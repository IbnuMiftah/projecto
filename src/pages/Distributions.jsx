import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import { usePermission } from '../hooks/usePermission';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  Search, Plus, Pencil, Trash2, Loader2, X, AlertCircle,
  Package, Play, Pause, CheckCircle2, AlertTriangle,
  UserCheck, Clock, Truck, ShieldAlert,
} from 'lucide-react';
import '../styles/data-pages.css';
import Pagination from '../components/Pagination';

const AID_TYPES = ['food', 'clothing', 'medical', 'financial', 'other'];

const PAGE_SIZE = 10;

const EMPTY_CAMPAIGN = {
  name: '', description: '', aid_type: 'food',
  start_date: '', end_date: '',
};

const AID_COLORS = {
  food: '#4caf50', clothing: '#2196f3', medical: '#f44336',
  financial: '#ff9800', other: '#9c27b0',
};

/* ─── Tab Button ────────────────────────────────────── */
function TabBar({ tabs, active, onChange }) {
  return (
    <div className="data-page__tabs">
      {tabs.map(t => (
        <button
          key={t.id}
          className={`data-page__tab ${active === t.id ? 'data-page__tab--active' : ''}`}
          onClick={() => onChange(t.id)}
        >
          <t.icon size={16} strokeWidth={1.5} />
          {t.label}
          {t.badge != null && <span className="data-page__tab-badge">{t.badge}</span>}
        </button>
      ))}
    </div>
  );
}


