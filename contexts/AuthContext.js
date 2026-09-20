// contexts/AuthContext.js
//
// Wraps the whole app. Keeps track of:
//   - the current Supabase auth session (who is logged in)
//   - that user's role ('admin' | 'staff'), looked up from the `users` table
//   - loading state, so pages can show a spinner instead of flashing content
//
// Any component can call `useAuth()` to read { user, role, loading, signIn, signOut }.

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // Supabase auth user object
  const [role, setRole] = useState(null); // 'admin' | 'staff' | null
  const [loading, setLoading] = useState(true);

  // Look up the profile row (role) that matches the logged-in auth user.
  const loadProfile = useCallback(async (authUser) => {
    if (!authUser) {
      setRole(null);
      return;
    }
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', authUser.id)
      .single();

    if (error) {
      console.error('Failed to load user profile/role:', error.message);
      setRole(null);
    } else {
      setRole(data?.role ?? null);
    }
  }, []);

  useEffect(() => {
    // 1. Check for an existing session on first load (e.g. page refresh).
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null);
      await loadProfile(session?.user ?? null);
      setLoading(false);
    });

    // 2. Subscribe to future auth changes (login / logout in any tab).
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      await loadProfile(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, [loadProfile]);

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = { user, role, loading, signIn, signOut };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
