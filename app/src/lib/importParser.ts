import * as XLSX from 'xlsx';
import type { Category } from '../types';
import { autoCategorize } from './autoCategorize';

export interface ImportedRow {
  date: string;       // ISO string — transaction date
  billingDate?: string; // ISO string — credit card charge date
  description: string;
  amount: number;
  category: Category;
  originalCategory?: string; // the raw category from file, for display
}

export type DetectedFormat = 'isracard' | 'normalized' | 'unknown';

// Map common Hebrew/English category names → our app categories
const CATEGORY_MAP: Record<string, Category> = {
  // English
  'groceries': 'groceries',
  'supermarket': 'groceries',
  'food': 'food',
  'food & restaurants': 'food',
  'restaurants': 'food',
  'transport': 'transport',
  'transportation': 'transport',
  'fuel': 'transport',
  'car & maintenance': 'transport',
  'shopping': 'shopping',
  'clothing & shopping': 'shopping',
  'clothing': 'shopping',
  'home & furniture': 'shopping',
  'entertainment': 'entertainment',
  'entertainment & leisure': 'entertainment',
  'fun': 'entertainment',
  'bills': 'bills',
  'bills & utilities': 'bills',
  'utilities': 'bills',
  'insurance & finance': 'bills',
  'education & activities': 'bills',
  'health': 'health',
  'pharmacy & health': 'health',
  'health services': 'health',
  'kids': 'other',
  'travel': 'entertainment',
  'other': 'other',
  // Hebrew
  'מזון': 'food',
  'מסעדות': 'food',
  'סופרמרקט': 'groceries',
  'מכולת': 'groceries',
  'תחבורה': 'transport',
  'דלק': 'transport',
  'קניות': 'shopping',
  'בילויים': 'entertainment',
  'חשבונות': 'bills',
  'בריאות': 'health',
  'אחר': 'other',
};

function mapCategory(raw: string | undefined): { category: Category; original: string } {
  if (!raw) return { category: 'other', original: '' };
  const cleaned = raw.trim().toLowerCase();
  const mapped = CATEGORY_MAP[cleaned];
  return { category: mapped || 'other', original: raw.trim() };
}

/**
 * Parse an Excel serial date number into a JS Date.
 * Excel uses Jan 1 1900 = 1 (with the Lotus 1-2-3 leap year bug).
 */
function excelSerialToDate(serial: number): Date {
  // Excel epoch: Jan 0 1900 = 0 (but with leap year bug at day 60)
  const epoch = new Date(1899, 11, 30); // Dec 30, 1899
  const ms = epoch.getTime() + serial * 86400000;
  return new Date(ms);
}

function parseDate(value: unknown): string | null {
  if (!value) return null;

  // Already a Date
  if (value instanceof Date) {
    return value.toISOString();
  }

  // Excel serial number
  if (typeof value === 'number' && value > 30000 && value < 60000) {
    return excelSerialToDate(value).toISOString();
  }

  // String date
  if (typeof value === 'string') {
    // Try DD/MM/YYYY
    const ddmmyyyy = value.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
    if (ddmmyyyy) {
      const [, d, m, y] = ddmmyyyy;
      return new Date(+y, +m - 1, +d).toISOString();
    }
    // Try YYYY-MM-DD
    const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) {
      return new Date(value).toISOString();
    }
    // Try generic parse
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) return parsed.toISOString();
  }

  return null;
}

function parseAmount(value: unknown): number | null {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[₪,\s]/g, '');
    const num = parseFloat(cleaned);
    if (!isNaN(num)) return num;
  }
  return null;
}

// ─── Isracard .xls parser ───────────────────────────────────────

function normalizeSpaces(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

function isIsracardFormat(sheet: XLSX.WorkSheet): boolean {
  // Isracard files have card sections with headers like "כרטיס:" or
  // column headers "תאריך עסקה" + "שם העסק" + "סכום חיוב" in specific layout.
  // They also have multiple card sections and offset columns (col B onwards).
  // Note: Isracard sometimes uses double spaces e.g. "שם  העסק"
  const range = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' });

  for (let i = 0; i < Math.min(10, range.length); i++) {
    const row = range[i];
    const text = normalizeSpaces(row.join(' '));
    if (text.includes('תאריך עסקה') && text.includes('שם העסק')) {
      return true;
    }
    // Also detect by Isracard card header pattern
    if (text.includes('ישראכרט') || text.includes('כרטיס:')) {
      return true;
    }
  }
  return false;
}

function parseIsracard(sheet: XLSX.WorkSheet): ImportedRow[] {
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '', raw: true });
  const results: ImportedRow[] = [];

  let inDataSection = false;
  let currentBillingDate: string | null = null;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] as unknown[];
    const rowText = normalizeSpaces(row.map(c => String(c ?? '')).join(' '));

    // Extract billing date from section header: "חיוב בתאריך DD/MM/YYYY"
    const billingMatch = rowText.match(/חיוב\s*בתאריך\s*(\d{1,2}[/.-]\d{1,2}[/.-]\d{4})/);
    if (billingMatch) {
      currentBillingDate = parseDate(billingMatch[1]);
    }

    // Detect column header row → start of data section
    if (rowText.includes('תאריך עסקה') && rowText.includes('שם העסק')) {
      inDataSection = true;
      continue;
    }

    // Detect end of section (subtotal row or empty)
    if (inDataSection) {
      const rowStr = row.map(c => String(c ?? '')).join('').trim();
      if (rowStr === '' || rowStr.includes('סה"כ') || rowStr.includes('מספר כרטיס')) {
        inDataSection = false;
        continue;
      }

      // Isracard uses columns B-F (index 1-5), with A often empty
      // B=date, C=business, D=transaction amount, E=charge amount, F=details
      const dateVal = row[1];
      const desc = String(row[2] ?? '').trim();
      const chargeAmount = row[4]; // סכום חיוב - what was actually charged

      const date = parseDate(dateVal);
      const amount = parseAmount(chargeAmount);

      if (date && amount !== null && amount > 0 && desc) {
        results.push({
          date,
          billingDate: currentBillingDate ?? undefined,
          description: desc,
          amount,
          category: autoCategorize(desc) ?? 'other',
          originalCategory: '',
        });
      }
    }
  }

  return results;
}

