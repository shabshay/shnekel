import { supabase } from './supabase';
import type { Settings, Expense } from '../types';
import { getActiveContext } from './context';

const SYNC_QUEUE_KEY = 'shnekel_sync_queue';
const MIGRATED_KEY = 'shnekel_migrated';

// ─── Types ──────────────────────────────────────────────────────

interface SyncOp {
  type: 'upsert_settings' | 'upsert_expense' | 'delete_expense' | 'bulk_insert_expenses';
  payload: unknown;
  timestamp: number;
  targetUserId?: string; // override user_id for shared mode writes
}

/**
 * Returns the user_id to use for sync operations.
 * In personal mode: the authenticated user's id.
 * In shared mode: the shared budget owner's id.
 */
async function getTargetUserId(): Promise<string | null> {
  if (!supabase) return null;
  const ctx = getActiveContext();
  if (ctx.type === 'shared') return ctx.ownerId;
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// ─── Queue ──────────────────────────────────────────────────────

function getQueue(): SyncOp[] {
  const raw = localStorage.getItem(SYNC_QUEUE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveQueue(queue: SyncOp[]) {
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
}

export function enqueueSync(op: SyncOp) {
  if (!supabase) return;
  // Tag with targetUserId if in shared mode so queued ops flush to the right account
  const ctx = getActiveContext();
  if (ctx.type === 'shared' && !op.targetUserId) {
    op.targetUserId = ctx.ownerId;
  }
  const queue = getQueue();
  queue.push(op);
  saveQueue(queue);
  flushSync();
}

// ─── Flush ──────────────────────────────────────────────────────

let flushing = false;
let retryTimeout: ReturnType<typeof setTimeout> | null = null;
let retryDelay = 1000;

async function processOp(op: SyncOp): Promise<boolean> {
  if (!supabase) return true; // skip if no supabase

  // Use op-level override (for queued shared writes), context, or auth user
  const userId = op.targetUserId ?? await getTargetUserId();
  if (!userId) return false;

  try {
    switch (op.type) {
      case 'upsert_settings': {
        const s = op.payload as Settings;
        const { error } = await supabase.from('settings').upsert({
          user_id: userId,
          period: s.period,
          budget_amount: s.budgetAmount,
          month_start_day: s.monthStartDay,
          alert_threshold: s.alertThreshold ?? 80,
          dark_mode: s.darkMode ?? false,
          date_mode: s.dateMode ?? 'transaction',
          category_budgets: JSON.stringify(s.categoryBudgets ?? {}),
          onboarding_complete: s.onboardingComplete,
          updated_at: new Date().toISOString(),
        });
        if (error) throw error;
        return true;
      }

      case 'upsert_expense': {
        const e = op.payload as Expense;
        const { error } = await supabase.from('expenses').upsert({
          id: e.id,
          user_id: userId,
          amount: e.amount,
          category: e.category,
          description: e.description,
          date: e.date,
          billing_date: e.billingDate ?? null,
        });
        if (error) throw error;
        return true;
      }

      case 'delete_expense': {
        const id = op.payload as string;
        const { error } = await supabase.from('expenses').delete().eq('id', id);
        if (error) throw error;
        return true;
      }

      case 'bulk_insert_expenses': {
        const expenses = op.payload as Expense[];
        const rows = expenses.map(e => ({
          id: e.id,
          user_id: userId,
          amount: e.amount,
          category: e.category,
          description: e.description,
          date: e.date,
          billing_date: e.billingDate ?? null,
        }));
        // Chunk into batches of 500
        for (let i = 0; i < rows.length; i += 500) {
          const chunk = rows.slice(i, i + 500);
          const { error } = await supabase.from('expenses').upsert(chunk);
          if (error) throw error;
        }
        return true;
      }

      default:
        return true;
    }
  } catch (err) {
    console.warn('[sync] Failed to process op:', op.type, err);
    return false;
  }
}

export async function flushSync() {
  if (flushing || !supabase) return;
  flushing = true;

  const queue = getQueue();
  const failed: SyncOp[] = [];

  for (const op of queue) {
    const ok = await processOp(op);
    if (!ok) {
      failed.push(op);
      break; // stop on first failure to preserve order
    }
  }

  // Keep unprocessed items + failed item
  const remaining = failed.length > 0
    ? queue.slice(queue.indexOf(failed[0]))
    : [];

  saveQueue(remaining);
  flushing = false;

  if (remaining.length > 0) {
    // Retry with backoff
    if (retryTimeout) clearTimeout(retryTimeout);
    retryTimeout = setTimeout(() => {
      flushSync();
    }, retryDelay);
    retryDelay = Math.min(retryDelay * 2, 30000);
  } else {
    retryDelay = 1000; // reset on success
  }
}

// ─── Pull from Supabase ─────────────────────────────────────────

/**
 * Pull data from Supabase for a specific user ID.
 * Used during context switches to load shared data.
 */
export async function pullForContext(targetUserId: string): Promise<boolean> {
  return pullFromSupabaseForUser(targetUserId);
}

export async function pullFromSupabase(): Promise<boolean> {
  const targetId = await getTargetUserId();
  if (!targetId) return false;
  return pullFromSupabaseForUser(targetId);
}

async function pullFromSupabaseForUser(userId: string): Promise<boolean> {
  if (!supabase) return false;

  // Verify we're authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  try {
    // Pull settings for target user
    const { data: remoteSettings } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (remoteSettings) {
      const settings: Settings = {
        period: remoteSettings.period,
        budgetAmount: Number(remoteSettings.budget_amount),
        monthStartDay: Number(remoteSettings.month_start_day),
        alertThreshold: Number(remoteSettings.alert_threshold ?? 80),
        darkMode: remoteSettings.dark_mode ?? false,
        dateMode: remoteSettings.date_mode ?? 'transaction',
        categoryBudgets: typeof remoteSettings.category_budgets === 'string'
          ? JSON.parse(remoteSettings.category_budgets)
          : (remoteSettings.category_budgets ?? {}),
        onboardingComplete: remoteSettings.onboarding_complete,
      };
      localStorage.setItem('shnekel_settings', JSON.stringify(settings));
    }

    // Pull expenses for target user
    const { data: remoteExpenses } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (remoteExpenses && remoteExpenses.length > 0) {
      // Merge: remote + any local-only expenses (in the sync queue)
      const localExpensesRaw = localStorage.getItem('shnekel_expenses');
      const localExpenses: Expense[] = localExpensesRaw ? JSON.parse(localExpensesRaw) : [];
      const remoteIds = new Set(remoteExpenses.map(e => e.id));

      // Keep local expenses that aren't yet in remote (pending sync)
      const localOnly = localExpenses.filter(e => !remoteIds.has(e.id));

      const merged: Expense[] = [
        ...remoteExpenses.map(e => ({
          id: e.id,
          amount: Number(e.amount),
          category: e.category,
          description: e.description,
          date: e.date,
          ...(e.billing_date && { billingDate: e.billing_date }),
        })),
        ...localOnly,
      ];

      // Sort by date descending
      merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      localStorage.setItem('shnekel_expenses', JSON.stringify(merged));
    }

    // Notify hooks to re-read
    window.dispatchEvent(new Event('shnekel-sync'));
    return true;
  } catch (err) {
    console.warn('[sync] Pull failed:', err);
    return false;
  }
}

// ─── One-time migration: localStorage → Supabase ────────────────

export async function migrateLocalToSupabase() {
  if (!supabase) return;
  if (localStorage.getItem(MIGRATED_KEY)) return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Check if user already has remote data
  const { data: existing } = await supabase
    .from('settings')
    .select('user_id')
    .eq('user_id', user.id)
    .single();

  if (existing) {
    // User already has remote data, skip migration
    localStorage.setItem(MIGRATED_KEY, 'true');
    return;
  }

  // Push local settings
  const settingsRaw = localStorage.getItem('shnekel_settings');
  if (settingsRaw) {
    const s = JSON.parse(settingsRaw) as Settings;
    enqueueSync({ type: 'upsert_settings', payload: s, timestamp: Date.now() });
  }

  // Push local expenses
  const expensesRaw = localStorage.getItem('shnekel_expenses');
  if (expensesRaw) {
    const expenses = JSON.parse(expensesRaw) as Expense[];
    if (expenses.length > 0) {
      enqueueSync({ type: 'bulk_insert_expenses', payload: expenses, timestamp: Date.now() });
    }
  }

  localStorage.setItem(MIGRATED_KEY, 'true');
}

// ─── Online listener ────────────────────────────────────────────

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    flushSync();
  });
}
