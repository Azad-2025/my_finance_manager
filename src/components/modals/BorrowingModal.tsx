import React, { useState, useEffect } from 'react';
import { X, Calendar, User, Phone, Banknote, FileText } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useLanguage } from '../../context/LanguageContext';
import { getTodayString } from '../../utils/formatters';
import { Borrowing, PaymentMethod } from '../../types/finance';

interface BorrowingModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingBorrowing?: Borrowing | null;
}

export const BorrowingModal: React.FC<BorrowingModalProps> = ({
  isOpen,
  onClose,
  editingBorrowing = null,
}) => {
  const { addBorrowing, updateBorrowing } = useFinance();
  const { t, isBn } = useLanguage();

  const [personName, setPersonName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [borrowedDate, setBorrowedDate] = useState(getTodayString());
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | string>('Cash');
  const [purpose, setPurpose] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingBorrowing) {
      setPersonName(editingBorrowing.person_name || '');
      setPhoneNumber(editingBorrowing.phone_number || '');
      setBorrowedDate(editingBorrowing.borrowed_date || getTodayString());
      setAmount(editingBorrowing.amount ? editingBorrowing.amount.toString() : '');
      setPaymentMethod(editingBorrowing.payment_method || 'Cash');
      setPurpose(editingBorrowing.purpose || '');
      setDueDate(editingBorrowing.due_date || '');
      setNotes(editingBorrowing.notes || '');
    } else {
      setPersonName('');
      setPhoneNumber('');
      setBorrowedDate(getTodayString());
      setAmount('');
      setPaymentMethod('Cash');
      setPurpose('');
      setDueDate('');
      setNotes('');
    }
    setError('');
  }, [editingBorrowing, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError(isBn ? 'অনুগ্রহ করে সঠিক পরিমাণ লিখুন।' : 'Please enter a valid positive amount.');
      return;
    }
    if (!personName.trim()) {
      setError(isBn ? 'যার থেকে ধার নিয়েছেন তার নাম লিখুন।' : "Please provide the lender person's name.");
      return;
    }

    setSubmitting(true);
    try {
      if (editingBorrowing) {
        await updateBorrowing({
          ...editingBorrowing,
          person_name: personName.trim(),
          phone_number: phoneNumber.trim() || undefined,
          borrowed_date: borrowedDate,
          amount: numAmount,
          payment_method: paymentMethod,
          purpose: purpose.trim() || undefined,
          due_date: dueDate || undefined,
          notes: notes.trim() || undefined,
        });
      } else {
        await addBorrowing({
          person_name: personName.trim(),
          phone_number: phoneNumber.trim() || undefined,
          borrowed_date: borrowedDate,
          amount: numAmount,
          payment_method: paymentMethod,
          purpose: purpose.trim() || undefined,
          due_date: dueDate || undefined,
          notes: notes.trim() || undefined,
        });
      }
      setSubmitting(false);
      onClose();
    } catch (err: any) {
      setError(err.message || (isBn ? 'রেকর্ড সংরক্ষণ করা যায়নি' : 'Failed to save borrowing record'));
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-orange-50/50 dark:bg-orange-950/20">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {editingBorrowing
                ? (isBn ? 'ধার নেওয়ার রেকর্ড সম্পাদনা' : 'Edit Borrowing Record')
                : (isBn ? 'ধার গ্রহণ লিপিবদ্ধ করুন (যে টাকা আমি ধার নিয়েছি)' : 'Record Borrowed Money (Debt Liability)')}
            </h3>
            <p className="text-[11px] text-slate-500">
              {isBn
                ? 'ধার নেওয়া দেনা ও কিস্তি পরিশোধ ট্র্যাকিং'
                : 'Track loans received from others to repay in installments'}
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

          {/* Person's Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              {isBn ? 'যার থেকে ধার নিয়েছেন তার নাম *' : "Borrowed From (Lender's Name) *"}
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                placeholder={isBn ? 'যেমন: ফারুক ভাই, খালেক সাহেব' : 'e.g. Brother Faruk, Uncle Rafiq'}
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Amount & Payment Method (Cash or bKash) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                {isBn ? 'পরিমাণ (৳) *' : 'Amount (BDT / ৳) *'}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">৳</span>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-mono font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                {isBn ? 'পেমেন্ট মাধ্যম (ক্যাশ বা বিকাশ) *' : 'Payment Method *'}
              </label>
              <div className="relative">
                <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="Cash">{isBn ? 'নগদ (Cash)' : 'Cash'}</option>
                  <option value="bKash">{isBn ? 'বিকাশ (bKash)' : 'bKash'}</option>
                  <option value="Nagad">{isBn ? 'নগদ (Nagad)' : 'Nagad'}</option>
                  <option value="Bank Transfer">{isBn ? 'ব্যাংক একাউন্ট' : 'Bank Transfer'}</option>
                  <option value="Other">{isBn ? 'অন্যান্য' : 'Other'}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Borrowed Date & Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                {isBn ? 'ধার নেওয়ার তারিখ *' : 'Borrowed Date *'}
              </label>
              <input
                type="date"
                required
                value={borrowedDate}
                onChange={(e) => setBorrowedDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                {isBn ? 'ফোন নম্বর (ঐচ্ছিক)' : 'Phone (Optional)'}
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="tel"
                  placeholder="01712-XXXXXX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Purpose / Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              {isBn ? 'উদ্দেশ্য / বিবরণ' : 'Purpose / Description'}
            </label>
            <input
              type="text"
              placeholder={isBn ? 'যেমন: ল্যাপটপ মেরামত, পারিবারিক জরুরি খরচ' : 'e.g. Laptop repair, family medical emergency'}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              {isBn ? 'পরিশোধের সম্ভাব্য শেষ তারিখ (ঐচ্ছিক)' : 'Due Date (Optional)'}
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              {isBn ? 'নোট / শর্তাবলী (ঐচ্ছিক)' : 'Optional Notes'}
            </label>
            <textarea
              rows={2}
              placeholder={isBn ? 'কোনো বিশেষ চুক্তি বা কিস্তির শর্ত থাকলে লিখুন...' : 'Any agreement terms or reminders...'}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Form Actions */}
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
              className="px-5 py-2.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-sm transition disabled:opacity-50"
            >
              {submitting
                ? (isBn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...')
                : editingBorrowing
                ? (isBn ? 'আপডেট করুন' : 'Update Record')
                : (isBn ? 'ধার গ্রহণ সংরক্ষণ করুন' : 'Record Borrowing')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
