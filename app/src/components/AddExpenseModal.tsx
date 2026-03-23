import { useState, useEffect, useRef } from 'react';
import type { Category, Expense } from '../types';
import { getCategories } from '../lib/storage';
import { supabase } from '../lib/supabase';
import { autoCategorize } from '../lib/autoCategorize';

interface AddExpenseModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (amount: number, category: Category, description: string, notes?: string, receiptUrl?: string) => void;
  onUpdate?: (expense: Expense) => void;
  editExpense?: Expense | null;
}

export function AddExpenseModal({ open, onClose, onAdd, onUpdate, editExpense }: AddExpenseModalProps) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('food');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showExtra, setShowExtra] = useState(false);
  const [userPickedCategory, setUserPickedCategory] = useState(false);
  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const isEdit = !!editExpense;

  useEffect(() => {
    if (editExpense) {
      setAmount(String(editExpense.amount));
      setCategory(editExpense.category);
      setDescription(editExpense.description);
      setNotes(editExpense.notes ?? '');
      setReceiptUrl(editExpense.receiptUrl ?? '');
      setShowExtra(!!(editExpense.notes || editExpense.receiptUrl));
    } else {
      resetForm();
    }
  }, [editExpense]);

  // Auto-categorize based on description
  useEffect(() => {
    if (isEdit || userPickedCategory || !description.trim()) {
      setSuggestedCategory(null);
      return;
    }
    const match = autoCategorize(description);
    if (match) {
      setCategory(match);
      setSuggestedCategory(getCategories().find(c => c.key === match)?.label ?? match);
    } else {
      setSuggestedCategory(null);
    }
  }, [description, isEdit, userPickedCategory]);

  if (!open) return null;

  function resetForm() {
    setAmount('');
    setCategory('food');
    setDescription('');
    setNotes('');
    setReceiptUrl('');
    setShowExtra(false);
    setUploading(false);
    setUserPickedCategory(false);
    setSuggestedCategory(null);
  }

  const handleUploadReceipt = async (file: File) => {
    if (!supabase) return;
    setUploading(true);
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage
      .from('receipts')
      .upload(path, file, { contentType: file.type });

    if (!error) {
      const { data } = supabase.storage.from('receipts').getPublicUrl(path);
      setReceiptUrl(data.publicUrl);
    }
    setUploading(false);
  };

  const handleSubmit = () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) return;

    const desc = description || getCategories().find(c => c.key === category)?.label || 'Expense';

    if (isEdit && onUpdate && editExpense) {
      onUpdate({
        ...editExpense,
        amount: numAmount,
        category,
        description: desc,
        notes: notes || undefined,
        receiptUrl: receiptUrl || undefined,
      });
    } else {
      onAdd(numAmount, category, desc, notes || undefined, receiptUrl || undefined);
    }

    resetForm();
    onClose();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative bg-surface-container-lowest rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md p-8 pb-10 z-10 max-h-[90vh] overflow-y-auto">
        <div className="w-10 h-1 bg-outline-variant rounded-full mx-auto mb-6 sm:hidden" />

        <h2 className="font-headline font-bold text-xl text-on-primary-fixed mb-8">
          {isEdit ? 'Edit Expense' : 'Add Expense'}
        </h2>

        {/* Amount input */}
        <div className="bg-surface rounded-xl p-6 mb-6">
          <label className="text-on-surface-variant text-xs font-semibold uppercase tracking-widest block mb-3">Amount</label>
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
        <label className="text-on-surface-variant text-xs font-semibold uppercase tracking-widest block mb-3">Category</label>
        <div className="grid grid-cols-4 gap-2 mb-6">
          {getCategories().map(cat => (
            <button
              key={cat.key}
              onClick={() => { setCategory(cat.key); setUserPickedCategory(true) }}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all ${
                category === cat.key ? 'bg-primary-container' : 'bg-surface hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined" style={{ color: category === cat.key ? '#fff' : cat.color }}>
                {cat.icon}
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${category === cat.key ? 'text-white' : 'text-on-surface-variant'}`}>
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
          className="w-full bg-surface rounded-xl px-4 py-3 font-body text-on-surface border-none outline-none placeholder:text-outline-variant mb-1"
        />
        {suggestedCategory && !userPickedCategory && (
          <p className="text-on-tertiary-container text-xs font-semibold mb-3 ml-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">auto_awesome</span>
            Suggested: {suggestedCategory}
          </p>
        )}
        {!suggestedCategory && <div className="mb-3" />}

        {/* Notes & Receipt toggle */}
        <button
          onClick={() => setShowExtra(!showExtra)}
          className="flex items-center gap-2 text-on-surface-variant text-sm font-semibold mb-4 hover:text-on-primary-fixed transition-colors"
        >
          <span className="material-symbols-outlined text-lg">{showExtra ? 'expand_less' : 'expand_more'}</span>
          Notes & Receipt
          {(notes || receiptUrl) && <span className="w-2 h-2 rounded-full bg-on-tertiary-container" />}
        </button>

        {showExtra && (
          <div className="space-y-4 mb-4">
            {/* Notes */}
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add notes..."
              rows={3}
              className="w-full bg-surface rounded-xl px-4 py-3 font-body text-on-surface border-none outline-none placeholder:text-outline-variant resize-none"
            />

            {/* Receipt */}
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleUploadReceipt(file);
                }}
              />
              {receiptUrl ? (
                <div className="relative">
                  <img src={receiptUrl} alt="Receipt" className="w-full h-32 object-cover rounded-xl" />
                  <button
                    onClick={() => setReceiptUrl('')}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="w-full py-3 bg-surface rounded-xl flex items-center justify-center gap-2 text-on-surface-variant hover:text-on-primary-fixed transition-colors"
                >
                  {uploading ? (
                    <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-lg">photo_camera</span>
                      <span className="text-sm font-semibold">Add receipt photo</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Submit */}
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
