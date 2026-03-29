import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  Truck,
  UserPlus,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  Shield,
  FileText,
  ClipboardCheck,
  Menu,
} from 'lucide-react';
import './Sidebar.css';

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ],
  },
  {
    label: 'Management',
    items: [
      { to: '/beneficiaries', icon: Users, label: 'Beneficiaries' },
      { to: '/distributions', icon: Truck, label: 'Distributions' },
      { to: '/members', icon: UserPlus, label: 'Members' },
    ],
  },
  {
    label: 'Administration',
    requiredRole: 'admin',
    items: [
      { to: '/admin/users', icon: ClipboardCheck, label: 'User Approval' },
      { to: '/admin/audit', icon: FileText, label: 'Audit Logs' },
      { to: '/admin/settings', icon: Shield, label: 'System Settings' },
    ],
  },
];

const BOTTOM_ITEMS = [
  { to: '/settings', icon: Settings, label: 'Settings' },
  { to: '/help', icon: HelpCircle, label: 'Support' },
];

export default function Sidebar({ collapsed, onToggle }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setSigningOut(false);
    }
  };

  const userRole = profile?.role || 'worker';

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
      {/* Brand */}
      <div className="sidebar__brand">
        <div className="sidebar__logo">
          <Shield size={24} strokeWidth={1.5} />
        </div>
        {!collapsed && (
          <div className="sidebar__brand-text">
            <span className="sidebar__brand-name">A.M.A.N.A.H</span>
            <span className="sidebar__brand-tagline">Networked Aid Hub</span>
          </div>
        )}
        <button
          className="sidebar__toggle"
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <Menu size={18} strokeWidth={1.5} /> : <ChevronLeft size={18} strokeWidth={1.5} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="sidebar__nav">
        {NAV_SECTIONS.map((section) => {
          if (section.requiredRole && userRole !== section.requiredRole && userRole !== 'admin') {
            return null;
          }
          return (
            <div className="sidebar__section" key={section.label}>
              {!collapsed && (
                <span className="sidebar__section-label">{section.label}</span>
              )}
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
                  }
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon size={20} strokeWidth={1.5} />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="sidebar__bottom">
        {BOTTOM_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
            }
            title={collapsed ? item.label : undefined}
          >
            <item.icon size={20} strokeWidth={1.5} />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
        <button
          className="sidebar__link sidebar__link--danger"
          onClick={handleSignOut}
          disabled={signingOut}
          title={collapsed ? 'Sign Out' : undefined}
        >
          <LogOut size={20} strokeWidth={1.5} />
          {!collapsed && <span>{signingOut ? 'Signing out…' : 'Sign Out'}</span>}
        </button>
      </div>
    </aside>
  );
}
