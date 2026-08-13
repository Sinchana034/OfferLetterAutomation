import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function CandidateLogin() {
  const { candidateLogin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activationToken = searchParams.get('token');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    const result = await candidateLogin(email, password);
    setSubmitting(false);
    if (result.success) {
      navigate('/candidate');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper-100 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="record-id">candidate portal</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-ink-900">Welcome back</h1>
          <p className="mt-2 text-sm text-ink-700/70">Sign in to view your offer letter</p>
        </div>

        {activationToken && (
          <div className="mb-4 rounded-md bg-signal-tealLight px-4 py-3 text-sm text-signal-teal">
            First time here?{' '}
            <Link to={`/candidate/activate?token=${activationToken}`} className="font-medium underline underline-offset-2">
              Set your password to activate your account
            </Link>
          </div>
        )}

        <form onSubmit={handleSubmit} className="rounded-lg border border-paper-200 bg-white p-6">
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-700/70">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-4 w-full rounded-md border border-paper-200 px-3 py-2 text-sm outline-none focus:border-signal-teal"
          />

          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-700/70">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-700/70">
          HR / Admin / Manager?{' '}
          <Link to="/login" className="text-signal-teal underline underline-offset-2">
            Staff sign-in
          </Link>
        </p>
      </div>
    </div>
  );
}
