import { useState, useEffect, useRef } from 'react';
import type { Category, Expense } from '../types';
import { getCategories } from '../lib/storage';
import { supabase } from '../lib/supabase';
import { autoCategorize } from '../lib/autoCategorize';
import { useLocale } from '../hooks/useLocale';

interface AddExpenseModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (amount: number, category: Category, description: string, notes?: string, receiptUrl?: string) => void;
  onUpdate?: (expense: Expense) => void;
  editExpense?: Expense | null;
}

export function AddExpenseModal({ open, onClose, onAdd, onUpdate, editExpense }: AddExpenseModalProps) {
  const { t } = useLocale()
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('food');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [uploading, setUploading] = useState(false);
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
          {isEdit ? t('expense.editExpense') : t('expense.addExpense')}
        </h2>

        {/* Amount input + Camera */}
        <div className="bg-surface rounded-xl p-6 mb-6">
          <label className="text-on-surface-variant text-xs font-semibold tracking-wide block mb-3">{t('expense.amount')}</label>
          <div className="flex items-center gap-3">
            <div className="flex items-baseline gap-1 flex-grow">
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
            {/* One-tap receipt camera */}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex-shrink-0 w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-tertiary-container active:scale-95 transition-all"
            >
              {uploading ? (
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
              ) : receiptUrl ? (
                <span className="material-symbols-outlined filled text-on-tertiary-container">photo_camera</span>
              ) : (
                <span className="material-symbols-outlined">photo_camera</span>
              )}
            </button>
          </div>
        </div>

        {/* Category grid */}
        <label className="text-on-surface-variant text-xs font-semibold tracking-wide block mb-3">{t('expense.category')}</label>
        <div className="grid grid-cols-4 gap-2 mb-6">
          {getCategories().map(cat => (
            <button
              key={cat.key}
              onClick={() => { setCategory(cat.key); setUserPickedCategory(true) }}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all active:scale-95 ${
                category === cat.key ? 'bg-primary-container' : 'bg-surface hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined" style={{ color: category === cat.key ? '#fff' : cat.color }}>
                {cat.icon}
              </span>
              <span className={`text-[10px] font-bold tracking-wide ${category === cat.key ? 'text-white' : 'text-on-surface-variant'}`}>
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
          placeholder={t('expense.descriptionOpt')}
          className="w-full bg-surface rounded-xl px-4 py-3 font-body text-on-surface border-none outline-none placeholder:text-outline-variant mb-1"
        />
        {suggestedCategory && !userPickedCategory && (
          <p className="text-on-tertiary-container text-xs font-semibold mb-3 ml-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">auto_awesome</span>
            {t('expense.suggested')} {suggestedCategory}
          </p>
        )}
        {!suggestedCategory && <div className="mb-3" />}

        {/* Hidden file input for receipt */}
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

        {/* Receipt preview (if attached) */}
        {receiptUrl && (
          <div className="relative mb-4">
            <img src={receiptUrl} alt="Receipt" className="w-full h-32 object-cover rounded-xl" />
            <button
              onClick={() => setReceiptUrl('')}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        )}

        {/* Notes — always visible */}
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder={t('expense.addNote')}
          rows={2}
          className="w-full bg-surface rounded-xl px-4 py-3 font-body text-sm text-on-surface border-none outline-none placeholder:text-outline-variant resize-none mb-4"
        />

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!amount || parseFloat(amount) <= 0}
          className="w-full py-4 bg-primary-container text-on-primary font-headline font-bold text-lg rounded-xl flex items-center justify-center gap-3 hover:opacity-90 active:scale-95 transition-all shadow-xl shadow-primary-container/10 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined filled">{isEdit ? 'check_circle' : 'add_circle'}</span>
          {isEdit ? t('expense.saveChanges') : t('expense.saveExpense')}
        </button>
      </div>
    </div>
  );
}
