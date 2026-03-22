import { supabase } from './supabase';
import type { Settings, Expense } from '../types';

const SYNC_QUEUE_KEY = 'shnekel_sync_queue';
const MIGRATED_KEY = 'shnekel_migrated';

// ─── Types ──────────────────────────────────────────────────────

interface SyncOp {
  type: 'upsert_settings' | 'upsert_expense' | 'delete_expense' | 'bulk_insert_expenses';
  payload: unknown;
  timestamp: number;
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

  const userId = (await supabase.auth.getUser()).data.user?.id;
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

export async function pullFromSupabase(): Promise<boolean> {
  if (!supabase) return false;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  try {
    // Pull settings
    const { data: remoteSettings } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (remoteSettings) {
      const settings: Settings = {
        period: remoteSettings.period,
        budgetAmount: Number(remoteSettings.budget_amount),
        monthStartDay: Number(remoteSettings.month_start_day),
        alertThreshold: Number(remoteSettings.alert_threshold ?? 80),
        darkMode: remoteSettings.dark_mode ?? false,
        onboardingComplete: remoteSettings.onboarding_complete,
      };
      localStorage.setItem('shnekel_settings', JSON.stringify(settings));
    }

    // Pull expenses
    const { data: remoteExpenses } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
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
