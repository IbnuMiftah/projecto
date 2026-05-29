import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { timeAgo } from '../lib/utils';
import {
  Users, Truck, UserPlus, AlertTriangle, Activity,
  TrendingUp, TrendingDown, Clock,
  CreditCard, Package,
} from 'lucide-react';
import './Dashboard.css';

const CACHE_TTL = 60_000; // 60 seconds

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

  /* ── Cache ref ── */
  const cacheRef = useRef({ ts: 0 });

  /**
   * BATCH 1: All counts + recent activity (8 parallel head/limit queries → ~1 round trip)
   */
  const fetchDashboardData = useCallback(async (force = false) => {
    // Return cached data if fresh
    if (!force && Date.now() - cacheRef.current.ts < CACHE_TTL && !loadingStats) return;

    setLoadingStats(true);

    const [
      { count: benefCount },
      { count: memberCount },
      { count: activeCampCount },
      { count: overdueCount },
      { count: distCount },
      { count: paymentCount },
      { data: recentDists },
      { data: recentPayments },
    ] = await Promise.all([
      supabase.from('beneficiaries').select('*', { count: 'exact', head: true }),
      supabase.from('members').select('*', { count: 'exact', head: true }),
      supabase.from('campaigns').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('members').select('*', { count: 'exact', head: true }).eq('payment_status', 'overdue'),
      supabase.from('distributions').select('*', { count: 'exact', head: true }),
      supabase.from('payment_logs').select('*', { count: 'exact', head: true }),
      supabase.from('distributions').select('id, beneficiary_name, distributed_by_name, distributed_at')
        .order('distributed_at', { ascending: false }).limit(5),
      supabase.from('payment_logs').select('id, member_name, collected_by_name, amount, payment_method, created_at')
        .order('created_at', { ascending: false }).limit(5),
    ]);

    setStats({
      beneficiaries: benefCount || 0,
      members: memberCount || 0,
      activeCampaigns: activeCampCount || 0,
      overdue: overdueCount || 0,
      distributed: distCount || 0,
      paymentsCollected: paymentCount || 0,
    });

    // Merge activity feeds
    const merged = [
      ...(recentDists || []).map(d => ({
        id: `dist-${d.id}`,
        text: `Aid distributed to ${d.beneficiary_name}`,
        meta: `by ${d.distributed_by_name || 'System'}`,
        time: d.distributed_at,
        type: 'success',
      })),
      ...(recentPayments || []).map(p => ({
        id: `pay-${p.id}`,
        text: `ETB ${parseFloat(p.amount).toLocaleString()} collected from ${p.member_name}`,
        meta: `${p.payment_method?.toUpperCase()} · by ${p.collected_by_name || 'System'}`,
        time: p.created_at,
        type: 'info',
      })),
    ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5);

    setRecentActivity(merged);
    setLoadingStats(false);
    cacheRef.current.ts = Date.now();
  }, [loadingStats]);

  /**
   * BATCH 2: Campaign progress (1 campaign query + N count queries, N = active/paused campaigns)
   */
  const fetchCampaignProgress = useCallback(async () => {
    const { data: campaigns } = await supabase
      .from('campaigns').select('id, name, aid_type, status')
      .in('status', ['active', 'paused']);
    if (!campaigns || campaigns.length === 0) { setCampaignProgress([]); return; }

    // Get total beneficiaries + per-campaign distribution counts in parallel
    const [{ count: totalBenef }, ...campCounts] = await Promise.all([
      supabase.from('beneficiaries').select('*', { count: 'exact', head: true }),
      ...campaigns.map(c =>
        supabase.from('distributions').select('*', { count: 'exact', head: true }).eq('campaign_id', c.id)
      ),
    ]);

    setCampaignProgress(campaigns.map((c, i) => ({
      ...c,
      distributed: campCounts[i]?.count || 0,
      total: totalBenef || 0,
    })));
  }, []);

  useEffect(() => {
    fetchDashboardData();
    fetchCampaignProgress();
  }, [fetchDashboardData, fetchCampaignProgress]);



  const STAT_CARDS = [
    { label: 'Total Beneficiaries', value: stats.beneficiaries, icon: Users, trend: 'up', sub: 'Registered in system' },
    { label: 'Active Campaigns', value: stats.activeCampaigns, icon: Truck, trend: 'neutral', sub: 'Currently distributing' },
    { label: 'Members', value: stats.members, icon: UserPlus, trend: 'up', sub: 'Registered members' },
    { label: 'Overdue Payments', value: stats.overdue, icon: AlertTriangle, trend: stats.overdue > 0 ? 'warning' : 'up', sub: stats.overdue > 0 ? 'Require follow-up' : 'All clear' },
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
            Operational overview for A.M.A.N.A.H — Automated Membership And Networked Aid Hub.
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
                {loadingStats ? <span className="skeleton skeleton--text" style={{ width: '48px', height: '28px', display: 'inline-block' }}>&nbsp;</span> : stat.value.toLocaleString()}
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
            {profile?.role === 'admin' && recentActivity.length > 0 && (
              <div style={{ padding: 'var(--space-3) var(--space-6)', borderTop: '1px solid var(--outline-ghost)', textAlign: 'center' }}>
                <Link to="/admin/audit" style={{ color: 'var(--primary)', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', textDecoration: 'none' }}>
                  View More Activity →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
