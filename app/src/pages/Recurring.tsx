import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { RecurringExpense, RecurringFrequency, Category } from '../types';
import { getCategories } from '../lib/storage';
import { CategoryIcon } from '../components/CategoryIcon';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { formatCurrency } from '../lib/format';
import { isSharedMode } from '../lib/context';
import {
  getRecurringExpenses,
  addRecurringExpense,
  updateRecurringExpense,
  deleteRecurringExpense,
} from '../lib/storage';

const FREQ_OPTIONS: { key: RecurringFrequency; label: string; icon: string }[] = [
  { key: 'daily', label: 'Daily', icon: 'calendar_today' },
  { key: 'weekly', label: 'Weekly', icon: 'date_range' },
  { key: 'monthly', label: 'Monthly', icon: 'calendar_month' },
];

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function Recurring() {
  const navigate = useNavigate();
  const shared = isSharedMode();
  const [items, setItems] = useState<RecurringExpense[]>(getRecurringExpenses);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<RecurringExpense | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RecurringExpense | null>(null);

  // Form state
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('bills');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [dayOfWeek, setDayOfWeek] = useState(1);

  const openForm = (item?: RecurringExpense) => {
    if (item) {
      setEditing(item);
      setAmount(String(item.amount));
      setCategory(item.category);
      setDescription(item.description);
      setFrequency(item.frequency);
      setDayOfMonth(item.dayOfMonth ?? 1);
      setDayOfWeek(item.dayOfWeek ?? 1);
    } else {
      setEditing(null);
      setAmount('');
      setCategory('bills');
      setDescription('');
      setFrequency('monthly');
      setDayOfMonth(1);
      setDayOfWeek(1);
    }
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  const handleSave = () => {
    const num = parseFloat(amount);
    if (!num || num <= 0 || !description.trim()) return;

    if (editing) {
      const updated: RecurringExpense = {
        ...editing,
        amount: num,
        category,
        description: description.trim(),
        frequency,
        dayOfMonth: frequency === 'monthly' ? dayOfMonth : undefined,
        dayOfWeek: frequency === 'weekly' ? dayOfWeek : undefined,
      };
      setItems(updateRecurringExpense(updated));
    } else {
      const item: RecurringExpense = {
        id: crypto.randomUUID(),
        amount: num,
        category,
        description: description.trim(),
        frequency,
        dayOfMonth: frequency === 'monthly' ? dayOfMonth : undefined,
        dayOfWeek: frequency === 'weekly' ? dayOfWeek : undefined,
        active: true,
        createdAt: new Date().toISOString(),
      };
      setItems(addRecurringExpense(item));
    }
    closeForm();
  };

  const handleToggle = (item: RecurringExpense) => {
    const updated = { ...item, active: !item.active };
    setItems(updateRecurringExpense(updated));
  };

  const handleDelete = () => {
    if (deleteTarget) {
      setItems(deleteRecurringExpense(deleteTarget.id));
      setDeleteTarget(null);
    }
  };

  const getScheduleLabel = (item: RecurringExpense) => {
    switch (item.frequency) {
      case 'daily': return 'Every day';
      case 'weekly': return `Every ${DAYS_OF_WEEK[item.dayOfWeek ?? 1]}`;
      case 'monthly': return `${item.dayOfMonth ?? 1}${getOrdinal(item.dayOfMonth ?? 1)} of each month`;
    }
  };

  if (shared) {
    return (
      <div className="px-6 pt-8 pb-4 max-w-lg mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/')} className="w-10 h-10 rounded-xl bg-surface-container-lowest flex items-center justify-center text-on-surface-variant">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="font-headline font-bold text-2xl text-on-primary-fixed">Recurring</h1>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="material-symbols-outlined text-4xl text-outline-variant mb-4">lock</span>
          <h2 className="font-headline font-bold text-lg text-on-primary-fixed mb-2">Personal only</h2>
          <p className="text-on-surface-variant text-sm">Recurring expenses are managed from your personal budget. Switch back to your budget to manage them.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 pt-8 pb-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="text-on-surface-variant hover:text-on-primary-fixed transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 className="font-headline font-bold text-2xl text-on-primary-fixed">Recurring</h1>
            <p className="text-on-surface-variant text-sm">Auto-added expenses</p>
          </div>
        </div>
        <button
          onClick={() => openForm()}
          className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center text-white hover:opacity-90 transition-all"
        >
          <span className="material-symbols-outlined">add</span>
        </button>
      </div>

      {/* List */}
      {items.length === 0 ? (
        <div className="text-center py-16">
          <span className="material-symbols-outlined text-4xl text-outline-variant mb-4">repeat</span>
          <p className="text-on-surface-variant font-medium">No recurring expenses</p>
          <p className="text-on-surface-variant text-sm mt-1">Add bills, subscriptions, or other regular costs</p>
          <button
            onClick={() => openForm()}
            className="mt-6 px-6 py-3 bg-primary-container text-on-primary font-headline font-bold text-sm rounded-xl hover:opacity-90 active:scale-[0.98] transition-all"
          >
            Add recurring expense
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div
              key={item.id}
              className={`bg-surface-container-lowest rounded-xl p-4 flex items-center gap-4 transition-opacity ${!item.active ? 'opacity-50' : ''}`}
            >
              <CategoryIcon category={item.category} />
              <div className="flex-grow min-w-0 cursor-pointer" onClick={() => openForm(item)}>
                <p className="font-headline font-bold text-on-primary-fixed text-sm truncate">{item.description}</p>
                <p className="text-on-surface-variant text-xs">{getScheduleLabel(item)}</p>
              </div>
              <p className="font-headline font-bold text-on-primary-fixed text-sm flex-shrink-0">
                {formatCurrency(item.amount)}
              </p>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => handleToggle(item)}
                  className="text-on-surface-variant hover:text-on-primary-fixed transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">
                    {item.active ? 'toggle_on' : 'toggle_off'}
                  </span>
                </button>
                <button
                  onClick={() => setDeleteTarget(item)}
                  className="text-on-surface-variant hover:text-error transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeForm} />
          <div className="relative bg-surface-container-lowest rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md p-8 pb-10 z-10 max-h-[90vh] overflow-y-auto">
            <div className="w-10 h-1 bg-outline-variant rounded-full mx-auto mb-6 sm:hidden" />
            <h2 className="font-headline font-bold text-xl text-on-primary-fixed mb-6">
              {editing ? 'Edit Recurring' : 'New Recurring Expense'}
            </h2>

            {/* Amount */}
            <div className="bg-surface rounded-xl p-5 mb-4">
              <label className="text-on-surface-variant text-xs font-semibold tracking-wide block mb-2">Amount</label>
              <div className="flex items-baseline gap-1">
                <span className="font-headline text-on-primary-fixed font-bold text-2xl">₪</span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0"
                  autoFocus
                  className="font-headline text-on-primary-fixed font-extrabold text-4xl bg-transparent border-none outline-none w-full placeholder:text-outline-variant"
                />
              </div>
            </div>

            {/* Description */}
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Netflix, Rent, Bus pass"
              className="w-full bg-surface rounded-xl px-4 py-3 font-body text-on-surface border-none outline-none placeholder:text-outline-variant mb-4"
            />

            {/* Category */}
            <label className="text-on-surface-variant text-xs font-semibold tracking-wide block mb-2">Category</label>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {getCategories().map(cat => (
                <button
                  key={cat.key}
                  onClick={() => setCategory(cat.key)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                    category === cat.key ? 'bg-primary-container' : 'bg-surface hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg" style={{ color: category === cat.key ? '#fff' : cat.color }}>
                    {cat.icon}
                  </span>
                  <span className={`text-[9px] font-bold uppercase ${category === cat.key ? 'text-white' : 'text-on-surface-variant'}`}>
                    {cat.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Frequency */}
            <label className="text-on-surface-variant text-xs font-semibold tracking-wide block mb-2">Frequency</label>
            <div className="flex gap-2 mb-4">
              {FREQ_OPTIONS.map(f => (
                <button
                  key={f.key}
                  onClick={() => setFrequency(f.key)}
                  className={`flex-1 py-2.5 rounded-xl font-headline text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    frequency === f.key ? 'bg-primary-container text-white' : 'bg-surface text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">{f.icon}</span>
                  {f.label}
                </button>
              ))}
            </div>

            {/* Day picker */}
            {frequency === 'monthly' && (
              <div className="mb-4">
                <label className="text-on-surface-variant text-xs font-semibold tracking-wide block mb-2">Day of month</label>
                <select
                  value={dayOfMonth}
                  onChange={e => setDayOfMonth(parseInt(e.target.value))}
                  className="w-full bg-surface rounded-xl px-4 py-3 font-headline font-bold text-on-primary-fixed border-none outline-none"
                >
                  {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            )}

            {frequency === 'weekly' && (
              <div className="mb-4">
                <label className="text-on-surface-variant text-xs font-semibold tracking-wide block mb-2">Day of week</label>
                <div className="grid grid-cols-7 gap-1">
                  {DAYS_OF_WEEK.map((label, i) => (
                    <button
                      key={i}
                      onClick={() => setDayOfWeek(i)}
                      className={`py-2 rounded-lg font-semibold text-xs transition-all ${
                        dayOfWeek === i ? 'bg-primary-container text-white' : 'bg-surface text-on-surface-variant'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={!amount || parseFloat(amount) <= 0 || !description.trim()}
              className="w-full py-4 bg-primary-container text-on-primary font-headline font-bold text-lg rounded-xl flex items-center justify-center gap-3 hover:opacity-90 active:scale-[0.98] transition-all shadow-xl shadow-primary-container/10 disabled:opacity-40 mt-4"
            >
              <span className="material-symbols-outlined filled">{editing ? 'check_circle' : 'add_circle'}</span>
              {editing ? 'Save Changes' : 'Add Recurring'}
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete recurring expense?"
        message={deleteTarget ? `Remove "${deleteTarget.description}"? Future expenses will no longer be auto-added.` : ''}
        confirmLabel="Delete"
        confirmDestructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function getOrdinal(n: number): string {
  if (n >= 11 && n <= 13) return 'th';
  switch (n % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}
