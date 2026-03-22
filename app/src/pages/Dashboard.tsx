import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Settings, Category } from '../types';
import { useExpenses, getTimeUntilReset } from '../hooks/useExpenses';
import { BalanceGauge } from '../components/BalanceGauge';
import { ExpenseList } from '../components/ExpenseList';
import { AddExpenseModal } from '../components/AddExpenseModal';

interface DashboardProps {
  settings: Settings;
  onUpdateSettings: (updates: Partial<Settings>) => void;
}

const periodLabels = {
  daily: 'left today',
  weekly: 'left this week',
  monthly: 'left this month',
};

export function Dashboard({ settings, onUpdateSettings }: DashboardProps) {
  const { currentPeriodExpenses, remaining, progress, addExpense, removeExpense } = useExpenses(
    settings.period,
    settings.budgetAmount,
    settings.monthStartDay
  );
  const [showAdd, setShowAdd] = useState(false);
  const [resetTime, setResetTime] = useState(getTimeUntilReset(settings.period, settings.monthStartDay));
  const [showSettings, setShowSettings] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setResetTime(getTimeUntilReset(settings.period, settings.monthStartDay));
    }, 60000);
    return () => clearInterval(interval);
  }, [settings.period, settings.monthStartDay]);

  const handleAdd = (amount: number, category: Category, description: string) => {
    addExpense(amount, category, description);
  };

  return (
    <div className="px-6 pt-8 pb-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="font-headline font-bold text-2xl text-on-primary-fixed">Balance</h1>
          <p className="text-on-surface-variant text-sm">Spend like it's cash.</p>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="w-10 h-10 rounded-xl bg-surface-container-lowest flex items-center justify-center text-on-surface-variant hover:text-on-primary-fixed transition-colors"
        >
          <span className="material-symbols-outlined">settings</span>
        </button>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="bg-surface-container-lowest rounded-xl p-6 mb-6 space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant block mb-2">
              Period
            </label>
            <div className="flex gap-2">
              {(['daily', 'weekly', 'monthly'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => onUpdateSettings({ period: p })}
                  className={`flex-1 py-2 rounded-lg font-headline text-sm font-semibold transition-all ${
                    settings.period === p
                      ? 'bg-primary-container text-white'
                      : 'bg-surface text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant block mb-2">
              Budget (₪)
            </label>
            <input
              type="number"
              value={settings.budgetAmount}
              onChange={e => {
                const v = parseFloat(e.target.value);
                if (v > 0) onUpdateSettings({ budgetAmount: v });
              }}
              className="w-full bg-surface rounded-lg px-4 py-2 font-headline font-bold text-on-primary-fixed border-none outline-none"
            />
          </div>
          {settings.period === 'monthly' && (
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant block mb-2">
                Month starts on day
              </label>
              <select
                value={settings.monthStartDay}
                onChange={e => onUpdateSettings({ monthStartDay: parseInt(e.target.value) })}
                className="w-full bg-surface rounded-lg px-4 py-2 font-headline font-bold text-on-primary-fixed border-none outline-none"
              >
                {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Gauge */}
      <div className="mb-8">
        <BalanceGauge
          remaining={remaining}
          progress={progress}
          periodLabel={periodLabels[settings.period]}
          resetTime={resetTime}
        />
      </div>

      {/* Add Expense Button */}
      <button
        onClick={() => setShowAdd(true)}
        className="w-full py-4 bg-primary-container text-on-primary font-headline font-bold text-base rounded-xl flex items-center justify-center gap-3 hover:opacity-90 active:scale-[0.98] transition-all shadow-xl shadow-primary-container/10 mb-6"
      >
        <span className="material-symbols-outlined filled">add_circle</span>
        Add expense
      </button>

      {/* Tab buttons */}
      <div className="flex gap-3 mb-6">
        <button className="flex-1 py-3 bg-surface-container-lowest rounded-xl font-headline font-semibold text-sm text-on-primary-fixed border-2 border-primary-container/10">
          All Expenses
        </button>
        <button
          onClick={() => navigate('/reports')}
          className="flex-1 py-3 bg-surface-container-lowest rounded-xl font-headline font-semibold text-sm text-on-surface-variant hover:text-on-primary-fixed transition-colors"
        >
          Reports
        </button>
      </div>

      {/* Recent expenses */}
      <div>
        <h3 className="font-headline font-bold text-lg text-on-primary-fixed mb-4">Recent expenses</h3>
        <ExpenseList expenses={currentPeriodExpenses} onDelete={removeExpense} />
      </div>

      <AddExpenseModal open={showAdd} onClose={() => setShowAdd(false)} onAdd={handleAdd} />
    </div>
  );
}
