import type { Expense } from '../types';
import { ExpenseItem } from './ExpenseItem';
import { formatCurrency } from '../lib/format';

interface ExpenseDayGroupProps {
  label: string;
  expenses: Expense[];
  onDelete?: (id: string) => void;
  onEdit?: (expense: Expense) => void;
}

export function ExpenseDayGroup({ label, expenses, onDelete, onEdit }: ExpenseDayGroupProps) {
  const dayTotal = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">{label}</span>
        <span className="text-xs font-bold text-on-primary-fixed">{formatCurrency(dayTotal)}</span>
      </div>
      <div className="space-y-4">
        {expenses.map(expense => (
          <ExpenseItem key={expense.id} expense={expense} onDelete={onDelete} onEdit={onEdit} />
        ))}
      </div>
    </div>
  );
}
