import React, { useState } from 'react';
import { X, DollarSign, CreditCard } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Borrowing, PaymentMethod } from '../../types/finance';
import { formatBDT } from '../../utils/formatters';

interface RepaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  borrowing: Borrowing | null;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  'Cash',
  'bKash',
  'Nagad',
  'Rocket',
  'Bank Transfer',
  'Debit Card',
  'Credit Card',
  'Other',
];

export const RepaymentModal: React.FC<RepaymentModalProps> = ({ isOpen, onClose, borrowing }) => {
  const { recordBorrowingRepayment, accounts } = useFinance();

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
      setError('Please enter a valid repayment amount.');
      return;
    }
    if (numAmount > remainingDebt) {
      setError(`Repayment cannot exceed remaining debt (${formatBDT(remainingDebt)}).`);
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
      setError(err.message || 'Failed to record repayment');
      setSubmitting(false);
    }
  };

  const setFullRepayment = () => {
    setAmount(String(remainingDebt));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Record Debt Repayment</h3>
            <p className="text-[11px] text-slate-500">Repaying loan to {borrowing.person_name}</p>
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
              <div className="text-[11px] text-slate-500">Remaining Debt</div>
              <div className="text-base font-bold text-amber-600 font-mono tabular-nums">
                {formatBDT(remainingDebt)}
              </div>
            </div>
            <button
              type="button"
              onClick={setFullRepayment}
              className="px-2.5 py-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 rounded-lg hover:bg-amber-200 transition"
            >
              Pay Full
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Repayment Amount (BDT / ৳) *
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
                Payment Method *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Deduct from Account
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- No Account --</option>
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
              Repayment Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Paid via bKash TrxID #827392"
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
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition disabled:opacity-50"
            >
              {submitting ? 'Recording...' : 'Confirm Repayment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
