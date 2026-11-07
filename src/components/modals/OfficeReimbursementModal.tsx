import React, { useState } from 'react';
import { X, Building, DollarSign } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Transaction, PaymentMethod } from '../../types/finance';
import { formatBDT } from '../../utils/formatters';

interface OfficeReimbursementModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
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

export const OfficeReimbursementModal: React.FC<OfficeReimbursementModalProps> = ({
  isOpen,
  onClose,
  transaction,
}) => {
  const { recordOfficeReimbursement, accounts } = useFinance();

  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | string>('Cash');
  const [accountId, setAccountId] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !transaction) return null;

  const reimbursedSoFar = Number(transaction.reimbursed_amount || 0);
  const pendingAmount = Math.max(0, transaction.amount - reimbursedSoFar);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid reimbursement amount.');
      return;
    }
    if (numAmount > pendingAmount) {
      setError(`Reimbursement cannot exceed pending amount (${formatBDT(pendingAmount)}).`);
      return;
    }

    setSubmitting(true);
    try {
      await recordOfficeReimbursement(
        transaction.id,
        numAmount,
        paymentMethod,
        accountId || undefined,
        notes.trim() || undefined
      );
      setSubmitting(false);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record reimbursement');
      setSubmitting(false);
    }
  };

  const setFullReimbursement = () => {
    setAmount(String(pendingAmount));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Record Office Reimbursement</h3>
            <p className="text-[11px] text-slate-500">Receipt: {transaction.description}</p>
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

          {/* Pending Reimbursement Pill */}
          <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">Pending Receivable from Office</div>
              <div className="text-base font-bold text-amber-600 font-mono tabular-nums">
                {formatBDT(pendingAmount)}
              </div>
            </div>
            <button
              type="button"
              onClick={setFullReimbursement}
              className="px-2.5 py-1 text-[11px] font-bold text-amber-800 dark:text-amber-300 bg-amber-200/80 dark:bg-amber-900/80 rounded-lg hover:bg-amber-300 transition"
            >
              Reimburse Full
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Reimbursed Amount (BDT / ৳) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">৳</span>
              <input
                type="number"
                step="any"
                min="0.01"
                max={pendingAmount}
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-mono font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              * Note: Office reimbursement reduces office receivable balance and is not double-counted as new income.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Received Via *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                Deposit to Account
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
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
              Remarks / Voucher No.
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Accounts voucher cleared by HR/Finance"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
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
              className="px-5 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-sm transition disabled:opacity-50"
            >
              {submitting ? 'Recording...' : 'Confirm Reimbursement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
