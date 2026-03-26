import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { CategoryInfo } from '../types'
import { AVAILABLE_ICONS, AVAILABLE_COLORS } from '../types'
import { getCategories, getSettings, saveSettings } from '../lib/storage'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { useLocale } from '../hooks/useLocale'

export function Categories() {
  const navigate = useNavigate()
  const { t } = useLocale()
  const [categories, setCategories] = useState<CategoryInfo[]>(getCategories)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<CategoryInfo | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CategoryInfo | null>(null)

  // Form state
  const [label, setLabel] = useState('')
  const [icon, setIcon] = useState('more_horiz')
  const [color, setColor] = useState('#78909C')

  const customCategories = categories.filter(c => !c.isDefault)

  const openForm = (cat?: CategoryInfo) => {
    if (cat) {
      setEditing(cat)
      setLabel(cat.label)
      setIcon(cat.icon)
      setColor(cat.color)
    } else {
      setEditing(null)
      setLabel('')
      setIcon('more_horiz')
      setColor('#78909C')
    }
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditing(null)
  }

  const saveCustomCategories = (customs: CategoryInfo[]) => {
    const settings = getSettings()
    saveSettings({ ...settings, customCategories: customs })
    setCategories(getCategories())
  }

  const handleSave = () => {
    if (!label.trim()) return
    const key = editing?.key ?? label.trim().toLowerCase().replace(/\s+/g, '_')

    if (editing) {
      const updated = customCategories.map(c =>
        c.key === editing.key ? { ...c, key, label: label.trim(), icon, color } : c
      )
      saveCustomCategories(updated)
    } else {
      // Check for duplicate key
      if (categories.some(c => c.key === key)) {
        return // silently prevent duplicate
      }
      saveCustomCategories([...customCategories, { key, label: label.trim(), icon, color }])
    }
    closeForm()
  }

  const handleDelete = () => {
    if (deleteTarget) {
      saveCustomCategories(customCategories.filter(c => c.key !== deleteTarget.key))
      setDeleteTarget(null)
    }
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
            <h1 className="font-headline font-bold text-2xl text-on-primary-fixed">{t('categories.title')}</h1>
            <p className="text-on-surface-variant text-sm">{t('categories.subtitle')}</p>
          </div>
        </div>
        <button
          onClick={() => openForm()}
          className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center text-white hover:opacity-90 transition-all"
        >
          <span className="material-symbols-outlined">add</span>
        </button>
      </div>

      {/* Default categories */}
      <h3 className="text-xs font-semibold tracking-wide text-on-surface-variant mb-3">{t('categories.default')}</h3>
      <div className="space-y-2 mb-8">
        {categories.filter(c => c.isDefault).map(cat => (
          <div key={cat.key} className="bg-surface-container-lowest rounded-xl p-4 flex items-center gap-4 opacity-70">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: cat.color + '18' }}
            >
              <span className="material-symbols-outlined" style={{ color: cat.color }}>{cat.icon}</span>
            </div>
            <p className="font-headline font-semibold text-on-primary-fixed text-sm flex-grow">{cat.label}</p>
            <span className="text-outline text-xs">{t('categories.builtIn')}</span>
          </div>
        ))}
      </div>

      {/* Custom categories */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold tracking-wide text-on-surface-variant">{t('categories.custom')}</h3>
      </div>
      {customCategories.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-on-surface-variant text-sm">{t('categories.noCustom')}</p>
          <button
            onClick={() => openForm()}
            className="mt-3 text-on-tertiary-container font-semibold text-sm hover:underline"
          >
            {t('categories.addOne')}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {customCategories.map(cat => (
            <div key={cat.key} className="bg-surface-container-lowest rounded-xl p-4 flex items-center gap-4">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: cat.color + '18' }}
              >
                <span className="material-symbols-outlined" style={{ color: cat.color }}>{cat.icon}</span>
              </div>
              <p
                className="font-headline font-semibold text-on-primary-fixed text-sm flex-grow cursor-pointer"
                onClick={() => openForm(cat)}
              >
                {cat.label}
              </p>
              <button
                onClick={() => openForm(cat)}
                className="text-on-surface-variant hover:text-on-primary-fixed transition-colors"
              >
                <span className="material-symbols-outlined text-lg">edit</span>
              </button>
              <button
                onClick={() => setDeleteTarget(cat)}
                className="text-on-surface-variant hover:text-error transition-colors"
              >
                <span className="material-symbols-outlined text-lg">delete</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeForm} />
          <div className="relative bg-surface-container-lowest rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md p-8 pb-10 z-10 max-h-[85vh] overflow-y-auto">
            <div className="w-10 h-1 bg-outline-variant rounded-full mx-auto mb-6 sm:hidden" />
            <h2 className="font-headline font-bold text-xl text-on-primary-fixed mb-6">
              {editing ? t('categories.editCategory') : t('categories.newCategory')}
            </h2>

            {/* Name */}
            <label className="text-on-surface-variant text-xs font-semibold tracking-wide block mb-2">{t('categories.name')}</label>
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder={t('categories.namePlaceholder')}
              autoFocus
              className="w-full bg-surface rounded-xl px-4 py-3 font-body text-on-surface border-none outline-none placeholder:text-outline-variant mb-5"
            />

            {/* Icon picker */}
            <label className="text-on-surface-variant text-xs font-semibold tracking-wide block mb-2">{t('categories.icon')}</label>
            <div className="grid grid-cols-7 gap-2 mb-5">
              {AVAILABLE_ICONS.map(ic => (
                <button
                  key={ic}
                  onClick={() => setIcon(ic)}
                  className={`aspect-square rounded-lg flex items-center justify-center transition-all ${
                    icon === ic ? 'bg-primary-container' : 'bg-surface hover:bg-surface-container'
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-lg"
                    style={{ color: icon === ic ? '#fff' : color }}
                  >
                    {ic}
                  </span>
                </button>
              ))}
            </div>

            {/* Color picker */}
            <label className="text-on-surface-variant text-xs font-semibold tracking-wide block mb-2">{t('categories.color')}</label>
            <div className="grid grid-cols-7 gap-2 mb-6">
              {AVAILABLE_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`aspect-square rounded-lg transition-all ${
                    color === c ? 'ring-2 ring-on-primary-fixed ring-offset-2' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            {/* Preview */}
            <div className="bg-surface rounded-xl p-4 flex items-center gap-4 mb-6">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: color + '18' }}
              >
                <span className="material-symbols-outlined" style={{ color }}>{icon}</span>
              </div>
              <p className="font-headline font-semibold text-on-primary-fixed">{label || 'Category name'}</p>
            </div>

            <button
              onClick={handleSave}
              disabled={!label.trim()}
              className="w-full py-4 bg-primary-container text-on-primary font-headline font-bold text-lg rounded-xl flex items-center justify-center gap-3 hover:opacity-90 active:scale-[0.98] transition-all shadow-xl shadow-primary-container/10 disabled:opacity-40"
            >
              <span className="material-symbols-outlined filled">{editing ? 'check_circle' : 'add_circle'}</span>
              {editing ? t('expense.saveChanges') : t('categories.addCategory')}
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title={t('categories.deleteCategory')}
        message={deleteTarget ? t('categories.deleteCategoryMsg', { label: deleteTarget.label }) : ''}
        confirmLabel="Delete"
        confirmDestructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
