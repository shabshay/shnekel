import type { Settings, Expense } from '../types';

const SETTINGS_KEY = 'shnekel_settings';
const EXPENSES_KEY = 'shnekel_expenses';

const DEFAULT_SETTINGS: Settings = {
  period: 'daily',
  budgetAmount: 200,
  monthStartDay: 1,
  onboardingComplete: false,
};

export function getSettings(): Settings {
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (!raw) return DEFAULT_SETTINGS;
  return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function getExpenses(): Expense[] {
  const raw = localStorage.getItem(EXPENSES_KEY);
  if (!raw) return [];
  return JSON.parse(raw);
}

export function saveExpenses(expenses: Expense[]): void {
  localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
}

export function addExpense(expense: Expense): Expense[] {
  const expenses = getExpenses();
  expenses.unshift(expense);
  saveExpenses(expenses);
  return expenses;
}

export function deleteExpense(id: string): Expense[] {
  const expenses = getExpenses().filter(e => e.id !== id);
  saveExpenses(expenses);
  return expenses;
}
