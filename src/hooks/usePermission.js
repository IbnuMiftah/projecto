import { useAuth } from '../contexts/AuthContext';
import { useFeatureToggle } from '../contexts/FeatureToggleContext';

/**
 * Combined permission check: feature toggle + user-level permission.
 *
 * Returns `false` if:
 *   - The global feature toggle is OFF (admin bypassed inside useFeatureToggle)
 *   - The user's `profile.permissions[key]` is explicitly `false`
 *
 * Returns `true` if:
 *   - User is admin (always)
 *   - Toggle is ON and permission is `true` or absent (backwards-compat: {} = all granted)
 *
 * @param {string} key - Permission key (e.g., 'distribute_aid')
 * @returns {boolean}
 */
export function usePermission(key) {
  const { profile } = useAuth();
  const featureEnabled = useFeatureToggle(key);

  // Admin always has full access
  if (profile?.role === 'admin') return true;

  // Global toggle is OFF → blocked for everyone except admin
  if (!featureEnabled) return false;

  // Check user-level permission (missing key = granted for backwards-compat)
  const permissions = profile?.permissions || {};
  if (key in permissions) {
    return permissions[key] !== false;
  }

  // Key not in permissions → granted (backwards-compat with empty {})
  return true;
}
