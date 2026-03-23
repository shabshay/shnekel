import { describe, it, expect } from 'vitest';
import { getPeriodStart, getPeriodEnd, getTimeUntilReset, getExpenseStats } from '../useExpenses';
import type { Expense } from '../../types';

describe('getPeriodStart', () => {
  it('daily returns today at midnight', () => {
    const start = getPeriodStart('daily');
    const now = new Date();
    expect(start.getFullYear()).toBe(now.getFullYear());
    expect(start.getMonth()).toBe(now.getMonth());
    expect(start.getDate()).toBe(now.getDate());
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
  });

  it('weekly returns Monday of current week', () => {
    const start = getPeriodStart('weekly');
    // Monday = 1
    expect(start.getDay()).toBe(1);
    // Should be <= today
    expect(start.getTime()).toBeLessThanOrEqual(Date.now());
    // Should be within 7 days of today
    expect(Date.now() - start.getTime()).toBeLessThan(7 * 24 * 60 * 60 * 1000);
  });

  it('monthly with day 1 returns 1st of current or last month', () => {
    const start = getPeriodStart('monthly', 1);
    expect(start.getDate()).toBe(1);
    expect(start.getTime()).toBeLessThanOrEqual(Date.now());
  });

  it('monthly with day 25 respects monthStartDay', () => {
    const start = getPeriodStart('monthly', 25);
    expect(start.getDate()).toBe(25);
    const now = new Date();
    if (now.getDate() >= 25) {
      expect(start.getMonth()).toBe(now.getMonth());
    } else {
      // Should be previous month's 25th
      const expectedMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      expect(start.getMonth()).toBe(expectedMonth);
    }
  });
});

describe('getPeriodEnd', () => {
  it('daily returns tomorrow at midnight', () => {
    const end = getPeriodEnd('daily');
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    expect(end.getDate()).toBe(tomorrow.getDate());
  });

  it('weekly is 7 days after period start', () => {
    const start = getPeriodStart('weekly');
    const end = getPeriodEnd('weekly');
    const diffDays = Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    expect(diffDays).toBe(7);
  });

  it('monthly end is after monthly start', () => {
    const start = getPeriodStart('monthly', 10);
    const end = getPeriodEnd('monthly', 10);
    expect(end.getTime()).toBeGreaterThan(start.getTime());
    expect(end.getDate()).toBe(10);
  });
});

describe('getTimeUntilReset', () => {
  it('returns a string with hours and minutes', () => {
    const result = getTimeUntilReset('daily');
    expect(result).toMatch(/^\d+h \d+m$/);
  });

  it('returns non-negative values', () => {
    const result = getTimeUntilReset('monthly', 1);
    const [hours] = result.split('h ').map(Number);
    expect(hours).toBeGreaterThanOrEqual(0);
  });
});

describe('getExpenseStats', () => {
  const today = new Date().toISOString();
  const expenses: Expense[] = [
    { id: '1', amount: 100, category: 'food', description: 'Lunch', date: today },
    { id: '2', amount: 200, category: 'food', description: 'Dinner', date: today },
    { id: '3', amount: 50, category: 'transport', description: 'Bus', date: today },
  ];

  it('calculates totalSpent correctly', () => {
    const stats = getExpenseStats(expenses, 'today');
    expect(stats.totalSpent).toBe(350);
  });

  it('identifies top category', () => {
    const stats = getExpenseStats(expenses, 'today');
    expect(stats.topCategory).toBe('food');
  });

  it('calculates highestDay', () => {
    const stats = getExpenseStats(expenses, 'today');
    expect(stats.highestDay).toBe(350);
  });

  it('returns empty chart data for no expenses', () => {
    const stats = getExpenseStats([], 'today');
    expect(stats.totalSpent).toBe(0);
    expect(stats.topCategory).toBe('None');
  });

  it('filters by period', () => {
    const oldDate = new Date(2020, 0, 1).toISOString();
    const oldExpenses: Expense[] = [
      { id: '4', amount: 999, category: 'bills', description: 'Old', date: oldDate },
    ];
    const stats = getExpenseStats(oldExpenses, 'today');
    expect(stats.totalSpent).toBe(0); // filtered out
  });
});