/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */
export default function Distributions() {
  const { user, profile } = useAuth();
  const canDistribute = usePermission('distribute_aid');
  const canManageCampaigns = usePermission('manage_campaigns');
  const [tab, setTab] = useState('campaigns');

  /* ── Campaigns state ── */
  const [campaigns, setCampaigns] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [campaignForm, setCampaignForm] = useState(EMPTY_CAMPAIGN);
  const [savingCampaign, setSavingCampaign] = useState(false);
  const [campaignError, setCampaignError] = useState('');

  /* ── Distribute state ── */
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [benefSearch, setBenefSearch] = useState('');
  const [benefResults, setBenefResults] = useState([]);
  const [searchingBenef, setSearchingBenef] = useState(false);
  const [selectedBenef, setSelectedBenef] = useState(null);
  const [distributing, setDistributing] = useState(false);
  const [distResult, setDistResult] = useState(null); // { type: 'success'|'duplicate'|'error', message }
  const [distNote, setDistNote] = useState('');

  /* ── History state ── */
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyCampaignFilter, setHistoryCampaignFilter] = useState('all');

  /* ── Distribution counts per campaign ── */
  const [distCounts, setDistCounts] = useState({});

  /* ════════════ FETCH FUNCTIONS ════════════ */

  const fetchCampaigns = useCallback(async () => {
    setLoadingCampaigns(true);
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setCampaigns(data || []);
    setLoadingCampaigns(false);
  }, []);

  const fetchDistCounts = useCallback(async (campaignList) => {
    const list = campaignList || campaigns;
    if (!list.length) return;
    const counts = {};
    await Promise.all(
      list.map(async (c) => {
        const { count } = await supabase
          .from('distributions')
          .select('*', { count: 'exact', head: true })
          .eq('campaign_id', c.id);
        counts[c.id] = count || 0;
      })
    );
    setDistCounts(counts);
  }, [campaigns]);

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    let query = supabase
      .from('distributions')
      .select('*', { count: 'exact' })
      .order('distributed_at', { ascending: false })
      .range((historyPage - 1) * PAGE_SIZE, historyPage * PAGE_SIZE - 1);
    if (historyCampaignFilter !== 'all') {
      query = query.eq('campaign_id', historyCampaignFilter);
    }
    const { data, count, error } = await query;
    if (!error) {
      setHistory(data || []);
      setHistoryTotal(count || 0);
    }
    setLoadingHistory(false);
  }, [historyPage, historyCampaignFilter]);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);
  useEffect(() => { if (campaigns.length) fetchDistCounts(); }, [campaigns, fetchDistCounts]);
  useEffect(() => { if (tab === 'history') fetchHistory(); }, [tab, fetchHistory]);

  const activeCampaigns = useMemo(() => campaigns.filter(c => c.status === 'active'), [campaigns]);

  /* ════════════ CAMPAIGN CRUD ════════════ */

  const openCreateCampaign = () => {
    setEditingCampaign(null);
    setCampaignForm(EMPTY_CAMPAIGN);
    setCampaignError('');
    setShowCampaignModal(true);
  };

  const openEditCampaign = (c) => {
    setEditingCampaign(c);
    setCampaignForm({
      name: c.name || '', description: c.description || '', aid_type: c.aid_type || 'food',
      start_date: c.start_date || '', end_date: c.end_date || '',
    });
    setCampaignError('');
    setShowCampaignModal(true);
  };

  const saveCampaign = async (e) => {
    e.preventDefault();
    if (!campaignForm.name.trim()) { setCampaignError('Campaign name is required.'); return; }
    setSavingCampaign(true);
    const payload = { ...campaignForm, updated_at: new Date().toISOString() };
    if (!payload.start_date) payload.start_date = null;
    if (!payload.end_date) payload.end_date = null;

    if (editingCampaign) {
      const { error } = await supabase.from('campaigns').update(payload).eq('id', editingCampaign.id);
      if (error) { setCampaignError(error.message); setSavingCampaign(false); return; }
    } else {
      payload.created_by = user?.id;
      payload.status = 'draft';
      const { error } = await supabase.from('campaigns').insert(payload);
      if (error) { setCampaignError(error.message); setSavingCampaign(false); return; }
    }
    setShowCampaignModal(false);
    setSavingCampaign(false);
    await fetchCampaigns();
  };

  const changeCampaignStatus = async (id, newStatus) => {
    const { error } = await supabase.from('campaigns').update({
      status: newStatus, updated_at: new Date().toISOString(),
    }).eq('id', id);
    if (!error) await fetchCampaigns();
  };

  const deleteCampaign = async (id) => {
    if (!window.confirm('Delete this campaign and all its distribution records?')) return;
    const { error } = await supabase.from('campaigns').delete().eq('id', id);
    if (!error) { await fetchCampaigns(); await fetchDistCounts(); }
  };

  /* ════════════ DISTRIBUTE WORKFLOW ════════════ */

  const debouncedBenefSearch = useDebounce(benefSearch, 300);

  // Fire Supabase query only when debounced value changes
  useEffect(() => {
    if (!debouncedBenefSearch || debouncedBenefSearch.length < 2) { setBenefResults([]); return; }
    if (selectedBenef) return; // Don't search when a beneficiary is already selected
    let cancelled = false;
    const doSearch = async () => {
      setSearchingBenef(true);
      const q = `%${debouncedBenefSearch}%`;
      const { data } = await supabase
        .from('beneficiaries')
        .select('*')
        .or(`full_name.ilike.${q},fayda_id.ilike.${q},phone.ilike.${q}`)
        .limit(10);
      if (!cancelled) {
        setBenefResults(data || []);
        setSearchingBenef(false);
      }
    };
    doSearch();
    return () => { cancelled = true; };
  }, [debouncedBenefSearch, selectedBenef]);

  const selectBeneficiary = async (benef) => {
    setSelectedBenef(benef);
    setBenefResults([]);
    setBenefSearch(benef.full_name + (benef.fayda_id ? ` (${benef.fayda_id})` : ''));
    setDistResult(null);
    setDistNote('');

    // Check if already distributed in selected campaign
    if (selectedCampaign) {
      const { data } = await supabase
        .from('distributions')
        .select('id, distributed_at, distributed_by_name')
        .eq('campaign_id', selectedCampaign)
        .eq('beneficiary_id', benef.id)
        .maybeSingle();
      if (data) {
        setDistResult({
          type: 'duplicate',
          message: `Already received on ${new Date(data.distributed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} by ${data.distributed_by_name || 'Unknown'}`,
        });
      }
    }
  };

  const markAsReceived = async () => {
    if (!selectedCampaign || !selectedBenef) return;
    setDistributing(true);
    setDistResult(null);

    const collectorName = profile?.full_name || user?.email || 'Admin';
    const { error } = await supabase.from('distributions').insert({
      campaign_id: selectedCampaign,
      beneficiary_id: selectedBenef.id,
      beneficiary_name: selectedBenef.full_name,
      beneficiary_fayda_id: selectedBenef.fayda_id || null,
      distributed_by: user?.id,
      distributed_by_name: collectorName,
      notes: distNote || null,
    });

    if (error) {
      if (error.message?.includes('duplicate key') || error.code === '23505') {
        setDistResult({ type: 'duplicate', message: 'This beneficiary has already received aid from this campaign.' });
      } else {
        setDistResult({ type: 'error', message: error.message });
      }
    } else {
      setDistResult({
        type: 'success',
        message: `Aid distributed to ${selectedBenef.full_name} successfully.`,
      });
      await fetchDistCounts();
      // Reset for next distribution
      setTimeout(() => {
        setSelectedBenef(null);
        setBenefSearch('');
        setDistNote('');
        setDistResult(null);
      }, 3000);
    }
    setDistributing(false);
  };

  /* ════════════ HELPERS ════════════ */

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  const campaignName = (id) => campaigns.find(c => c.id === id)?.name || 'Unknown';

  const tabs = [
    { id: 'campaigns', label: 'Campaigns', icon: Package, badge: campaigns.length },
    { id: 'distribute', label: 'Distribute', icon: Truck, badge: activeCampaigns.length > 0 ? activeCampaigns.length : null },
    { id: 'history', label: 'History', icon: Clock },
  ];

  /* ════════════ RENDER ════════════ */

  return (
    <div className="data-page">
      <div className="data-page__header">
        <div className="data-page__header-left">
          <h2>Distributions</h2>
          <p>Manage campaigns and track aid distribution to beneficiaries.</p>
        </div>
        <div className="data-page__header-right">
          {tab === 'campaigns' && canManageCampaigns && (
            <button className="btn btn--primary" onClick={openCreateCampaign}>
              <Plus size={16} strokeWidth={2} /> New Campaign
            </button>
          )}
        </div>
      </div>

      {!canDistribute && (
        <div className="permission-banner">
          <ShieldAlert size={16} className="permission-banner__icon" />
          Aid distribution has been disabled by your administrator.
        </div>
      )}
      {!canManageCampaigns && (
        <div className="permission-banner">
          <ShieldAlert size={16} className="permission-banner__icon" />
          Campaign management has been disabled by your administrator.
        </div>
      )}

      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      {/* ═══ TAB 1: CAMPAIGNS ═══ */}
      {tab === 'campaigns' && (
        <div style={{ marginTop: 'var(--space-6)' }}>
          {loadingCampaigns ? (
            <div className="data-page__loading"><Loader2 size={20} className="animate-spin" /><span>Loading campaigns…</span></div>
          ) : campaigns.length === 0 ? (
            <div className="data-page__empty">
              <div className="data-page__empty-icon"><Package size={28} strokeWidth={1.5} /></div>
              <h3>No campaigns yet</h3>
              <p>Create your first distribution campaign to get started.</p>
              {canManageCampaigns && <button className="btn btn--primary" onClick={openCreateCampaign}><Plus size={16} /> New Campaign</button>}
            </div>
          ) : (
            <div className="dist-campaigns-grid">
              {campaigns.map(c => (
                <div key={c.id} className={`dist-campaign-card dist-campaign-card--${c.status}`}>
                  <div className="dist-campaign-card__header">
                    <span className="dist-campaign-card__type" style={{ background: AID_COLORS[c.aid_type] + '22', color: AID_COLORS[c.aid_type] }}>
                      {c.aid_type?.toUpperCase()}
                    </span>
                    <span className={`status-badge status-badge--${c.status === 'active' ? 'paid' : c.status === 'draft' ? 'pending' : c.status === 'completed' ? 'exempt' : 'overdue'}`}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
                      {c.status}
                    </span>
                  </div>
                  <h4 className="dist-campaign-card__name">{c.name}</h4>
                  {c.description && <p className="dist-campaign-card__desc">{c.description}</p>}
                  <div className="dist-campaign-card__meta">
                    <span>{distCounts[c.id] || 0} distributed</span>
                    {c.start_date && <span>From {new Date(c.start_date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}</span>}
                    {c.end_date && <span>To {new Date(c.end_date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}</span>}
                  </div>
                  <div className="dist-campaign-card__actions">
                    {c.status === 'draft' && (
                      <button className="btn btn--sm btn--primary" onClick={() => changeCampaignStatus(c.id, 'active')}>
                        <Play size={13} /> Activate
                      </button>
                    )}
                    {c.status === 'active' && (
                      <>
                        <button className="btn btn--sm btn--ghost" onClick={() => changeCampaignStatus(c.id, 'paused')}>
                          <Pause size={13} /> Pause
                        </button>
                        <button className="btn btn--sm btn--primary" onClick={() => changeCampaignStatus(c.id, 'completed')}>
                          <CheckCircle2 size={13} /> Complete
                        </button>
                      </>
                    )}
                    {c.status === 'paused' && (
                      <button className="btn btn--sm btn--primary" onClick={() => changeCampaignStatus(c.id, 'active')}>
                        <Play size={13} /> Resume
                      </button>
                    )}
                    {canManageCampaigns && <button className="btn btn--sm btn--ghost" onClick={() => openEditCampaign(c)}><Pencil size={13} /></button>}
                    {c.status === 'draft' && canManageCampaigns && (
                      <button className="btn btn--sm btn--danger" onClick={() => deleteCampaign(c.id)}><Trash2 size={13} /></button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB 2: DISTRIBUTE ═══ */}
      {tab === 'distribute' && (
        <div className="dist-workflow">
          {activeCampaigns.length === 0 ? (
            <div className="data-page__empty">
              <div className="data-page__empty-icon"><Package size={28} strokeWidth={1.5} /></div>
              <h3>No active campaigns</h3>
              <p>Activate a campaign first to start distributing aid.</p>
              <button className="btn btn--primary" onClick={() => setTab('campaigns')}><Play size={16} /> Go to Campaigns</button>
            </div>
          ) : (
            <>
              {/* Step 1: Select Campaign */}
              <div className="dist-step">
                <div className="dist-step__number">1</div>
                <div className="dist-step__content">
                  <label className="dist-step__label">Select Active Campaign</label>
                  <select
                    className="modal__select"
                    value={selectedCampaign}
                    onChange={e => { setSelectedCampaign(e.target.value); setSelectedBenef(null); setDistResult(null); setBenefSearch(''); }}
                  >
                    <option value="">Choose a campaign…</option>
                    {activeCampaigns.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.aid_type}) — {distCounts[c.id] || 0} distributed</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Step 2: Search Beneficiary */}
              {selectedCampaign && (
                <div className="dist-step">
                  <div className="dist-step__number">2</div>
                  <div className="dist-step__content" style={{ position: 'relative' }}>
                    <label className="dist-step__label">Search Beneficiary</label>
                    <div className="data-page__search" style={{ maxWidth: '100%' }}>
                      <Search size={16} className="data-page__search-icon" />
                      <input
                        className="data-page__search-input"
                        placeholder="Search by name, FAYDA ID, or phone…"
                        value={benefSearch}
                        onChange={e => { setBenefSearch(e.target.value); setSelectedBenef(null); setDistResult(null); }}
                      />
                    </div>
                    {searchingBenef && (
                      <div style={{ padding: 'var(--space-3)', fontSize: 'var(--font-size-sm)', color: 'var(--outline)' }}>
                        <Loader2 size={14} className="animate-spin" style={{ display: 'inline', marginRight: 6 }} />Searching…
                      </div>
                    )}
                    {benefResults.length > 0 && !selectedBenef && (
                      <div style={{ position: 'absolute', left: 0, right: 0, top: '100%', zIndex: 50, maxHeight: 240, overflowY: 'auto', background: 'var(--surface-container-high)', borderRadius: 'var(--radius-md)', marginTop: 4, boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
                        {benefResults.map(b => (
                          <div key={b.id} onClick={() => selectBeneficiary(b)}
                            style={{ padding: 'var(--space-3) var(--space-4)', cursor: 'pointer', borderBottom: '1px solid var(--outline-ghost)', transition: 'background 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-container-highest)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <div style={{ fontWeight: 500, color: 'var(--on-surface)' }}>{b.full_name}</div>
                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--outline)', fontFamily: 'monospace' }}>
                              {b.fayda_id || 'No FAYDA ID'} · {b.category} · Family: {b.household_size}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Verify + Distribute */}
              {selectedBenef && (
                <div className="dist-step">
                  <div className="dist-step__number">3</div>
                  <div className="dist-step__content">
                    <label className="dist-step__label">Verify & Distribute</label>
                    <div className="dist-beneficiary-card">
                      <div className="dist-beneficiary-card__avatar">
                        {selectedBenef.full_name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div className="dist-beneficiary-card__info">
                        <div className="dist-beneficiary-card__name">{selectedBenef.full_name}</div>
                        <div className="dist-beneficiary-card__detail">
                          <span>FAYDA: {selectedBenef.fayda_id || '—'}</span>
                          <span>Category: {selectedBenef.category}</span>
                          <span>Family Size: {selectedBenef.household_size}</span>
                          <span>Phone: {selectedBenef.phone || '—'}</span>
                          <span>Kebele: {selectedBenef.kebele || '—'}</span>
                        </div>
                      </div>
                    </div>

                    {distResult?.type === 'duplicate' && (
                      <div className="dist-result dist-result--duplicate">
                        <AlertTriangle size={18} />
                        <div>
                          <strong>Duplicate — Already Received</strong>
                          <p>{distResult.message}</p>
                        </div>
                      </div>
                    )}
                    {distResult?.type === 'error' && (
                      <div className="dist-result dist-result--error">
                        <AlertCircle size={18} />
                        <div><strong>Error</strong><p>{distResult.message}</p></div>
                      </div>
                    )}
                    {distResult?.type === 'success' && (
                      <div className="dist-result dist-result--success">
                        <CheckCircle2 size={18} />
                        <div><strong>Success</strong><p>{distResult.message}</p></div>
                      </div>
                    )}

                    {distResult?.type !== 'duplicate' && distResult?.type !== 'success' && canDistribute && (
                      <>
                        <div style={{ marginTop: 'var(--space-4)' }}>
                          <label className="quick-payment__field-label">Notes (optional)</label>
                          <input className="quick-payment__input" placeholder="Additional notes…" value={distNote} onChange={e => setDistNote(e.target.value)} />
                        </div>
                        <button
                          className="btn btn--primary"
                          style={{ marginTop: 'var(--space-4)', width: '100%', justifyContent: 'center', padding: 'var(--space-4)' }}
                          disabled={distributing}
                          onClick={markAsReceived}
                        >
                          {distributing ? (
                            <><Loader2 size={16} className="animate-spin" /> Processing…</>
                          ) : (
                            <><UserCheck size={16} /> Mark as Received</>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ═══ TAB 3: HISTORY ═══ */}
      {tab === 'history' && (
        <div style={{ marginTop: 'var(--space-6)' }}>
          <div className="data-page__toolbar" style={{ justifyContent: 'flex-start', gap: 'var(--space-4)' }}>
            <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--on-surface-variant)', whiteSpace: 'nowrap' }}>Filter by campaign</label>
            <select
              className="modal__select"
              style={{ maxWidth: 320 }}
              value={historyCampaignFilter}
              onChange={e => { setHistoryCampaignFilter(e.target.value); setHistoryPage(1); }}
            >
              <option value="all">All Campaigns</option>
              {campaigns.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.aid_type})</option>
              ))}
            </select>
            <span className="data-page__count">{historyTotal} record{historyTotal !== 1 ? 's' : ''}</span>
          </div>

          {loadingHistory ? (
            <div className="data-page__loading"><Loader2 size={20} className="animate-spin" /><span>Loading history…</span></div>
          ) : history.length === 0 ? (
            <div className="data-page__empty">
              <div className="data-page__empty-icon"><Clock size={28} strokeWidth={1.5} /></div>
              <h3>No distribution records</h3>
              <p>Distribute aid from the "Distribute" tab to see records here.</p>
            </div>
          ) : (
            <>
              <div className="data-table" style={{ overflowX: 'auto' }}>
                <div className="data-table__head" style={{ gridTemplateColumns: '1.5fr 0.8fr 1fr 0.8fr 0.6fr' }}>
                  <span>Beneficiary</span>
                  <span>FAYDA ID</span>
                  <span>Campaign</span>
                  <span>Distributed By</span>
                  <span>Date</span>
                </div>
                <div className="data-table__body">
                  {history.map(d => (
                    <div key={d.id} className="data-table__row" style={{ gridTemplateColumns: '1.5fr 0.8fr 1fr 0.8fr 0.6fr' }}>
                      <div className="data-table__cell data-table__cell--name">
                        <div className="data-table__avatar">{d.beneficiary_name?.charAt(0)?.toUpperCase()}</div>
                        <span className="data-table__name-primary">{d.beneficiary_name}</span>
                      </div>
                      <div className="data-table__cell">
                        <span style={{ fontFamily: 'monospace', fontSize: 'var(--font-size-sm)', color: d.beneficiary_fayda_id ? 'var(--on-surface)' : 'var(--outline)' }}>
                          {d.beneficiary_fayda_id || '—'}
                        </span>
                      </div>
                      <div className="data-table__cell" style={{ fontSize: 'var(--font-size-sm)' }}>{campaignName(d.campaign_id)}</div>
                      <div className="data-table__cell" style={{ fontSize: 'var(--font-size-sm)' }}>{d.distributed_by_name || '—'}</div>
                      <div className="data-table__cell" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--outline)' }}>
                        {timeAgo(d.distributed_at)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <Pagination currentPage={historyPage} totalPages={Math.ceil(historyTotal / PAGE_SIZE)} totalItems={historyTotal} pageSize={PAGE_SIZE} itemLabel="records" onPageChange={setHistoryPage} />
            </>
          )}
        </div>
      )}

      {/* ═══ CAMPAIGN MODAL ═══ */}
      {showCampaignModal && (
        <div className="modal-overlay" onClick={() => setShowCampaignModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">{editingCampaign ? 'Edit Campaign' : 'Create Campaign'}</h3>
              <button className="modal__close" onClick={() => setShowCampaignModal(false)}><X size={18} /></button>
            </div>
            {campaignError && <div className="modal__error"><AlertCircle size={16} /><span>{campaignError}</span></div>}
            <form className="modal__form" onSubmit={saveCampaign}>
              <div className="modal__field">
                <label className="modal__label">Campaign Name *</label>
                <input className="modal__input" value={campaignForm.name} onChange={e => setCampaignForm(p => ({ ...p, name: e.target.value }))} required autoFocus />
              </div>
              <div className="modal__field">
                <label className="modal__label">Description</label>
                <textarea className="modal__textarea" value={campaignForm.description} onChange={e => setCampaignForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional description…" />
              </div>
              <div className="modal__row">
                <div className="modal__field">
                  <label className="modal__label">Aid Type</label>
                  <select className="modal__select" value={campaignForm.aid_type} onChange={e => setCampaignForm(p => ({ ...p, aid_type: e.target.value }))}>
                    {AID_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal__row">
                <div className="modal__field">
                  <label className="modal__label">Start Date</label>
                  <input className="modal__input" type="date" value={campaignForm.start_date} onChange={e => setCampaignForm(p => ({ ...p, start_date: e.target.value }))} />
                </div>
                <div className="modal__field">
                  <label className="modal__label">End Date</label>
                  <input className="modal__input" type="date" value={campaignForm.end_date} onChange={e => setCampaignForm(p => ({ ...p, end_date: e.target.value }))} />
                </div>
              </div>
              <div className="modal__actions">
                <button type="button" className="btn btn--ghost" onClick={() => setShowCampaignModal(false)}>Cancel</button>
                <button type="submit" className="btn btn--primary" disabled={savingCampaign}>
                  {savingCampaign ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : editingCampaign ? 'Update Campaign' : 'Create Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
