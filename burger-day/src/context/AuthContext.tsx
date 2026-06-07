import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../supabase/client';
import type { Profile } from '../lib/database.types';
import {
  getGuestProfile,
  updateGuestProfile,
  clearGuestData,
  type GuestProfile,
} from '../services/localStorage';

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isGuest: boolean;
  guestProfile: GuestProfile | null;
  isLoading: boolean;
  signUp: (email: string, password: string) => Promise<'auto-login' | 'verify-email'>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshGuestProfile: () => Promise<void>;
  mergeGuestToUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [guestProfile, setGuestProfile] = useState<GuestProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isGuest = !session && !user;

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (data) {
      setProfile(data as Profile);
    }
  };

  const loadGuestProfile = useCallback(async () => {
    const gp = await getGuestProfile();
    setGuestProfile(gp);
  }, []);

  // Initialize auth state
  useEffect(() => {
    Promise.all([
      supabase.auth.getSession(),
      getGuestProfile(),
    ]).then(([{ data: { session: s } }, gp]) => {
      setSession(s);
      setUser(s?.user ?? null);
      setGuestProfile(gp);
      if (s?.user) {
        fetchProfile(s.user.id);
      }
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        fetchProfile(s.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string): Promise<'auto-login' | 'verify-email'> => {
    // Try sign up
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;

    // If auto-confirm is on, session is returned and we're logged in
    if (data?.session) {
      // Session will be picked up by onAuthStateChange
      return 'auto-login';
    }

    // If no session, try signing in directly (bypass email verification)
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (!signInError) {
        return 'auto-login';
      }
    } catch {
      // Sign-in failed, email verification required
    }

    return 'verify-email';
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    // Clear guest data too
    await clearGuestData();
    setGuestProfile(null);
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const refreshGuestProfile = async () => {
    await loadGuestProfile();
  };

  const mergeGuestToUser = async () => {
    // When a guest registers, we should merge their local data
    // For now, clear guest data since it's been migrated
    await clearGuestData();
    setGuestProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session, user, profile,
        isGuest, guestProfile,
        isLoading,
        signUp, signIn, signOut,
        refreshProfile, refreshGuestProfile, mergeGuestToUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
