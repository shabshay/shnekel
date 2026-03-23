import { formatCurrency } from '../lib/format';

interface BalanceGaugeProps {
  remaining: number;
  budget: number;
  progress: number;
  periodLabel: string;
  resetTime: string;
}

export function BalanceGauge({ remaining, budget, progress, periodLabel, resetTime }: BalanceGaugeProps) {
  const radius = 130;
  const stroke = 12;
  const normalizedRadius = radius - stroke / 2;
  const circumference = 2 * Math.PI * normalizedRadius;

  const isOverBudget = remaining < 0;
  const clampedProgress = Math.min(progress, 1);
  const remainingProgress = 1 - clampedProgress;
  const strokeDashoffset = circumference * (1 - remainingProgress);

  const strokeColor = isOverBudget
    ? 'var(--color-error)'
    : 'var(--color-on-tertiary-container)';

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: radius * 2, height: radius * 2 }}>
        <svg width={radius * 2} height={radius * 2} className="-rotate-90">
          {/* Background track */}
          <circle
            cx={radius}
            cy={radius}
            r={normalizedRadius}
            fill="none"
            stroke="var(--color-surface-container)"
            strokeWidth={stroke}
          />
          {/* Progress arc */}
          <circle
            cx={radius}
            cy={radius}
            r={normalizedRadius}
            fill="none"
            stroke={strokeColor}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-headline font-extrabold text-5xl tracking-tight ${isOverBudget ? 'text-error' : 'text-on-primary-fixed'}`}>
            {formatCurrency(remaining)}
          </span>
          <span className={`font-headline font-semibold text-sm mt-1 ${isOverBudget ? 'text-error' : 'text-on-tertiary-container'}`}>
            {isOverBudget ? 'over budget' : periodLabel}
          </span>
          {/* Budget context pill */}
          <span className="text-xs text-on-surface-variant bg-surface-container rounded-full px-3 py-1 mt-2">
            of {formatCurrency(budget)} budget
          </span>
        </div>
      </div>
      {resetTime && (
        <p className="text-on-surface-variant text-sm mt-4">
          Resets in <span className="font-semibold text-on-tertiary-container">{resetTime}</span>
        </p>
      )}
    </div>
  );
}
