import { useAuth } from '../contexts/AuthContext';
import {
  Users,
  Truck,
  UserPlus,
  AlertTriangle,
  Activity,
  TrendingUp,
  Clock,
  Shield,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import './Dashboard.css';

// Placeholder data — will be replaced with real Supabase queries in Phase 2
const STATS = [
  {
    label: 'Total Beneficiaries',
    value: '2,847',
    change: '+12%',
    icon: Users,
    trend: 'up',
  },
  {
    label: 'Active Distributions',
    value: '3',
    change: 'Ongoing',
    icon: Truck,
    trend: 'neutral',
  },
  {
    label: 'Members Registered',
    value: '412',
    change: '+5',
    icon: UserPlus,
    trend: 'up',
  },
  {
    label: 'Duplicate Flags',
    value: '7',
    change: 'This week',
    icon: AlertTriangle,
    trend: 'warning',
  },
];

const RECENT_ACTIVITY = [
  {
    id: 1,
    text: 'Worker ADV-004 registered new beneficiary',
    meta: '2 minutes ago · Sector 7',
    type: 'info',
  },
  {
    id: 2,
    text: 'Manager approved Hub Delta report',
    meta: '14 minutes ago',
    type: 'success',
  },
  {
    id: 3,
    text: 'System flagged duplicate: ID-90321',
    meta: '45 minutes ago · Hub Gamma',
    type: 'warning',
  },
  {
    id: 4,
    text: 'Worker ADV-002 initiated distribution',
    meta: '1 hour ago · Sector 4',
    type: 'info',
  },
  {
    id: 5,
    text: 'New user registration pending approval',
    meta: '2 hours ago',
    type: 'pending',
  },
];

const FRAUD_TOGGLES = [
  {
    id: 'beneficiary-reg',
    label: 'Beneficiary Registration',
    description: 'Prevent new entries during audits',
    enabled: true,
  },
  {
    id: 'distribution-marking',
    label: 'Distribution Marking',
    description: 'Lock distribution status globally',
    enabled: true,
  },
  {
    id: 'mobile-access',
    label: 'Mobile Agent Access',
    description: 'Force agent logouts on suspect activity',
    enabled: false,
  },
];

export default function Dashboard() {
  const { profile } = useAuth();

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard__header">
        <div>
          <h2 className="dashboard__greeting">
            Welcome back, {profile?.full_name?.split(' ')[0] || 'User'}
          </h2>
          <p className="dashboard__subheading">
            Operational status for distribution network and field ops.
          </p>
        </div>
        {profile?.role === 'admin' && (
          <div className="dashboard__alert">
            <AlertTriangle size={16} strokeWidth={1.5} />
            <span>Duplicate ID detected: HUB-DELTA</span>
          </div>
        )}
      </div>

      {/* Stats Grid — Bento layout */}
      <div className="dashboard__stats">
        {STATS.map((stat) => (
          <div className="stat-card" key={stat.label}>
            <div className="stat-card__icon-wrap">
              <stat.icon size={20} strokeWidth={1.5} />
            </div>
            <div className="stat-card__content">
              <span className="stat-card__value">{stat.value}</span>
              <span className="stat-card__label">{stat.label}</span>
            </div>
            <span
              className={`stat-card__change stat-card__change--${stat.trend}`}
            >
              {stat.trend === 'up' && <TrendingUp size={12} strokeWidth={2} />}
              {stat.change}
            </span>
          </div>
        ))}
      </div>

      {/* Main Grid — Asymmetric bento */}
      <div className="dashboard__grid">
        {/* Distribution Matrix placeholder */}
        <div className="dashboard__panel dashboard__panel--wide">
          <div className="dashboard__panel-header">
            <Activity size={18} strokeWidth={1.5} />
            <h3>Live Distribution Matrix</h3>
          </div>
          <div className="dashboard__matrix">
            {['Sector A', 'Sector B', 'Sector C', 'Sector D', 'Hub Alpha', 'Hub Beta', 'Hub Gamma', 'Hub Delta'].map(
              (sector, i) => (
                <div
                  className={`matrix-cell matrix-cell--${
                    i < 3 ? 'active' : i === 7 ? 'alert' : 'idle'
                  }`}
                  key={sector}
                >
                  <span className="matrix-cell__name">{sector}</span>
                  <span className="matrix-cell__status">
                    {i < 3 ? 'Distributing' : i === 7 ? 'Flagged' : 'Idle'}
                  </span>
                </div>
              )
            )}
          </div>
        </div>

        {/* Fraud Prevention — Admin only */}
        {profile?.role === 'admin' && (
          <div className="dashboard__panel">
            <div className="dashboard__panel-header">
              <Shield size={18} strokeWidth={1.5} />
              <h3>Fraud Prevention Toggles</h3>
            </div>
            <div className="dashboard__toggles">
              {FRAUD_TOGGLES.map((toggle) => (
                <div className="toggle-row" key={toggle.id}>
                  <div className="toggle-row__info">
                    <span className="toggle-row__label">{toggle.label}</span>
                    <span className="toggle-row__desc">{toggle.description}</span>
                  </div>
                  <button className="toggle-row__switch" aria-label={`Toggle ${toggle.label}`}>
                    {toggle.enabled ? (
                      <ToggleRight size={28} className="toggle-row__on" />
                    ) : (
                      <ToggleLeft size={28} className="toggle-row__off" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activity Feed */}
        <div className="dashboard__panel">
          <div className="dashboard__panel-header">
            <Clock size={18} strokeWidth={1.5} />
            <h3>Real-time Activity</h3>
          </div>
          <div className="dashboard__activity">
            {RECENT_ACTIVITY.map((item) => (
              <div className="activity-item" key={item.id}>
                <span className={`activity-item__dot activity-item__dot--${item.type}`} />
                <div className="activity-item__content">
                  <span className="activity-item__text">{item.text}</span>
                  <span className="activity-item__meta">{item.meta}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
