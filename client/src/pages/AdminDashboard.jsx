import { useEffect, useState, useCallback } from 'react';
import { api, getErrorMessage } from '../api/client';
import DashboardShell from '../components/DashboardShell';
import OfferTable from '../components/OfferTable';
import GenerateOfferForm from '../components/GenerateOfferForm';
import { DEPARTMENTS } from '../constants';

function CreateStaffForm({ onCreated }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'hr', department: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await api.post('/users', form);
      setSuccess(`${form.role === 'hr' ? 'HR' : 'Manager'} account created for ${form.name}.`);
      setForm({ name: '', email: '', password: '', role: 'hr', department: '' });
      onCreated?.();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-md border border-paper-200 bg-white px-3 py-2 text-sm outline-none focus:border-signal-violet';
  const labelClass = 'mb-1 block text-xs font-medium uppercase tracking-wide text-ink-700/70';

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-paper-200 bg-white p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Name</label>
          <input required value={form.name} onChange={update('name')} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Email</label>
          <input required type="email" value={form.email} onChange={update('email')} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Temporary password</label>
          <input required value={form.password} onChange={update('password')} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Role</label>
          <select value={form.role} onChange={update('role')} className={inputClass}>
            <option value="hr">HR</option>
            <option value="manager">Manager</option>
          </select>
        </div>
        {form.role === 'manager' && (
          <div className="sm:col-span-2">
            <label className={labelClass}>Department (this manager will only see this department)</label>
            <select required value={form.department} onChange={update('department')} className={inputClass}>
              <option value="" disabled>
                Select department
              </option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && <div className="mt-4 rounded-md bg-signal-roseLight px-4 py-2 text-sm text-signal-rose">{error}</div>}
      {success && (
        <div className="mt-4 rounded-md bg-signal-violetLight px-4 py-2 text-sm text-signal-violet">{success}</div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="mt-5 rounded-md bg-signal-violet px-5 py-2.5 text-sm font-medium text-white transition hover:bg-signal-violet/90 disabled:opacity-50"
      >
        {submitting ? 'Creating…' : 'Create staff account'}
      </button>
    </form>
  );
}

function StaffList({ refreshKey }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await api.get('/users');
    setUsers(data.users);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const toggleStatus = async (user) => {
    await api.patch(`/users/${user._id}/status`, { isActive: !user.isActive });
    load();
  };

  return (
    <div className="overflow-hidden rounded-lg border border-paper-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-paper-200 bg-paper-100 text-xs uppercase tracking-wide text-ink-700/70">
          <tr>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Role</th>
            <th className="px-4 py-3 font-medium">Department</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-paper-200">
          {loading && (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-ink-700/60">
                Loading staff…
              </td>
            </tr>
          )}
          {!loading &&
            users.map((u) => (
              <tr key={u._id} className="hover:bg-paper-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-ink-900">{u.name}</div>
                  <div className="record-id">{u.email}</div>
                </td>
                <td className="px-4 py-3 capitalize text-ink-800">{u.role}</td>
                <td className="px-4 py-3 text-ink-800">{u.department || '—'}</td>
                <td className="px-4 py-3">
                  <span className={u.isActive ? 'text-signal-teal' : 'text-signal-rose'}>
                    {u.isActive ? 'Active' : 'Deactivated'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {u.role !== 'admin' && (
                    <button
                      onClick={() => toggleStatus(u)}
                      className="rounded-md border border-paper-200 px-2.5 py-1 text-xs font-medium text-ink-800 hover:border-signal-violet hover:text-signal-violet"
                    >
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminDashboard() {
  const [tab, setTab] = useState('offers');
  const [refreshKey, setRefreshKey] = useState(0);

  const [stats, setStats] = useState({
  totalCandidates: 0,
  selectedCandidates: 0,
  offersGenerated: 0,
  emailsSent: 0,
  pendingEmails: 0,
  failedEmails: 0, 
  });


const [statsLoading, setStatsLoading] = useState(true); 

useEffect(() => {
  const loadStats = async () => {
    try {
      setStatsLoading(true);

      const { data } = await api.get('/offers/stats');

      setStats(data.stats);
    } catch (err) {
      console.error('Failed to load dashboard stats:', getErrorMessage(err));
    } finally {
      setStatsLoading(false);
    }
  };

  loadStats();
}, [refreshKey]);

  const tabs = [
    { id: 'offers', label: 'All offer letters' },
    { id: 'generate', label: 'Generate offer' },
    { id: 'staff', label: 'Manage staff' },
  ];

  return (
    <DashboardShell eyebrow="Full access" title="Admin control center">

    {/* Dashboard Statistics */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-paper-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-700/60">
            Total Candidates
          </p>
          <p className="mt-2 text-3xl font-semibold text-ink-900">
            {statsLoading ? '—' : stats.totalCandidates}
          </p>
        </div>

        <div className="rounded-lg border border-paper-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-700/60">
            Selected Candidates
          </p>
          <p className="mt-2 text-3xl font-semibold text-ink-900">
            {statsLoading ? '—' : stats.selectedCandidates}
          </p>
        </div>

        <div className="rounded-lg border border-paper-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-700/60">
            Offers Generated
          </p>
          <p className="mt-2 text-3xl font-semibold text-signal-violet">
            {statsLoading ? '—' : stats.offersGenerated}
          </p>
        </div>

        <div className="rounded-lg border border-paper-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-700/60">
            Emails Sent
          </p>
          <p className="mt-2 text-3xl font-semibold text-signal-teal">
            {statsLoading ? '—' : stats.emailsSent}
          </p>
        </div>

        <div className="rounded-lg border border-paper-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-700/60">
            Pending Emails
          </p>
          <p className="mt-2 text-3xl font-semibold text-signal-amber">
            {statsLoading ? '—' : stats.pendingEmails}
          </p>
        </div>

        <div className="rounded-lg border border-paper-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-700/60">
            Failed Emails
          </p>
          <p className="mt-2 text-3xl font-semibold text-signal-rose">
            {statsLoading ? '—' : stats.failedEmails}
          </p>
        </div>
      </div>

  
      <div className="mb-6 flex gap-1 border-b border-paper-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition ${
              tab === t.id
                ? 'border-signal-violet text-signal-violet'
                : 'border-transparent text-ink-700/60 hover:text-ink-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'offers' && <OfferTable canResend />}
      {tab === 'generate' && <GenerateOfferForm />}
      {tab === 'staff' && (
        <div className="space-y-6">
          <CreateStaffForm onCreated={() => setRefreshKey((k) => k + 1)} />
          <StaffList refreshKey={refreshKey} />
        </div>
      )}
    </DashboardShell>
  );
}