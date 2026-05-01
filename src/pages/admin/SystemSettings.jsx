import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

import { timeAgo } from '../../lib/utils';
import {
  Loader2, AlertCircle,
  Users, Truck, Pencil, CreditCard, FolderPlus,
} from 'lucide-react';
import './SystemSettings.css';

/** Toggle definitions with NGO-specific descriptions */
const FEATURE_TOGGLES = [
  {
    key: 'register_beneficiary',
    label: 'Register Beneficiary',
    desc: 'When OFF, workers cannot add new beneficiaries. Use during audit periods to freeze the registry.',
    icon: Users,
  },
  {
    key: 'distribute_aid',
    label: 'Distribute Aid',
    desc: 'When OFF, no worker can mark aid as received. Use to pause all distributions immediately.',
    icon: Truck,
  },
  {
    key: 'edit_records',
    label: 'Edit Records',
    desc: 'When OFF, workers cannot edit existing beneficiary or member records.',
    icon: Pencil,
  },
  {
    key: 'collect_payments',
    label: 'Collect Payments',
    desc: 'When OFF, workers cannot record member payments or register new members.',
    icon: CreditCard,
  },
  {
    key: 'manage_campaigns',
    label: 'Manage Campaigns',
    desc: 'When OFF, workers cannot create or edit campaigns. Only admins can.',
    icon: FolderPlus,
  },
];

export default function SystemSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null); // key being saved
  const [error, setError] = useState('');

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError('');
    const { data, error: err } = await supabase
      .from('system_settings')
      .select('*')
      .order('key');

    if (err) {
      setError('Failed to load settings.');
    } else {
      setSettings(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const toggleFeature = async (key, currentEnabled) => {
    setSaving(key);
    setError('');

    const newEnabled = !currentEnabled;

    // Optimistic UI: update local state immediately
    setSettings(prev =>
      prev.map(s => s.key === key
        ? { ...s, value: { enabled: newEnabled }, updated_at: new Date().toISOString() }
        : s
      )
    );

    const { error: err } = await supabase
      .from('system_settings')
      .update({
        value: { enabled: newEnabled },
        updated_at: new Date().toISOString(),
        updated_by: user?.id,
      })
      .eq('key', key);

    if (err) {
      // Revert on error
      setSettings(prev =>
        prev.map(s => s.key === key
          ? { ...s, value: { enabled: currentEnabled } }
          : s
        )
      );
      setError(`Failed to update "${key}". Please try again.`);
    }

    setSaving(null);
  };

  if (loading) {
    return (
      <div className="system-settings">
        <div className="system-settings__loading">
          <Loader2 size={24} className="animate-spin" />
          <span>Loading settings…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="system-settings">
      <div className="system-settings__header">
        <h2 className="system-settings__title">System Settings</h2>
        <p className="system-settings__subtitle">
          Control which actions workers can perform across the system.
        </p>
      </div>

      {error && (
        <div className="system-settings__error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Feature Toggles */}
      <div className="system-settings__section">
        <h3 className="system-settings__section-title">Feature Toggles</h3>
        {FEATURE_TOGGLES.map(toggle => {
          const setting = settings.find(s => s.key === toggle.key);
          const enabled = setting?.value?.enabled !== false;
          const isSaving = saving === toggle.key;
          const Icon = toggle.icon;

          return (
            <div className="toggle-card" key={toggle.key}>
              <div className="toggle-card__info">
                <span className="toggle-card__label">
                  <Icon size={16} style={{ marginRight: 8, verticalAlign: 'middle', opacity: 0.7 }} />
                  {toggle.label}
                </span>
                <span className="toggle-card__desc">{toggle.desc}</span>
                {setting?.updated_at && (
                  <span className="toggle-card__meta">
                    Last changed {timeAgo(setting.updated_at)}
                  </span>
                )}
              </div>
              <button
                type="button"
                className={`toggle-switch ${enabled ? 'toggle-switch--on' : ''} ${isSaving ? 'toggle-switch--saving' : ''}`}
                onClick={() => toggleFeature(toggle.key, enabled)}
                disabled={isSaving}
                aria-label={`${toggle.label}: ${enabled ? 'Enabled' : 'Disabled'}`}
              >
                <div className="toggle-switch__track" />
                <div className="toggle-switch__thumb" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
