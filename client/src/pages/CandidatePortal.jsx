import { useEffect, useState } from 'react';
import { api, getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import StatusPill from '../components/StatusPill';

const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

export default function CandidatePortal() {
  const { logout } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [profile, setProfile] = useState({
    phone: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/candidate/me');
        setData(data.candidate);
        setProfile(data.candidate.profile);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const { data: res } = await api.patch('/candidate/me', profile);
      setProfile(res.profile);
      setSaved(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full rounded-md border border-paper-200 bg-white px-3 py-2 text-sm outline-none focus:border-signal-teal';
  const labelClass = 'mb-1 block text-xs font-medium uppercase tracking-wide text-ink-700/70';

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-ink-700/60">Loading your offer…</div>;
  }

  if (error && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center text-signal-rose">{error}</div>
    );
  }

  const offer = data?.offer;

  return (
    <div className="min-h-screen bg-paper-50">
      <div className="border-b border-paper-200 bg-ink-900">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <div>
            <span className="font-display text-lg font-semibold text-paper-50">Offer Desk</span>
            <span className="record-id ml-3 !text-ink-200">candidate portal</span>
          </div>
          <button
            onClick={logout}
            className="rounded-md border border-ink-700 px-3 py-1.5 text-sm text-paper-100 transition hover:bg-ink-800"
          >
            Sign out
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-10">
        <p className="record-id mb-1 uppercase text-signal-teal">Confirmation</p>
        <h1 className="font-display text-3xl font-semibold text-ink-900">
          Welcome, {data?.name?.split(' ')[0]}
        </h1>

        {offer && (
          <div className="mt-8 rounded-lg border border-paper-200 bg-white p-6">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="font-display text-xl font-semibold text-ink-900">{offer.designation}</h2>
                <p className="text-sm text-ink-700/70">{offer.department} department</p>
              </div>
              <StatusPill status={offer.emailStatus} />
            </div>

            <dl className="grid grid-cols-2 gap-4 border-t border-paper-200 pt-4 text-sm">
              <div>
                <dt className="record-id">Date of joining</dt>
                <dd className="mt-0.5 text-ink-900">{formatDate(offer.dateOfJoining)}</dd>
              </div>
              <div>
                <dt className="record-id">Stipend / CTC</dt>
                <dd className="mt-0.5 text-ink-900">{offer.stipendOrCTC}</dd>
              </div>
              <div>
                <dt className="record-id">Reporting manager</dt>
                <dd className="mt-0.5 text-ink-900">{offer.reportingManager || '—'}</dd>
              </div>
              <div>
                <dt className="record-id">Offer issued</dt>
                <dd className="mt-0.5 text-ink-900">{formatDate(offer.offerIssueDate)}</dd>
              </div>
            </dl>

            {offer.pdfUrl && (
              <a
                href={`${import.meta.env.VITE_API_ORIGIN || 'http://localhost:5000'}${offer.pdfUrl}`}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-block rounded-md bg-ink-900 px-4 py-2 text-sm font-medium text-paper-50 transition hover:bg-ink-800"
              >
                Download offer letter (PDF)
              </a>
            )}
          </div>
        )}

        <div className="mt-8">
          <h2 className="font-display text-xl font-semibold text-ink-900">Your profile</h2>
          <p className="mt-1 text-sm text-ink-700/70">
            You can update your contact details below. Your name, designation, joining date, and
            compensation are set by HR and can't be edited here.
          </p>

          <form onSubmit={handleSave} className="mt-4 rounded-lg border border-paper-200 bg-white p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Phone</label>
                <input
                  value={profile.phone}
                  onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Address</label>
                <input
                  value={profile.address}
                  onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Emergency contact name</label>
                <input
                  value={profile.emergencyContactName}
                  onChange={(e) => setProfile((p) => ({ ...p, emergencyContactName: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Emergency contact phone</label>
                <input
                  value={profile.emergencyContactPhone}
                  onChange={(e) => setProfile((p) => ({ ...p, emergencyContactPhone: e.target.value }))}
                  className={inputClass}
                />
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-md bg-signal-roseLight px-4 py-2 text-sm text-signal-rose">{error}</div>
            )}
            {saved && (
              <div className="mt-4 rounded-md bg-signal-tealLight px-4 py-2 text-sm text-signal-teal">
                Profile updated.
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="mt-5 rounded-md bg-signal-teal px-5 py-2.5 text-sm font-medium text-white transition hover:bg-signal-teal/90 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
