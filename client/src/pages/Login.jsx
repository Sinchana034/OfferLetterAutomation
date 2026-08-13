import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { staffLogin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    const result = await staffLogin(email, password);
    setSubmitting(false);
    if (result.success) {
      navigate(`/${result.user.role}`);
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="record-id !text-ink-200">internal · staff access</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-paper-50">Offer Desk</h1>
          <p className="mt-2 text-sm text-ink-200">Admin, HR, and Manager sign-in</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-lg border border-ink-700 bg-ink-900 p-6">
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-200">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-4 w-full rounded-md border border-ink-700 bg-ink-950 px-3 py-2 text-sm text-paper-50 outline-none focus:border-signal-teal"
          />

          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-200">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mb-2 w-full rounded-md border border-ink-700 bg-ink-950 px-3 py-2 pr-10 text-sm text-paper-50 outline-none focus:border-signal-teal"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-300 hover:text-paper-50"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                // Eye with slash — password is visible
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 3l18 18M10.58 10.58a2 2 0 102.83 2.83M9.88 5.09A9.77 9.77 0 0112 4.83c5.25 0 9.25 5.17 10 7.17a10.7 10.7 0 01-2.02 3.24M6.23 6.23C4.19 7.67 2.73 9.63 2 12c.75 2.08 3.9 7.17 10 7.17a9.77 9.77 0 004.12-.9"
                  />
                </svg>
              ) : (
                // Normal eye — password is hidden
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.46 12C3.73 8.94 7.43 5 12 5s8.27 3.94 9.54 7c-1.27 3.06-4.97 7-9.54 7s-8.27-3.94-9.54-7z"
                  />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
          <div className="mb-5 text-right">
            <Link
              to="/forgot-password"
              className="text-sm text-signal-teal underline underline-offset-2"
            >
              Forgot password?
            </Link>
          </div>

          {error && (
            <div className="mb-4 rounded-md bg-signal-roseLight px-3 py-2 text-sm text-signal-rose">{error}</div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-signal-teal px-4 py-2.5 text-sm font-medium text-white transition hover:bg-signal-teal/90 disabled:opacity-50"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-200">
          Candidate?{' '}
          <Link to="/candidate/login" className="text-signal-teal underline underline-offset-2">
            Go to your portal
          </Link>
        </p>
      </div>
    </div>
  );
}
