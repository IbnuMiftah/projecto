import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { usePermission } from '../hooks/usePermission';
import {
  Search, Plus, Pencil, Trash2, Loader2, X,
  AlertCircle, Users as UsersIcon, CreditCard, DollarSign, ShieldAlert,
} from 'lucide-react';
import '../styles/data-pages.css';
import Pagination from '../components/Pagination';

const PLANS = ['weekly', 'monthly', 'yearly'];
const PAYMENT_STATUSES = ['pending', 'paid', 'overdue', 'exempt'];
const PAGE_SIZE = 10;

const EMPTY_FORM = {
  full_name: '', fayda_id: '', email: '', phone: '', address: '',
  membership_plan: 'monthly', payment_status: 'pending',
  payment_amount: '', notes: '',
};



export default function Members() {
  const { user, profile } = useAuth();
  const canCollect = usePermission('collect_payments');
  const canEdit = usePermission('edit_records');
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Quick Payment
  const [qpMember, setQpMember] = useState(null); // selected member object
  const [qpSearch, setQpSearch] = useState('');
  const [qpDropdownOpen, setQpDropdownOpen] = useState(false);
  const [qpAmount, setQpAmount] = useState('');
  const [qpDate, setQpDate] = useState(new Date().toISOString().split('T')[0]);
  const [qpMethod, setQpMethod] = useState('cash');
  const [qpSaving, setQpSaving] = useState(false);
  const [qpError, setQpError] = useState('');
  const [qpSuccess, setQpSuccess] = useState('');

  // Recent collection activity
  const [recentLogs, setRecentLogs] = useState([]);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('members').select('*').order('created_at', { ascending: false });
      if (filter !== 'all') query = query.eq('payment_status', filter);
      const { data, error: fetchErr } = await query;
      if (fetchErr) throw fetchErr;
      setMembers(data || []);
    } catch (err) {
      console.error('Fetch members error:', err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const fetchRecentLogs = useCallback(async () => {
    const { data, error: logErr } = await supabase
      .from('payment_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    if (logErr) {
      console.error('Fetch logs error:', logErr.message);
      return;
    }
    setRecentLogs(data || []);
  }, []);

  useEffect(() => { fetchMembers(); fetchRecentLogs(); }, [fetchMembers, fetchRecentLogs]);

  // Search + filter
  const filtered = useMemo(() => {
    if (!search) return members;
    const q = search.toLowerCase();
    return members.filter((m) =>
      m.full_name?.toLowerCase().includes(q) ||
      m.fayda_id?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.phone?.includes(q)
    );
  }, [members, search]);

  // Stats
  const stats = useMemo(() => {
    const total = members.length;
    const paid = members.filter(m => m.payment_status === 'paid').length;
    const overdue = members.filter(m => m.payment_status === 'overdue');
    const overdueAmount = overdue.reduce((sum, m) => sum + (parseFloat(m.payment_amount) || 0), 0);
    return { total, paid, overdueCount: overdue.length, overdueAmount };
  }, [members]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  useEffect(() => { setCurrentPage(1); }, [search, filter]);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setError(''); setShowModal(true); };

  const openEdit = (member) => {
    setEditing(member);
    setForm({
      full_name: member.full_name || '',
      fayda_id: member.fayda_id || '',
      email: member.email || '',
      phone: member.phone || '',
      address: member.address || '',
      membership_plan: member.membership_plan || 'monthly',
      payment_status: member.payment_status || 'pending',
      payment_amount: member.payment_amount || '',
      notes: member.notes || '',
    });
    setError('');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.full_name.trim()) { setError('Full name is required.'); return; }

    setSaving(true);
    try {
      const payload = {
        ...form,
        fayda_id: form.fayda_id.trim() || null,
        payment_amount: form.payment_amount ? parseFloat(form.payment_amount) : 0,
        updated_at: new Date().toISOString(),
      };
      if (editing) {
        const { error: updateErr } = await supabase.from('members').update(payload).eq('id', editing.id);
        if (updateErr) throw updateErr;
      } else {
        payload.registered_by = user?.id;
        const { error: insertErr } = await supabase.from('members').insert(payload);
        if (insertErr) throw insertErr;
      }
      setShowModal(false);
      await fetchMembers();
    } catch (err) {
      setError(err.message || 'Failed to save member.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;
    try {
      await supabase.from('members').delete().eq('id', id);
      await fetchMembers();
    } catch (err) { console.error('Delete error:', err); }
  };

  // Filtered member list for quick payment search
  const qpFilteredMembers = useMemo(() => {
    if (!qpSearch) return members;
    const q = qpSearch.toLowerCase();
    return members.filter(m =>
      m.full_name?.toLowerCase().includes(q) ||
      m.fayda_id?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.phone?.includes(q)
    );
  }, [members, qpSearch]);

  const selectQpMember = (member) => {
    setQpMember(member);
    setQpSearch(member.full_name + (member.fayda_id ? ` (${member.fayda_id})` : ''));
    setQpDropdownOpen(false);
  };

  const handleQuickPayment = async (e) => {
    e.preventDefault();
    if (!qpMember || !qpAmount) return;
    setQpSaving(true);
    setQpError('');
    setQpSuccess('');

    const amountNum = parseFloat(qpAmount);
    const collectorName = profile?.full_name || user?.email || 'Admin';

    // 1. Log payment into payment_logs
    const { error: logErr } = await supabase.from('payment_logs').insert({
      member_id: qpMember.id,
      member_name: qpMember.full_name,
      amount: amountNum,
      payment_method: qpMethod,
      collected_by: user?.id,
      collected_by_name: collectorName,
    });

    if (logErr) {
      console.error('Payment log insert error:', logErr);
      setQpError(`Failed to log payment: ${logErr.message}`);
      setQpSaving(false);
      return;
    }

    // 2. Update member's payment status, last payment date, and amount
    const { error: updateErr } = await supabase.from('members').update({
      payment_status: 'paid',
      last_payment_date: qpDate,
      payment_method: qpMethod,
      payment_amount: amountNum,
      updated_at: new Date().toISOString(),
    }).eq('id', qpMember.id);

    if (updateErr) {
      console.error('Member update error:', updateErr);
      setQpError(`Payment logged but failed to update member: ${updateErr.message}`);
      setQpSaving(false);
      return;
    }

    // 3. Success — reset form and refresh data
    setQpSuccess(`ETB ${amountNum.toLocaleString()} collected from ${qpMember.full_name}`);
    setQpMember(null);
    setQpSearch('');
    setQpAmount('');
    setQpDate(new Date().toISOString().split('T')[0]);
    setTimeout(() => setQpSuccess(''), 4000);

    await fetchMembers();
    await fetchRecentLogs();
    setQpSaving(false);
  };

  const update = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} minute${mins > 1 ? 's' : ''} ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
    return `${Math.floor(hrs / 24)} day${Math.floor(hrs / 24) > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="data-page">
      {/* Header */}
      <div className="data-page__header">
        <div className="data-page__header-left">
          <h2>Members</h2>
          <p>Review, register, and manage institutional community members.</p>
        </div>
        <div className="data-page__header-right">
          <button className="btn btn--primary" onClick={openCreate} disabled={!canCollect} title={!canCollect ? 'Member registration disabled by administrator' : undefined}>
            <Plus size={16} strokeWidth={2} /> Register New Member
          </button>
        </div>
      </div>

      {!canCollect && (
        <div className="permission-banner">
          <ShieldAlert size={16} className="permission-banner__icon" />
          Member registration and payments have been disabled by your administrator.
        </div>
      )}
      {!canEdit && (
        <div className="permission-banner">
          <ShieldAlert size={16} className="permission-banner__icon" />
          Record editing has been disabled by your administrator.
        </div>
      )}

      {/* Stats */}
      <div className="data-page__stats" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="data-stat-card">
          <span className="data-stat-card__label">Total Members</span>
          <span className="data-stat-card__value">{stats.total.toLocaleString()}</span>
          <span className="data-stat-card__sub data-stat-card__sub--success">Active records in database</span>
        </div>
        <div className="data-stat-card">
          <span className="data-stat-card__label">Overdue Payments</span>
          <span className="data-stat-card__value">{stats.overdueCount}</span>
          <span className="data-stat-card__sub data-stat-card__sub--error">{stats.overdueAmount > 0 ? `ETB ${stats.overdueAmount.toLocaleString()} outstanding` : 'Action required'}</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="data-page__toolbar">
        <div className="data-page__search">
          <Search size={16} className="data-page__search-icon" />
          <input className="data-page__search-input" placeholder="Search by name, FAYDA ID, email, or phone…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="data-page__filter">
          {['all', ...PAYMENT_STATUSES].map((s) => (
            <button key={s} className={`data-page__filter-btn ${filter === s ? 'data-page__filter-btn--active' : ''}`} onClick={() => setFilter(s)}>
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <span className="data-page__count">Showing {paginatedData.length} of {filtered.length}</span>
      </div>

      {/* Main layout: table + sidebar */}
      <div className="data-page__main-layout">
        <div className="data-page__main-content">
          {loading ? (
            <div className="data-page__loading"><Loader2 size={20} className="animate-spin" /><span>Loading members…</span></div>
          ) : filtered.length === 0 ? (
            <div className="data-page__empty">
              <div className="data-page__empty-icon"><UsersIcon size={28} strokeWidth={1.5} /></div>
              <h3>{search ? 'No results found' : 'No members yet'}</h3>
              <p>{search ? 'Try a different search term.' : 'Register your first member to get started.'}</p>
              {!search && <button className="btn btn--primary" onClick={openCreate} disabled={!canCollect} title={!canCollect ? 'Member registration disabled by administrator' : undefined}><Plus size={16} /> Register New Member</button>}
            </div>
          ) : (
            <>
              <div className="data-table" style={{ overflowX: 'auto' }}>
                <div className="data-table__head" style={{ gridTemplateColumns: '1.5fr 0.8fr 0.7fr 0.7fr 0.7fr 80px' }}>
                  <span>Member Name</span>
                  <span>FAYDA ID</span>
                  <span>Plan Type</span>
                  <span>Last Payment</span>
                  <span>Status</span>
                  <span />
                </div>
                <div className="data-table__body">
                  {paginatedData.map((m) => (
                    <div className="data-table__row" key={m.id} style={{ gridTemplateColumns: '1.5fr 0.8fr 0.7fr 0.7fr 0.7fr 80px' }} onClick={() => openEdit(m)}>
                      <div className="data-table__cell data-table__cell--name">
                        <div className="data-table__avatar">{m.full_name?.charAt(0)?.toUpperCase()}</div>
                        <div className="data-table__name-text">
                          <span className="data-table__name-primary">{m.full_name}</span>
                          <span className="data-table__name-secondary">{m.email || m.phone || '—'}</span>
                        </div>
                      </div>
                      <div className="data-table__cell">
                        <span style={{ fontFamily: 'monospace', fontSize: 'var(--font-size-sm)', color: m.fayda_id ? 'var(--on-surface)' : 'var(--outline)' }}>
                          {m.fayda_id || '—'}
                        </span>
                      </div>
                      <div className="data-table__cell">
                        <span className={`category-badge plan-badge--${m.membership_plan}`}>{m.membership_plan?.toUpperCase()}</span>
                      </div>
                      <div className="data-table__cell" style={{ fontSize: 'var(--font-size-sm)' }}>
                        {m.last_payment_date ? (
                          <span style={{ color: m.payment_status === 'overdue' ? 'var(--error)' : 'var(--on-surface)' }}>
                            {new Date(m.last_payment_date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        ) : <span style={{ color: 'var(--outline)' }}>Never</span>}
                      </div>
                      <div className="data-table__cell">
                        <span className={`status-badge status-badge--${m.payment_status}`}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
                          {m.payment_status}
                        </span>
                      </div>
                      <div className="data-table__actions" onClick={(e) => e.stopPropagation()}>
                        <button className="data-table__action-btn" onClick={() => openEdit(m)} disabled={!canEdit} title={!canEdit ? 'Editing disabled by administrator' : 'Edit'}><Pencil size={14} /></button>
                        <button className="data-table__action-btn data-table__action-btn--danger" onClick={() => handleDelete(m.id)} title="Delete"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setCurrentPage} itemLabel="members" />
            </>
          )}
        </div>

        {/* Sidebar: Quick Payment + Recent Activity */}
        <div className="data-page__side-panel">
          <div className="quick-payment">
            <div className="quick-payment__title">
              <CreditCard size={16} strokeWidth={1.5} /> Quick Payment
            </div>
            <form onSubmit={handleQuickPayment}>
              <div className="quick-payment__field" style={{ position: 'relative' }}>
                <label className="quick-payment__field-label">Select Member</label>
                <input
                  className="quick-payment__input"
                  placeholder="Search by name, FAYDA ID…"
                  value={qpSearch}
                  onChange={(e) => { setQpSearch(e.target.value); setQpMember(null); setQpDropdownOpen(true); }}
                  onFocus={() => setQpDropdownOpen(true)}
                />
                {qpDropdownOpen && qpSearch && qpFilteredMembers.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, maxHeight: 180, overflowY: 'auto', background: 'var(--surface-container-high)', borderRadius: 'var(--radius-md)', marginTop: 4, boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
                    {qpFilteredMembers.map(m => (
                      <div
                        key={m.id}
                        onClick={() => selectQpMember(m)}
                        style={{ padding: 'var(--space-3) var(--space-4)', cursor: 'pointer', fontSize: 'var(--font-size-sm)', color: 'var(--on-surface)', transition: 'background 0.15s', borderBottom: '1px solid var(--outline-ghost)' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-container-highest)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ fontWeight: 500 }}>{m.full_name}</div>
                        {m.fayda_id && <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--outline)', fontFamily: 'monospace' }}>{m.fayda_id}</div>}
                      </div>
                    ))}
                  </div>
                )}
                {qpDropdownOpen && qpSearch && qpFilteredMembers.length === 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, padding: 'var(--space-3) var(--space-4)', background: 'var(--surface-container-high)', borderRadius: 'var(--radius-md)', marginTop: 4, fontSize: 'var(--font-size-sm)', color: 'var(--outline)' }}>
                    No members found
                  </div>
                )}
              </div>
              <div className="quick-payment__row" style={{ marginBottom: 'var(--space-4)' }}>
                <div className="quick-payment__field">
                  <label className="quick-payment__field-label">Amount (ETB)</label>
                  <input className="quick-payment__input" type="number" step="0.01" placeholder="0.00" value={qpAmount} onChange={(e) => setQpAmount(e.target.value)} required />
                </div>
                <div className="quick-payment__field">
                  <label className="quick-payment__field-label">Date</label>
                  <input className="quick-payment__input" type="date" value={qpDate} onChange={(e) => setQpDate(e.target.value)} />
                </div>
              </div>
              <div className="quick-payment__field">
                <label className="quick-payment__field-label">Payment Method</label>
              </div>
              <div className="quick-payment__methods">
                {['cash', 'mobile'].map(method => (
                  <button key={method} type="button" className={`quick-payment__method-btn ${qpMethod === method ? 'quick-payment__method-btn--active' : ''}`} onClick={() => setQpMethod(method)}>
                    {method.toUpperCase()}
                  </button>
                ))}
              </div>
              <button type="submit" className="quick-payment__submit" disabled={qpSaving || !qpMember || !qpAmount || !canCollect} title={!canCollect ? 'Payments disabled by administrator' : undefined}>
                {qpSaving ? 'Processing…' : !canCollect ? 'Payments Disabled' : 'Log Payment'}
              </button>
              {qpError && (
                <div style={{ marginTop: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--error-container)', color: 'var(--on-error-container)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-sm)' }}>
                  {qpError}
                </div>
              )}
              {qpSuccess && (
                <div style={{ marginTop: 'var(--space-3)', padding: 'var(--space-3)', background: 'rgba(76, 175, 80, 0.12)', color: 'var(--success)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-sm)' }}>
                  ✓ {qpSuccess}
                </div>
              )}
            </form>
          </div>

          <div className="collection-activity">
            <div className="collection-activity__title">Recent Collection Activity</div>
            {recentLogs.length === 0 ? (
              <div className="collection-activity__empty">No recent payments logged.</div>
            ) : (
              <div className="collection-activity__list">
                {recentLogs.map(log => (
                  <div className="collection-activity__item" key={log.id}>
                    <span className="collection-activity__dot" />
                    <div>
                      <div className="collection-activity__text">
                        ETB {parseFloat(log.amount).toLocaleString()} collected from {log.member_name}
                      </div>
                      <div className="collection-activity__time">
                        {timeAgo(log.created_at)} · {log.payment_method?.toUpperCase()}
                        {log.collected_by_name && <> · by {log.collected_by_name}</>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">{editing ? 'Edit Member' : 'Register New Member'}</h3>
              <button className="modal__close" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            {error && <div className="modal__error"><AlertCircle size={16} /><span>{error}</span></div>}
            <form className="modal__form" onSubmit={handleSave}>
              <div className="modal__field">
                <label className="modal__label">Full Name *</label>
                <input className="modal__input" value={form.full_name} onChange={update('full_name')} required autoFocus />
              </div>
              <div className="modal__row">
                <div className="modal__field">
                  <label className="modal__label">FAYDA ID</label>
                  <input className="modal__input" value={form.fayda_id} onChange={update('fayda_id')} placeholder="National ID (optional)" />
                </div>
                <div className="modal__field">
                  <label className="modal__label">Email</label>
                  <input className="modal__input" type="email" value={form.email} onChange={update('email')} />
                </div>
              </div>
              <div className="modal__row">
                <div className="modal__field">
                  <label className="modal__label">Phone</label>
                  <input className="modal__input" type="tel" value={form.phone} onChange={update('phone')} placeholder="+251 9XX XXX XXXX" />
                </div>
                <div className="modal__field">
                  <label className="modal__label">Address</label>
                  <input className="modal__input" value={form.address} onChange={update('address')} />
                </div>
              </div>
              <div className="modal__row">
                <div className="modal__field">
                  <label className="modal__label">Membership Plan</label>
                  <select className="modal__select" value={form.membership_plan} onChange={update('membership_plan')}>
                    {PLANS.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                  </select>
                </div>
                <div className="modal__field">
                  <label className="modal__label">Payment Status</label>
                  <select className="modal__select" value={form.payment_status} onChange={update('payment_status')}>
                    {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal__field">
                <label className="modal__label">Payment Amount (ETB)</label>
                <input className="modal__input" type="number" step="0.01" value={form.payment_amount} onChange={update('payment_amount')} placeholder="0.00" />
              </div>
              <div className="modal__field">
                <label className="modal__label">Notes</label>
                <textarea className="modal__textarea" value={form.notes} onChange={update('notes')} placeholder="Optional internal notes…" />
              </div>
              <div className="modal__actions">
                <button type="button" className="btn btn--ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn--primary" disabled={saving}>
                  {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : editing ? 'Update Member' : 'Register Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
