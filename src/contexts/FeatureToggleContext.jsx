import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const FeatureToggleContext = createContext({
  toggles: {},
  loading: true,
  isFeatureEnabled: () => true,
});

/**
 * Provides global feature toggles from `system_settings` table.
 * Subscribes to Supabase Realtime for instant updates when admin changes a toggle.
 * Admin users always bypass all checks.
 */
export function FeatureToggleProvider({ children }) {
  const { profile } = useAuth();
  const [toggles, setToggles] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchToggles = useCallback(async () => {
    const { data, error } = await supabase
      .from('system_settings')
      .select('key, value');

    if (error) {
      console.error('[FeatureToggle] Fetch error:', error.message);
      // Default to all enabled on error (safe fallback)
      setLoading(false);
      return;
    }

    const map = {};
    for (const row of data || []) {
      map[row.key] = row.value?.enabled !== false; // missing or true → enabled
    }
    setToggles(map);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchToggles();
  }, [fetchToggles]);

  useEffect(() => {
    const channel = supabase
      .channel('system_settings_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'system_settings' },
        (payload) => {
          if (payload.new) {
            setToggles(prev => ({
              ...prev,
              [payload.new.key]: payload.new.value?.enabled !== false,
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  /**
   * Check if a feature toggle is enabled globally.
   * Returns true if toggle is ON or doesn't exist (safe default).
   */
  const isFeatureEnabled = useCallback((key) => {
    // Admin bypasses all toggles
    if (profile?.role === 'admin') return true;
    // Missing toggle = enabled (backwards-compat)
    if (!(key in toggles)) return true;
    return toggles[key];
  }, [toggles, profile?.role]);

  const value = { toggles, loading, isFeatureEnabled };

  return (
    <FeatureToggleContext.Provider value={value}>
      {children}
    </FeatureToggleContext.Provider>
  );
}

/**
 * Hook to check if a specific feature toggle is enabled.
 * @param {string} key - The toggle key (e.g., 'distribute_aid')
 * @returns {boolean}
 */
export function useFeatureToggle(key) {
  const { isFeatureEnabled } = useContext(FeatureToggleContext);
  return isFeatureEnabled(key);
}

export { FeatureToggleContext };
