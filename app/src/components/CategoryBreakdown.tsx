import type { Expense } from '../types';
import { getCategories } from '../lib/storage';
import { formatCurrency } from '../lib/format';

interface CategoryBreakdownProps {
  expenses: Expense[];
  budget: number;
}

export function CategoryBreakdown({ expenses, budget }: CategoryBreakdownProps) {
  if (expenses.length === 0) return null;

  const categories = getCategories();
  const totals = new Map<string, number>();
  expenses.forEach(e => {
    totals.set(e.category, (totals.get(e.category) ?? 0) + e.amount);
  });

  // Sort by amount descending, take top 5
  const sorted = [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-2.5">
      {sorted.map(([catKey, amount]) => {
        const cat = categories.find(c => c.key === catKey);
        const pct = budget > 0 ? Math.min((amount / budget) * 100, 100) : 0;
        return (
          <div key={catKey} className="flex items-center gap-3">
            <span className="text-xs font-semibold text-on-surface-variant w-16 truncate">
              {cat?.label ?? catKey}
            </span>
            <div className="flex-grow h-2 bg-surface-container rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: cat?.color ?? '#78909C' }}
              />
            </div>
            <span className="text-xs font-bold text-on-primary-fixed w-14 text-right">
              {formatCurrency(amount)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
