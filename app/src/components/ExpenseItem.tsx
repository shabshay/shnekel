import type { Expense } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { CATEGORIES } from '../types';

interface ExpenseItemProps {
  expense: Expense;
  onDelete?: (id: string) => void;
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const time = d.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' });

  if (diffDays === 0) return `Today, ${time}`;
  if (diffDays === 1) return `Yesterday, ${time}`;
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric' }) + `, ${time}`;
}

export function ExpenseItem({ expense, onDelete }: ExpenseItemProps) {
  const cat = CATEGORIES.find(c => c.key === expense.category);

  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-4">
        <CategoryIcon category={expense.category} />
        <div>
          <p className="font-headline font-bold text-on-primary-fixed text-sm">{expense.description}</p>
          <p className="font-body text-xs text-on-surface-variant">
            {cat?.label} &middot; {formatTime(expense.date)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <p className="font-headline font-bold text-on-primary-fixed">₪{expense.amount.toFixed(2)}</p>
        {onDelete && (
          <button
            onClick={() => onDelete(expense.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-on-surface-variant hover:text-error"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        )}
      </div>
    </div>
  );
}
