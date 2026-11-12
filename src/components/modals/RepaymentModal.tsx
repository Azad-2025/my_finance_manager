import React, { useState } from 'react';
import { X, CreditCard } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useLanguage } from '../../context/LanguageContext';
import { Borrowing, PaymentMethod } from '../../types/finance';
import { formatBDT } from '../../utils/formatters';

interface RepaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  borrowing: Borrowing | null;
}

export const RepaymentModal: React.FC<RepaymentModalProps> = ({ isOpen, onClose, borrowing }) => {
  const { recordBorrowingRepayment, accounts } = useFinance();
  const { t, isBn } = useLanguage();

  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | string>('bKash');
  const [accountId, setAccountId] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !borrowing) return null;

  const remainingDebt = Math.max(0, borrowing.amount - borrowing.repaid_amount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError(isBn ? 'সঠিক পরিশোধের পরিমাণ লিখুন।' : 'Please enter a valid repayment amount.');
      return;
    }
    if (numAmount > remainingDebt) {
      setError(
        isBn
          ? `পরিশোধের পরিমাণ অবশিষ্ট দেনার (${formatBDT(remainingDebt)}) চেয়ে বেশি হতে পারে না।`
          : `Repayment cannot exceed remaining debt (${formatBDT(remainingDebt)}).`
      );
      return;
    }

    setSubmitting(true);
    try {
      await recordBorrowingRepayment(
        borrowing.id,
        numAmount,
        paymentMethod,
        accountId || undefined,
        notes.trim() || undefined
      );
      setSubmitting(false);
      onClose();
    } catch (err: any) {
      setError(err.message || (isBn ? 'পরিশোধ রেকর্ড সংরক্ষণ করা যায়নি' : 'Failed to record repayment'));
      setSubmitting(false);
    }
  };

  const setFullRepayment = () => {
    setAmount(String(remainingDebt));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-emerald-50/50 dark:bg-emerald-950/20">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {isBn ? 'ঋণ পরিশোধ লিপিবদ্ধ করুন' : 'Record Debt Repayment'}
            </h3>
            <p className="text-[11px] text-slate-500">
              {isBn
                ? `${borrowing.person_name}-কে ঋণের কিস্তি প্রদান`
                : `Repaying loan to ${borrowing.person_name}`}
            </p>
          </div>
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

          {/* Debt Summary Pill */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-500">
                {isBn ? 'অবশিষ্ট দেনা' : 'Remaining Debt'}
              </div>
              <div className="text-base font-bold text-amber-600 font-mono tabular-nums">
                {formatBDT(remainingDebt)}
              </div>
            </div>
            <button
              type="button"
              onClick={setFullRepayment}
              className="px-2.5 py-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 rounded-lg hover:bg-amber-200 transition"
            >
              {isBn ? 'সম্পূর্ণ পরিশোধ' : 'Pay Full'}
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              {isBn ? 'পরিশোধের পরিমাণ (৳) *' : 'Repayment Amount (BDT / ৳) *'}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">৳</span>
              <input
                type="number"
                step="any"
                min="0.01"
                max={remainingDebt}
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-mono font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                {isBn ? 'পেমেন্ট মাধ্যম *' : 'Payment Method *'}
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Cash">{isBn ? 'নগদ (Cash)' : 'Cash'}</option>
                <option value="bKash">{isBn ? 'বিকাশ (bKash)' : 'bKash'}</option>
                <option value="Nagad">{isBn ? 'নগদ (Nagad)' : 'Nagad'}</option>
                <option value="Bank Transfer">{isBn ? 'ব্যাংক একাউন্ট' : 'Bank Transfer'}</option>
                <option value="Other">{isBn ? 'অন্যান্য' : 'Other'}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                {isBn ? 'একাউন্ট থেকে কর্তন' : 'Deduct from Account'}
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">{isBn ? '-- কোনো একাউন্ট নয় --' : '-- No Account --'}</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} (৳{acc.balance.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              {isBn ? 'নোট / ট্রানজেকশন আইডি (ঐচ্ছিক)' : 'Repayment Notes (Optional)'}
            </label>
            <textarea
              rows={2}
              placeholder={isBn ? 'যেমন: বিকাশ TrxID #827392 এর মাধ্যমে পরিশোধ' : 'e.g. Paid via bKash TrxID #827392'}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              {isBn ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition disabled:opacity-50"
            >
              {submitting
                ? (isBn ? 'সংরক্ষণ হচ্ছে...' : 'Recording...')
                : (isBn ? 'পরিশোধ নিশ্চিত করুন' : 'Confirm Repayment')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
