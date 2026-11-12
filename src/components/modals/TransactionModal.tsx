import React, { useState, useEffect } from 'react';
import { X, Plus, Calendar, DollarSign, Tag, FileText, CreditCard, Building, Check } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useLanguage } from '../../context/LanguageContext';
import { Transaction, TransactionType, PaymentMethod, OfficeReimbursementStatus } from '../../types/finance';
import { getTodayString } from '../../utils/formatters';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: TransactionType;
  editingTransaction?: Transaction | null;
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

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  initialType = 'personal_expense',
  editingTransaction,
}) => {
  const { categories, accounts, addTransaction, updateTransaction } = useFinance();
  const { language, t } = useLanguage();
  const isBn = language === 'bn';

  const [type, setType] = useState<TransactionType>(initialType);
  const [date, setDate] = useState(getTodayString());
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | string>('bKash');
  const [accountId, setAccountId] = useState('');
  const [notes, setNotes] = useState('');
  const [projectName, setProjectName] = useState('');
  const [reimbursementStatus, setReimbursementStatus] = useState<OfficeReimbursementStatus>('Not Submitted');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setDate(editingTransaction.date);
      setCategory(editingTransaction.category);
      setDescription(editingTransaction.description);
      setAmount(String(editingTransaction.amount));
      setPaymentMethod(editingTransaction.payment_method);
      setAccountId(editingTransaction.account_id || '');
      setNotes(editingTransaction.notes || '');
      setProjectName(editingTransaction.project_name || '');
      setReimbursementStatus(editingTransaction.reimbursement_status || 'Not Submitted');
    } else {
      setType(initialType);
      setDate(getTodayString());
      setDescription('');
      setAmount('');
      setNotes('');
      setProjectName('');
      setReimbursementStatus('Not Submitted');
      if (accounts.length > 0 && !accountId) {
        setAccountId(accounts[0].id);
      }
    }
    setError('');
  }, [editingTransaction, initialType, isOpen, accounts]);

  // Filter available categories based on selected transaction type
  const availableCategories = categories.filter((c) => c.type === type);

  useEffect(() => {
    if (availableCategories.length > 0 && !editingTransaction) {
      setCategory(availableCategories[0].name);
    }
  }, [type, categories]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError(isBn ? 'দয়া করে একটি সঠিক ইতিবাচক টাকার পরিমাণ (৳) লিখুন।' : 'Please enter a valid positive amount in BDT (৳).');
      return;
    }
    if (!description.trim()) {
      setError(isBn ? 'দয়া করে বিবরণ বা আইটেমের নাম লিখুন।' : 'Please provide a description or item name.');
      return;
    }
    if (!category) {
      setError(isBn ? 'দয়া করে একটি ক্যাটাগরি নির্বাচন করুন।' : 'Please select a category.');
      return;
    }

    setSubmitting(true);
    const selectedAccount = accounts.find((a) => a.id === accountId);

    try {
      if (editingTransaction) {
        await updateTransaction({
          ...editingTransaction,
          date,
          type,
          category,
          description: description.trim(),
          amount: numAmount,
          payment_method: paymentMethod,
          account_id: accountId || undefined,
          account_name: selectedAccount?.name,
          notes: notes.trim() || undefined,
          project_name: type === 'office_expense' ? projectName.trim() || undefined : undefined,
          reimbursement_status: type === 'office_expense' ? reimbursementStatus : undefined,
        });
      } else {
        await addTransaction({
          date,
          type,
          category,
          description: description.trim(),
          amount: numAmount,
          payment_method: paymentMethod,
          account_id: accountId || undefined,
          account_name: selectedAccount?.name,
          notes: notes.trim() || undefined,
          project_name: type === 'office_expense' ? projectName.trim() || undefined : undefined,
          reimbursement_status: type === 'office_expense' ? reimbursementStatus : undefined,
          reimbursed_amount: 0,
        });
      }
      setSubmitting(false);
      onClose();
    } catch (err: any) {
      setError(err.message || (isBn ? 'লেনদেন সংরক্ষণ করতে ব্যর্থ হয়েছে' : 'Failed to save transaction'));
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-slate-900 dark:text-white">
              {editingTransaction
                ? (isBn ? 'লেনদেন সম্পাদনা' : 'Edit Transaction')
                : (isBn ? 'নতুন লেনদেন রেকর্ড করুন' : 'Record New Transaction')}
            </span>
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

          {/* Type Segmented Buttons */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
              {isBn ? 'লেনদেনের ধরন' : 'Transaction Type'}
            </label>
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setType('personal_expense')}
                className={`py-2 text-xs font-semibold rounded-lg transition ${
                  type === 'personal_expense'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {isBn ? 'ব্যক্তিগত ব্যয়' : 'Personal Expense'}
              </button>
              <button
                type="button"
                onClick={() => setType('office_expense')}
                className={`py-2 text-xs font-semibold rounded-lg transition ${
                  type === 'office_expense'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {isBn ? 'অফিস খরচ' : 'Office Expense'}
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`py-2 text-xs font-semibold rounded-lg transition ${
                  type === 'income'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {isBn ? 'আয়' : 'Income'}
              </button>
            </div>
          </div>

          {/* Amount & Date Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                {isBn ? 'টাকার পরিমাণ (BDT / ৳) *' : 'Amount (BDT / ৳) *'}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">৳</span>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                {isBn ? 'তারিখ *' : 'Date *'}
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              {isBn ? 'বিবরণ / আইটেমের নাম *' : 'Description / Item Name *'}
            </label>
            <input
              type="text"
              required
              placeholder={
                type === 'income'
                  ? (isBn ? 'যেমন: অক্টোবর মাসের বেতন, ফ্রিল্যান্স প্রজেক্ট' : 'e.g. October Salary, Freelance project')
                  : (isBn ? 'যেমন: দুপুরের খাবার, উবার ভাড়া, মুদি বাজার' : 'e.g. Lunch with team, Uber ride, Grocery')
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Category & Payment Method Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                {isBn ? 'ক্যাটাগরি *' : 'Category *'}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {availableCategories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                {isBn ? 'পেমেন্ট মাধ্যম *' : 'Payment Method *'}
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Account Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              {isBn ? 'অ্যাকাউন্ট / ওয়ালেট' : 'Account / Wallet'}
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">{isBn ? '-- কোনো অ্যাকাউন্ট সংযুক্ত নেই --' : '-- No Account Linked --'}</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.type}) - ৳{acc.balance.toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          {/* Office Expense Specific Fields */}
          {type === 'office_expense' && (
            <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
                <Building className="w-4 h-4" />
                <span>{isBn ? 'অফিস রিইমবার্সমেন্ট বিবরণ' : 'Office Reimbursement Details'}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {isBn ? 'প্রজেক্ট / ক্লায়েন্টের নাম' : 'Project / Client Name'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Apex Portal Revamp"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {isBn ? 'রিইমবার্সমেন্ট স্ট্যাটাস' : 'Reimbursement Status'}
                  </label>
                  <select
                    value={reimbursementStatus}
                    onChange={(e) => setReimbursementStatus(e.target.value as OfficeReimbursementStatus)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="Not Submitted">{isBn ? 'জমা দেওয়া হয়নি' : 'Not Submitted'}</option>
                    <option value="Submitted">{isBn ? 'জমা দেওয়া হয়েছে' : 'Submitted'}</option>
                    <option value="Partially Reimbursed">{isBn ? 'আংশিক পরিশোধিত' : 'Partially Reimbursed'}</option>
                    <option value="Fully Reimbursed">{isBn ? 'সম্পূর্ণ পরিশোধিত' : 'Fully Reimbursed'}</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              {isBn ? 'নোট / মন্তব্য (ঐচ্ছিক)' : 'Notes (Optional)'}
            </label>
            <textarea
              rows={2}
              placeholder={isBn ? 'অতিরিক্ত মন্তব্য, রসিদ বা ভাউচার নম্বর...' : 'Additional remarks, memo, or receipt invoice details...'}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Submit button */}
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
                ? (isBn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...')
                : editingTransaction
                ? (isBn ? 'আপডেট করুন' : 'Update Transaction')
                : (isBn ? 'সংরক্ষণ করুন' : 'Save Transaction')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
