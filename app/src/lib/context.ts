import type { AccountContext } from '../types'

const CONTEXT_KEY = 'shnekel_active_context'
const PERSONAL_PREFIX = 'shnekel_personal_'

// The main storage keys that hold the active context's data
const DATA_KEYS = ['shnekel_settings', 'shnekel_expenses', 'shnekel_recurring', 'shnekel_sync_queue']

export function getActiveContext(): AccountContext {
  const raw = localStorage.getItem(CONTEXT_KEY)
  if (!raw) return { type: 'personal' }
  try {
    return JSON.parse(raw)
  } catch {
    return { type: 'personal' }
  }
}

export function isSharedMode(): boolean {
  return getActiveContext().type === 'shared'
}

/**
 * Save current data under personal backup keys,
 * then clear main keys so shared data can be loaded.
 */
export function switchToShared(ownerId: string, ownerEmail: string, budgetId: string): void {
  // Backup personal data
  for (const key of DATA_KEYS) {
    const val = localStorage.getItem(key)
    if (val) localStorage.setItem(PERSONAL_PREFIX + key.replace('shnekel_', ''), val)
  }

  // Clear main keys (shared data will be pulled from Supabase)
  for (const key of DATA_KEYS) {
    localStorage.removeItem(key)
  }

  // Set context
  const ctx: AccountContext = { type: 'shared', ownerId, ownerEmail, budgetId }
  localStorage.setItem(CONTEXT_KEY, JSON.stringify(ctx))

  // Notify hooks
  window.dispatchEvent(new Event('shnekel-context-switch'))
}

/**
 * Restore personal data from backup keys.
 */
export function switchToPersonal(): void {
  // Clear shared data from main keys
  for (const key of DATA_KEYS) {
    localStorage.removeItem(key)
  }

  // Restore personal data
  for (const key of DATA_KEYS) {
    const backupKey = PERSONAL_PREFIX + key.replace('shnekel_', '')
    const val = localStorage.getItem(backupKey)
    if (val) {
      localStorage.setItem(key, val)
      localStorage.removeItem(backupKey)
    }
  }

  // Reset context
  localStorage.removeItem(CONTEXT_KEY)

  // Notify hooks
  window.dispatchEvent(new Event('shnekel-context-switch'))
}

/**
 * Reset context to personal without restoring data.
 * Used on sign-out to clean up everything.
 */
export function resetContext(): void {
  localStorage.removeItem(CONTEXT_KEY)
  // Clean up any personal backups
  for (const key of DATA_KEYS) {
    localStorage.removeItem(PERSONAL_PREFIX + key.replace('shnekel_', ''))
  }
}
