import { useState, useCallback, useMemo, useEffect } from 'react';
import type { Expense, Category, Period } from '../types';
import { getExpenses, addExpense as addExpenseToStorage, addExpensesBatch as addExpensesBatchToStorage, updateExpense as updateExpenseInStorage, deleteExpense as deleteExpenseFromStorage } from '../lib/storage';

export function getPeriodStart(period: Period, monthStartDay: number = 1): Date {
  const now = new Date();
  switch (period) {
    case 'daily':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case 'weekly': {
      const day = now.getDay();
      const diff = day === 0 ? 6 : day - 1; // Monday start
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff);
    }
    case 'monthly': {
      // If we haven't reached monthStartDay this month, the period started last month
      if (now.getDate() >= monthStartDay) {
        return new Date(now.getFullYear(), now.getMonth(), monthStartDay);
      }
      return new Date(now.getFullYear(), now.getMonth() - 1, monthStartDay);
    }
  }
}

export function getPeriodEnd(period: Period, monthStartDay: number = 1): Date {
  const now = new Date();
  switch (period) {
    case 'daily':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    case 'weekly': {
      const start = getPeriodStart(period, monthStartDay);
      return new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7);
    }
    case 'monthly': {
      if (now.getDate() >= monthStartDay) {
        return new Date(now.getFullYear(), now.getMonth() + 1, monthStartDay);
      }
      return new Date(now.getFullYear(), now.getMonth(), monthStartDay);
    }
  }
}

export function shiftPeriodStart(start: Date, period: Period, offset: number, _monthStartDay: number = 1): Date {
  if (offset === 0) return start;
  const d = new Date(start);
  switch (period) {
    case 'daily':
      d.setDate(d.getDate() + offset);
      break;
    case 'weekly':
      d.setDate(d.getDate() + offset * 7);
      break;
    case 'monthly':
      d.setMonth(d.getMonth() + offset);
      break;
  }
  return d;
}

export function getPeriodLabel(period: Period, offset: number, monthStartDay: number = 1): string {
  if (offset === 0) {
    return period === 'daily' ? 'Today' : period === 'weekly' ? 'This week' : 'This month';
  }
  const start = shiftPeriodStart(getPeriodStart(period, monthStartDay), period, offset, monthStartDay);
  if (offset === -1) {
    return period === 'daily' ? 'Yesterday' : period === 'weekly' ? 'Last week' : 'Last month';
  }
  switch (period) {
    case 'daily':
      return start.toLocaleDateString('en', { month: 'short', day: 'numeric' });
    case 'weekly':
      return `Week of ${start.toLocaleDateString('en', { month: 'short', day: 'numeric' })}`;
    case 'monthly':
      return start.toLocaleDateString('en', { month: 'long', year: 'numeric' });
  }
}

export function getTimeUntilReset(period: Period, monthStartDay: number = 1): string {
  const end = getPeriodEnd(period, monthStartDay);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}

/**
 * @param periodOffset - 0 = current period, -1 = previous period, -2 = two periods ago, etc.
 */
export function useExpenses(period: Period, budgetAmount: number, monthStartDay: number = 1, periodOffset: number = 0) {
  const [expenses, setExpenses] = useState<Expense[]>(getExpenses);

  // Re-read from localStorage when a sync pull completes
  useEffect(() => {
    const handler = () => setExpenses(getExpenses());
    window.addEventListener('shnekel-sync', handler);
    return () => window.removeEventListener('shnekel-sync', handler);
  }, []);

  const addExpense = useCallback((amount: number, category: Category, description: string, notes?: string, receiptUrl?: string) => {
    const expense: Expense = {
      id: crypto.randomUUID(),
      amount,
      category,
      description,
      date: new Date().toISOString(),
      ...(notes && { notes }),
      ...(receiptUrl && { receiptUrl }),
    };
    const updated = addExpenseToStorage(expense);
    setExpenses(updated);
  }, []);

  const addExpensesBatch = useCallback((newExpenses: Expense[]) => {
    const updated = addExpensesBatchToStorage(newExpenses);
    setExpenses(updated);
  }, []);

  const editExpense = useCallback((expense: Expense) => {
    const updated = updateExpenseInStorage(expense);
    setExpenses(updated);
  }, []);

  const removeExpense = useCallback((id: string) => {
    const updated = deleteExpenseFromStorage(id);
    setExpenses(updated);
  }, []);

  const periodStart = useMemo(() => {
    const base = getPeriodStart(period, monthStartDay);
    return periodOffset === 0 ? base : shiftPeriodStart(base, period, periodOffset, monthStartDay);
  }, [period, monthStartDay, periodOffset]);

  const periodEnd = useMemo(() => {
    if (periodOffset === 0) return getPeriodEnd(period, monthStartDay);
    // For past periods, end = start of next period
    return shiftPeriodStart(periodStart, period, 1, monthStartDay);
  }, [period, monthStartDay, periodOffset, periodStart]);

  const currentPeriodExpenses = useMemo(() => {
    return expenses.filter(e => {
      const d = new Date(e.date);
      return d >= periodStart && d < periodEnd;
    });
  }, [expenses, periodStart, periodEnd]);

  const totalSpent = useMemo(() => {
    return currentPeriodExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [currentPeriodExpenses]);

  const remaining = budgetAmount - totalSpent;
  const progress = budgetAmount > 0 ? totalSpent / budgetAmount : 0;

  return {
    expenses,
    currentPeriodExpenses,
    totalSpent,
    remaining,
    progress,
    addExpense,
    addExpensesBatch,
    editExpense,
    removeExpense,
  };
}

export function getExpenseStats(expenses: Expense[], filterPeriod: 'today' | 'week' | 'month', monthStartDay: number = 1) {
  const now = new Date();
  let start: Date;
  switch (filterPeriod) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week': {
      const day = now.getDay();
      const diff = day === 0 ? 6 : day - 1;
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff);
      break;
    }
    case 'month': {
      if (now.getDate() >= monthStartDay) {
        start = new Date(now.getFullYear(), now.getMonth(), monthStartDay);
      } else {
        start = new Date(now.getFullYear(), now.getMonth() - 1, monthStartDay);
      }
      break;
    }
  }

  const filtered = expenses.filter(e => new Date(e.date) >= start);
  const totalSpent = filtered.reduce((sum, e) => sum + e.amount, 0);

  // Days in period
  const daysDiff = Math.max(1, Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  const avgPerDay = totalSpent / daysDiff;

  // Highest day
  const byDay = new Map<string, number>();
  filtered.forEach(e => {
    const dayKey = new Date(e.date).toLocaleDateString();
    byDay.set(dayKey, (byDay.get(dayKey) || 0) + e.amount);
  });
  const highestDay = Math.max(0, ...byDay.values());

  // Top category
  const byCat = new Map<string, number>();
  filtered.forEach(e => {
    byCat.set(e.category, (byCat.get(e.category) || 0) + e.amount);
  });
  let topCategory = 'None';
  let topAmount = 0;
  byCat.forEach((amount, cat) => {
    if (amount > topAmount) {
      topAmount = amount;
      topCategory = cat;
    }
  });

  // Daily spending data for chart
  const chartData: { date: string; amount: number }[] = [];
  const cursor = new Date(start);
  while (cursor <= now) {
    const key = cursor.toLocaleDateString();
    chartData.push({ date: formatChartDate(cursor), amount: byDay.get(key) || 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  return { totalSpent, avgPerDay, highestDay, topCategory, chartData, filteredExpenses: filtered };
}

function formatChartDate(d: Date): string {
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
}
