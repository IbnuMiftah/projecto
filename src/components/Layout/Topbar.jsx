import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Menu, Bell, Search, Sun, Moon, Monitor } from 'lucide-react';
import './Topbar.css';

const THEME_META = {
  system: { icon: Monitor, label: 'System theme' },
  light:  { icon: Sun,     label: 'Light theme' },
  dark:   { icon: Moon,    label: 'Dark theme' },
};

export default function Topbar({ pageTitle, onMenuClick }) {
  const { profile } = useAuth();
  const { mode, toggleTheme } = useTheme();
  const { icon: ThemeIcon, label: themeLabel } = THEME_META[mode];

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin': return 'topbar__role-badge--admin';
      case 'finance': return 'topbar__role-badge--finance';
      case 'auditor': return 'topbar__role-badge--auditor';
      default: return 'topbar__role-badge--worker';
    }
  };

  return (
    <header className="topbar">
      <div className="topbar__left">
        <button
          className="topbar__menu-btn"
          onClick={onMenuClick}
          aria-label="Toggle menu"
        >
          <Menu size={20} strokeWidth={1.5} />
        </button>
        <h1 className="topbar__title">{pageTitle || 'Dashboard'}</h1>
      </div>

      <div className="topbar__right">
        <button className="topbar__action-btn" aria-label="Search">
          <Search size={18} strokeWidth={1.5} />
        </button>
        <button
          className="topbar__action-btn topbar__theme-btn"
          onClick={toggleTheme}
          aria-label={themeLabel}
          title={themeLabel}
        >
          <ThemeIcon size={18} strokeWidth={1.5} />
        </button>
        <button className="topbar__action-btn" aria-label="Notifications">
          <Bell size={18} strokeWidth={1.5} />
          <span className="topbar__notif-dot" />
        </button>
        <div className="topbar__user">
          <div className="topbar__avatar">
            {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="topbar__user-info">
            <span className="topbar__user-name">{profile?.full_name || 'User'}</span>
            <span className={`topbar__role-badge ${getRoleBadgeClass(profile?.role)}`}>
              {profile?.role || 'worker'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

