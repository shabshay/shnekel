import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Settings, Category, Expense } from '../types';
import { useExpenses, getTimeUntilReset, getPeriodLabel } from '../hooks/useExpenses';
import { useAuth } from '../hooks/useAuth';
import { BalanceGauge } from '../components/BalanceGauge';
import { ExpenseList } from '../components/ExpenseList';
import { AddExpenseModal } from '../components/AddExpenseModal';
import { BudgetAlert } from '../components/BudgetAlert';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { resetAllData } from '../lib/storage';
import { getCategories } from '../lib/storage';
import { CategoryBreakdown } from '../components/CategoryBreakdown';
import { CoinLogo } from '../components/CoinLogo';
import { isAdminEmail } from '../lib/admin';
import { SharedBudgetManager } from '../components/SharedBudgetManager';
import { useAccountContext } from '../hooks/useAccountContext';

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
  const [periodOffset, setPeriodOffset] = useState(0);
  const { currentPeriodExpenses, remaining, progress, addExpense, editExpense, removeExpense } = useExpenses(
    settings.period,
    settings.budgetAmount,
    settings.monthStartDay,
    periodOffset,
    settings.dateMode ?? 'transaction'
  );
  const isCurrentPeriod = periodOffset === 0;
  const { signOut, user } = useAuth();
  const [showAdd, setShowAdd] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [resetTime, setResetTime] = useState(getTimeUntilReset(settings.period, settings.monthStartDay));
  const [showSettings, setShowSettings] = useState(false);
  const [search, setSearch] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showCategoryBudgets, setShowCategoryBudgets] = useState(false);
  const [visibleCount, setVisibleCount] = useState(20);
  const [showSharedBudgets, setShowSharedBudgets] = useState(false);
  const { activeContext, isSharedMode, switchToPersonal } = useAccountContext();
  const navigate = useNavigate();

  const filteredExpenses = useMemo(() => {
    if (!search.trim()) return currentPeriodExpenses;
    const q = search.toLowerCase();
    const categories = getCategories();
    return currentPeriodExpenses.filter(e => {
      const catLabel = categories.find(c => c.key === e.category)?.label ?? '';
      return (
        e.description.toLowerCase().includes(q) ||
        catLabel.toLowerCase().includes(q) ||
        String(e.amount).includes(q) ||
        (e.notes && e.notes.toLowerCase().includes(q))
      );
    });
  }, [currentPeriodExpenses, search]);

  // Reset pagination when period or search changes
  useEffect(() => { setVisibleCount(20); }, [periodOffset, search]);

  useEffect(() => {
    const interval = setInterval(() => {
      setResetTime(getTimeUntilReset(settings.period, settings.monthStartDay));
    }, 60000);
    return () => clearInterval(interval);
  }, [settings.period, settings.monthStartDay]);

  const handleAdd = (amount: number, category: Category, description: string, notes?: string, receiptUrl?: string) => {
    addExpense(amount, category, description, notes, receiptUrl);
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
  };

  const handleUpdate = (expense: Expense) => {
    editExpense(expense);
  };

  return (
    <div className="px-6 pt-8 pb-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <CoinLogo size="sm" />
          <div>
            <h1 className="font-headline font-bold text-xl text-on-primary-fixed">Shnekel</h1>
            <p className="text-on-surface-variant text-xs">Spend like it's cash.</p>
          </div>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="w-10 h-10 rounded-xl bg-surface-container-lowest flex items-center justify-center text-on-surface-variant hover:text-on-primary-fixed transition-colors"
        >
          <span className="material-symbols-outlined">settings</span>
        </button>
      </div>

      {/* Settings overlay */}
      {showSettings && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center animate-fade-in">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowSettings(false)} />
          <div className="relative bg-surface-container-lowest rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md p-8 pb-8 z-10 max-h-[100dvh] sm:max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="w-10 h-1 bg-outline-variant rounded-full mx-auto mb-6 sm:hidden" />
            <h2 className="font-headline font-bold text-xl text-on-primary-fixed mb-6">Settings</h2>

            <div className="space-y-5">
              <div>
                <label className="text-xs font-semibold tracking-wide text-on-surface-variant block mb-2">Period</label>
                <div className="flex gap-2">
                  {(['daily', 'weekly', 'monthly'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => onUpdateSettings({ period: p })}
                      className={`flex-1 py-2.5 rounded-lg font-headline text-sm font-semibold transition-all ${
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
                <label className="text-xs font-semibold tracking-wide text-on-surface-variant block mb-2">Budget (₪)</label>
                <input
                  type="number"
                  value={settings.budgetAmount}
                  onChange={e => {
                    const v = parseFloat(e.target.value);
                    if (v > 0) onUpdateSettings({ budgetAmount: v });
                  }}
                  className="w-full bg-surface rounded-xl px-4 py-3 font-headline font-bold text-on-primary-fixed border-none outline-none"
                />
              </div>

              {settings.period === 'monthly' && (
                <div>
                  <label className="text-xs font-semibold tracking-wide text-on-surface-variant block mb-2">Month starts on day</label>
                  <select
                    value={settings.monthStartDay}
                    onChange={e => onUpdateSettings({ monthStartDay: parseInt(e.target.value) })}
                    className="w-full bg-surface rounded-xl px-4 py-3 font-headline font-bold text-on-primary-fixed border-none outline-none"
                  >
                    {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold tracking-wide text-on-surface-variant block mb-2">Alert at (%)</label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={settings.alertThreshold ?? 80}
                  onChange={e => {
                    const v = parseInt(e.target.value);
                    if (v >= 50 && v <= 100) onUpdateSettings({ alertThreshold: v });
                  }}
                  className="w-full bg-surface rounded-xl px-4 py-3 font-headline font-bold text-on-primary-fixed border-none outline-none"
                />
              </div>

              {/* Date mode toggle */}
              <div>
                <label className="text-xs font-semibold tracking-wide text-on-surface-variant block mb-2">Calculate by</label>
                <div className="flex gap-2">
                  {([['transaction', 'Transaction date'], ['billing', 'Billing date']] as const).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => onUpdateSettings({ dateMode: key })}
                      className={`flex-1 py-2.5 rounded-lg font-headline text-sm font-semibold transition-all ${
                        (settings.dateMode ?? 'transaction') === key
                          ? 'bg-primary-container text-white'
                          : 'bg-surface text-on-surface-variant hover:bg-surface-container'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dark mode toggle */}
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold tracking-wide text-on-surface-variant">Dark mode</label>
                <button
                  onClick={() => onUpdateSettings({ darkMode: !settings.darkMode })}
                  className="text-on-surface-variant hover:text-on-primary-fixed transition-colors"
                >
                  <span className="material-symbols-outlined text-2xl">
                    {settings.darkMode ? 'toggle_on' : 'toggle_off'}
                  </span>
                </button>
              </div>

              {/* Category budgets */}
              <div className="pt-2 border-t border-outline-variant/20">
                <button
                  onClick={() => setShowCategoryBudgets(!showCategoryBudgets)}
                  className="w-full flex items-center justify-between py-2"
                >
                  <label className="text-xs font-semibold tracking-wide text-on-surface-variant">Category budgets</label>
                  <span className={`material-symbols-outlined text-on-surface-variant text-lg transition-transform ${showCategoryBudgets ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                </button>
                {showCategoryBudgets && (
                  <div className="space-y-2 pb-2">
                    <p className="text-on-surface-variant text-xs mb-2">Set optional limits per category. Leave empty for no limit.</p>
                    {getCategories().map(cat => (
                      <div key={cat.key} className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: cat.color + '20' }}
                        >
                          <span className="material-symbols-outlined text-sm" style={{ color: cat.color }}>{cat.icon}</span>
                        </div>
                        <span className="text-on-primary-fixed text-xs font-semibold w-20 truncate">{cat.label}</span>
                        <div className="flex-grow relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-on-surface-variant text-xs">₪</span>
                          <input
                            type="number"
                            inputMode="numeric"
                            placeholder="—"
                            value={settings.categoryBudgets?.[cat.key] || ''}
                            onChange={e => {
                              const v = parseFloat(e.target.value);
                              const updated = { ...(settings.categoryBudgets ?? {}) };
                              if (isNaN(v) || v <= 0) {
                                delete updated[cat.key];
                              } else {
                                updated[cat.key] = v;
                              }
                              onUpdateSettings({ categoryBudgets: updated });
                            }}
                            className="w-full bg-surface rounded-lg pl-6 pr-2 py-1.5 text-xs font-headline font-bold text-on-primary-fixed border-none outline-none placeholder:text-outline-variant"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick links */}
              <div className="space-y-1 pt-2 border-t border-outline-variant/20">
                <button
                  onClick={() => { setShowSettings(false); setShowSharedBudgets(true); }}
                  className="w-full flex items-center gap-3 py-3 text-on-surface-variant hover:text-on-primary-fixed transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">group</span>
                  <span className="font-semibold text-sm">Shared budget</span>
                </button>
                <button
                  onClick={() => { setShowSettings(false); navigate('/categories'); }}
                  className="w-full flex items-center gap-3 py-3 text-on-surface-variant hover:text-on-primary-fixed transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">category</span>
                  <span className="font-semibold text-sm">Manage categories</span>
                </button>
                <button
                  onClick={() => { setShowSettings(false); navigate('/import'); }}
                  className="w-full flex items-center gap-3 py-3 text-on-surface-variant hover:text-on-primary-fixed transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">upload_file</span>
                  <span className="font-semibold text-sm">Import expenses from file</span>
                </button>
                {isAdminEmail(user?.email) && (
                  <button
                    onClick={() => { setShowSettings(false); navigate('/admin'); }}
                    className="w-full flex items-center gap-3 py-3 text-on-tertiary-container hover:opacity-80 transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
                    <span className="font-semibold text-sm">Admin panel</span>
                  </button>
                )}
              </div>

              {/* Account */}
              <div className="pt-2 border-t border-outline-variant/20 space-y-2">
                <p className="text-on-surface-variant text-xs truncate">{user?.email}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowResetConfirm(true)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-error text-sm font-semibold bg-error/5 hover:bg-error/10 transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">delete_forever</span>
                    Reset data
                  </button>
                  <button
                    onClick={signOut}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-on-surface-variant text-sm font-semibold bg-surface hover:bg-surface-container transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">logout</span>
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shared mode banner */}
      {isSharedMode && activeContext.type === 'shared' && (
        <div className="bg-tertiary-container/15 border border-tertiary-container/30 rounded-xl p-3 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-on-tertiary-container text-lg">group</span>
            <div>
              <p className="text-on-primary-fixed text-xs font-semibold">Shared budget</p>
              <p className="text-on-surface-variant text-[10px]">{activeContext.ownerEmail}</p>
            </div>
          </div>
          <button
            onClick={() => switchToPersonal()}
            className="text-[10px] font-semibold text-on-tertiary-container bg-tertiary-container/20 rounded-lg px-2.5 py-1 hover:bg-tertiary-container/40 transition-colors"
          >
            My budget
          </button>
        </div>
      )}

      {/* Period navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setPeriodOffset(o => o - 1)}
          className="w-9 h-9 rounded-lg bg-surface-container-lowest flex items-center justify-center text-on-surface-variant hover:text-on-primary-fixed transition-colors"
        >
          <span className="material-symbols-outlined text-lg">chevron_left</span>
        </button>
        <button
          onClick={() => isCurrentPeriod ? null : setPeriodOffset(0)}
          className={`font-headline font-semibold text-sm ${isCurrentPeriod ? 'text-on-primary-fixed' : 'text-on-tertiary-container cursor-pointer hover:underline'}`}
        >
          {getPeriodLabel(settings.period, periodOffset, settings.monthStartDay)}
        </button>
        <button
          onClick={() => setPeriodOffset(o => Math.min(0, o + 1))}
          disabled={isCurrentPeriod}
          className="w-9 h-9 rounded-lg bg-surface-container-lowest flex items-center justify-center text-on-surface-variant hover:text-on-primary-fixed transition-colors disabled:opacity-30"
        >
          <span className="material-symbols-outlined text-lg">chevron_right</span>
        </button>
      </div>

      {/* Budget Alert */}
      {isCurrentPeriod && (
        <BudgetAlert
          progress={progress}
          remaining={remaining}
          threshold={settings.alertThreshold ?? 80}
          categoryAlerts={
            settings.categoryBudgets
              ? Object.entries(settings.categoryBudgets)
                  .filter(([, b]) => b > 0)
                  .map(([catKey, catBudget]) => {
                    const spent = currentPeriodExpenses
                      .filter(e => e.category === catKey)
                      .reduce((sum, e) => sum + e.amount, 0);
                    const label = getCategories().find(c => c.key === catKey)?.label ?? catKey;
                    return { label, spent, budget: catBudget };
                  })
              : undefined
          }
        />
      )}

      {/* Gauge */}
      <div className="mb-8">
        <BalanceGauge
          remaining={remaining}
          budget={settings.budgetAmount}
          progress={progress}
          periodLabel={isCurrentPeriod ? periodLabels[settings.period] : 'spent'}
          resetTime={isCurrentPeriod ? resetTime : ''}
        />
      </div>

      {/* Category Breakdown */}
      {currentPeriodExpenses.length > 0 && (
        <div className="bg-surface-container-lowest rounded-xl p-5 mb-6">
          <h3 className="text-xs font-semibold tracking-wide text-on-surface-variant mb-3">Spending by category</h3>
          <CategoryBreakdown expenses={currentPeriodExpenses} budget={settings.budgetAmount} categoryBudgets={settings.categoryBudgets} />
        </div>
      )}

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

      {/* Search */}
      <div className="relative mb-4">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search expenses..."
          className="w-full bg-surface-container-lowest rounded-xl pl-10 pr-4 py-3 font-body text-sm text-on-surface border-none outline-none placeholder:text-outline-variant"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-primary-fixed"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        )}
      </div>

      {/* Expense list */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-headline font-bold text-lg text-on-primary-fixed">
            {search ? 'Search results' : 'Recent expenses'}
          </h3>
          {filteredExpenses.length > 0 && (
            <span className="text-on-surface-variant text-xs">{filteredExpenses.length} total</span>
          )}
        </div>
        <ExpenseList expenses={filteredExpenses.slice(0, visibleCount)} onDelete={removeExpense} onEdit={handleEdit} />
        {filteredExpenses.length > visibleCount && (
          <button
            onClick={() => setVisibleCount(v => v + 20)}
            className="w-full py-3 mt-3 bg-surface-container-lowest rounded-xl font-headline font-semibold text-sm text-on-surface-variant hover:text-on-primary-fixed transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">expand_more</span>
            Show more ({filteredExpenses.length - visibleCount} remaining)
          </button>
        )}
      </div>

      {/* Add modal */}
      <AddExpenseModal open={showAdd} onClose={() => setShowAdd(false)} onAdd={handleAdd} />

      {/* Edit modal */}
      <AddExpenseModal
        open={!!editingExpense}
        onClose={() => setEditingExpense(null)}
        onAdd={handleAdd}
        onUpdate={handleUpdate}
        editExpense={editingExpense}
      />

      {/* Shared budget manager */}
      <SharedBudgetManager open={showSharedBudgets} onClose={() => setShowSharedBudgets(false)} />

      {/* Reset confirm */}
      <ConfirmDialog
        open={showResetConfirm}
        title="Reset all data?"
        message="This will permanently delete all your expenses, recurring items, categories, and settings. You'll start fresh as if you just signed up. This cannot be undone."
        confirmLabel="Delete everything"
        confirmDestructive
        onConfirm={async () => {
          setShowResetConfirm(false);
          setShowSettings(false);
          await resetAllData();
          window.location.reload();
        }}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
}