// ─── Normalized / generic format parser ─────────────────────────

// These are the columns we look for (in order of preference)
const DATE_COLS = ['date', 'תאריך', 'תאריך עסקה'];
const DESC_COLS = ['description', 'name', 'שם', 'שם העסק', 'תיאור', 'business'];
const AMOUNT_COLS = ['amount', 'סכום', 'סכום חיוב', 'סכום עסקה', 'charge', 'total'];
const CATEGORY_COLS = ['category', 'קטגוריה', 'type', 'סוג'];

function findCol(headers: string[], candidates: string[]): number {
  for (const candidate of candidates) {
    const idx = headers.findIndex(h => h.toLowerCase().trim() === candidate.toLowerCase());
    if (idx >= 0) return idx;
  }
  return -1;
}

function parseNormalized(sheet: XLSX.WorkSheet): ImportedRow[] {
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '', raw: true });
  if (rows.length < 2) return [];

  const headers = (rows[0] as unknown[]).map(h => String(h ?? '').trim());

  const dateIdx = findCol(headers, DATE_COLS);
  const descIdx = findCol(headers, DESC_COLS);
  const amountIdx = findCol(headers, AMOUNT_COLS);
  const catIdx = findCol(headers, CATEGORY_COLS);

  if (dateIdx < 0 || amountIdx < 0) return [];

  const results: ImportedRow[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] as unknown[];
    const date = parseDate(row[dateIdx]);
    const amount = parseAmount(row[amountIdx]);
    const desc = descIdx >= 0 ? String(row[descIdx] ?? '').trim() : '';
    const rawCat = catIdx >= 0 ? String(row[catIdx] ?? '') : '';
    const { category, original } = mapCategory(rawCat);

    if (date && amount !== null && amount > 0) {
      results.push({
        date,
        description: desc || 'Imported expense',
        amount,
        category,
        originalCategory: original,
      });
    }
  }

  return results;
}

// ─── Main entry point ───────────────────────────────────────────

export interface ParseResult {
  rows: ImportedRow[];
  format: DetectedFormat;
  error?: string;
}

export async function parseImportFile(file: File): Promise<ParseResult> {
  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: false, raw: true });

    // Try sheets in order: "Transactions" first (summary format), then first sheet
    const sheetName = workbook.SheetNames.includes('Transactions')
      ? 'Transactions'
      : workbook.SheetNames[0];

    const sheet = workbook.Sheets[sheetName];

    // Try Isracard detection
    if (isIsracardFormat(sheet)) {
      const rows = parseIsracard(sheet);
      return { rows, format: 'isracard' };
    }

    // Try normalized format
    const rows = parseNormalized(sheet);
    if (rows.length > 0) {
      return { rows, format: 'normalized' };
    }

    return { rows: [], format: 'unknown', error: 'Could not detect the file format. Please use the template format.' };
  } catch (err) {
    return { rows: [], format: 'unknown', error: `Failed to read file: ${(err as Error).message}` };
  }
}

// ─── Template generation ────────────────────────────────────────

export function downloadTemplate() {
  const wb = XLSX.utils.book_new();
  const data = [
    ['date', 'description', 'amount', 'category'],
    ['2025-01-15', 'Supermarket', 150, 'groceries'],
    ['2025-01-15', 'Bus pass', 50, 'transport'],
    ['2025-01-16', 'New shoes', 200, 'shopping'],
    ['2025-01-16', 'Netflix', 45, 'entertainment'],
    ['2025-01-17', 'Electricity bill', 300, 'bills'],
    ['2025-01-17', 'Pharmacy', 80, 'health'],
    ['2025-01-18', 'Gift', 120, 'other'],
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);

  // Set column widths
  ws['!cols'] = [
    { wch: 12 }, // date
    { wch: 25 }, // description
    { wch: 10 }, // amount
    { wch: 15 }, // category
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Expenses');
  XLSX.writeFile(wb, 'shnekel_import_template.xlsx');
}
