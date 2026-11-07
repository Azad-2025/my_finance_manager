import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import {
  getSupabase,
  isSupabaseConfigured,
  saveSupabaseConfig,
  UserProfile,
  getSavedUserProfile,
  saveUserProfile,
  DEFAULT_USER_PROFILE,
} from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile;
  loading: boolean;
  isConfigured: boolean;
  isDemoUser: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null; needsEmailConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  enterDemoMode: () => void;
  saveCredentials: (url: string, anonKey: string) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfileState] = useState<UserProfile>(getSavedUserProfile());
  const [loading, setLoading] = useState(true);
  const [isDemoUser, setIsDemoUser] = useState<boolean>(() => {
    return !isSupabaseConfigured();
  });
  const [configured, setConfigured] = useState<boolean>(isSupabaseConfigured());

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        setIsDemoUser(false);
        if (currentSession.user.user_metadata?.full_name) {
          updateProfile({ name: currentSession.user.user_metadata.full_name });
        }
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        setIsDemoUser(false);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [configured]);

  const updateProfile = (partial: Partial<UserProfile>) => {
    const updated = { ...userProfile, ...partial };
    setUserProfileState(updated);
    saveUserProfile(updated);
  };

  const signIn = async (email: string, password: string) => {
    const supabase = getSupabase();
    if (!supabase) {
      return { error: new Error('Supabase is not configured yet. Please configure Supabase URL and Anon Key in Settings.') };
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) {
      setIsDemoUser(false);
    }
    return { error };
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    const supabase = getSupabase();
    if (!supabase) {
      return { error: new Error('Supabase is not configured yet. Please configure Supabase URL and Anon Key in Settings.') };
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName || userProfile.name },
      },
    });

    const needsEmailConfirmation = Boolean(data?.user && !data.session);
    if (!error && data.session) {
      setIsDemoUser(false);
      if (fullName) {
        updateProfile({ name: fullName, email });
      }
    }
    return { error, needsEmailConfirmation };
  };

  const signOut = async () => {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setIsDemoUser(true);
  };

  const resetPassword = async (email: string) => {
    const supabase = getSupabase();
    if (!supabase) {
      return { error: new Error('Supabase is not configured.') };
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    return { error };
  };

  const enterDemoMode = () => {
    setIsDemoUser(true);
  };

  const saveCredentials = (url: string, anonKey: string) => {
    saveSupabaseConfig({ url, anonKey });
    setConfigured(isSupabaseConfigured());
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        userProfile,
        loading,
        isConfigured: configured,
        isDemoUser,
        signIn,
        signUp,
        signOut,
        resetPassword,
        enterDemoMode,
        saveCredentials,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
