import { useNavigate } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useAdmin } from '../hooks/useAdmin'
import { formatCurrency } from '../lib/format'
import { getCategories } from '../lib/storage'
import { CategoryIcon } from '../components/CategoryIcon'
import type { Category } from '../types'
import { useEffect } from 'react'

export function Admin() {
  const navigate = useNavigate()
  const { isAdmin, loading, error, stats, users, categories, dailyVolume, refresh } = useAdmin()

  // Redirect non-admin
  useEffect(() => {
    if (!loading && !isAdmin) navigate('/')
  }, [loading, isAdmin, navigate])

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <span className="material-symbols-outlined text-4xl text-on-tertiary-container animate-spin">progress_activity</span>
      </div>
    )
  }

  if (!isAdmin) return null

  const chartData = [...(dailyVolume ?? [])].reverse().map(d => ({
    date: new Date(d.day).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    expenses: d.count,
    amount: d.total,
    users: d.active_users,
  }))

  const allCategories = getCategories()

  return (
    <div className="px-6 pt-8 pb-28 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 rounded-xl bg-surface-container-lowest flex items-center justify-center text-on-surface-variant hover:text-on-primary-fixed transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 className="font-headline font-bold text-2xl text-on-primary-fixed">Admin</h1>
            <p className="text-on-surface-variant text-xs">System overview</p>
          </div>
        </div>
        <button
          onClick={refresh}
          className="w-10 h-10 rounded-xl bg-surface-container-lowest flex items-center justify-center text-on-surface-variant hover:text-on-primary-fixed transition-colors"
        >
          <span className="material-symbols-outlined">refresh</span>
        </button>
      </div>

      {error && (
        <div className="bg-error/10 rounded-xl p-4 mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-error">error</span>
          <p className="text-error text-sm">{error}</p>
        </div>
      )}

      {/* Overview Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 mb-8">
          <StatCard icon="group" label="Total users" value={String(stats.total_users)} />
          <StatCard icon="trending_up" label="Active this week" value={String(stats.active_this_week)} accent />
          <StatCard icon="receipt_long" label="Total expenses" value={stats.total_expenses.toLocaleString()} />
          <StatCard icon="payments" label="Total tracked" value={formatCurrency(stats.total_amount)} accent />
          {stats.incomplete_onboarding > 0 && (
            <StatCard icon="warning" label="Incomplete onboarding" value={String(stats.incomplete_onboarding)} />
          )}
        </div>
      )}

      {/* Daily Volume Chart */}
      {chartData.length > 0 && (
        <div className="bg-surface-container-lowest rounded-2xl p-5 mb-8">
          <h3 className="text-xs font-semibold tracking-wide text-on-surface-variant mb-4">
            Daily volume (last 30 days)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="adminGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-on-tertiary-container)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-on-tertiary-container)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant)" opacity={0.3} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="var(--color-on-surface-variant)" />
              <YAxis tick={{ fontSize: 10 }} stroke="var(--color-on-surface-variant)" />
              <Tooltip
                contentStyle={{
                  background: 'var(--color-surface-container)',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="var(--color-on-tertiary-container)"
                fill="url(#adminGrad)"
                strokeWidth={2}
                name="Amount (₪)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Category Breakdown */}
      {categories.length > 0 && (
        <div className="bg-surface-container-lowest rounded-2xl p-5 mb-8">
          <h3 className="text-xs font-semibold tracking-wide text-on-surface-variant mb-4">
            Categories (all users)
          </h3>
          <div className="space-y-3">
            {categories.map(cat => {
              const info = allCategories.find(c => c.key === cat.category)
              return (
                <div key={cat.category} className="flex items-center gap-3">
                  <CategoryIcon category={cat.category as Category} size="sm" />
                  <div className="flex-grow min-w-0">
                    <p className="font-semibold text-on-primary-fixed text-sm">{info?.label ?? cat.category}</p>
                    <p className="text-on-surface-variant text-xs">
                      {cat.count} expenses · {cat.user_count} user{cat.user_count !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <span className="font-headline font-bold text-on-primary-fixed text-sm">
                    {formatCurrency(cat.total)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* User List */}
      {users.length > 0 && (
        <div className="bg-surface-container-lowest rounded-2xl p-5">
          <h3 className="text-xs font-semibold tracking-wide text-on-surface-variant mb-4">
            Users ({users.length})
          </h3>
          <div className="space-y-3">
            {users.map(u => (
              <div key={u.user_id} className="p-4 bg-surface rounded-xl">
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-on-primary-fixed text-sm truncate">{u.email}</p>
                    <p className="text-on-surface-variant text-xs">
                      Joined {new Date(u.signed_up).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {u.last_sign_in && (
                        <> · Last seen {timeAgo(u.last_sign_in)}</>
                      )}
                    </p>
                  </div>
                  {!u.onboarding_complete && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold flex-shrink-0">
                      No onboarding
                    </span>
                  )}
                </div>
                <div className="flex gap-4 text-xs text-on-surface-variant">
                  <span>{u.expense_count} expenses</span>
                  <span>{formatCurrency(u.total_spent)} spent</span>
                  <span>Budget: {formatCurrency(u.budget_amount)}/{u.period}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, label, value, accent }: { icon: string; label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className={`material-symbols-outlined text-lg ${accent ? 'text-on-tertiary-container' : 'text-on-surface-variant'}`}>
          {icon}
        </span>
        <span className="text-on-surface-variant text-xs font-semibold">{label}</span>
      </div>
      <p className={`font-headline font-bold text-xl ${accent ? 'text-on-tertiary-container' : 'text-on-primary-fixed'}`}>
        {value}
      </p>
    </div>
  )
}

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  if (hours < 1) return 'just now'
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}
