import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Expense, RecurringExpense } from '../../types';

// Mock the sync module to prevent Supabase calls
vi.mock('../sync', () => ({
  enqueueSync: vi.fn(),
}));

// Mock localStorage before importing storage module
const store = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, value); },
    removeItem: (key: string) => { store.delete(key); },
    clear: () => { store.clear(); },
    get length() { return store.size; },
    key: (index: number) => [...store.keys()][index] ?? null,
  },
  writable: true,
  configurable: true,
});

// Now import storage (it will use our mocked localStorage)
const storage = await import('../storage');
const { getSettings, saveSettings, getExpenses, addExpense, updateExpense, deleteExpense, addExpensesBatch, getCategories, getRecurringExpenses, addRecurringExpense, deleteRecurringExpense } = storage;

beforeEach(() => {
  store.clear();
});

describe('Settings', () => {
  it('returns defaults when empty', () => {
    const settings = getSettings();
    expect(settings.period).toBe('daily');
    expect(settings.budgetAmount).toBe(200);
    expect(settings.monthStartDay).toBe(1);
    expect(settings.alertThreshold).toBe(80);
    expect(settings.onboardingComplete).toBe(false);
  });

  it('saves and retrieves settings', () => {
    saveSettings({ period: 'monthly', budgetAmount: 5000, monthStartDay: 10, alertThreshold: 90, onboardingComplete: true });
    const settings = getSettings();
    expect(settings.period).toBe('monthly');
    expect(settings.budgetAmount).toBe(5000);
    expect(settings.monthStartDay).toBe(10);
    expect(settings.alertThreshold).toBe(90);
  });

  it('merges with defaults for missing fields', () => {
    store.set('shnekel_settings', JSON.stringify({ period: 'weekly', budgetAmount: 300, monthStartDay: 1, onboardingComplete: true }));
    const settings = getSettings();
    expect(settings.alertThreshold).toBe(80);
    expect(settings.period).toBe('weekly');
  });
});

describe('Expenses CRUD', () => {
  const makeExpense = (overrides?: Partial<Expense>): Expense => ({
    id: crypto.randomUUID(),
    amount: 100,
    category: 'food',
    description: 'Test',
    date: new Date().toISOString(),
    ...overrides,
  });

  it('starts empty', () => {
    expect(getExpenses()).toEqual([]);
  });

  it('adds an expense', () => {
    const expense = makeExpense();
    addExpense(expense);
    const all = getExpenses();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe(expense.id);
  });

  it('adds expenses in order (newest first)', () => {
    const e1 = makeExpense({ description: 'First' });
    const e2 = makeExpense({ description: 'Second' });
    addExpense(e1);
    addExpense(e2);
    const all = getExpenses();
    expect(all[0].description).toBe('Second');
    expect(all[1].description).toBe('First');
  });

  it('updates an expense', () => {
    const expense = makeExpense({ amount: 100 });
    addExpense(expense);
    updateExpense({ ...expense, amount: 999 });
    const all = getExpenses();
    expect(all[0].amount).toBe(999);
  });

  it('deletes an expense', () => {
    const expense = makeExpense();
    addExpense(expense);
    deleteExpense(expense.id);
    expect(getExpenses()).toHaveLength(0);
  });

  it('batch adds multiple expenses', () => {
    const batch = [makeExpense({ description: 'A' }), makeExpense({ description: 'B' }), makeExpense({ description: 'C' })];
    addExpensesBatch(batch);
    expect(getExpenses()).toHaveLength(3);
  });
});

describe('Categories', () => {
  it('returns 8 default categories when no custom ones', () => {
    const cats = getCategories();
    expect(cats.length).toBe(8);
    expect(cats.map(c => c.key)).toContain('food');
    expect(cats.map(c => c.key)).toContain('groceries');
    expect(cats.map(c => c.key)).toContain('other');
  });

  it('includes custom categories from settings', () => {
    saveSettings({
      period: 'daily',
      budgetAmount: 200,
      monthStartDay: 1,
      alertThreshold: 80,
      darkMode: false,
      onboardingComplete: true,
      customCategories: [{ key: 'kids', label: 'Kids', icon: 'child_care', color: '#FF4081' }],
    });
    const cats = getCategories();
    expect(cats.length).toBe(9);
    expect(cats.map(c => c.key)).toContain('kids');
  });
});

describe('Recurring Expenses', () => {
  it('starts empty', () => {
    expect(getRecurringExpenses()).toEqual([]);
  });

  it('adds and retrieves recurring expense', () => {
    const item: RecurringExpense = {
      id: '1', amount: 50, category: 'bills', description: 'Netflix',
      frequency: 'monthly', dayOfMonth: 1, active: true, createdAt: new Date().toISOString(),
    };
    addRecurringExpense(item);
    const all = getRecurringExpenses();
    expect(all).toHaveLength(1);
    expect(all[0].description).toBe('Netflix');
  });

  it('deletes recurring expense', () => {
    const item: RecurringExpense = {
      id: '1', amount: 50, category: 'bills', description: 'Netflix',
      frequency: 'monthly', dayOfMonth: 1, active: true, createdAt: new Date().toISOString(),
    };
    addRecurringExpense(item);
    deleteRecurringExpense('1');
    expect(getRecurringExpenses()).toHaveLength(0);
  });
});
