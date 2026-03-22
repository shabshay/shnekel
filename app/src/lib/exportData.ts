import * as XLSX from 'xlsx';
import type { Expense } from '../types';
import { getCategories } from './storage';

interface ExportStats {
  totalSpent: number;
  avgPerDay: number;
  highestDay: number;
  topCategory: string;
}

export function exportExpenses(
  expenses: Expense[],
  stats: ExportStats,
  filterLabel: string,
) {
  const categories = getCategories();

  // Sheet 1: Expenses
  const expenseRows = expenses.map(e => ({
    Date: new Date(e.date).toLocaleDateString('en', { year: 'numeric', month: 'short', day: 'numeric' }),
    Description: e.description,
    Amount: e.amount,
    Category: categories.find(c => c.key === e.category)?.label ?? e.category,
    Notes: e.notes ?? '',
  }));

  const wsExpenses = XLSX.utils.json_to_sheet(expenseRows);
  wsExpenses['!cols'] = [
    { wch: 14 }, // Date
    { wch: 30 }, // Description
    { wch: 12 }, // Amount
    { wch: 15 }, // Category
    { wch: 30 }, // Notes
  ];

  // Sheet 2: Summary
  const summaryData = [
    ['Shnekel Export', ''],
    ['Period', filterLabel],
    ['Total Expenses', expenses.length],
    ['Total Spent', stats.totalSpent],
    ['Average Per Day', Math.round(stats.avgPerDay)],
    ['Highest Day', stats.highestDay],
    ['Top Category', categories.find(c => c.key === stats.topCategory)?.label ?? stats.topCategory],
    ['Exported At', new Date().toLocaleString()],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary['!cols'] = [{ wch: 18 }, { wch: 25 }];

  // Build workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsExpenses, 'Expenses');
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  // Download
  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `shnekel_${filterLabel.toLowerCase()}_${dateStr}.xlsx`);
}
