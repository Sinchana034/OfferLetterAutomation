import { useEffect, useState, useCallback } from 'react';
import { api, getErrorMessage } from '../api/client';
import StatusPill from './StatusPill';
import ResendModal from './ResendModal';

const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

// canResend: whether the logged-in role is allowed to trigger a resend
// (Admin/HR yes, Manager no - read-only).
export default function OfferTable({ canResend = false }) {
  const [offers, setOffers] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resendTarget, setResendTarget] = useState(null);

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
    const timeout = setTimeout(load, 300);

    return () => clearTimeout(timeout);
  }, [load]);

  return (
    <div>
      {/* =====================================================
          SEARCH + FILTERS
      ====================================================== */}
      <div
        className="
          mb-4
          flex
          flex-wrap
          items-center
          gap-3

          max-md:flex-col
          max-md:items-stretch
        "
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by candidate name or email"
          className="
            w-72
            rounded-md
            border
            border-paper-200
            bg-white
            px-3
            py-2
            text-sm
            outline-none
            focus:border-signal-teal

            max-md:w-full
          "
        />

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="
            rounded-md
            border
            border-paper-200
            bg-white
            px-3
            py-2
            text-sm
            outline-none
            focus:border-signal-teal

            max-md:w-full
          "
        >
          <option value="">All statuses</option>
          <option value="Sent">Sent</option>
          <option value="Pending">Pending</option>
          <option value="Failed">Failed</option>
        </select>

        <span
          className="
            record-id
            ml-auto

            max-md:ml-0
            max-md:self-end
          "
        >
          {offers.length} record{offers.length !== 1 && 's'}
        </span>
      </div>

      {/* =====================================================
          ERROR
      ====================================================== */}
      {error && (
        <div className="mb-4 rounded-md bg-signal-roseLight px-4 py-2 text-sm text-signal-rose">
          {error}
        </div>
      )}

      {/* =====================================================
          DESKTOP TABLE
          Visible from md and above
      ====================================================== */}
      <div className="hidden overflow-hidden rounded-lg border border-paper-200 bg-white md:block">
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

              {canResend && (
                <th className="px-4 py-3 font-medium">Action</th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-paper-200">
            {/* Loading */}
            {loading && (
              <tr>
                <td
                  colSpan={canResend ? 8 : 7}
                  className="px-4 py-8 text-center text-ink-700/60"
                >
                  Loading records…
                </td>
              </tr>
            )}

            {/* Empty */}
            {!loading && offers.length === 0 && (
              <tr>
                <td
                  colSpan={canResend ? 8 : 7}
                  className="px-4 py-8 text-center text-ink-700/60"
                >
                  No offers match this view yet.
                </td>
              </tr>
            )}

            {/* Records */}
            {!loading &&
              offers.map((offer) => (
                <tr
                  key={offer._id}
                  className="transition hover:bg-paper-50"
                >
                  {/* Candidate */}
                  <td className="px-4 py-3">
                    <div className="font-medium text-ink-900">
                      {offer.candidateName}
                    </div>

                    <div className="record-id">
                      {offer.candidateEmail}
                    </div>
                  </td>

                  {/* Designation */}
                  <td className="px-4 py-3 text-ink-800">
                    {offer.designation}
                  </td>

                  {/* Department */}
                  <td className="px-4 py-3 text-ink-800">
                    {offer.department}
                  </td>

                  {/* Type */}
                  <td className="px-4 py-3 text-ink-800">
                    {offer.employmentType}

                    {offer.employmentType === 'Internship' &&
                      offer.internshipDurationMonths && (
                        <span className="record-id ml-1">
                          ({offer.internshipDurationMonths}mo)
                        </span>
                      )}
                  </td>

                  {/* Joining / End */}
                  <td className="px-4 py-3 text-ink-800">
                    {formatDate(offer.dateOfJoining)}

                    {offer.endDate && (
                      <span className="text-ink-700/50">
                        {' '}
                        → {formatDate(offer.endDate)}
                      </span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <StatusPill status={offer.emailStatus} />

                    {offer.emailStatus === 'Failed' &&
                      offer.emailError && (
                        <div
                          className="mt-1 max-w-[180px] truncate text-xs text-signal-rose"
                          title={offer.emailError}
                        >
                          {offer.emailError}
                        </div>
                      )}
                  </td>

                  {/* PDF */}
                  <td className="px-4 py-3">
                    {offer.pdfUrl ? (
                      <a
                        href={`${
                          import.meta.env.VITE_API_ORIGIN ||
                          'http://localhost:5000'
                        }${offer.pdfUrl}`}
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

                  {/* Resend */}
                  {canResend && (
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setResendTarget(offer)}
                        className="
                          rounded-md
                          border
                          border-paper-200
                          px-2.5
                          py-1
                          text-xs
                          font-medium
                          text-ink-800
                          transition
                          hover:border-signal-teal
                          hover:text-signal-teal
                        "
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

      {/* =====================================================
          MOBILE CARDS
          Visible below md
      ====================================================== */}
      <div className="space-y-3 md:hidden">
        {/* Loading */}
        {loading && (
          <div className="rounded-lg border border-paper-200 bg-white px-4 py-8 text-center text-sm text-ink-700/60">
            Loading records…
          </div>
        )}

        {/* Empty */}
        {!loading && offers.length === 0 && (
          <div className="rounded-lg border border-paper-200 bg-white px-4 py-8 text-center text-sm text-ink-700/60">
            No offers match this view yet.
          </div>
        )}

        {/* Mobile offer cards */}
        {!loading &&
          offers.map((offer) => (
            <div
              key={offer._id}
              className="
                overflow-hidden
                rounded-xl
                border
                border-paper-200
                bg-white
                shadow-sm
              "
            >
              {/* =================================================
                  CARD HEADER
              ================================================== */}
              <div
                className="
                  border-b
                  border-paper-200
                  bg-paper-50
                  px-4
                  py-4
                "
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-ink-900">
                      {offer.candidateName}
                    </h3>

                    <p className="mt-1 break-all text-xs text-ink-700/60">
                      {offer.candidateEmail}
                    </p>
                  </div>

                  <div className="shrink-0">
                    <StatusPill status={offer.emailStatus} />
                  </div>
                </div>
              </div>

              {/* =================================================
                  CARD DETAILS
              ================================================== */}
              <div className="divide-y divide-paper-100 px-4">
                {/* Designation */}
                <div className="flex items-start justify-between gap-4 py-3">
                  <span className="text-xs font-medium uppercase tracking-wide text-ink-700/60">
                    Designation
                  </span>

                  <span className="max-w-[60%] text-right text-sm text-ink-900">
                    {offer.designation}
                  </span>
                </div>

                {/* Department */}
                <div className="flex items-start justify-between gap-4 py-3">
                  <span className="text-xs font-medium uppercase tracking-wide text-ink-700/60">
                    Department
                  </span>

                  <span className="max-w-[60%] text-right text-sm text-ink-900">
                    {offer.department}
                  </span>
                </div>

                {/* Employment type */}
                <div className="flex items-start justify-between gap-4 py-3">
                  <span className="text-xs font-medium uppercase tracking-wide text-ink-700/60">
                    Type
                  </span>

                  <span className="text-right text-sm text-ink-900">
                    {offer.employmentType}

                    {offer.employmentType === 'Internship' &&
                      offer.internshipDurationMonths && (
                        <span className="record-id ml-1">
                          ({offer.internshipDurationMonths}mo)
                        </span>
                      )}
                  </span>
                </div>

                {/* Joining */}
                <div className="flex items-start justify-between gap-4 py-3">
                  <span className="text-xs font-medium uppercase tracking-wide text-ink-700/60">
                    Joining
                  </span>

                  <span className="text-right text-sm text-ink-900">
                    {formatDate(offer.dateOfJoining)}
                  </span>
                </div>

                {/* End date */}
                {offer.endDate && (
                  <div className="flex items-start justify-between gap-4 py-3">
                    <span className="text-xs font-medium uppercase tracking-wide text-ink-700/60">
                      End date
                    </span>

                    <span className="text-right text-sm text-ink-900">
                      {formatDate(offer.endDate)}
                    </span>
                  </div>
                )}

                {/* Email error */}
                {offer.emailStatus === 'Failed' &&
                  offer.emailError && (
                    <div className="py-3">
                      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-signal-rose">
                        Email error
                      </p>

                      <p
                        className="break-words text-xs text-signal-rose"
                        title={offer.emailError}
                      >
                        {offer.emailError}
                      </p>
                    </div>
                  )}
              </div>

              {/* =================================================
                  CARD ACTIONS
              ================================================== */}
              <div
                className="
                  flex
                  items-center
                  justify-between
                  gap-3
                  border-t
                  border-paper-200
                  bg-paper-50
                  px-4
                  py-3
                "
              >
                {/* PDF */}
                <div>
                  {offer.pdfUrl ? (
                    <a
                      href={`${
                        import.meta.env.VITE_API_ORIGIN ||
                        'http://localhost:5000'
                      }${offer.pdfUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="
                        inline-flex
                        items-center
                        rounded-md
                        px-2
                        py-1.5
                        text-sm
                        font-medium
                        text-signal-teal
                        underline
                        underline-offset-2
                      "
                    >
                      View PDF
                    </a>
                  ) : (
                    <span className="text-sm text-ink-700/40">
                      PDF unavailable
                    </span>
                  )}
                </div>

                {/* Resend */}
                {canResend && (
                  <button
                    onClick={() => setResendTarget(offer)}
                    className="
                      rounded-md
                      border
                      border-paper-200
                      bg-white
                      px-3
                      py-1.5
                      text-xs
                      font-medium
                      text-ink-800
                      transition
                      hover:border-signal-teal
                      hover:text-signal-teal
                    "
                  >
                    Resend
                  </button>
                )}
              </div>
            </div>
          ))}
      </div>

      {/* =====================================================
          RESEND MODAL
      ====================================================== */}
      {resendTarget && (
        <ResendModal
          offer={resendTarget}
          onClose={() => setResendTarget(null)}
          onResent={load}
        />
      )}
    </div>
  );
}