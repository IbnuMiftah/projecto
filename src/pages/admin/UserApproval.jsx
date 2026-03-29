import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  UserCheck,
  UserX,
  ChevronDown,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import './UserApproval.css';

const ROLES = ['worker', 'finance', 'auditor'];

export default function UserApproval() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [filter, setFilter] = useState('pending_approval');
  const [error, setError] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error: fetchErr } = await query;
      if (fetchErr) throw fetchErr;
      setUsers(data || []);
    } catch (err) {
      setError('Failed to fetch users. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const updateUser = async (userId, updates) => {
    setActionLoading(userId);
    try {
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (updateErr) throw updateErr;
      await fetchUsers();
    } catch (err) {
      setError(`Action failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const approveUser = (userId, role) =>
    updateUser(userId, { status: 'active', role });

  const rejectUser = (userId) =>
    updateUser(userId, { status: 'rejected' });

  const suspendUser = (userId) =>
    updateUser(userId, { status: 'suspended' });

  const reactivateUser = (userId) =>
    updateUser(userId, { status: 'active' });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <UserCheck size={14} />;
      case 'pending_approval': return <Clock size={14} />;
      case 'rejected': return <UserX size={14} />;
      case 'suspended': return <AlertCircle size={14} />;
      default: return null;
    }
  };

  return (
    <div className="user-approval">
      <div className="user-approval__header">
        <div>
          <h2 className="user-approval__title">User Approval</h2>
          <p className="user-approval__subtitle">
            Review, approve, and manage user accounts.
          </p>
        </div>
        <button className="user-approval__refresh" onClick={fetchUsers}>
          <RefreshCw size={16} strokeWidth={1.5} />
          Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="user-approval__filters">
        {[
          { value: 'pending_approval', label: 'Pending' },
          { value: 'active', label: 'Active' },
          { value: 'suspended', label: 'Suspended' },
          { value: 'rejected', label: 'Rejected' },
          { value: 'all', label: 'All' },
        ].map((f) => (
          <button
            key={f.value}
            className={`user-approval__filter ${filter === f.value ? 'user-approval__filter--active' : ''}`}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="user-approval__error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* User List */}
      {loading ? (
        <div className="user-approval__loading">
          <Loader2 size={24} className="animate-spin" />
          <span>Loading users…</span>
        </div>
      ) : users.length === 0 ? (
        <div className="user-approval__empty">
          <Clock size={32} strokeWidth={1.5} />
          <p>No users found with status: {filter.replace('_', ' ')}</p>
        </div>
      ) : (
        <div className="user-approval__list">
          {users.map((u) => (
            <div className="user-row" key={u.id}>
              <div className="user-row__avatar">
                {u.full_name?.charAt(0)?.toUpperCase() || '?'}
              </div>

              <div className="user-row__info">
                <span className="user-row__name">{u.full_name}</span>
                <span className="user-row__email">{u.phone || 'No phone'}</span>
              </div>

              <div className={`user-row__status user-row__status--${u.status}`}>
                {getStatusIcon(u.status)}
                <span>{u.status?.replace('_', ' ')}</span>
              </div>

              <div className="user-row__role">
                <span className="user-row__role-label">{u.role}</span>
              </div>

              <div className="user-row__date">
                {new Date(u.created_at).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </div>

              {/* Actions */}
              <div className="user-row__actions">
                {actionLoading === u.id ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : u.status === 'pending_approval' ? (
                  <>
                    <div className="user-row__role-select">
                      <select
                        defaultValue={u.role || 'worker'}
                        onChange={(e) => approveUser(u.id, e.target.value)}
                        className="user-row__select"
                        aria-label="Approve with role"
                      >
                        <option value="" disabled>
                          Approve as…
                        </option>
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r.charAt(0).toUpperCase() + r.slice(1)}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="user-row__select-icon" />
                    </div>
                    <button
                      className="user-row__action user-row__action--approve"
                      onClick={() => approveUser(u.id, u.role || 'worker')}
                      title="Approve"
                    >
                      <CheckCircle2 size={18} />
                    </button>
                    <button
                      className="user-row__action user-row__action--reject"
                      onClick={() => rejectUser(u.id)}
                      title="Reject"
                    >
                      <XCircle size={18} />
                    </button>
                  </>
                ) : u.status === 'active' ? (
                  <button
                    className="user-row__action user-row__action--suspend"
                    onClick={() => suspendUser(u.id)}
                    title="Suspend"
                  >
                    Suspend
                  </button>
                ) : u.status === 'suspended' ? (
                  <button
                    className="user-row__action user-row__action--approve"
                    onClick={() => reactivateUser(u.id)}
                    title="Reactivate"
                  >
                    Reactivate
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
