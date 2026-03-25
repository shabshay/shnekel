import { useState } from 'react';
import { formatCurrency } from '../lib/format';

interface CategoryAlert {
  label: string;
  spent: number;
  budget: number;
}

interface BudgetAlertProps {
  progress: number;  // 0-1+
  remaining: number;
  threshold: number; // 0-100 (default 80)
  categoryAlerts?: CategoryAlert[];
}

export function BudgetAlert({ progress, remaining, threshold, categoryAlerts }: BudgetAlertProps) {
  const [dismissed, setDismissed] = useState(false);
  const [catDismissed, setCatDismissed] = useState(false);

  const percentUsed = Math.round(progress * 100);
  const thresholdReached = percentUsed >= threshold && percentUsed < 100;
  const overBudget = percentUsed >= 100;

  const overCategories = (categoryAlerts ?? []).filter(c => c.spent > c.budget);

  return (
    <>
      {/* Global budget alert */}
      {!dismissed && (thresholdReached || overBudget) && (
        <div
          className={`rounded-xl p-4 flex items-center gap-3 mb-4 ${
            overBudget ? 'bg-error/10' : 'bg-amber-500/10'
          }`}
        >
          <span className={`material-symbols-outlined text-xl ${overBudget ? 'text-error' : 'text-amber-600'}`}>
            {overBudget ? 'error' : 'warning'}
          </span>
          <p className={`text-sm font-medium flex-grow ${overBudget ? 'text-error' : 'text-amber-700'}`}>
            {overBudget
              ? `Over budget by ${formatCurrency(Math.abs(remaining))}`
              : `${percentUsed}% of budget used`
            }
          </p>
          <button
            onClick={() => setDismissed(true)}
            className={`text-xs font-semibold ${overBudget ? 'text-error/60' : 'text-amber-600/60'} hover:opacity-100 transition-opacity`}
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      )}

      {/* Category budget alerts */}
      {!catDismissed && overCategories.length > 0 && (
        <div className="rounded-xl p-4 flex items-center gap-3 mb-4 bg-error/5">
          <span className="material-symbols-outlined text-lg text-error">category</span>
          <p className="text-sm font-medium flex-grow text-error/80">
            {overCategories.length === 1
              ? `${overCategories[0].label} is over its category budget`
              : `${overCategories.map(c => c.label).join(', ')} are over their category budgets`
            }
          </p>
          <button
            onClick={() => setCatDismissed(true)}
            className="text-error/40 hover:text-error/70 transition-opacity"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      )}
    </>
  );
}
