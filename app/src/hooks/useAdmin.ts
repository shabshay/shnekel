import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import { supabase } from '../lib/supabase'
import { isAdminEmail } from '../lib/admin'

interface AggregateStats {
  total_users: number
  active_this_week: number
  total_expenses: number
  total_amount: number
  incomplete_onboarding: number
}

interface UserStats {
  user_id: string
  email: string
  signed_up: string
  last_sign_in: string | null
  period: string
  budget_amount: number
  onboarding_complete: boolean
  expense_count: number
  total_spent: number
  last_expense: string | null
}

interface CategoryStats {
  category: string
  count: number
  total: number
  user_count: number
}

interface DailyVolume {
  day: string
  count: number
  total: number
  active_users: number
}

export function useAdmin() {
  const { user } = useAuth()
  const isAdmin = isAdminEmail(user?.email)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<AggregateStats | null>(null)
  const [users, setUsers] = useState<UserStats[]>([])
  const [categories, setCategories] = useState<CategoryStats[]>([])
  const [dailyVolume, setDailyVolume] = useState<DailyVolume[]>([])

  const fetchData = useCallback(async () => {
    if (!isAdmin || !supabase) return

    setLoading(true)
    setError(null)

    try {
      const [statsRes, usersRes, catsRes, volumeRes] = await Promise.all([
        supabase.rpc('admin_get_aggregate_stats'),
        supabase.rpc('admin_get_user_stats'),
        supabase.rpc('admin_get_category_stats'),
        supabase.rpc('admin_get_daily_volume'),
      ])

      if (statsRes.error) throw new Error(statsRes.error.message)
      if (usersRes.error) throw new Error(usersRes.error.message)
      if (catsRes.error) throw new Error(catsRes.error.message)
      if (volumeRes.error) throw new Error(volumeRes.error.message)

      setStats(statsRes.data?.[0] ?? null)
      setUsers(usersRes.data ?? [])
      setCategories(catsRes.data ?? [])
      setDailyVolume(volumeRes.data ?? [])
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [isAdmin])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { isAdmin, loading, error, stats, users, categories, dailyVolume, refresh: fetchData }
}
