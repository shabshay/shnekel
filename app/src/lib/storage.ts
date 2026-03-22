import type { Settings, Expense, RecurringExpense, CategoryInfo } from '../types';
import { DEFAULT_CATEGORIES } from '../types';
import { enqueueSync } from './sync';

const SETTINGS_KEY = 'shnekel_settings';
const EXPENSES_KEY = 'shnekel_expenses';
const RECURRING_KEY = 'shnekel_recurring';

const DEFAULT_SETTINGS: Settings = {
  period: 'daily',
  budgetAmount: 200,
  monthStartDay: 1,
  alertThreshold: 80,
  onboardingComplete: false,
};

// ─── Settings ───────────────────────────────────────────────────

export function getSettings(): Settings {
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (!raw) return DEFAULT_SETTINGS;
  return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  enqueueSync({ type: 'upsert_settings', payload: settings, timestamp: Date.now() });
}

// ─── Categories ─────────────────────────────────────────────────

export function getCategories(): CategoryInfo[] {
  const settings = getSettings();
  const custom = settings.customCategories ?? [];
  return [...DEFAULT_CATEGORIES, ...custom];
}

// ─── Expenses ───────────────────────────────────────────────────

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
  enqueueSync({ type: 'upsert_expense', payload: expense, timestamp: Date.now() });
  return expenses;
}

export function addExpensesBatch(newExpenses: Expense[]): Expense[] {
  const expenses = getExpenses();
  expenses.unshift(...newExpenses);
  saveExpenses(expenses);
  enqueueSync({ type: 'bulk_insert_expenses', payload: newExpenses, timestamp: Date.now() });
  return expenses;
}

export function updateExpense(updated: Expense): Expense[] {
  const expenses = getExpenses().map(e => e.id === updated.id ? updated : e);
  saveExpenses(expenses);
  enqueueSync({ type: 'upsert_expense', payload: updated, timestamp: Date.now() });
  return expenses;
}

export function deleteExpense(id: string): Expense[] {
  const expenses = getExpenses().filter(e => e.id !== id);
  saveExpenses(expenses);
  enqueueSync({ type: 'delete_expense', payload: id, timestamp: Date.now() });
  return expenses;
}

// ─── Recurring Expenses ─────────────────────────────────────────

export function getRecurringExpenses(): RecurringExpense[] {
  const raw = localStorage.getItem(RECURRING_KEY);
  if (!raw) return [];
  return JSON.parse(raw);
}

export function saveRecurringExpenses(items: RecurringExpense[]): void {
  localStorage.setItem(RECURRING_KEY, JSON.stringify(items));
}

export function addRecurringExpense(item: RecurringExpense): RecurringExpense[] {
  const items = getRecurringExpenses();
  items.unshift(item);
  saveRecurringExpenses(items);
  return items;
}

export function updateRecurringExpense(updated: RecurringExpense): RecurringExpense[] {
  const items = getRecurringExpenses().map(r => r.id === updated.id ? updated : r);
  saveRecurringExpenses(items);
  return items;
}

export function deleteRecurringExpense(id: string): RecurringExpense[] {
  const items = getRecurringExpenses().filter(r => r.id !== id);
  saveRecurringExpenses(items);
  return items;
}

/**
 * Generate expenses from active recurring templates that are due.
 * Called on app startup. Checks each recurring expense and creates
 * actual expenses for any missed days since lastGenerated.
 */
export function processRecurringExpenses(): Expense[] {
  const recurring = getRecurringExpenses();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().slice(0, 10);
  const generated: Expense[] = [];

  for (const r of recurring) {
    if (!r.active) continue;

    const lastDate = r.lastGenerated ? new Date(r.lastGenerated) : null;
    if (lastDate) lastDate.setHours(0, 0, 0, 0);

    let shouldGenerate = false;

    switch (r.frequency) {
      case 'daily':
        // Generate if we haven't generated today
        shouldGenerate = !lastDate || lastDate.toISOString().slice(0, 10) < todayStr;
        break;
      case 'weekly':
        // Generate if today is the right day of week and we haven't generated this week
        shouldGenerate = today.getDay() === (r.dayOfWeek ?? 1) &&
          (!lastDate || (today.getTime() - lastDate.getTime()) >= 6 * 86400000);
        break;
      case 'monthly':
        // Generate if today is the right day and we haven't generated this month
        shouldGenerate = today.getDate() === (r.dayOfMonth ?? 1) &&
          (!lastDate || lastDate.getMonth() !== today.getMonth() || lastDate.getFullYear() !== today.getFullYear());
        break;
    }

    if (shouldGenerate) {
      const expense: Expense = {
        id: crypto.randomUUID(),
        amount: r.amount,
        category: r.category,
        description: `${r.description} (recurring)`,
        date: new Date().toISOString(),
      };
      generated.push(expense);
      r.lastGenerated = todayStr;
    }
  }

  if (generated.length > 0) {
    addExpensesBatch(generated);
    saveRecurringExpenses(recurring);
  }

  return generated;
}
