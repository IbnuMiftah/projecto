import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import { supabase } from '../../lib/supabase';
import { formatDate } from '../../lib/utils';
import {
  Search, Loader2, Clock, Package, CreditCard,
} from 'lucide-react';
import '../../styles/data-pages.css';
import Pagination from '../../components/Pagination';

const PAGE_SIZE = 10;
const LOG_TYPES = [
  { id: 'all', label: 'All Activity', icon: Clock },
  { id: 'distributions', label: 'Distributions', icon: Package },
  { id: 'payments', label: 'Payments', icon: CreditCard },
];



export default function AuditLogs() {
  const [logType, setLogType] = useState('all');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    let allLogs = [];
    let totalCount = 0;

    const from = (page - 1) * PAGE_SIZE;
    const to = page * PAGE_SIZE - 1;

    if (logType === 'all' || logType === 'distributions') {
      let q = supabase.from('distributions')
        .select('id, beneficiary_name, beneficiary_fayda_id, distributed_by_name, distributed_at, notes, campaign_id', { count: 'exact' })
        .order('distributed_at', { ascending: false });

      if (debouncedSearch) q = q.or(`beneficiary_name.ilike.%${debouncedSearch}%,distributed_by_name.ilike.%${debouncedSearch}%,beneficiary_fayda_id.ilike.%${debouncedSearch}%`);
      if (dateFrom) q = q.gte('distributed_at', dateFrom);
      if (dateTo) q = q.lte('distributed_at', dateTo + 'T23:59:59');

      if (logType === 'distributions') {
        q = q.range(from, to);
        const { data, count } = await q;
        allLogs = (data || []).map(d => ({
          id: `dist-${d.id}`, type: 'distribution',
          action: `Aid distributed to ${d.beneficiary_name}`,
          detail: d.beneficiary_fayda_id ? `FAYDA: ${d.beneficiary_fayda_id}` : '',
          actor: d.distributed_by_name || '—',
          time: d.distributed_at,
          notes: d.notes,
        }));
        totalCount = count || 0;
      } else {
        const { data } = await q.limit(100);
        allLogs.push(...(data || []).map(d => ({
          id: `dist-${d.id}`, type: 'distribution',
          action: `Aid distributed to ${d.beneficiary_name}`,
          detail: d.beneficiary_fayda_id ? `FAYDA: ${d.beneficiary_fayda_id}` : '',
          actor: d.distributed_by_name || '—',
          time: d.distributed_at,
          notes: d.notes,
        })));
      }
    }

    if (logType === 'all' || logType === 'payments') {
      let q = supabase.from('payment_logs')
        .select('id, member_name, amount, payment_method, collected_by_name, created_at', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (debouncedSearch) q = q.or(`member_name.ilike.%${debouncedSearch}%,collected_by_name.ilike.%${debouncedSearch}%`);
      if (dateFrom) q = q.gte('created_at', dateFrom);
      if (dateTo) q = q.lte('created_at', dateTo + 'T23:59:59');

      if (logType === 'payments') {
        q = q.range(from, to);
        const { data, count } = await q;
        allLogs = (data || []).map(p => ({
          id: `pay-${p.id}`, type: 'payment',
          action: `ETB ${parseFloat(p.amount).toLocaleString()} collected from ${p.member_name}`,
          detail: p.payment_method?.toUpperCase() || '',
          actor: p.collected_by_name || '—',
          time: p.created_at,
        }));
        totalCount = count || 0;
      } else {
        const { data } = await q.limit(100);
        allLogs.push(...(data || []).map(p => ({
          id: `pay-${p.id}`, type: 'payment',
          action: `ETB ${parseFloat(p.amount).toLocaleString()} collected from ${p.member_name}`,
          detail: p.payment_method?.toUpperCase() || '',
          actor: p.collected_by_name || '—',
          time: p.created_at,
        })));
      }
    }

    // For "all", merge + sort + paginate client-side
    if (logType === 'all') {
      allLogs.sort((a, b) => new Date(b.time) - new Date(a.time));
      totalCount = allLogs.length;
      allLogs = allLogs.slice(from, to + 1);
    }

    setLogs(allLogs);
    setTotal(totalCount);
    setLoading(false);
  }, [logType, debouncedSearch, page, dateFrom, dateTo]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  useEffect(() => { setPage(1); }, [logType, debouncedSearch, dateFrom, dateTo]);



  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="data-page">
      <div className="data-page__header">
        <div className="data-page__header-left">
          <h2>Audit Logs</h2>
          <p>System activity history for compliance and tracking.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="data-page__toolbar" style={{ flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <select
          className="modal__select"
          style={{ maxWidth: 200 }}
          value={logType}
          onChange={e => setLogType(e.target.value)}
        >
          {LOG_TYPES.map(t => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>

        <div className="data-page__search" style={{ flex: 1, minWidth: 200 }}>
          <Search size={16} className="data-page__search-icon" />
          <input
            className="data-page__search-input"
            placeholder="Search by name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--outline)', whiteSpace: 'nowrap' }}>From</label>
          <input className="modal__input" type="date" style={{ maxWidth: 150, padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--font-size-sm)' }} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--outline)', whiteSpace: 'nowrap' }}>To</label>
          <input className="modal__input" type="date" style={{ maxWidth: 150, padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--font-size-sm)' }} value={dateTo} onChange={e => setDateTo(e.target.value)} />
        </div>

        <span className="data-page__count" style={{ whiteSpace: 'nowrap' }}>
          {total} log{total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="data-page__loading"><Loader2 size={20} className="animate-spin" /><span>Loading logs…</span></div>
      ) : logs.length === 0 ? (
        <div className="data-page__empty">
          <div className="data-page__empty-icon"><Clock size={28} strokeWidth={1.5} /></div>
          <h3>No logs found</h3>
          <p>Adjust your filters or check back later.</p>
        </div>
      ) : (
        <>
          <div className="data-table" style={{ overflowX: 'auto' }}>
            <div className="data-table__head" style={{ gridTemplateColumns: '0.4fr 1.5fr 0.8fr 0.6fr 0.8fr', minWidth: 700 }}>
              <span>Type</span>
              <span>Action</span>
              <span>Detail</span>
              <span>Performed By</span>
              <span>Date & Time</span>
            </div>
            <div className="data-table__body">
              {logs.map(log => (
                <div key={log.id} className="data-table__row" style={{ gridTemplateColumns: '0.4fr 1.5fr 0.8fr 0.6fr 0.8fr', minWidth: 700 }}>
                  <div className="data-table__cell">
                    <span className="category-badge" style={{
                      textTransform: 'uppercase',
                      fontWeight: 600,
                      letterSpacing: '0.03em',
                      background: log.type === 'distribution' ? 'rgba(76,175,80,0.12)' : 'rgba(33,150,243,0.12)',
                      color: log.type === 'distribution' ? 'var(--success)' : 'var(--info)',
                    }}>
                      {log.type === 'distribution' ? 'DIST' : 'PAY'}
                    </span>
                  </div>
                  <div className="data-table__cell" style={{ fontSize: 'var(--font-size-sm)' }}>{log.action}</div>
                  <div className="data-table__cell" style={{ fontSize: 'var(--font-size-xs)', fontFamily: 'monospace', color: 'var(--on-surface-variant)' }}>
                    {log.detail || '—'}
                  </div>
                  <div className="data-table__cell" style={{ fontSize: 'var(--font-size-sm)' }}>{log.actor}</div>
                  <div className="data-table__cell" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--outline)' }}>
                    {formatDate(log.time)}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Pagination currentPage={page} totalPages={totalPages} totalItems={total} pageSize={PAGE_SIZE} onPageChange={setPage} itemLabel="logs" />
        </>
      )}
    </div>
  );
}
