import React, { useState, useEffect } from 'react';
import { X, Calendar, User, Phone, Banknote, FileText } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useLanguage } from '../../context/LanguageContext';
import { getTodayString } from '../../utils/formatters';
import { Lending, PaymentMethod } from '../../types/finance';

interface LendingModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingLending?: Lending | null;
}

export const LendingModal: React.FC<LendingModalProps> = ({
  isOpen,
  onClose,
  editingLending = null,
}) => {
  const { addLending, updateLending } = useFinance();
  const { t, isBn } = useLanguage();

  const [personName, setPersonName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [lendingDate, setLendingDate] = useState(getTodayString());
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | string>('Cash');
  const [purpose, setPurpose] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingLending) {
      setPersonName(editingLending.person_name || '');
      setPhoneNumber(editingLending.phone_number || '');
      setLendingDate(editingLending.lending_date || getTodayString());
      setAmount(editingLending.amount ? editingLending.amount.toString() : '');
      setPaymentMethod(editingLending.payment_method || 'Cash');
      setPurpose(editingLending.purpose || '');
      setExpectedReturnDate(editingLending.expected_return_date || '');
      setNotes(editingLending.notes || '');
    } else {
      setPersonName('');
      setPhoneNumber('');
      setLendingDate(getTodayString());
      setAmount('');
      setPaymentMethod('Cash');
      setPurpose('');
      setExpectedReturnDate('');
      setNotes('');
    }
    setError('');
  }, [editingLending, isOpen]);

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
      setError(isBn ? 'যাকে ধার দিয়েছেন তার নাম লিখুন।' : "Please provide the borrower person's name.");
      return;
    }

    setSubmitting(true);
    try {
      if (editingLending) {
        await updateLending({
          ...editingLending,
          person_name: personName.trim(),
          phone_number: phoneNumber.trim() || undefined,
          lending_date: lendingDate,
          amount: numAmount,
          payment_method: paymentMethod,
          purpose: purpose.trim() || undefined,
          expected_return_date: expectedReturnDate || undefined,
          notes: notes.trim() || undefined,
        });
      } else {
        await addLending({
          person_name: personName.trim(),
          phone_number: phoneNumber.trim() || undefined,
          lending_date: lendingDate,
          amount: numAmount,
          payment_method: paymentMethod,
          purpose: purpose.trim() || undefined,
          expected_return_date: expectedReturnDate || undefined,
          notes: notes.trim() || undefined,
        });
      }
      setSubmitting(false);
      onClose();
    } catch (err: any) {
      setError(err.message || (isBn ? 'রেকর্ড সংরক্ষণ করা যায়নি' : 'Failed to save lending record'));
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-blue-50/50 dark:bg-blue-950/20">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {editingLending
                ? (isBn ? 'ধার দেওয়ার রেকর্ড সম্পাদনা' : 'Edit Lending Record')
                : (isBn ? 'ধার প্রদান লিপিবদ্ধ করুন (যে টাকা আমি অন্যকে ধার দিয়েছি)' : 'Record Lent Money (Receivable Asset)')}
            </h3>
            <p className="text-[11px] text-slate-500">
              {isBn
                ? 'অন্যকে দেওয়া ধার এবং আদায় ট্র্যাকিং'
                : 'Track loans given to others and collection receipts'}
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

          {/* Borrower's Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              {isBn ? 'যাকে ধার দিয়েছেন তার নাম *' : "Lent To (Borrower's Name) *"}
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                placeholder={isBn ? 'যেমন: ফাহিম হোসেন, সাব্বির' : 'e.g. Fahim Hossain, Sabbir'}
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-mono font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
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

          {/* Lending Date & Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                {isBn ? 'ধার দেওয়ার তারিখ *' : 'Lending Date *'}
              </label>
              <input
                type="date"
                required
                value={lendingDate}
                onChange={(e) => setLendingDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  placeholder="01912-XXXXXX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              placeholder={isBn ? 'যেমন: ভ্রমণ টিকেট, ব্যবসার মূলধন, চিকিৎসা' : 'e.g. Travel tickets, business capital, medical'}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Expected Return Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              {isBn ? 'ফেরতের সম্ভাব্য তারিখ (ঐচ্ছিক)' : 'Expected Return Date (Optional)'}
            </label>
            <input
              type="date"
              value={expectedReturnDate}
              onChange={(e) => setExpectedReturnDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              {isBn ? 'নোট / শর্তাবলী (ঐচ্ছিক)' : 'Optional Notes'}
            </label>
            <textarea
              rows={2}
              placeholder={isBn ? 'কোনো বিশেষ চুক্তি বা শর্ত থাকলে লিখুন...' : 'Terms, reminders, or repayment timeline...'}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition disabled:opacity-50"
            >
              {submitting
                ? (isBn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...')
                : editingLending
                ? (isBn ? 'আপডেট করুন' : 'Update Record')
                : (isBn ? 'ধার প্রদান সংরক্ষণ করুন' : 'Record Lending')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
