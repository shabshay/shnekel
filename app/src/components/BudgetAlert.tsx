import { useState } from 'react';
import { formatCurrency } from '../lib/format';

interface BudgetAlertProps {
  progress: number;  // 0-1+
  remaining: number;
  threshold: number; // 0-100 (default 80)
}

export function BudgetAlert({ progress, remaining, threshold }: BudgetAlertProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const percentUsed = Math.round(progress * 100);
  const thresholdReached = percentUsed >= threshold && percentUsed < 100;
  const overBudget = percentUsed >= 100;

  if (!thresholdReached && !overBudget) return null;

  return (
    <div
      className={`rounded-xl p-4 flex items-center gap-3 mb-6 ${
        overBudget
          ? 'bg-error/10'
          : 'bg-amber-500/10'
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
  );
}
