import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        console.error('[Auth] Profile fetch error:', error.message);
        return null;
      }
      return data;
    } catch (err) {
      console.error('[Auth] Profile fetch exception:', err.message);
      return null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    // Single source of truth: onAuthStateChange handles everything
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, s) => {
        if (cancelled) return;

        setSession(s);
        setUser(s?.user ?? null);

        if (s?.user) {
          // Use setTimeout to break out of the Supabase callback chain
          // This prevents auth lock contention issues
          setTimeout(async () => {
            if (cancelled) return;
            const prof = await fetchProfile(s.user.id);
            if (!cancelled) {
              setProfile(prof);
              setLoading(false);
            }
          }, 0);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    // Safety timeout — if nothing fires in 5s, stop loading
    const timeout = setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 5000);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;

    // Fetch profile and check status
    if (data.user) {
      const prof = await fetchProfile(data.user.id);

      if (!prof) {
        await supabase.auth.signOut();
        throw new Error('No profile found. Please contact your administrator.');
      }

      if (prof.status !== 'active') {
        await supabase.auth.signOut();
        throw new Error(
          prof.status === 'pending_approval'
            ? 'Your account is pending admin approval. Please wait for activation.'
            : prof.status === 'suspended'
            ? 'Your account has been suspended. Contact your administrator.'
            : 'Your account has been rejected. Contact your administrator.'
        );
      }

      // Set profile immediately — don't wait for onAuthStateChange
      setProfile(prof);
      setUser(data.user);
      setSession(data.session);
      setLoading(false);
    }

    return data;
  }, [fetchProfile]);

  const signUp = useCallback(async ({ email, password, fullName, phone }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone || null,
        },
      },
    });
    if (error) throw error;

    // The database trigger handle_new_user() creates the profile automatically.
    // This client-side insert is a fallback in case the trigger hasn't been set up.
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          full_name: fullName,
          phone: phone || null,
          role: 'worker',
          status: 'pending_approval',
          permissions: {},
        }, { onConflict: 'id', ignoreDuplicates: true });
      if (profileError) {
        // Expected to fail if user has no session yet (email confirmation required).
        // The DB trigger handles this case.
        console.warn('[Auth] Client-side profile insert skipped (trigger handles it):', profileError.message);
      }
    }
    return data;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setProfile(null);
    setUser(null);
    setSession(null);
  }, []);

  const resetPassword = useCallback(async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      const prof = await fetchProfile(user.id);
      setProfile(prof);
    }
  }, [user, fetchProfile]);

  const value = useMemo(() => ({
    session,
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    refreshProfile,
  }), [session, user, profile, loading, signIn, signUp, signOut, resetPassword, refreshProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
