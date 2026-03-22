import { useState } from 'react';
import type { Period } from '../types';
import { CoinLogo } from '../components/CoinLogo';

interface OnboardingProps {
  onComplete: (period: Period, budget: number, monthStartDay?: number) => void;
}

const periodOptions: { key: Period; label: string; desc: string; icon: string }[] = [
  { key: 'daily', label: 'Daily', desc: 'Reset every day', icon: 'calendar_today' },
  { key: 'weekly', label: 'Weekly', desc: 'Reset every week', icon: 'date_range' },
  { key: 'monthly', label: 'Monthly', desc: 'Reset every month', icon: 'calendar_month' },
];

const presets = [100, 200, 500];

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [period, setPeriod] = useState<Period>('daily');
  const [budget, setBudget] = useState('200');
  const [monthStartDay, setMonthStartDay] = useState(1);

  const totalSteps = period === 'monthly' ? 3 : 2;

  const handleContinueStep1 = () => {
    setStep(2);
  };

  const getNextStepFromMonthDay = () => setStep(3);

  const getBudgetStep = () => (period === 'monthly' ? 3 : 2);

  return (
    <div className="min-h-dvh flex flex-col bg-surface">
      {/* Header */}
      <header className="px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <CoinLogo size="sm" />
          <h1 className="font-headline font-black text-primary-container text-2xl tracking-tight">
            Shnekel
          </h1>
        </div>
        <span className="text-on-surface-variant font-medium text-sm">Step {step} of {totalSteps}</span>
      </header>

      {/* Progress dots */}
      <div className="flex justify-center gap-2 mb-8">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div key={i} className={`h-1.5 w-10 rounded-full ${step >= i + 1 ? 'bg-primary-container' : 'bg-outline-variant'}`} />
        ))}
      </div>

      <main className="flex-grow flex items-start justify-center px-6">
        <div className="max-w-md w-full">
          {/* Step 1: Choose period */}
          {step === 1 && (
            <>
              <h2 className="font-headline font-bold text-3xl text-on-primary-fixed tracking-tight mb-2">
                Choose your period
              </h2>
              <p className="text-on-surface-variant text-base mb-8">
                How often should your budget reset?
              </p>

              <div className="space-y-3">
                {periodOptions.map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setPeriod(opt.key)}
                    className={`w-full flex items-center p-5 rounded-xl transition-all duration-200 ${
                      period === opt.key
                        ? 'bg-primary-container text-white'
                        : 'bg-surface-container-lowest text-on-primary-fixed hover:bg-surface-container'
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center mr-5 ${
                        period === opt.key ? 'bg-white/15' : 'bg-surface-container'
                      }`}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ color: period === opt.key ? '#fff' : undefined }}
                      >
                        {opt.icon}
                      </span>
                    </div>
                    <div className="text-left">
                      <h3 className="font-headline font-semibold text-lg">{opt.label}</h3>
                      <p className={`text-sm ${period === opt.key ? 'text-white/70' : 'text-on-surface-variant'}`}>
                        {opt.desc}
                      </p>
                    </div>
                    {period === opt.key && (
                      <span className="material-symbols-outlined filled ml-auto">check_circle</span>
                    )}
                  </button>
                ))}
              </div>

              <button
                onClick={handleContinueStep1}
                className="w-full mt-10 py-4 bg-primary-container text-on-primary font-headline font-bold text-lg rounded-xl hover:opacity-90 active:scale-[0.98] transition-all shadow-xl shadow-primary-container/10"
              >
                Continue
              </button>
            </>
          )}

          {/* Step 2 (monthly only): Choose month start day */}
          {step === 2 && period === 'monthly' && (
            <>
              <h2 className="font-headline font-bold text-3xl text-on-primary-fixed tracking-tight mb-2">
                When does your month start?
              </h2>
              <p className="text-on-surface-variant text-base mb-8">
                Pick the day your budget resets each month (e.g. salary day).
              </p>

              {/* Day grid */}
              <div className="grid grid-cols-7 gap-2 mb-8">
                {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                  <button
                    key={day}
                    onClick={() => setMonthStartDay(day)}
                    className={`aspect-square rounded-lg font-headline font-semibold text-sm flex items-center justify-center transition-all ${
                      monthStartDay === day
                        ? 'bg-primary-container text-white'
                        : 'bg-surface-container-lowest text-on-primary-fixed hover:bg-surface-container'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>

              <div className="bg-surface-container-lowest rounded-xl p-4 mb-8 flex items-center gap-3">
                <span className="material-symbols-outlined text-on-tertiary-container">info</span>
                <p className="text-on-surface-variant text-sm">
                  Your budget will reset on the <span className="font-semibold text-on-primary-fixed">{monthStartDay}{getOrdinal(monthStartDay)}</span> of each month.
                </p>
              </div>

              <div className="flex gap-4 items-center">
                <button
                  onClick={() => setStep(1)}
                  className="font-headline font-semibold text-on-surface-variant hover:text-on-primary-fixed transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={getNextStepFromMonthDay}
                  className="flex-1 py-4 bg-primary-container text-on-primary font-headline font-bold text-lg rounded-xl hover:opacity-90 active:scale-[0.98] transition-all shadow-xl shadow-primary-container/10"
                >
                  Continue
                </button>
              </div>
            </>
          )}

          {/* Budget step (step 2 for daily/weekly, step 3 for monthly) */}
          {step === getBudgetStep() && !(step === 2 && period === 'monthly') && (
            <>
              <h2 className="font-headline font-bold text-3xl text-on-primary-fixed tracking-tight mb-2">
                Set your budget
              </h2>
              <p className="text-on-surface-variant text-base mb-8">
                How much can you spend per {period === 'daily' ? 'day' : period === 'weekly' ? 'week' : 'month'}?
              </p>

              {/* Budget input */}
              <div className="bg-surface-container-lowest rounded-xl p-8 mb-6">
                <div className="flex items-baseline justify-center">
                  <span className="font-headline text-on-primary-fixed font-bold text-4xl mr-1">₪</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={budget}
                    onChange={e => setBudget(e.target.value)}
                    className="font-headline text-on-primary-fixed font-extrabold text-6xl bg-transparent border-none outline-none text-center w-40 placeholder:text-outline-variant"
                    placeholder="0"
                    autoFocus
                  />
                </div>
              </div>

              {/* Presets */}
              <div className="flex gap-3 mb-10">
                {presets.map(p => (
                  <button
                    key={p}
                    onClick={() => setBudget(String(p))}
                    className={`flex-1 py-3 rounded-xl font-headline font-semibold text-sm transition-all ${
                      budget === String(p)
                        ? 'bg-primary-container text-white'
                        : 'bg-surface-container-lowest text-on-primary-fixed hover:bg-surface-container'
                    }`}
                  >
                    ₪{p}
                  </button>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-4 items-center">
                <button
                  onClick={() => setStep(step - 1)}
                  className="font-headline font-semibold text-on-surface-variant hover:text-on-primary-fixed transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => {
                    const num = parseFloat(budget);
                    if (num > 0) onComplete(period, num, period === 'monthly' ? monthStartDay : undefined);
                  }}
                  disabled={!budget || parseFloat(budget) <= 0}
                  className="flex-1 py-4 bg-primary-container text-on-primary font-headline font-bold text-lg rounded-xl hover:opacity-90 active:scale-[0.98] transition-all shadow-xl shadow-primary-container/10 disabled:opacity-40"
                >
                  Get Started
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function getOrdinal(n: number): string {
  if (n >= 11 && n <= 13) return 'th';
  switch (n % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}
