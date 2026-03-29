import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  UserPlus, Search, Plus, Pencil, Trash2, Loader2, X,
  AlertCircle, CreditCard, Users as UsersIcon,
} from 'lucide-react';
import '../styles/data-pages.css';

const PLANS = ['basic', 'standard', 'premium'];
const PAYMENT_STATUSES = ['pending', 'paid', 'overdue', 'exempt'];
const MEMBER_STATUSES = ['active', 'inactive', 'suspended'];

const EMPTY_FORM = {
  full_name: '', email: '', phone: '', address: '',
  membership_plan: 'basic', payment_status: 'pending',
  payment_amount: '', notes: '',
};

export default function Members() {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('members')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error: fetchErr } = await query;
      if (fetchErr) throw fetchErr;
      setMembers(data || []);
    } catch (err) {
      console.error('Fetch members error:', err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const filtered = members.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      m.full_name?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.phone?.includes(q)
    );
  });

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowModal(true);
  };

  const openEdit = (member) => {
    setEditing(member);
    setForm({
      full_name: member.full_name || '',
      email: member.email || '',
      phone: member.phone || '',
      address: member.address || '',
      membership_plan: member.membership_plan || 'basic',
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

    if (!form.full_name.trim()) {
      setError('Full name is required.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        payment_amount: form.payment_amount ? parseFloat(form.payment_amount) : 0,
        updated_at: new Date().toISOString(),
      };

      if (editing) {
        const { error: updateErr } = await supabase
          .from('members')
          .update(payload)
          .eq('id', editing.id);
        if (updateErr) throw updateErr;
      } else {
        payload.registered_by = user?.id;
        const { error: insertErr } = await supabase
          .from('members')
          .insert(payload);
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
      const { error: delErr } = await supabase.from('members').delete().eq('id', id);
      if (delErr) throw delErr;
      await fetchMembers();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const update = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="data-page">
      {/* Header */}
      <div className="data-page__header">
        <div className="data-page__header-left">
          <h2>Members</h2>
          <p>Manage organizational members, plans, and payment records.</p>
        </div>
        <div className="data-page__header-right">
          <button className="btn btn--primary" onClick={openCreate}>
            <Plus size={16} strokeWidth={2} />
            Add Member
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="data-page__toolbar">
        <div className="data-page__search">
          <Search size={16} className="data-page__search-icon" />
          <input
            className="data-page__search-input"
            placeholder="Search by name, email, or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="data-page__filter">
          {['all', ...MEMBER_STATUSES].map((s) => (
            <button
              key={s}
              className={`data-page__filter-btn ${filter === s ? 'data-page__filter-btn--active' : ''}`}
              onClick={() => setFilter(s)}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <span className="data-page__count">{filtered.length} members</span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="data-page__loading">
          <Loader2 size={20} className="animate-spin" />
          <span>Loading members…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="data-page__empty">
          <div className="data-page__empty-icon">
            <UsersIcon size={28} strokeWidth={1.5} />
          </div>
          <h3>{search ? 'No results found' : 'No members yet'}</h3>
          <p>{search ? 'Try a different search term.' : 'Add your first member to get started.'}</p>
          {!search && (
            <button className="btn btn--primary" onClick={openCreate}>
              <Plus size={16} /> Add Member
            </button>
          )}
        </div>
      ) : (
        <div className="data-table">
          <div className="data-table__head" style={{ gridTemplateColumns: '1.5fr 1fr 0.8fr 0.8fr 0.6fr 80px' }}>
            <span>Name</span>
            <span>Contact</span>
            <span>Plan</span>
            <span>Payment</span>
            <span>Status</span>
            <span />
          </div>
          <div className="data-table__body">
            {filtered.map((m) => (
              <div
                className="data-table__row"
                key={m.id}
                style={{ gridTemplateColumns: '1.5fr 1fr 0.8fr 0.8fr 0.6fr 80px' }}
                onClick={() => openEdit(m)}
              >
                <div className="data-table__cell data-table__cell--name">
                  <div className="data-table__avatar">
                    {m.full_name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="data-table__name-text">
                    <span className="data-table__name-primary">{m.full_name}</span>
                    <span className="data-table__name-secondary">
                      {m.join_date ? new Date(m.join_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </span>
                  </div>
                </div>
                <div className="data-table__cell">
                  <div className="data-table__name-text">
                    <span className="data-table__name-primary" style={{ fontSize: 'var(--font-size-sm)' }}>{m.email || '—'}</span>
                    <span className="data-table__name-secondary">{m.phone || '—'}</span>
                  </div>
                </div>
                <div className="data-table__cell">
                  <span className="category-badge">{m.membership_plan}</span>
                </div>
                <div className="data-table__cell">
                  <span className={`status-badge status-badge--${m.payment_status}`}>
                    {m.payment_status}
                  </span>
                </div>
                <div className="data-table__cell">
                  <span className={`status-badge status-badge--${m.status}`}>
                    {m.status}
                  </span>
                </div>
                <div className="data-table__actions" onClick={(e) => e.stopPropagation()}>
                  <button className="data-table__action-btn" onClick={() => openEdit(m)} title="Edit">
                    <Pencil size={14} />
                  </button>
                  <button className="data-table__action-btn data-table__action-btn--danger" onClick={() => handleDelete(m.id)} title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">{editing ? 'Edit Member' : 'New Member'}</h3>
              <button className="modal__close" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="modal__error">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form className="modal__form" onSubmit={handleSave}>
              <div className="modal__field">
                <label className="modal__label">Full Name *</label>
                <input className="modal__input" value={form.full_name} onChange={update('full_name')} required autoFocus />
              </div>

              <div className="modal__row">
                <div className="modal__field">
                  <label className="modal__label">Email</label>
                  <input className="modal__input" type="email" value={form.email} onChange={update('email')} />
                </div>
                <div className="modal__field">
                  <label className="modal__label">Phone</label>
                  <input className="modal__input" type="tel" value={form.phone} onChange={update('phone')} placeholder="+251 9XX XXX XXXX" />
                </div>
              </div>

              <div className="modal__field">
                <label className="modal__label">Address</label>
                <input className="modal__input" value={form.address} onChange={update('address')} />
              </div>

              <div className="modal__row">
                <div className="modal__field">
                  <label className="modal__label">Membership Plan</label>
                  <select className="modal__select" value={form.membership_plan} onChange={update('membership_plan')}>
                    {PLANS.map((p) => (
                      <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className="modal__field">
                  <label className="modal__label">Payment Status</label>
                  <select className="modal__select" value={form.payment_status} onChange={update('payment_status')}>
                    {PAYMENT_STATUSES.map((s) => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
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
                  {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : editing ? 'Update Member' : 'Create Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
