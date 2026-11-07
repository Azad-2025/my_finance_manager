import React, { useState } from 'react';
import { X, Lock, Mail, User, ShieldCheck, Database, Key } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from '../common/BrandLogo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const {
    user,
    userProfile,
    signIn,
    signUp,
    signOut,
    resetPassword,
    isConfigured,
    isDemoUser,
    enterDemoMode,
    saveCredentials,
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot' | 'config'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    if (mode === 'config') {
      if (!supabaseUrl.startsWith('http') || !supabaseKey) {
        setMessage({ type: 'error', text: 'Please enter a valid Supabase project URL (https://...) and Anon key.' });
        setLoading(false);
        return;
      }
      saveCredentials(supabaseUrl.trim(), supabaseKey.trim());
      setMessage({ type: 'success', text: 'Supabase credentials saved successfully!' });
      setLoading(false);
      setMode('signin');
      return;
    }

    if (mode === 'signin') {
      const { error } = await signIn(email, password);
      if (error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({ type: 'success', text: 'Signed in successfully!' });
        setTimeout(() => onClose(), 600);
      }
    } else if (mode === 'signup') {
      const { error, needsEmailConfirmation } = await signUp(email, password, fullName);
      if (error) {
        setMessage({ type: 'error', text: error.message });
      } else if (needsEmailConfirmation) {
        setMessage({ type: 'success', text: 'Account created! Please check your email to confirm registration.' });
      } else {
        setMessage({ type: 'success', text: 'Account created and signed in!' });
        setTimeout(() => onClose(), 600);
      }
    } else if (mode === 'forgot') {
      const { error } = await resetPassword(email);
      if (error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({ type: 'success', text: 'Password reset link sent to your email.' });
      }
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {user
                ? 'User Profile & Session'
                : mode === 'config'
                ? 'Connect Supabase Database'
                : mode === 'signup'
                ? 'Create Personal Account'
                : mode === 'forgot'
                ? 'Reset Password'
                : 'Sign In to Your Finance'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex justify-center mb-5">
            <BrandLogo size="md" />
          </div>

          {message && (
            <div
              className={`p-3 rounded-xl mb-4 text-xs font-medium border ${
                message.type === 'error'
                  ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 text-red-600 dark:text-red-400'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {message.text}
            </div>
          )}

          {user ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="text-xs text-slate-500">Active Profile:</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                  {userProfile.name}
                </div>
                <div className="text-xs font-mono text-slate-500 mt-0.5">
                  {user.email} • {userProfile.phone}
                </div>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Authenticated via Supabase PostgreSQL</span>
                </div>
              </div>

              <button
                type="button"
                onClick={async () => {
                  await signOut();
                  onClose();
                }}
                className="w-full py-2.5 rounded-xl border border-red-200 dark:border-red-900 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'config' ? (
                <>
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                    <p className="font-semibold text-slate-900 dark:text-white">Supabase Setup Guide:</p>
                    <p>1. Create a free project at <span className="font-mono text-emerald-600">supabase.com</span></p>
                    <p>2. Copy your Project URL & Anon Key from Settings → API</p>
                    <p>3. Run the SQL schema from our Settings tab in your Supabase SQL Editor</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Project URL *
                    </label>
                    <div className="relative">
                      <Database className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="url"
                        required
                        placeholder="https://xyzcompany.supabase.co"
                        value={supabaseUrl}
                        onChange={(e) => setSupabaseUrl(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Anon Public API Key *
                    </label>
                    <div className="relative">
                      <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="password"
                        required
                        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                        value={supabaseKey}
                        onChange={(e) => setSupabaseKey(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {!isConfigured && (
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-[11px] text-amber-800 dark:text-amber-300">
                      <span>Supabase credentials not detected yet. You can test in </span>
                      <button
                        type="button"
                        onClick={() => {
                          enterDemoMode();
                          onClose();
                        }}
                        className="font-bold underline hover:text-amber-950 dark:hover:text-amber-100"
                      >
                        Demo Mode
                      </button>
                      <span> or </span>
                      <button
                        type="button"
                        onClick={() => setMode('config')}
                        className="font-bold underline hover:text-amber-950 dark:hover:text-amber-100"
                      >
                        Configure Supabase now
                      </button>.
                    </div>
                  )}

                  {mode === 'signup' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Muhammad Salah Uddin"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {mode !== 'forgot' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Password *
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="password"
                          required
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
              >
                {loading
                  ? 'Processing...'
                  : mode === 'config'
                  ? 'Save Credentials'
                  : mode === 'signup'
                  ? 'Create Account'
                  : mode === 'forgot'
                  ? 'Send Reset Link'
                  : 'Sign In'}
              </button>

              <div className="pt-2 flex flex-col items-center gap-2 text-xs text-slate-500">
                {mode === 'signin' && (
                  <>
                    <div className="flex gap-1">
                      <span>Don't have an account?</span>
                      <button
                        type="button"
                        onClick={() => {
                          setMode('signup');
                          setMessage(null);
                        }}
                        className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                      >
                        Sign Up
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setMessage(null);
                      }}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      Forgot password?
                    </button>
                  </>
                )}

                {mode === 'signup' && (
                  <div className="flex gap-1">
                    <span>Already have an account?</span>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('signin');
                        setMessage(null);
                      }}
                      className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                    >
                      Sign In
                    </button>
                  </div>
                )}

                {mode === 'forgot' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setMessage(null);
                    }}
                    className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                  >
                    Back to Sign In
                  </button>
                )}

                <div className="w-full border-t border-slate-200 dark:border-slate-800 pt-3 flex justify-between items-center text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      setMode(mode === 'config' ? 'signin' : 'config');
                      setMessage(null);
                    }}
                    className="text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 underline font-medium"
                  >
                    {mode === 'config' ? 'Back to Login' : 'Configure Supabase Keys'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      enterDemoMode();
                      onClose();
                    }}
                    className="text-slate-500 hover:text-slate-900 dark:hover:text-white underline font-medium"
                  >
                    Use Offline Sandbox
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
