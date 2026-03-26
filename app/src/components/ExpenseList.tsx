import { useMemo } from 'react';
import type { Expense } from '../types';
import { ExpenseDayGroup } from './ExpenseDayGroup';
import { useLocale } from '../hooks/useLocale'

interface ExpenseListProps {
  expenses: Expense[];
  onDelete?: (id: string) => void;
  onEdit?: (expense: Expense) => void;
}

function getDayLabel(dateStr: string, t: (key: string) => string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const expDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  if (expDay.getTime() === today.getTime()) return t('time.today');
  if (expDay.getTime() === yesterday.getTime()) return t('time.yesterday');
  return d.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' });
}

function getDayKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function ExpenseList({ expenses, onDelete, onEdit }: ExpenseListProps) {
  const { t } = useLocale()

  const groups = useMemo(() => {
    const map = new Map<string, { label: string; expenses: Expense[] }>();
    for (const exp of expenses) {
      const key = getDayKey(exp.date);
      if (!map.has(key)) {
        map.set(key, { label: getDayLabel(exp.date, t), expenses: [] });
      }
      map.get(key)!.expenses.push(exp);
    }
    return [...map.values()];
  }, [expenses, t]);

  if (expenses.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-on-surface-variant font-medium">{t('expense.noExpenses')}</p>
        <p className="text-on-surface-variant text-sm mt-1">{t('expense.noExpensesHint')}</p>
      </div>
    );
  }

  return (
    <div>
      {groups.map(group => (
        <ExpenseDayGroup
          key={group.label}
          label={group.label}
          expenses={group.expenses}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}
