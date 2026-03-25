import type { Expense } from '../types';
import { getCategories } from '../lib/storage';
import { formatCurrency } from '../lib/format';

interface CategoryBreakdownProps {
  expenses: Expense[];
  budget: number;
  categoryBudgets?: Record<string, number>;
}

export function CategoryBreakdown({ expenses, budget, categoryBudgets }: CategoryBreakdownProps) {
  if (expenses.length === 0) return null;

  const categories = getCategories();
  const totals = new Map<string, number>();
  expenses.forEach(e => {
    totals.set(e.category, (totals.get(e.category) ?? 0) + e.amount);
  });

  // Sort by amount descending, take top 6
  const sorted = [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  return (
    <div className="space-y-3">
      {sorted.map(([catKey, amount]) => {
        const cat = categories.find(c => c.key === catKey);
        const catBudget = categoryBudgets?.[catKey];
        const hasCatBudget = catBudget != null && catBudget > 0;
        const isOver = hasCatBudget && amount > catBudget;

        // Use category budget for bar if set, otherwise global budget
        const barBase = hasCatBudget ? catBudget : budget;
        const pct = barBase > 0 ? Math.min((amount / barBase) * 100, 100) : 0;

        return (
          <div key={catKey}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-on-surface-variant w-16 truncate">
                {cat?.label ?? catKey}
              </span>
              <div className="flex-grow" />
              {hasCatBudget ? (
                <span className={`text-xs font-bold ${isOver ? 'text-error' : 'text-on-primary-fixed'}`}>
                  {formatCurrency(amount)} / {formatCurrency(catBudget)}
                </span>
              ) : (
                <span className="text-xs font-bold text-on-primary-fixed">
                  {formatCurrency(amount)}
                </span>
              )}
              {isOver && (
                <span className="text-[10px] font-bold text-error bg-error/10 px-1.5 py-0.5 rounded-full flex-shrink-0">
                  over
                </span>
              )}
            </div>
            <div className="h-2 bg-surface-container rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  backgroundColor: isOver ? 'var(--color-error)' : (cat?.color ?? '#78909C'),
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
