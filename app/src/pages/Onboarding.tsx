import { useState } from 'react';
import type { Period } from '../types';
import { CoinLogo } from '../components/CoinLogo';
import { useLocale } from '../hooks/useLocale'

interface OnboardingProps {
  onComplete: (period: Period, budget: number, monthStartDay?: number) => void;
}

const periodOptions: { key: Period; labelKey: string; descKey: string; icon: string }[] = [
  { key: 'daily', labelKey: 'period.daily', descKey: 'period.dailyDesc', icon: 'calendar_today' },
  { key: 'weekly', labelKey: 'period.weekly', descKey: 'period.weeklyDesc', icon: 'date_range' },
  { key: 'monthly', labelKey: 'period.monthly', descKey: 'period.monthlyDesc', icon: 'calendar_month' },
];

const presetsByPeriod: Record<Period, number[]> = {
  daily: [50, 100, 200],
  weekly: [500, 1000, 2000],
  monthly: [3000, 5000, 10000],
};

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [period, setPeriod] = useState<Period>('daily');
  const [budget, setBudget] = useState('100');
  const [monthStartDay, setMonthStartDay] = useState(1);
  const { t } = useLocale()

  const totalSteps = period === 'monthly' ? 3 : 2;

  const handleSelectPeriod = (p: Period) => {
    setPeriod(p);
    // Set default budget to the middle preset for the selected period
    setBudget(String(presetsByPeriod[p][1]));
  };

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
            {t('app.name')}
          </h1>
        </div>
        <span className="text-on-surface-variant font-medium text-sm">{t('onboarding.step', { step, total: totalSteps })}</span>
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
                {t('onboarding.choosePeriod')}
              </h2>
              <p className="text-on-surface-variant text-base mb-8">
                {t('onboarding.choosePeriodDesc')}
              </p>

              <div className="space-y-3">
                {periodOptions.map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => handleSelectPeriod(opt.key)}
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
                      <h3 className="font-headline font-semibold text-lg">{t(opt.labelKey)}</h3>
                      <p className={`text-sm ${period === opt.key ? 'text-white/70' : 'text-on-surface-variant'}`}>
                        {t(opt.descKey)}
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
                {t('onboarding.continue')}
              </button>
            </>
          )}

          {/* Step 2 (monthly only): Choose month start day */}
          {step === 2 && period === 'monthly' && (
            <>
              <h2 className="font-headline font-bold text-3xl text-on-primary-fixed tracking-tight mb-2">
                {t('onboarding.monthStart')}
              </h2>
              <p className="text-on-surface-variant text-base mb-8">
                {t('onboarding.monthStartDesc')}
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
                  {t('onboarding.monthResetInfo', { day: monthStartDay, ordinal: getOrdinal(monthStartDay) })}
                </p>
              </div>

              <div className="flex gap-4 items-center">
                <button
                  onClick={() => setStep(1)}
                  className="font-headline font-semibold text-on-surface-variant hover:text-on-primary-fixed transition-colors"
                >
                  {t('onboarding.back')}
                </button>
                <button
                  onClick={getNextStepFromMonthDay}
                  className="flex-1 py-4 bg-primary-container text-on-primary font-headline font-bold text-lg rounded-xl hover:opacity-90 active:scale-[0.98] transition-all shadow-xl shadow-primary-container/10"
                >
                  {t('onboarding.continue')}
                </button>
              </div>
            </>
          )}

          {/* Budget step (step 2 for daily/weekly, step 3 for monthly) */}
          {step === getBudgetStep() && !(step === 2 && period === 'monthly') && (
            <>
              <h2 className="font-headline font-bold text-3xl text-on-primary-fixed tracking-tight mb-2">
                {t('onboarding.setBudget')}
              </h2>
              <p className="text-on-surface-variant text-base mb-8">
                {t(period === 'daily' ? 'onboarding.budgetPerDay' : period === 'weekly' ? 'onboarding.budgetPerWeek' : 'onboarding.budgetPerMonth')}
              </p>

              {/* Budget input */}
              <div className="bg-surface-container-lowest rounded-xl p-8 mb-6">
                <div className="flex items-baseline justify-center">
                  <span className="font-headline text-on-primary-fixed font-bold text-3xl mr-1">₪</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={budget}
                    onChange={e => setBudget(e.target.value)}
                    className="font-headline text-on-primary-fixed font-extrabold text-5xl bg-transparent border-none outline-none text-center w-52 placeholder:text-outline-variant"
                    placeholder="0"
                    autoFocus
                  />
                </div>
              </div>

              {/* Presets */}
              <div className="flex gap-3 mb-10">
                {presetsByPeriod[period].map(p => (
                  <button
                    key={p}
                    onClick={() => setBudget(String(p))}
                    className={`flex-1 py-3 rounded-xl font-headline font-semibold text-sm transition-all active:scale-95 ${
                      budget === String(p)
                        ? 'bg-primary-container text-white'
                        : 'bg-surface-container-lowest text-on-primary-fixed hover:bg-surface-container'
                    }`}
                  >
                    ₪{p.toLocaleString()}
                  </button>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-4 items-center">
                <button
                  onClick={() => setStep(step - 1)}
                  className="font-headline font-semibold text-on-surface-variant hover:text-on-primary-fixed transition-colors"
                >
                  {t('onboarding.back')}
                </button>
                <button
                  onClick={() => {
                    const num = parseFloat(budget);
                    if (num > 0) onComplete(period, num, period === 'monthly' ? monthStartDay : undefined);
                  }}
                  disabled={!budget || parseFloat(budget) <= 0}
                  className="flex-1 py-4 bg-primary-container text-on-primary font-headline font-bold text-lg rounded-xl hover:opacity-90 active:scale-[0.98] transition-all shadow-xl shadow-primary-container/10 disabled:opacity-40"
                >
                  {t('onboarding.getStarted')}
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
