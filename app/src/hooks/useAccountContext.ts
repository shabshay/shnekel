import { useState, useCallback, useEffect } from 'react'
import type { AccountContext } from '../types'
import { getActiveContext, switchToShared as doSwitchToShared, switchToPersonal as doSwitchToPersonal } from '../lib/context'
import { pullForContext } from '../lib/sync'

export function useAccountContext() {
  const [activeContext, setActiveContext] = useState<AccountContext>(getActiveContext)

  // Re-read context on switch events
  useEffect(() => {
    const handler = () => setActiveContext(getActiveContext())
    window.addEventListener('shnekel-context-switch', handler)
    return () => window.removeEventListener('shnekel-context-switch', handler)
  }, [])

  const switchToShared = useCallback(async (ownerId: string, ownerEmail: string, budgetId: string) => {
    // Save personal data and clear main keys
    doSwitchToShared(ownerId, ownerEmail, budgetId)
    // Pull owner's data from Supabase into main localStorage keys
    await pullForContext(ownerId)
    // Notify everything to re-read
    window.dispatchEvent(new Event('shnekel-sync'))
  }, [])

  const switchToPersonal = useCallback(async () => {
    doSwitchToPersonal()
    // Notify everything to re-read
    window.dispatchEvent(new Event('shnekel-sync'))
  }, [])

  return {
    activeContext,
    isSharedMode: activeContext.type === 'shared',
    switchToShared,
    switchToPersonal,
  }
}
