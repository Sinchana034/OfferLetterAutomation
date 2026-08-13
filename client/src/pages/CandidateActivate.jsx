import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api, getErrorMessage } from '../api/client';

export default function CandidateActivate() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('This activation link is missing its token. Please use the link from your offer email.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/auth/candidate/activate', { token, password });
      setDone(true);
      setTimeout(() => navigate('/candidate/login'), 1800);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper-100 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="record-id">candidate portal · activation</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-ink-900">Set your password</h1>
          <p className="mt-2 text-sm text-ink-700/70">This activates your candidate portal account.</p>
        </div>

        {done ? (
          <div className="rounded-lg border border-paper-200 bg-white p-6 text-center">
            <p className="text-signal-teal">Account activated. Redirecting you to sign in…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="rounded-lg border border-paper-200 bg-white p-6">
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-700/70">
              New password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mb-4 w-full rounded-md border border-paper-200 px-3 py-2 text-sm outline-none focus:border-signal-teal"
            />

            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-700/70">
              Confirm password
            </label>
            <input
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mb-5 w-full rounded-md border border-paper-200 px-3 py-2 text-sm outline-none focus:border-signal-teal"
            />

            {error && (
              <div className="mb-4 rounded-md bg-signal-roseLight px-3 py-2 text-sm text-signal-rose">{error}</div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-ink-900 px-4 py-2.5 text-sm font-medium text-paper-50 transition hover:bg-ink-800 disabled:opacity-50"
            >
              {submitting ? 'Activating…' : 'Activate account'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-ink-700/70">
          Already activated?{' '}
          <Link to="/candidate/login" className="text-signal-teal underline underline-offset-2">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
