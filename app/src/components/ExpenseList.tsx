import type { Expense } from '../types';
import { ExpenseItem } from './ExpenseItem';

interface ExpenseListProps {
  expenses: Expense[];
  onDelete?: (id: string) => void;
  onEdit?: (expense: Expense) => void;
}

export function ExpenseList({ expenses, onDelete, onEdit }: ExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-on-surface-variant font-medium">No expenses yet</p>
        <p className="text-on-surface-variant text-sm mt-1">Tap "Add expense" to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {expenses.map(expense => (
        <ExpenseItem key={expense.id} expense={expense} onDelete={onDelete} onEdit={onEdit} />
      ))}
    </div>
  );
}
