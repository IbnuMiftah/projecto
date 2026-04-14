import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  Users, Truck, UserPlus, AlertTriangle, Activity,
  TrendingUp, TrendingDown, Clock, Shield,
  ToggleLeft, ToggleRight, CreditCard, Package,
} from 'lucide-react';
import './Dashboard.css';

export default function Dashboard() {
  const { profile } = useAuth();

  /* ── Live stats ── */
  const [stats, setStats] = useState({
    beneficiaries: 0, members: 0, activeCampaigns: 0,
    overdue: 0, distributed: 0, paymentsCollected: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  /* ── Recent activity ── */
  const [recentActivity, setRecentActivity] = useState([]);

  /* ── Campaign progress ── */
  const [campaignProgress, setCampaignProgress] = useState([]);

  /* ── Toggles (local state for now) ── */
  const [toggles, setToggles] = useState({
    'beneficiary-reg': true,
    'distribution-marking': true,
    'mobile-access': false,
  });

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    const [
      { count: benefCount },
      { count: memberCount },
      { count: activeCampCount },
      { count: overdueCount },
      { count: distCount },
      { count: paymentCount },
    ] = await Promise.all([
      supabase.from('beneficiaries').select('*', { count: 'exact', head: true }),
      supabase.from('members').select('*', { count: 'exact', head: true }),
      supabase.from('campaigns').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('members').select('*', { count: 'exact', head: true }).eq('payment_status', 'overdue'),
      supabase.from('distributions').select('*', { count: 'exact', head: true }),
      supabase.from('payment_logs').select('*', { count: 'exact', head: true }),
    ]);

    setStats({
      beneficiaries: benefCount || 0,
      members: memberCount || 0,
      activeCampaigns: activeCampCount || 0,
      overdue: overdueCount || 0,
      distributed: distCount || 0,
      paymentsCollected: paymentCount || 0,
    });
    setLoadingStats(false);
  }, []);

  const fetchActivity = useCallback(async () => {
    // Merge distributions + payment_logs as recent activity
    const [{ data: dists }, { data: payments }] = await Promise.all([
      supabase.from('distributions').select('id, beneficiary_name, distributed_by_name, distributed_at, campaign_id')
        .order('distributed_at', { ascending: false }).limit(5),
      supabase.from('payment_logs').select('id, member_name, collected_by_name, amount, payment_method, created_at')
        .order('created_at', { ascending: false }).limit(5),
    ]);

    const merged = [
      ...(dists || []).map(d => ({
        id: `dist-${d.id}`,
        text: `Aid distributed to ${d.beneficiary_name}`,
        meta: `by ${d.distributed_by_name || 'System'}`,
        time: d.distributed_at,
        type: 'success',
      })),
      ...(payments || []).map(p => ({
        id: `pay-${p.id}`,
        text: `ETB ${parseFloat(p.amount).toLocaleString()} collected from ${p.member_name}`,
        meta: `${p.payment_method?.toUpperCase()} · by ${p.collected_by_name || 'System'}`,
        time: p.created_at,
        type: 'info',
      })),
    ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 8);

    setRecentActivity(merged);
  }, []);

  const fetchCampaignProgress = useCallback(async () => {
    const { data: campaigns } = await supabase
      .from('campaigns').select('id, name, aid_type, status')
      .in('status', ['active', 'paused']);
    if (!campaigns || campaigns.length === 0) { setCampaignProgress([]); return; }

    const { data: dists } = await supabase
      .from('distributions').select('campaign_id');

    const { count: totalBenef } = await supabase
      .from('beneficiaries').select('*', { count: 'exact', head: true });

    const distCounts = {};
    (dists || []).forEach(d => { distCounts[d.campaign_id] = (distCounts[d.campaign_id] || 0) + 1; });

    setCampaignProgress(campaigns.map(c => ({
      ...c,
      distributed: distCounts[c.id] || 0,
      total: totalBenef || 0,
    })));
  }, []);

  useEffect(() => {
    fetchStats();
    fetchActivity();
    fetchCampaignProgress();
  }, [fetchStats, fetchActivity, fetchCampaignProgress]);

  const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const toggleSwitch = (id) => {
    setToggles(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const STAT_CARDS = [
    { label: 'Total Beneficiaries', value: stats.beneficiaries, icon: Users, trend: 'up', sub: 'Registered in system' },
    { label: 'Active Campaigns', value: stats.activeCampaigns, icon: Truck, trend: 'neutral', sub: 'Currently distributing' },
    { label: 'Members', value: stats.members, icon: UserPlus, trend: 'up', sub: 'Registered members' },
    { label: 'Overdue Payments', value: stats.overdue, icon: AlertTriangle, trend: stats.overdue > 0 ? 'warning' : 'up', sub: stats.overdue > 0 ? 'Require follow-up' : 'All clear' },
  ];

  const FRAUD_TOGGLES = [
    { id: 'beneficiary-reg', label: 'Beneficiary Registration', description: 'Prevent new entries during audits' },
    { id: 'distribution-marking', label: 'Distribution Marking', description: 'Lock distribution status globally' },
    { id: 'mobile-access', label: 'Mobile Agent Access', description: 'Force agent logouts on suspect activity' },
  ];

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard__header">
        <div>
          <h2 className="dashboard__greeting">
            Welcome back, {profile?.full_name?.split(' ')[0] || 'User'}
          </h2>
          <p className="dashboard__subheading">
            Operational overview for A.M.A.N.A.H distribution network.
          </p>
        </div>
        {stats.overdue > 0 && profile?.role === 'admin' && (
          <div className="dashboard__alert">
            <AlertTriangle size={16} strokeWidth={1.5} />
            <span>{stats.overdue} overdue payment{stats.overdue !== 1 ? 's' : ''} require attention</span>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="dashboard__stats">
        {STAT_CARDS.map((stat) => (
          <div className="stat-card" key={stat.label}>
            <div className="stat-card__icon-wrap">
              <stat.icon size={20} strokeWidth={1.5} />
            </div>
            <div className="stat-card__content">
              <span className="stat-card__value">
                {loadingStats ? '—' : stat.value.toLocaleString()}
              </span>
              <span className="stat-card__label">{stat.label}</span>
            </div>
            <span className={`stat-card__change stat-card__change--${stat.trend}`}>
              {stat.trend === 'up' && <TrendingUp size={12} strokeWidth={2} />}
              {stat.trend === 'warning' && <TrendingDown size={12} strokeWidth={2} />}
              {stat.sub}
            </span>
          </div>
        ))}
      </div>

      {/* Summary row */}
      <div className="dashboard__summary-row">
        <div className="dashboard__summary-card">
          <Package size={16} strokeWidth={1.5} />
          <span className="dashboard__summary-value">{stats.distributed.toLocaleString()}</span>
          <span className="dashboard__summary-label">Total Distributions</span>
        </div>
        <div className="dashboard__summary-card">
          <CreditCard size={16} strokeWidth={1.5} />
          <span className="dashboard__summary-value">{stats.paymentsCollected.toLocaleString()}</span>
          <span className="dashboard__summary-label">Payments Collected</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="dashboard__grid">
        {/* Campaign Progress */}
        <div className="dashboard__panel dashboard__panel--wide">
          <div className="dashboard__panel-header">
            <Activity size={18} strokeWidth={1.5} />
            <h3>Campaign Distribution Progress</h3>
          </div>
          {campaignProgress.length === 0 ? (
            <div className="dashboard__matrix" style={{ justifyContent: 'center', padding: 'var(--space-8)', color: 'var(--outline)' }}>
              No active campaigns. Create one from the Distributions page.
            </div>
          ) : (
            <div className="dashboard__matrix">
              {campaignProgress.map(c => {
                const pct = c.total > 0 ? Math.round((c.distributed / c.total) * 100) : 0;
                return (
                  <div className={`matrix-cell matrix-cell--${c.status === 'active' ? 'active' : 'idle'}`} key={c.id}>
                    <span className="matrix-cell__name">{c.name}</span>
                    <span className="matrix-cell__status">
                      {c.distributed}/{c.total} ({pct}%)
                    </span>
                    <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: c.status === 'active' ? 'var(--success)' : 'var(--warning)', borderRadius: 2, transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
                  <button className="toggle-row__switch" aria-label={`Toggle ${toggle.label}`} onClick={() => toggleSwitch(toggle.id)}>
                    {toggles[toggle.id] ? (
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
            <h3>Recent Activity</h3>
          </div>
          <div className="dashboard__activity">
            {recentActivity.length === 0 ? (
              <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--outline)', fontSize: 'var(--font-size-sm)' }}>
                No recent activity yet.
              </div>
            ) : (
              recentActivity.map((item) => (
                <div className="activity-item" key={item.id}>
                  <span className={`activity-item__dot activity-item__dot--${item.type}`} />
                  <div className="activity-item__content">
                    <span className="activity-item__text">{item.text}</span>
                    <span className="activity-item__meta">{item.meta} · {timeAgo(item.time)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
