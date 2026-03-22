import { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { parseImportFile, downloadTemplate, type ImportedRow, type DetectedFormat } from '../lib/importParser';
import { addExpensesBatch } from '../lib/storage';
import { type Category, type Expense } from '../types';
import { getCategories } from '../lib/storage';
import { formatCurrency } from '../lib/format';

type Step = 'upload' | 'preview' | 'done';

const FORMAT_LABELS: Record<DetectedFormat, string> = {
  isracard: 'Isracard credit card statement',
  normalized: 'Standard spreadsheet',
  unknown: 'Unknown',
};

export function Import() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('upload');
  const [rows, setRows] = useState<ImportedRow[]>([]);
  const [format, setFormat] = useState<DetectedFormat>('unknown');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  // Category overrides per row
  const [categoryOverrides, setCategoryOverrides] = useState<Map<number, Category>>(new Map());

  const handleFile = async (file: File) => {
    setLoading(true);
    setError('');
    const result = await parseImportFile(file);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.rows.length === 0) {
      setError('No expenses found in this file. Make sure it has dates and amounts.');
      return;
    }

    setRows(result.rows);
    setFormat(result.format);
    setSelectedRows(new Set(result.rows.map((_, i) => i)));
    setCategoryOverrides(new Map());
    setStep('preview');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleImport = () => {
    const expenses: Expense[] = [];
    for (const idx of selectedRows) {
      const row = rows[idx];
      const category = categoryOverrides.get(idx) ?? row.category;
      expenses.push({
        id: crypto.randomUUID(),
        amount: row.amount,
        category,
        description: row.description,
        date: row.date,
      });
    }
    addExpensesBatch(expenses);
    setImportedCount(expenses.length);
    setStep('done');
  };

  const toggleRow = (idx: number) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedRows.size === rows.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(rows.map((_, i) => i)));
    }
  };

  const totalSelected = useMemo(() => {
    let sum = 0;
    for (const idx of selectedRows) sum += rows[idx]?.amount ?? 0;
    return sum;
  }, [selectedRows, rows]);

  return (
    <div className="px-6 pt-8 pb-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => step === 'upload' ? navigate('/') : step === 'preview' ? setStep('upload') : navigate('/')}
          className="w-10 h-10 rounded-xl bg-surface-container-lowest flex items-center justify-center text-on-surface-variant hover:text-on-primary-fixed transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h1 className="font-headline font-bold text-2xl text-on-primary-fixed">Import Expenses</h1>
          <p className="text-on-surface-variant text-sm">
            {step === 'upload' && 'Upload a file to get started'}
            {step === 'preview' && 'Review before importing'}
            {step === 'done' && 'All done!'}
          </p>
        </div>
      </div>

      {/* ── Step 1: Upload ── */}
      {step === 'upload' && (
        <>
          {/* Drop zone */}
          <div
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-outline-variant rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer hover:border-primary-container hover:bg-surface-container-lowest/50 transition-all mb-6"
          >
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
            {loading ? (
              <span className="material-symbols-outlined text-4xl text-primary-container animate-spin">progress_activity</span>
            ) : (
              <>
                <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-3">upload_file</span>
                <p className="font-headline font-semibold text-on-primary-fixed text-center">
                  Tap to choose a file
                </p>
                <p className="text-on-surface-variant text-sm text-center mt-1">
                  or drag & drop here
                </p>
                <p className="text-outline text-xs mt-3">.xlsx, .xls, or .csv</p>
              </>
            )}
          </div>

          {error && (
            <div className="bg-error-container/20 rounded-xl p-4 flex items-start gap-3 mb-6">
              <span className="material-symbols-outlined text-error text-xl mt-0.5">error</span>
              <p className="text-error text-sm">{error}</p>
            </div>
          )}

          {/* Supported formats */}
          <div className="bg-surface-container-lowest rounded-2xl p-6 mb-6">
            <h3 className="font-headline font-bold text-base text-on-primary-fixed mb-4">
              Supported formats
            </h3>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-on-tertiary-container mt-0.5">credit_card</span>
                <div>
                  <p className="font-semibold text-on-primary-fixed text-sm">Isracard statement</p>
                  <p className="text-on-surface-variant text-xs">
                    The .xls file you download from your Isracard account. We'll auto-detect the format and extract all transactions.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-on-tertiary-container mt-0.5">table_chart</span>
                <div>
                  <p className="font-semibold text-on-primary-fixed text-sm">Any spreadsheet</p>
                  <p className="text-on-surface-variant text-xs">
                    An .xlsx or .csv with columns for date, description, amount, and optionally category.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Template download */}
          <div className="bg-surface-container-lowest rounded-2xl p-6">
            <h3 className="font-headline font-bold text-base text-on-primary-fixed mb-2">
              Not sure about the format?
            </h3>
            <p className="text-on-surface-variant text-sm mb-4">
              Download our template to see an example. Fill it with your expenses and import it back.
            </p>
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 py-3 px-5 bg-primary-container text-on-primary font-headline font-semibold text-sm rounded-xl hover:opacity-90 active:scale-[0.98] transition-all"
            >
              <span className="material-symbols-outlined text-lg">download</span>
              Download template
            </button>
          </div>
        </>
      )}

      {/* ── Step 2: Preview ── */}
      {step === 'preview' && (
        <>
          {/* Format badge */}
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-on-tertiary-container text-lg">
              {format === 'isracard' ? 'credit_card' : 'table_chart'}
            </span>
            <span className="text-on-surface-variant text-sm">
              Detected: <span className="font-semibold text-on-primary-fixed">{FORMAT_LABELS[format]}</span>
            </span>
          </div>

          {/* Summary bar */}
          <div className="bg-surface-container-lowest rounded-xl p-4 flex items-center justify-between mb-4">
            <div>
              <p className="text-on-surface-variant text-xs">Selected</p>
              <p className="font-headline font-bold text-on-primary-fixed">
                {selectedRows.size} of {rows.length} expenses
              </p>
            </div>
            <div className="text-right">
              <p className="text-on-surface-variant text-xs">Total</p>
              <p className="font-headline font-bold text-on-primary-fixed">{formatCurrency(totalSelected)}</p>
            </div>
          </div>

          {/* Select all */}
          <button
            onClick={toggleAll}
            className="flex items-center gap-2 text-sm font-semibold text-on-surface-variant mb-3 hover:text-on-primary-fixed transition-colors"
          >
            <span className="material-symbols-outlined text-lg">
              {selectedRows.size === rows.length ? 'check_box' : selectedRows.size > 0 ? 'indeterminate_check_box' : 'check_box_outline_blank'}
            </span>
            {selectedRows.size === rows.length ? 'Deselect all' : 'Select all'}
          </button>

          {/* Row list */}
          <div className="space-y-2 mb-6 max-h-[50vh] overflow-y-auto">
            {rows.map((row, idx) => {
              const cat = categoryOverrides.get(idx) ?? row.category;
              const catInfo = getCategories().find(c => c.key === cat)!;
              const isSelected = selectedRows.has(idx);

              return (
                <div
                  key={idx}
                  className={`rounded-xl p-4 flex items-center gap-3 transition-all ${
                    isSelected ? 'bg-surface-container-lowest' : 'bg-surface-container-lowest/40 opacity-50'
                  }`}
                >
                  {/* Checkbox */}
                  <button onClick={() => toggleRow(idx)} className="flex-shrink-0">
                    <span className={`material-symbols-outlined text-xl ${isSelected ? 'text-on-tertiary-container' : 'text-outline-variant'}`}>
                      {isSelected ? 'check_box' : 'check_box_outline_blank'}
                    </span>
                  </button>

                  {/* Info */}
                  <div className="flex-grow min-w-0">
                    <p className="font-semibold text-on-primary-fixed text-sm truncate">{row.description}</p>
                    <p className="text-on-surface-variant text-xs">
                      {new Date(row.date).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {row.originalCategory && (
                        <span className="text-outline ml-2">• {row.originalCategory}</span>
                      )}
                    </p>
                  </div>

                  {/* Category picker */}
                  <select
                    value={cat}
                    onChange={e => {
                      const next = new Map(categoryOverrides);
                      next.set(idx, e.target.value as Category);
                      setCategoryOverrides(next);
                    }}
                    className="bg-surface rounded-lg px-2 py-1 text-xs font-semibold border-none outline-none flex-shrink-0"
                    style={{ color: catInfo.color }}
                  >
                    {getCategories().map(c => (
                      <option key={c.key} value={c.key}>{c.label}</option>
                    ))}
                  </select>

                  {/* Amount */}
                  <span className="font-headline font-bold text-on-primary-fixed text-sm flex-shrink-0 w-16 text-right">
                    {formatCurrency(row.amount)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="sticky bottom-28 bg-surface/80 backdrop-blur-xl rounded-2xl py-4">
            <button
              onClick={handleImport}
              disabled={selectedRows.size === 0}
              className="w-full py-4 bg-primary-container text-on-primary font-headline font-bold text-base rounded-xl flex items-center justify-center gap-3 hover:opacity-90 active:scale-[0.98] transition-all shadow-xl shadow-primary-container/10 disabled:opacity-40"
            >
              <span className="material-symbols-outlined filled">download_done</span>
              Import {selectedRows.size} expense{selectedRows.size !== 1 ? 's' : ''}
            </button>
          </div>
        </>
      )}

      {/* ── Step 3: Done ── */}
      {step === 'done' && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-20 h-20 rounded-full bg-on-tertiary-container/10 flex items-center justify-center mb-6">
            <span className="material-symbols-outlined filled text-on-tertiary-container text-4xl">check_circle</span>
          </div>
          <h2 className="font-headline font-bold text-2xl text-on-primary-fixed mb-2">
            {importedCount} expense{importedCount !== 1 ? 's' : ''} imported
          </h2>
          <p className="text-on-surface-variant text-center mb-10">
            Your expenses have been added to Shnekel. They'll show up in your balance and reports.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-4 bg-primary-container text-on-primary font-headline font-bold text-base rounded-xl flex items-center justify-center gap-3 hover:opacity-90 active:scale-[0.98] transition-all shadow-xl shadow-primary-container/10"
          >
            <span className="material-symbols-outlined">home</span>
            Back to dashboard
          </button>
          <button
            onClick={() => { setStep('upload'); setRows([]); setError(''); }}
            className="mt-4 font-headline font-semibold text-on-surface-variant hover:text-on-primary-fixed transition-colors"
          >
            Import another file
          </button>
        </div>
      )}
    </div>
  );
}
