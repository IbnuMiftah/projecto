import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Shield, Moon, Sun } from 'lucide-react';
import '../styles/data-pages.css';

export default function Settings() {
  const { profile } = useAuth();
  const [theme, setTheme] = useState(
    () => document.documentElement.getAttribute('data-theme') || 'dark'
  );

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    setTheme(next);
  };


  const roleBadge = profile?.role === 'admin' ? 'active' : profile?.role === 'auditor' ? 'pending' : 'exempt';

  return (
    <div className="data-page">
      <div className="data-page__header">
        <div className="data-page__header-left">
          <h1 className="data-page__title">Settings</h1>
          <p className="data-page__subtitle">Manage your preferences and account details.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 'var(--space-6)', maxWidth: 640 }}>
        {/* Profile Section */}
        <div className="dashboard__panel">
          <div className="dashboard__panel-header">
            <User size={18} strokeWidth={1.5} />
            <h3>Profile</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', padding: 'var(--space-4) 0' }}>
            {profile ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: 'var(--radius-lg)',
                    background: 'linear-gradient(135deg, var(--primary), var(--primary-container))',
                    color: 'var(--on-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)',
                  }}>
                    {profile.full_name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--font-size-md)', color: 'var(--on-surface)' }}>
                      {profile.full_name || 'Unknown User'}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 2 }}>
                      <Mail size={13} /> {profile.email || '—'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                  <span className={`status-badge status-badge--${roleBadge}`}>
                    <Shield size={12} /> {profile.role || 'worker'}
                  </span>
                  {profile.phone && (
                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--outline)' }}>
                      📞 {profile.phone}
                    </span>
                  )}
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <div className="skeleton skeleton--text" style={{ width: '40%', height: 20 }}>&nbsp;</div>
                <div className="skeleton skeleton--text" style={{ width: '60%', height: 16 }}>&nbsp;</div>
              </div>
            )}
          </div>
        </div>

        {/* Appearance */}
        <div className="dashboard__panel">
          <div className="dashboard__panel-header">
            {theme === 'dark' ? <Moon size={18} strokeWidth={1.5} /> : <Sun size={18} strokeWidth={1.5} />}
            <h3>Appearance</h3>
          </div>
          <div style={{ padding: 'var(--space-4) 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--on-surface)' }}>Theme</div>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--on-surface-variant)' }}>
                  Currently using {theme} mode
                </div>
              </div>
              <button className="btn btn--secondary" onClick={toggleTheme} style={{ gap: 'var(--space-2)' }}>
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                Switch to {theme === 'dark' ? 'Light' : 'Dark'}
              </button>
            </div>
          </div>
        </div>


      </div>
    </div>
  );
}
