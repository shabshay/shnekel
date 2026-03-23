import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { getExpenses, getSettings } from '../lib/storage';
import { getExpenseStats, type StatsFilterPeriod } from '../hooks/useExpenses';
import { StatsCard } from '../components/StatsCard';
import { getCategories } from '../lib/storage';
import { formatCurrency } from '../lib/format';
import { exportExpenses } from '../lib/exportData';

export function Reports() {
  const [filter, setFilter] = useState<StatsFilterPeriod>('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const navigate = useNavigate();
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

  const topCatLabel = getCategories().find(c => c.key === stats.topCategory)?.label || stats.topCategory;
  const topCatColor = getCategories().find(c => c.key === stats.topCategory)?.color;

  const filters: { key: StatsFilterPeriod; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
    { key: 'custom', label: 'Custom' },
  ];

  return (
    <div className="px-6 pt-8 pb-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/')}
          className="text-on-surface-variant hover:text-on-primary-fixed transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="font-headline font-bold text-2xl text-on-primary-fixed flex-grow">Reports</h1>
        <button
          onClick={() => exportExpenses(stats.filteredExpenses, stats, filters.find(f => f.key === filter)!.label)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-container-lowest text-on-surface-variant hover:text-on-primary-fixed font-semibold text-sm transition-colors"
        >
          <span className="material-symbols-outlined text-lg">download</span>
          Export
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
            <label className="text-on-surface-variant text-xs font-semibold tracking-wide block mb-1">From</label>
            <input
              type="date"
              value={customStart}
              onChange={e => setCustomStart(e.target.value)}
              className="w-full bg-surface-container-lowest rounded-xl px-4 py-3 font-headline text-sm font-semibold text-on-primary-fixed border-none outline-none"
            />
          </div>
          <div className="flex-1">
            <label className="text-on-surface-variant text-xs font-semibold tracking-wide block mb-1">To</label>
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
          <p className="text-on-surface-variant text-sm">Select a start and end date to view your report.</p>
        </div>
      )}

      {/* Stats grid */}
      {(filter !== 'custom' || (customStart && customEnd)) && (
        <>
          <div className="grid grid-cols-2 gap-3 mb-8">
            <StatsCard label="Total spent" value={formatCurrency(stats.totalSpent)} color="#E040FB" />
            <StatsCard label="Average per day" value={formatCurrency(stats.avgPerDay)} color="#4E7CFF" />
            <StatsCard label="Highest day" value={formatCurrency(stats.highestDay)} color="#FF6B35" />
            <StatsCard label="Top category" value={topCatLabel} color={topCatColor} />
          </div>

          {/* Chart */}
          <div className="bg-surface-container-lowest rounded-xl p-6">
            <h3 className="font-headline font-bold text-on-primary-fixed mb-6">Spending over time</h3>
            {stats.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={stats.chartData}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eceef0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: '#45464d' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#45464d' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={v => formatCurrency(Number(v))}
                  />
                  <Tooltip
                    formatter={(value: unknown) => [formatCurrency(Number(value), true), 'Spent']}
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 20px 40px rgba(19,27,46,0.06)',
                      fontFamily: 'Lexend',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#10b981"
                    strokeWidth={3}
                    fill="url(#colorAmount)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center gap-4">
                {/* Ghost chart skeleton */}
                <div className="flex items-end gap-2 h-24 w-full max-w-xs">
                  {[35, 55, 25, 70, 45, 60, 30].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-surface-container rounded animate-pulse"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
                <p className="text-on-surface-variant text-sm text-center">
                  Start adding expenses to see your spending trends
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
