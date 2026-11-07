import React, { useState, useEffect } from 'react';
import { X, Tag } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Category } from '../../types/finance';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCategory?: Category | null;
  defaultType?: 'personal_expense' | 'office_expense' | 'income';
}

const COLOR_OPTIONS = [
  '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b',
  '#ef4444', '#06b6d4', '#6366f1', '#f97316', '#84cc16',
  '#0ea5e9', '#d946ef', '#14b8a6', '#64748b'
];

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  editingCategory,
  defaultType = 'personal_expense',
}) => {
  const { addCategory, updateCategory } = useFinance();

  const [name, setName] = useState('');
  const [type, setType] = useState<'personal_expense' | 'office_expense' | 'income'>(defaultType);
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingCategory) {
      setName(editingCategory.name);
      setType(editingCategory.type);
      setColor(editingCategory.color || COLOR_OPTIONS[0]);
    } else {
      setName('');
      setType(defaultType);
      setColor(COLOR_OPTIONS[0]);
    }
    setError('');
  }, [editingCategory, defaultType, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter a category name.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingCategory) {
        await updateCategory({
          ...editingCategory,
          name: name.trim(),
          type,
          color,
        });
      } else {
        await addCategory({
          name: name.trim(),
          type,
          color,
        });
      }
      setSubmitting(false);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save category');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {editingCategory ? 'Edit Category' : 'Create Custom Category'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-600 dark:text-red-400 font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Category Section
            </label>
            <select
              value={type}
              disabled={Boolean(editingCategory)}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
            >
              <option value="personal_expense">Personal Expense</option>
              <option value="office_expense">Office Expense</option>
              <option value="income">Income</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Category Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Gym & Fitness, Tech Gadgets"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
              Color Tag
            </label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    color === c ? 'scale-125 ring-2 ring-slate-900 dark:ring-white ring-offset-2 dark:ring-offset-slate-900' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
