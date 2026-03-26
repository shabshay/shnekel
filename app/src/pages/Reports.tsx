import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { getExpenses, getSettings } from '../lib/storage';
import { getExpenseStats, type StatsFilterPeriod } from '../hooks/useExpenses';
import { StatsCard } from '../components/StatsCard';
import { getCategories } from '../lib/storage';
import { formatCurrency } from '../lib/format';
import { exportExpenses } from '../lib/exportData';
import { CategoryIcon } from '../components/CategoryIcon';
import { useLocale } from '../hooks/useLocale';
import type { Category } from '../types';

export function Reports() {
  const [filter, setFilter] = useState<StatsFilterPeriod>('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const navigate = useNavigate();
  const { t } = useLocale();
  const expenses = getExpenses();
  const settings = getSettings();

  const stats = useMemo(() => {
    if (filter === 'custom' && customStart && customEnd) {
      return getExpenseStats(expenses, 'custom', {
        monthStartDay: settings.monthStartDay,
        dateMode: settings.dateMode ?? 'transaction',
        customStart: new Date(customStart),
        customEnd: new Date(customEnd + 'T23:59:59'),
      });
    }
    return getExpenseStats(expenses, filter, {
      monthStartDay: settings.monthStartDay,
      dateMode: settings.dateMode ?? 'transaction',
    });
  }, [expenses, filter, settings.monthStartDay, settings.dateMode, customStart, customEnd]);

  // Previous period stats for trend comparison
  const prevStats = useMemo(() => {
    if (filter === 'custom') return null;
    const periodMs = stats.periodEnd.getTime() - stats.periodStart.getTime();
    const prevStart = new Date(stats.periodStart.getTime() - periodMs);
    const prevEnd = new Date(stats.periodStart.getTime() - 1);
    return getExpenseStats(expenses, 'custom', {
      monthStartDay: settings.monthStartDay,
      dateMode: settings.dateMode ?? 'transaction',
      customStart: prevStart,
      customEnd: prevEnd,
    });
  }, [expenses, filter, stats.periodStart, stats.periodEnd, settings.monthStartDay, settings.dateMode]);

  const topCatLabel = getCategories().find(c => c.key === stats.topCategory)?.label || (stats.topCategory === 'None' ? t('common.none') : stats.topCategory);
  const topCatColor = getCategories().find(c => c.key === stats.topCategory)?.color;
  const allCategories = getCategories();

  const trendPct = prevStats && prevStats.avgPerDay > 0
    ? ((stats.avgPerDay - prevStats.avgPerDay) / prevStats.avgPerDay) * 100
    : null;

  const budgetPct = settings.budgetAmount > 0
    ? Math.min((stats.totalSpent / settings.budgetAmount) * 100, 150)
    : 0;

  const hasData = filter !== 'custom' || (customStart && customEnd);

  const filters: { key: StatsFilterPeriod; label: string }[] = [
    { key: 'today', label: t('reports.today') },
    { key: 'week', label: t('reports.week') },
    { key: 'month', label: t('reports.month') },
    { key: 'custom', label: t('reports.custom') },
  ];

  return (
    <div className="px-6 pt-8 pb-28 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/')}
          className="text-on-surface-variant hover:text-on-primary-fixed transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="font-headline font-bold text-2xl text-on-primary-fixed flex-grow">{t('reports.title')}</h1>
        <button
          onClick={() => exportExpenses(stats.filteredExpenses, stats, filters.find(f => f.key === filter)!.label)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-container-lowest text-on-surface-variant hover:text-on-primary-fixed font-semibold text-sm transition-colors"
        >
          <span className="material-symbols-outlined text-lg">download</span>
          {t('reports.export')}
        </button>
      </div>

      {/* Time filter */}
      <div className="flex gap-2 mb-4">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-xl font-headline text-sm font-semibold transition-all ${
              filter === f.key
                ? 'bg-primary-container text-white'
                : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Custom date range picker */}
      {filter === 'custom' && (
        <div className="flex gap-3 mb-6">
          <div className="flex-1">
            <label className="text-on-surface-variant text-xs font-semibold tracking-wide block mb-1">{t('reports.from')}</label>
            <input
              type="date"
              value={customStart}
              onChange={e => setCustomStart(e.target.value)}
              className="w-full bg-surface-container-lowest rounded-xl px-4 py-3 font-headline text-sm font-semibold text-on-primary-fixed border-none outline-none"
            />
          </div>
          <div className="flex-1">
            <label className="text-on-surface-variant text-xs font-semibold tracking-wide block mb-1">{t('reports.to')}</label>
            <input
              type="date"
              value={customEnd}
              onChange={e => setCustomEnd(e.target.value)}
              className="w-full bg-surface-container-lowest rounded-xl px-4 py-3 font-headline text-sm font-semibold text-on-primary-fixed border-none outline-none"
            />
          </div>
        </div>
      )}

      {/* No dates selected hint */}
      {filter === 'custom' && (!customStart || !customEnd) && (
        <div className="bg-surface-container-lowest rounded-xl p-4 mb-6 flex items-center gap-3">
          <span className="material-symbols-outlined text-on-surface-variant">info</span>
          <p className="text-on-surface-variant text-sm">{t('reports.customHint')}</p>
        </div>
      )}

      {hasData && (
        <>
          {/* ── Section 1: Overview Stats ── */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <StatsCard label={t('reports.totalSpent')} value={formatCurrency(stats.totalSpent)} color="#E040FB" />
            <StatsCard label={t('reports.avgPerDay')} value={formatCurrency(stats.avgPerDay)} color="#4E7CFF" />
            <StatsCard label={t('reports.highestDay')} value={formatCurrency(stats.highestDay)} color="#FF6B35" />
            <StatsCard label={t('reports.topCategory')} value={topCatLabel} color={topCatColor} />
          </div>

          {/* ── Section 2: Budget Comparison ── */}
          {settings.budgetAmount > 0 && (
            <div className="bg-surface-container-lowest rounded-xl p-5 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold tracking-wide text-on-surface-variant">{t('reports.budgetUsage')}</h3>
                <span className={`text-xs font-bold ${budgetPct > 100 ? 'text-error' : 'text-on-tertiary-container'}`}>
                  {Math.round(budgetPct)}%
                </span>
              </div>
              <div className="h-3 bg-surface-container rounded-full overflow-hidden mb-3">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${budgetPct > 100 ? 'bg-error' : 'bg-on-tertiary-container'}`}
                  style={{ width: `${Math.min(budgetPct, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-on-primary-fixed font-semibold">
                  {formatCurrency(stats.totalSpent)} spent
                </span>
                <span className="text-on-surface-variant">
                  of {formatCurrency(settings.budgetAmount)} budget
                </span>
              </div>
            </div>
          )}

          {/* ── Section 3: Quick Stats Row ── */}
          <div className="flex gap-3 mb-6">
            <div className="flex-1 bg-surface-container-lowest rounded-xl p-4 text-center">
              <p className="font-headline font-bold text-xl text-on-primary-fixed">{stats.expenseCount}</p>
              <p className="text-on-surface-variant text-xs font-semibold">{t('reports.expenses')}</p>
            </div>
            <div className="flex-1 bg-surface-container-lowest rounded-xl p-4 text-center">
              <p className="font-headline font-bold text-xl text-on-primary-fixed">{stats.daysDiff}</p>
              <p className="text-on-surface-variant text-xs font-semibold">{t('reports.days')}</p>
            </div>
            {trendPct !== null && (
              <div className="flex-1 bg-surface-container-lowest rounded-xl p-4 text-center">
                <p className={`font-headline font-bold text-xl ${trendPct > 0 ? 'text-error' : 'text-on-tertiary-container'}`}>
                  {trendPct > 0 ? '+' : ''}{Math.round(trendPct)}%
                </p>
                <p className="text-on-surface-variant text-xs font-semibold">{t('reports.vsPrev')}</p>
              </div>
            )}
          </div>

          {/* ── Section 4: Spending Chart ── */}
          <div className="bg-surface-container-lowest rounded-xl p-5 mb-6">
            <h3 className="text-xs font-semibold tracking-wide text-on-surface-variant mb-4">{t('reports.spendingOverTime')}</h3>
            {stats.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={stats.chartData}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-on-tertiary-container)" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="var(--color-on-tertiary-container)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant)" opacity={0.3} />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="var(--color-on-surface-variant)" axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} stroke="var(--color-on-surface-variant)" axisLine={false} tickLine={false} tickFormatter={v => formatCurrency(Number(v))} />
                  <Tooltip
                    formatter={(value: unknown) => [formatCurrency(Number(value), true), 'Spent']}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 40px rgba(19,27,46,0.06)', fontFamily: 'Lexend' }}
                  />
                  <Area type="monotone" dataKey="amount" stroke="var(--color-on-tertiary-container)" strokeWidth={2.5} fill="url(#colorAmount)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-40 flex flex-col items-center justify-center gap-3">
                <div className="flex items-end gap-2 h-20 w-full max-w-xs">
                  {[35, 55, 25, 70, 45, 60, 30].map((h, i) => (
                    <div key={i} className="flex-1 bg-surface-container rounded animate-pulse" style={{ height: `${h}%` }} />
                  ))}
                </div>
                <p className="text-on-surface-variant text-sm text-center">{t('reports.emptyChart')}</p>
              </div>
            )}
          </div>

          {/* ── Section 5: Category Breakdown ── */}
          {stats.categoryBreakdown.length > 0 && (
            <div className="bg-surface-container-lowest rounded-xl p-5 mb-6">
              <h3 className="text-xs font-semibold tracking-wide text-on-surface-variant mb-4">{t('reports.byCategory')}</h3>
              <div className="space-y-3">
                {stats.categoryBreakdown.map(cat => {
                  const info = allCategories.find(c => c.key === cat.category);
                  const catBudget = settings.categoryBudgets?.[cat.category];
                  const hasCatBudget = catBudget != null && catBudget > 0;
                  const isOver = hasCatBudget && cat.total > catBudget;
                  const barBase = hasCatBudget ? catBudget : stats.totalSpent;
                  const pct = barBase > 0 ? Math.min((cat.total / barBase) * 100, 100) : 0;
                  return (
                    <div key={cat.category}>
                      <div className="flex items-center gap-3 mb-1.5">
                        <CategoryIcon category={cat.category as Category} size="sm" />
                        <div className="flex-grow min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-on-primary-fixed text-sm">{info?.label ?? cat.category}</span>
                            <span className={`font-headline font-bold text-sm ${isOver ? 'text-error' : 'text-on-primary-fixed'}`}>
                              {formatCurrency(cat.total)}
                              {hasCatBudget && <span className="text-on-surface-variant font-normal"> / {formatCurrency(catBudget)}</span>}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-on-surface-variant text-xs">{t('reports.expenseCount', { count: cat.count })}</span>
                            {isOver ? (
                              <span className="text-error text-xs font-semibold">{t('reports.overBudget')}</span>
                            ) : (
                              <span className="text-on-surface-variant text-xs">{Math.round(pct)}%</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="h-1.5 bg-surface-container rounded-full overflow-hidden ml-13">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: isOver ? 'var(--color-error)' : (info?.color ?? '#78909C') }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Section 6: Recurring vs One-time ── */}
          {stats.recurringTotal > 0 && (
            <div className="bg-surface-container-lowest rounded-xl p-5 mb-6">
              <h3 className="text-xs font-semibold tracking-wide text-on-surface-variant mb-4">{t('reports.recurVsOneTime')}</h3>
              <div className="flex gap-3 mb-3">
                <div className="flex-1 text-center">
                  <p className="font-headline font-bold text-lg text-on-primary-fixed">{formatCurrency(stats.recurringTotal)}</p>
                  <p className="text-on-surface-variant text-xs font-semibold">{t('reports.recurring')}</p>
                </div>
                <div className="w-px bg-outline-variant/30" />
                <div className="flex-1 text-center">
                  <p className="font-headline font-bold text-lg text-on-primary-fixed">{formatCurrency(stats.oneTimeTotal)}</p>
                  <p className="text-on-surface-variant text-xs font-semibold">{t('reports.oneTime')}</p>
                </div>
              </div>
              {/* Stacked bar */}
              <div className="h-3 bg-surface-container rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-on-tertiary-container transition-all duration-500"
                  style={{ width: `${stats.totalSpent > 0 ? (stats.recurringTotal / stats.totalSpent) * 100 : 0}%` }}
                />
                <div
                  className="h-full bg-primary-container transition-all duration-500"
                  style={{ width: `${stats.totalSpent > 0 ? (stats.oneTimeTotal / stats.totalSpent) * 100 : 0}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-on-surface-variant">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-on-tertiary-container" /> {t('reports.recurring')}</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary-container" /> {t('reports.oneTime')}</span>
              </div>
            </div>
          )}

          {/* ── Section 7: Top Expenses ── */}
          {stats.topExpenses.length > 0 && (
            <div className="bg-surface-container-lowest rounded-xl p-5 mb-6">
              <h3 className="text-xs font-semibold tracking-wide text-on-surface-variant mb-4">
                {t('reports.topExpenses', { count: Math.min(stats.topExpenses.length, 10) })}
              </h3>
              <div className="space-y-3">
                {stats.topExpenses.map((exp, idx) => {
                  const catInfo = allCategories.find(c => c.key === exp.category);
                  return (
                    <div key={exp.id} className="flex items-center gap-3">
                      <span className="text-on-surface-variant text-xs font-bold w-5 text-right">{idx + 1}</span>
                      <CategoryIcon category={exp.category as Category} size="sm" />
                      <div className="flex-grow min-w-0">
                        <p className="font-semibold text-on-primary-fixed text-sm truncate">{exp.description}</p>
                        <p className="text-on-surface-variant text-xs">
                          {new Date(exp.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                          {' · '}{catInfo?.label ?? exp.category}
                        </p>
                      </div>
                      <span className="font-headline font-bold text-on-primary-fixed text-sm flex-shrink-0">
                        {formatCurrency(exp.amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
