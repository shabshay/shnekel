import { useState } from 'react';
import type { Expense } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { formatCurrency } from '../lib/format';
import { getCategories } from '../lib/storage';
import { ConfirmDialog } from './ConfirmDialog';
import { useLocale } from '../hooks/useLocale'

interface ExpenseItemProps {
  expense: Expense;
  onDelete?: (id: string) => void;
  onEdit?: (expense: Expense) => void;
}

function formatTime(dateStr: string, t: (key: string) => string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const time = d.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' });

  if (diffDays === 0) return `${t('time.today')}, ${time}`;
  if (diffDays === 1) return `${t('time.yesterday')}, ${time}`;
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric' }) + `, ${time}`;
}

export function ExpenseItem({ expense, onDelete, onEdit }: ExpenseItemProps) {
  const { t } = useLocale()
  const cat = getCategories().find(c => c.key === expense.category);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between group">
        <div
          className={`flex items-center gap-4 flex-grow min-w-0 ${onEdit ? 'cursor-pointer' : ''}`}
          onClick={() => onEdit?.(expense)}
        >
          <CategoryIcon category={expense.category} />
          <div className="min-w-0">
            <p className="font-headline font-bold text-on-primary-fixed text-sm truncate">{expense.description}</p>
            <p className="font-body text-xs text-on-surface-variant flex items-center gap-1">
              {cat?.label} &middot; {formatTime(expense.date, t)}
              {expense.notes && <span className="material-symbols-outlined text-xs">sticky_note_2</span>}
              {expense.receiptUrl && <span className="material-symbols-outlined text-xs">receipt</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <p className="font-headline font-bold text-on-primary-fixed">{formatCurrency(expense.amount, true)}</p>
          {onDelete && (
            <button
              onClick={() => setConfirmDelete(true)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-on-surface-variant hover:text-error"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title={t('expense.deleteExpense')}
        message={t('expense.deleteExpenseMsg', { desc: expense.description, amount: formatCurrency(expense.amount, true) })}
        confirmLabel={t('common.delete')}
        confirmDestructive
        onConfirm={() => {
          setConfirmDelete(false);
          onDelete?.(expense.id);
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
