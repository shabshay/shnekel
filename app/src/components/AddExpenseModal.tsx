import { useState, useEffect } from 'react';
import type { Category, Expense } from '../types';
import { CATEGORIES } from '../types';

interface AddExpenseModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (amount: number, category: Category, description: string) => void;
  onUpdate?: (expense: Expense) => void;
  editExpense?: Expense | null;
}

export function AddExpenseModal({ open, onClose, onAdd, onUpdate, editExpense }: AddExpenseModalProps) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('food');
  const [description, setDescription] = useState('');

  const isEdit = !!editExpense;

  // Populate fields when editing
  useEffect(() => {
    if (editExpense) {
      setAmount(String(editExpense.amount));
      setCategory(editExpense.category);
      setDescription(editExpense.description);
    } else {
      setAmount('');
      setCategory('food');
      setDescription('');
    }
  }, [editExpense]);

  if (!open) return null;

  const handleSubmit = () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) return;

    if (isEdit && onUpdate && editExpense) {
      onUpdate({
        ...editExpense,
        amount: numAmount,
        category,
        description: description || CATEGORIES.find(c => c.key === category)!.label,
      });
    } else {
      onAdd(numAmount, category, description || CATEGORIES.find(c => c.key === category)!.label);
    }

    setAmount('');
    setCategory('food');
    setDescription('');
    onClose();
  };

  const handleClose = () => {
    setAmount('');
    setCategory('food');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-surface-container-lowest rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md p-8 pb-10 z-10">
        {/* Handle bar (mobile) */}
        <div className="w-10 h-1 bg-outline-variant rounded-full mx-auto mb-6 sm:hidden" />

        <h2 className="font-headline font-bold text-xl text-on-primary-fixed mb-8">
          {isEdit ? 'Edit Expense' : 'Add Expense'}
        </h2>

        {/* Amount input */}
        <div className="bg-surface rounded-xl p-6 mb-6">
          <label className="text-on-surface-variant text-xs font-semibold uppercase tracking-widest block mb-3">
            Amount
          </label>
          <div className="flex items-baseline gap-1">
            <span className="font-headline text-on-primary-fixed font-bold text-3xl">₪</span>
            <input
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0"
              autoFocus
              className="font-headline text-on-primary-fixed font-extrabold text-5xl bg-transparent border-none outline-none w-full placeholder:text-outline-variant"
            />
          </div>
        </div>

        {/* Category grid */}
        <label className="text-on-surface-variant text-xs font-semibold uppercase tracking-widest block mb-3">
          Category
        </label>
        <div className="grid grid-cols-4 gap-2 mb-6">
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setCategory(cat.key)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all ${
                category === cat.key
                  ? 'bg-primary-container'
                  : 'bg-surface hover:bg-surface-container'
              }`}
            >
              <span
                className="material-symbols-outlined"
                style={{ color: category === cat.key ? '#fff' : cat.color }}
              >
                {cat.icon}
              </span>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  category === cat.key ? 'text-white' : 'text-on-surface-variant'
                }`}
              >
                {cat.label}
              </span>
            </button>
          ))}
        </div>

        {/* Description */}
        <input
          type="text"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Description (optional)"
          className="w-full bg-surface rounded-xl px-4 py-3 font-body text-on-surface border-none outline-none placeholder:text-outline-variant mb-8"
        />

        {/* Actions */}
        <button
          onClick={handleSubmit}
          disabled={!amount || parseFloat(amount) <= 0}
          className="w-full py-4 bg-primary-container text-on-primary font-headline font-bold text-lg rounded-xl flex items-center justify-center gap-3 hover:opacity-90 active:scale-[0.98] transition-all shadow-xl shadow-primary-container/10 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined filled">{isEdit ? 'check_circle' : 'add_circle'}</span>
          {isEdit ? 'Save Changes' : 'Save Expense'}
        </button>
      </div>
    </div>
  );
}
