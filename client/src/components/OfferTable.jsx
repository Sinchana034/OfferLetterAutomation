import { useEffect, useState, useCallback } from 'react';
import { api, getErrorMessage } from '../api/client';
import StatusPill from './StatusPill';
import ResendModal from './ResendModal';

const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });

// canResend: whether the logged-in role is allowed to trigger a resend
// (Admin/HR yes, Manager no - read-only).
export default function OfferTable({ canResend = false }) {
  const [offers, setOffers] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resendTarget, setResendTarget] = useState(null); // the offer currently open in the resend modal

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (search) params.search = search;
      if (status) params.status = status;
      const { data } = await api.get('/offers', { params });
      setOffers(data.offers);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    const timeout = setTimeout(load, 300); // debounce search typing
    return () => clearTimeout(timeout);
  }, [load]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by candidate name or email"
          className="w-72 rounded-md border border-paper-200 bg-white px-3 py-2 text-sm outline-none focus:border-signal-teal"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-md border border-paper-200 bg-white px-3 py-2 text-sm outline-none focus:border-signal-teal"
        >
          <option value="">All statuses</option>
          <option value="Sent">Sent</option>
          <option value="Pending">Pending</option>
          <option value="Failed">Failed</option>
        </select>
        <span className="record-id ml-auto">{offers.length} record{offers.length !== 1 && 's'}</span>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-signal-roseLight px-4 py-2 text-sm text-signal-rose">{error}</div>
      )}

      <div className="overflow-hidden rounded-lg border border-paper-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-paper-200 bg-paper-100 text-xs uppercase tracking-wide text-ink-700/70">
            <tr>
              <th className="px-4 py-3 font-medium">Candidate</th>
              <th className="px-4 py-3 font-medium">Designation</th>
              <th className="px-4 py-3 font-medium">Department</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Joining → End</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Letter</th>
              {canResend && <th className="px-4 py-3 font-medium">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-paper-200">
            {loading && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-ink-700/60">
                  Loading records…
                </td>
              </tr>
            )}
            {!loading && offers.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-ink-700/60">
                  No offers match this view yet.
                </td>
              </tr>
            )}
            {!loading &&
              offers.map((offer) => (
                <tr key={offer._id} className="hover:bg-paper-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-ink-900">{offer.candidateName}</div>
                    <div className="record-id">{offer.candidateEmail}</div>
                  </td>
                  <td className="px-4 py-3 text-ink-800">{offer.designation}</td>
                  <td className="px-4 py-3 text-ink-800">{offer.department}</td>
                  <td className="px-4 py-3 text-ink-800">
                    {offer.employmentType}
                    {offer.employmentType === 'Internship' && offer.internshipDurationMonths && (
                      <span className="record-id ml-1">({offer.internshipDurationMonths}mo)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-800">
                    {formatDate(offer.dateOfJoining)}
                    {offer.endDate && <span className="text-ink-700/50"> → {formatDate(offer.endDate)}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={offer.emailStatus} />
                    {offer.emailStatus === 'Failed' && offer.emailError && (
                      <div className="mt-1 max-w-[180px] truncate text-xs text-signal-rose" title={offer.emailError}>
                        {offer.emailError}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {offer.pdfUrl ? (
                      <a
                        href={`${import.meta.env.VITE_API_ORIGIN || 'http://localhost:5000'}${offer.pdfUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-signal-teal underline underline-offset-2"
                      >
                        View PDF
                      </a>
                    ) : (
                      <span className="text-ink-700/40">—</span>
                    )}
                  </td>
                  {canResend && (
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setResendTarget(offer)}
                        className="rounded-md border border-paper-200 px-2.5 py-1 text-xs font-medium text-ink-800 transition hover:border-signal-teal hover:text-signal-teal"
                      >
                        Resend
                      </button>
                    </td>
                  )}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {resendTarget && (
        <ResendModal offer={resendTarget} onClose={() => setResendTarget(null)} onResent={load} />
      )}
    </div>
  );
}