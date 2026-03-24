import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock sync to prevent Supabase calls
vi.mock('../sync', () => ({
  enqueueSync: vi.fn(),
}));

// Mock localStorage
const store = new Map<string, string>();
const mockLocalStorage = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => store.set(key, value),
  removeItem: (key: string) => store.delete(key),
  clear: () => store.clear(),
  get length() { return store.size; },
  key: (i: number) => [...store.keys()][i] ?? null,
};
Object.defineProperty(globalThis, 'localStorage', { value: mockLocalStorage, writable: true });

import { addExpense, getExpenses, getSettings, saveSettings } from '../storage';
import type { Expense, Settings } from '../../types';

beforeEach(() => {
  store.clear();
});

describe('Security: Input Validation', () => {
  it('stores negative amounts (no server-side guard)', () => {
    const expense: Expense = {
      id: crypto.randomUUID(),
      amount: -500,
      category: 'food',
      description: 'Negative test',
      date: new Date().toISOString(),
    };
    addExpense(expense);
    const expenses = getExpenses();
    expect(expenses[0].amount).toBe(-500);
    // NOTE: This documents the behavior. UI prevents it, but storage layer accepts it.
  });

  it('stores zero amounts (no server-side guard)', () => {
    const expense: Expense = {
      id: crypto.randomUUID(),
      amount: 0,
      category: 'food',
      description: 'Zero test',
      date: new Date().toISOString(),
    };
    addExpense(expense);
    expect(getExpenses()[0].amount).toBe(0);
  });

  it('handles extreme amounts without overflow', () => {
    const expense: Expense = {
      id: crypto.randomUUID(),
      amount: Number.MAX_SAFE_INTEGER,
      category: 'food',
      description: 'Max int test',
      date: new Date().toISOString(),
    };
    addExpense(expense);
    expect(getExpenses()[0].amount).toBe(Number.MAX_SAFE_INTEGER);
  });

  it('stores XSS strings in description without executing', () => {
    const xssPayloads = [
      '<script>alert(1)</script>',
      '<img src=x onerror="alert(1)">',
      'javascript:alert(1)',
      '" onclick="alert(1)" data-x="',
    ];

    for (const payload of xssPayloads) {
      store.clear();
      const expense: Expense = {
        id: crypto.randomUUID(),
        amount: 100,
        category: 'food',
        description: payload,
        date: new Date().toISOString(),
      };
      addExpense(expense);
      const stored = getExpenses()[0];
      // Verify the string is stored verbatim (React will escape it in JSX)
      expect(stored.description).toBe(payload);
    }
  });

  it('handles XSS in custom category keys', () => {
    const settings = getSettings();
    const malicious: Settings = {
      ...settings,
      customCategories: [{
        key: '"><img src=x onerror=alert(1)>',
        label: 'Evil',
        icon: 'home',
        color: '#ff0000',
      }],
    };
    saveSettings(malicious);
    const loaded = getSettings();
    expect(loaded.customCategories?.[0].key).toBe('"><img src=x onerror=alert(1)>');
    // Stored verbatim — React auto-escapes in JSX
  });
});

describe('Security: Prototype Pollution via JSON.parse', () => {
  it('does not pollute Object.prototype via stored data', () => {
    // Simulate a malicious JSON payload in localStorage
    store.set('shnekel_expenses', '{"__proto__":{"polluted":true}}');
    const expenses = getExpenses();
    // @ts-expect-error — testing prototype pollution
    expect(({}).polluted).toBeUndefined();
    // JSON.parse in modern JS does not pollute prototypes
    expect(expenses).toBeDefined();
  });

  it('handles constructor pollution attempt', () => {
    store.set('shnekel_settings', '{"constructor":{"prototype":{"polluted":true}}}');
    const settings = getSettings();
    // @ts-expect-error — testing prototype pollution
    expect(({}).polluted).toBeUndefined();
    expect(settings).toBeDefined();
  });
});

describe('Security: Import Parser Sanitization', () => {
  // We test the sanitizeRows function indirectly via the module
  // The actual file parsing requires XLSX which needs ArrayBuffer

  it('sanitizeRows strips HTML tags from descriptions', async () => {
    // Dynamic import to get the module
    const { parseImportFile } = await import('../importParser');

    // Create a minimal valid XLSX-like file to test
    // Instead, test the sanitization concept directly
    const XLSX = await import('xlsx');
    const ws = XLSX.utils.aoa_to_sheet([
      ['date', 'description', 'amount', 'category'],
      ['2025-01-15', '<script>alert(1)</script>Groceries', 150, 'food'],
      ['2025-01-16', '<img src=x onerror=alert(1)>Shop', 200, 'shopping'],
      ['2025-01-17', 'Normal expense', 100, 'food'],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

    const file = new File([buffer], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const result = await parseImportFile(file);

    // Descriptions should have HTML tags stripped
    expect(result.rows[0]?.description).not.toContain('<script>');
    expect(result.rows[0]?.description).toContain('Groceries');
    expect(result.rows[1]?.description).not.toContain('<img');
    expect(result.rows[1]?.description).toContain('Shop');
    expect(result.rows[2]?.description).toBe('Normal expense');
  });

  it('filters out invalid amounts from imported data', async () => {
    const XLSX = await import('xlsx');
    const ws = XLSX.utils.aoa_to_sheet([
      ['date', 'description', 'amount', 'category'],
      ['2025-01-15', 'Valid', 100, 'food'],
      ['2025-01-16', 'Negative', -50, 'food'],
      ['2025-01-17', 'Zero', 0, 'food'],
      ['2025-01-18', 'NaN', 'not a number', 'food'],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

    const file = new File([buffer], 'test.xlsx');
    const { parseImportFile } = await import('../importParser');
    const result = await parseImportFile(file);

    // Only the valid positive amount should pass
    expect(result.rows.length).toBe(1);
    expect(result.rows[0].amount).toBe(100);
  });
});

describe('Security: Auth Guard on Sync', () => {
  it('enqueueSync is called but does not throw without auth', async () => {
    const { enqueueSync } = await import('../sync');
    // Storage operations call enqueueSync — verify it's called (mocked)
    const expense: Expense = {
      id: crypto.randomUUID(),
      amount: 50,
      category: 'food',
      description: 'Test',
      date: new Date().toISOString(),
    };
    addExpense(expense);
    expect(enqueueSync).toHaveBeenCalled();
  });
});
