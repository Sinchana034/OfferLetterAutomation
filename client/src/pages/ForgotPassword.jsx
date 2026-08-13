import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    setError('');

    try {
      const response = await api.post('/auth/forgot-password', { email });

      setMessage(
        response.data.message ||
          'If an account exists with that email, a password reset link has been sent.'
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Unable to process your request.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="record-id !text-ink-200">internal · password recovery</p>

          <h1 className="mt-1 font-display text-3xl font-semibold text-paper-50">
            Reset Password
          </h1>

          <p className="mt-2 text-sm text-ink-200">
            Enter your staff account email
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-ink-700 bg-ink-900 p-6"
        >
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-200">
            Email
          </label>

          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="mb-5 w-full rounded-md border border-ink-700 bg-ink-950 px-3 py-2 text-sm text-paper-50 outline-none focus:border-signal-teal"
          />

          {message && (
            <div className="mb-4 rounded-md bg-signal-teal/10 px-3 py-2 text-sm text-signal-teal">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-md bg-signal-roseLight px-3 py-2 text-sm text-signal-rose">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-signal-teal px-4 py-2.5 text-sm font-medium text-white transition hover:bg-signal-teal/90 disabled:opacity-50"
          >
            {submitting ? 'Sending…' : 'Send Reset Link'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-200">
          Remember your password?{' '}
          <Link
            to="/login"
            className="text-signal-teal underline underline-offset-2"
          >
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}