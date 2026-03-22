import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { getExpenses, getSettings } from '../lib/storage';
import { getExpenseStats } from '../hooks/useExpenses';
import { StatsCard } from '../components/StatsCard';
import { CATEGORIES } from '../types';

type FilterPeriod = 'today' | 'week' | 'month';

export function Reports() {
  const [filter, setFilter] = useState<FilterPeriod>('month');
  const navigate = useNavigate();
  const expenses = getExpenses();
  const settings = getSettings();

  const stats = useMemo(() => getExpenseStats(expenses, filter, settings.monthStartDay), [expenses, filter, settings.monthStartDay]);

  const topCatLabel = CATEGORIES.find(c => c.key === stats.topCategory)?.label || stats.topCategory;
  const topCatColor = CATEGORIES.find(c => c.key === stats.topCategory)?.color;

  const filters: { key: FilterPeriod; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
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
        <h1 className="font-headline font-bold text-2xl text-on-primary-fixed">Reports</h1>
      </div>

      {/* Time filter */}
      <div className="flex gap-2 mb-8">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-5 py-2 rounded-xl font-headline text-sm font-semibold transition-all ${
              filter === f.key
                ? 'bg-primary-container text-white'
                : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <StatsCard label="Total spent" value={`₪${Math.round(stats.totalSpent)}`} color="#E040FB" />
        <StatsCard label="Average per day" value={`₪${Math.round(stats.avgPerDay)}`} color="#4E7CFF" />
        <StatsCard label="Highest day" value={`₪${Math.round(stats.highestDay)}`} color="#FF6B35" />
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
                  <stop offset="5%" stopColor="#009668" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#009668" stopOpacity={0} />
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
                tickFormatter={v => `₪${v}`}
              />
              <Tooltip
                formatter={(value: number) => [`₪${value.toFixed(2)}`, 'Spent']}
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
                stroke="#009668"
                strokeWidth={3}
                fill="url(#colorAmount)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-48 flex items-center justify-center text-on-surface-variant text-sm">
            No data for this period yet
          </div>
        )}
      </div>
    </div>
  );
}
