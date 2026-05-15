import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  Truck,
  UserPlus,
  MoreHorizontal,
  X,
  Settings,
  HelpCircle,
  LogOut,
  ClipboardCheck,
  FileText,
  Shield,
} from 'lucide-react';
import './BottomNav.css';

const MAIN_TABS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/beneficiaries', icon: Users, label: 'Beneficiaries' },
  { to: '/distributions', icon: Truck, label: 'Distributions' },
  { to: '/members', icon: UserPlus, label: 'Members' },
];

export default function BottomNav() {
  const [moreOpen, setMoreOpen] = useState(false);
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const isAdmin = profile?.role === 'admin';

  const handleSignOut = async () => {
    setMoreOpen(false);
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  return (
    <>
      {/* More drawer overlay */}
      {moreOpen && (
        <div className="bottom-nav__overlay" onClick={() => setMoreOpen(false)} />
      )}

      {/* More drawer */}
      {moreOpen && (
        <div className="bottom-nav__drawer">
          <div className="bottom-nav__drawer-header">
            <span className="bottom-nav__drawer-title">More</span>
            <button
              className="bottom-nav__drawer-close"
              onClick={() => setMoreOpen(false)}
              aria-label="Close"
            >
              <X size={20} strokeWidth={1.5} />
            </button>
          </div>
          <nav className="bottom-nav__drawer-links">
            {isAdmin && (
              <>
                <NavLink to="/admin/users" className="bottom-nav__drawer-link" onClick={() => setMoreOpen(false)}>
                  <ClipboardCheck size={20} strokeWidth={1.5} />
                  <span>User Approval</span>
                </NavLink>
                <NavLink to="/admin/audit" className="bottom-nav__drawer-link" onClick={() => setMoreOpen(false)}>
                  <FileText size={20} strokeWidth={1.5} />
                  <span>Audit Logs</span>
                </NavLink>
                <NavLink to="/admin/settings" className="bottom-nav__drawer-link" onClick={() => setMoreOpen(false)}>
                  <Shield size={20} strokeWidth={1.5} />
                  <span>System Settings</span>
                </NavLink>
              </>
            )}
            <NavLink to="/settings" className="bottom-nav__drawer-link" onClick={() => setMoreOpen(false)}>
              <Settings size={20} strokeWidth={1.5} />
              <span>Settings</span>
            </NavLink>
            <NavLink to="/help" className="bottom-nav__drawer-link" onClick={() => setMoreOpen(false)}>
              <HelpCircle size={20} strokeWidth={1.5} />
              <span>Support</span>
            </NavLink>
            <button className="bottom-nav__drawer-link bottom-nav__drawer-link--danger" onClick={handleSignOut}>
              <LogOut size={20} strokeWidth={1.5} />
              <span>Sign Out</span>
            </button>
          </nav>
        </div>
      )}

      {/* Bottom tab bar */}
      <nav className="bottom-nav" aria-label="Main navigation">
        {MAIN_TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `bottom-nav__tab ${isActive ? 'bottom-nav__tab--active' : ''}`
            }
          >
            <tab.icon size={22} strokeWidth={1.5} />
            <span className="bottom-nav__label">{tab.label}</span>
          </NavLink>
        ))}
        <button
          className={`bottom-nav__tab ${moreOpen ? 'bottom-nav__tab--active' : ''}`}
          onClick={() => setMoreOpen((prev) => !prev)}
          aria-label="More options"
        >
          <MoreHorizontal size={22} strokeWidth={1.5} />
          <span className="bottom-nav__label">More</span>
        </button>
      </nav>
    </>
  );
}
