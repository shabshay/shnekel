import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import type { SharedBudget } from '../types'

function mapRow(row: Record<string, unknown>): SharedBudget {
  return {
    id: row.id as string,
    ownerId: row.owner_id as string,
    ownerEmail: (row.owner_email as string) ?? '',
    memberId: row.member_id as string | undefined,
    memberEmail: row.member_email as string,
    status: row.status as SharedBudget['status'],
    createdAt: row.created_at as string,
  }
}

export function useSharedBudgets() {
  const { user } = useAuth()
  const [invitesSent, setInvitesSent] = useState<SharedBudget[]>([])
  const [invitesReceived, setInvitesReceived] = useState<SharedBudget[]>([])
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!supabase || !user) return
    setLoading(true)

    // Fetch invites I sent (as owner)
    const { data: sent } = await supabase
      .from('shared_budgets')
      .select('*, owner_email:owner_id(email)')
      .eq('owner_id', user.id)
      .neq('status', 'revoked')

    // Fetch invites I received (as member)
    const { data: received } = await supabase
      .from('shared_budgets')
      .select('*, owner_email:owner_id(email)')
      .eq('member_email', user.email)
      .neq('status', 'revoked')

    // Map and extract owner email from joined data
    if (sent) {
      setInvitesSent(sent.map(r => ({
        ...mapRow(r),
        ownerEmail: user.email ?? '',
      })))
    }
    if (received) {
      setInvitesReceived(received.map(r => ({
        ...mapRow(r),
        ownerEmail: typeof r.owner_email === 'object' && r.owner_email
          ? (r.owner_email as Record<string, string>).email ?? ''
          : '',
      })))
    }

    setLoading(false)
  }, [user])

  useEffect(() => { refresh() }, [refresh])

  const sendInvite = useCallback(async (email: string) => {
    if (!supabase || !user) return { error: 'Not authenticated' }
    if (email.toLowerCase() === user.email?.toLowerCase()) return { error: 'Cannot invite yourself' }

    const { error } = await supabase.from('shared_budgets').insert({
      owner_id: user.id,
      member_email: email.toLowerCase().trim(),
    })

    if (error) {
      if (error.code === '23505') return { error: 'Already invited this email' }
      return { error: error.message }
    }

    await refresh()
    return { error: null }
  }, [user, refresh])

  const acceptInvite = useCallback(async (budgetId: string) => {
    if (!supabase || !user) return

    await supabase.from('shared_budgets').update({
      status: 'accepted',
      member_id: user.id,
      accepted_at: new Date().toISOString(),
    }).eq('id', budgetId)

    await refresh()
  }, [user, refresh])

  const revokeAccess = useCallback(async (budgetId: string) => {
    if (!supabase) return

    await supabase.from('shared_budgets').update({
      status: 'revoked',
    }).eq('id', budgetId)

    await refresh()
  }, [refresh])

  const leaveShared = useCallback(async (budgetId: string) => {
    if (!supabase || !user) return

    // Member can set status to revoked on their own invite
    await supabase.from('shared_budgets').update({
      status: 'revoked',
    }).eq('id', budgetId).eq('member_id', user.id)

    await refresh()
  }, [user, refresh])

  return {
    invitesSent,
    invitesReceived,
    loading,
    refresh,
    sendInvite,
    acceptInvite,
    revokeAccess,
    leaveShared,
  }
}
