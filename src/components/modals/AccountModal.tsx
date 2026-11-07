import React, { useState, useEffect } from 'react';
import { X, Wallet } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Account, AccountType } from '../../types/finance';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingAccount?: Account | null;
}

const ACCOUNT_TYPES: AccountType[] = [
  'Cash Wallet',
  'Bank Account',
  'bKash',
  'Nagad',
  'Rocket',
  'Other',
];

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  editingAccount,
}) => {
  const { addAccount, updateAccount } = useFinance();

  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('Cash Wallet');
  const [balance, setBalance] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingAccount) {
      setName(editingAccount.name);
      setType(editingAccount.type);
      setBalance(String(editingAccount.balance));
      setAccountNumber(editingAccount.account_number || '');
    } else {
      setName('');
      setType('Cash Wallet');
      setBalance('0');
      setAccountNumber('');
    }
    setError('');
  }, [editingAccount, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter an account or wallet name.');
      return;
    }
    const numBalance = parseFloat(balance);
    if (isNaN(numBalance)) {
      setError('Please enter a valid numeric starting balance.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingAccount) {
        await updateAccount({
          ...editingAccount,
          name: name.trim(),
          type,
          balance: numBalance,
          account_number: accountNumber.trim() || undefined,
        });
      } else {
        await addAccount({
          name: name.trim(),
          type,
          balance: numBalance,
          account_number: accountNumber.trim() || undefined,
          is_default: false,
        });
      }
      setSubmitting(false);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save account');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {editingAccount ? 'Edit Account' : 'Add Financial Account'}
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
              Account Type *
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as AccountType)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {ACCOUNT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Account / Wallet Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. City Bank Salary, bKash Personal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Initial / Current Balance (BDT / ৳) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">৳</span>
              <input
                type="number"
                step="any"
                required
                placeholder="0.00"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-mono font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Account / Mobile Number (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. 01712-XXXXXX or AC# 1102983"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
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
              {submitting ? 'Saving...' : editingAccount ? 'Update Account' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
