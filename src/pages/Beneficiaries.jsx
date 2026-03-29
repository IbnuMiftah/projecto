import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  Search, Plus, Pencil, Trash2, Loader2, X,
  AlertCircle, Users, ShieldCheck, AlertTriangle,
} from 'lucide-react';
import '../styles/data-pages.css';

const CATEGORIES = ['general', 'orphan', 'elderly', 'disabled', 'widow', 'displaced'];
const STATUSES = ['active', 'inactive', 'flagged', 'duplicate'];

const EMPTY_FORM = {
  full_name: '', fayda_id: '', phone: '', address: '',
  kebele: '', woreda: '', category: 'general',
  household_size: 1, notes: '',
};

export default function Beneficiaries() {
  const { user } = useAuth();
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchBeneficiaries = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('beneficiaries')
        .select('*')
        .order('created_at', { ascending: false });

      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }

      const { data, error: fetchErr } = await query;
      if (fetchErr) throw fetchErr;
      setBeneficiaries(data || []);
    } catch (err) {
      console.error('Fetch beneficiaries error:', err);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter]);

  useEffect(() => { fetchBeneficiaries(); }, [fetchBeneficiaries]);

  const filtered = beneficiaries.filter((b) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      b.full_name?.toLowerCase().includes(q) ||
      b.fayda_id?.toLowerCase().includes(q) ||
      b.phone?.includes(q) ||
      b.kebele?.toLowerCase().includes(q) ||
      b.woreda?.toLowerCase().includes(q)
    );
  });

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowModal(true);
  };

  const openEdit = (beneficiary) => {
    setEditing(beneficiary);
    setForm({
      full_name: beneficiary.full_name || '',
      fayda_id: beneficiary.fayda_id || '',
      phone: beneficiary.phone || '',
      address: beneficiary.address || '',
      kebele: beneficiary.kebele || '',
      woreda: beneficiary.woreda || '',
      category: beneficiary.category || 'general',
      household_size: beneficiary.household_size || 1,
      notes: beneficiary.notes || '',
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
        household_size: parseInt(form.household_size, 10) || 1,
        fayda_id: form.fayda_id.trim() || null,
        updated_at: new Date().toISOString(),
      };

      if (editing) {
        const { error: updateErr } = await supabase
          .from('beneficiaries')
          .update(payload)
          .eq('id', editing.id);
        if (updateErr) throw updateErr;
      } else {
        payload.registered_by = user?.id;
        payload.status = 'active';
        const { error: insertErr } = await supabase
          .from('beneficiaries')
          .insert(payload);
        if (insertErr) throw insertErr;
      }

      setShowModal(false);
      await fetchBeneficiaries();
    } catch (err) {
      if (err.message?.includes('duplicate key') && err.message?.includes('fayda_id')) {
        setError('A beneficiary with this FAYDA ID already exists. Possible duplicate.');
      } else {
        setError(err.message || 'Failed to save beneficiary.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this beneficiary record?')) return;
    try {
      const { error: delErr } = await supabase.from('beneficiaries').delete().eq('id', id);
      if (delErr) throw delErr;
      await fetchBeneficiaries();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const flagBeneficiary = async (id, currentStatus) => {
    const newStatus = currentStatus === 'flagged' ? 'active' : 'flagged';
    try {
      const { error: updateErr } = await supabase
        .from('beneficiaries')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (updateErr) throw updateErr;
      await fetchBeneficiaries();
    } catch (err) {
      console.error('Flag error:', err);
    }
  };

  const update = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const statusCounts = {
    all: beneficiaries.length,
    flagged: beneficiaries.filter((b) => b.status === 'flagged').length,
  };

  return (
    <div className="data-page">
      {/* Header */}
      <div className="data-page__header">
        <div className="data-page__header-left">
          <h2>Beneficiaries</h2>
          <p>Register and manage aid recipients across all sectors.</p>
        </div>
        <div className="data-page__header-right">
          {statusCounts.flagged > 0 && (
            <div className="btn btn--danger btn--sm" style={{ cursor: 'default' }}>
              <AlertTriangle size={14} />
              {statusCounts.flagged} Flagged
            </div>
          )}
          <button className="btn btn--primary" onClick={openCreate}>
            <Plus size={16} strokeWidth={2} />
            Register Beneficiary
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="data-page__toolbar">
        <div className="data-page__search">
          <Search size={16} className="data-page__search-icon" />
          <input
            className="data-page__search-input"
            placeholder="Search by name, FAYDA ID, phone, kebele…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="data-page__filter">
          {['all', ...CATEGORIES].map((c) => (
            <button
              key={c}
              className={`data-page__filter-btn ${categoryFilter === c ? 'data-page__filter-btn--active' : ''}`}
              onClick={() => setCategoryFilter(c)}
            >
              {c === 'all' ? 'All' : c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          ))}
        </div>
        <span className="data-page__count">{filtered.length} beneficiaries</span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="data-page__loading">
          <Loader2 size={20} className="animate-spin" />
          <span>Loading beneficiaries…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="data-page__empty">
          <div className="data-page__empty-icon">
            <Users size={28} strokeWidth={1.5} />
          </div>
          <h3>{search ? 'No results found' : 'No beneficiaries registered'}</h3>
          <p>{search ? 'Try a different search term or FAYDA ID.' : 'Register your first beneficiary to start tracking aid distribution.'}</p>
          {!search && (
            <button className="btn btn--primary" onClick={openCreate}>
              <Plus size={16} /> Register Beneficiary
            </button>
          )}
        </div>
      ) : (
        <div className="data-table">
          <div className="data-table__head" style={{ gridTemplateColumns: '1.5fr 0.8fr 0.7fr 0.6fr 0.5fr 0.5fr 80px' }}>
            <span>Name</span>
            <span>FAYDA ID</span>
            <span>Location</span>
            <span>Category</span>
            <span>Household</span>
            <span>Status</span>
            <span />
          </div>
          <div className="data-table__body">
            {filtered.map((b) => (
              <div
                className="data-table__row"
                key={b.id}
                style={{ gridTemplateColumns: '1.5fr 0.8fr 0.7fr 0.6fr 0.5fr 0.5fr 80px' }}
                onClick={() => openEdit(b)}
              >
                <div className="data-table__cell data-table__cell--name">
                  <div className="data-table__avatar">
                    {b.full_name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="data-table__name-text">
                    <span className="data-table__name-primary">{b.full_name}</span>
                    <span className="data-table__name-secondary">{b.phone || '—'}</span>
                  </div>
                </div>
                <div className="data-table__cell">
                  <span style={{ fontFamily: 'monospace', fontSize: 'var(--font-size-sm)', color: b.fayda_id ? 'var(--on-surface)' : 'var(--outline)' }}>
                    {b.fayda_id || 'Not verified'}
                  </span>
                </div>
                <div className="data-table__cell">
                  <div className="data-table__name-text">
                    <span className="data-table__name-primary" style={{ fontSize: 'var(--font-size-sm)' }}>{b.kebele || '—'}</span>
                    <span className="data-table__name-secondary">{b.woreda || '—'}</span>
                  </div>
                </div>
                <div className="data-table__cell">
                  <span className="category-badge">{b.category}</span>
                </div>
                <div className="data-table__cell" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--on-surface)' }}>
                  {b.household_size} {b.household_size === 1 ? 'person' : 'people'}
                </div>
                <div className="data-table__cell">
                  <span className={`status-badge status-badge--${b.status}`}>
                    {b.status}
                  </span>
                </div>
                <div className="data-table__actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="data-table__action-btn"
                    onClick={() => flagBeneficiary(b.id, b.status)}
                    title={b.status === 'flagged' ? 'Unflag' : 'Flag'}
                  >
                    {b.status === 'flagged' ? <ShieldCheck size={14} /> : <AlertTriangle size={14} />}
                  </button>
                  <button className="data-table__action-btn" onClick={() => openEdit(b)} title="Edit">
                    <Pencil size={14} />
                  </button>
                  <button className="data-table__action-btn data-table__action-btn--danger" onClick={() => handleDelete(b.id)} title="Delete">
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
              <h3 className="modal__title">{editing ? 'Edit Beneficiary' : 'Register Beneficiary'}</h3>
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
                  <label className="modal__label">FAYDA ID</label>
                  <input className="modal__input" value={form.fayda_id} onChange={update('fayda_id')} placeholder="National ID (optional)" />
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
                  <label className="modal__label">Kebele</label>
                  <input className="modal__input" value={form.kebele} onChange={update('kebele')} />
                </div>
                <div className="modal__field">
                  <label className="modal__label">Woreda</label>
                  <input className="modal__input" value={form.woreda} onChange={update('woreda')} />
                </div>
              </div>

              <div className="modal__row">
                <div className="modal__field">
                  <label className="modal__label">Category</label>
                  <select className="modal__select" value={form.category} onChange={update('category')}>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className="modal__field">
                  <label className="modal__label">Household Size</label>
                  <input className="modal__input" type="number" min="1" max="50" value={form.household_size} onChange={update('household_size')} />
                </div>
              </div>

              <div className="modal__field">
                <label className="modal__label">Notes</label>
                <textarea className="modal__textarea" value={form.notes} onChange={update('notes')} placeholder="Optional notes about this beneficiary…" />
              </div>

              <div className="modal__actions">
                <button type="button" className="btn btn--ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn--primary" disabled={saving}>
                  {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : editing ? 'Update Record' : 'Register Beneficiary'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
