import { useState, useMemo } from 'react';
import { api, getErrorMessage } from '../api/client';
import { DEPARTMENTS, EMPLOYMENT_TYPES, INTERNSHIP_DURATIONS, addMonthsToDateString } from '../constants';
import OfferLetterPreview from './OfferLetterPreview';

// Converts an ISO datetime (from the DB) into the yyyy-mm-dd shape
// the <input type="date"> element expects.
const toDateInputValue = (isoString) => (isoString ? new Date(isoString).toISOString().split('T')[0] : '');

// stage: 'choice' -> 'edit' -> 'preview'
export default function ResendModal({ offer, onClose, onResent }) {
  const [stage, setStage] = useState('choice');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    candidateName: offer.candidateName,
    designation: offer.designation,
    department: offer.department,
    employmentType: offer.employmentType || 'Internship',
    internshipDurationMonths: offer.internshipDurationMonths || '',
    dateOfJoining: toDateInputValue(offer.dateOfJoining),
    stipendOrCTC: offer.stipendOrCTC,
    reportingManager: offer.reportingManager || '',
  });

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const isInternship = form.employmentType === 'Internship';

  const computedEndDate = useMemo(() => {
    if (!isInternship) return '';
    return addMonthsToDateString(form.dateOfJoining, form.internshipDurationMonths);
  }, [isInternship, form.dateOfJoining, form.internshipDurationMonths]);

  const handleEmploymentTypeChange = (e) => {
    const value = e.target.value;
    setForm((f) => ({
      ...f,
      employmentType: value,
      internshipDurationMonths: value === 'Internship' ? f.internshipDurationMonths : '',
    }));
  };

  const submitResend = async (payload) => {
    setSubmitting(true);
    setError('');
    try {
      await api.post(`/offers/${offer._id}/resend`, payload);
      onResent();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendAsIs = () => submitResend({});

  const handlePreviewClick = (e) => {
    const formEl = e.target.closest('form');
    if (!formEl.reportValidity()) return;
    setError('');
    setStage('preview');
  };

  const handleConfirmResend = () => {
    const payload = { ...form };
    if (!isInternship) delete payload.internshipDurationMonths;
    submitResend(payload);
  };

  const inputClass =
    'w-full rounded-md border border-paper-200 bg-white px-3 py-2 text-sm outline-none focus:border-signal-teal';
  const labelClass = 'mb-1 block text-xs font-medium uppercase tracking-wide text-ink-700/70';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-paper-50 p-6 shadow-xl">
        {stage === 'choice' && (
          <div>
            <h3 className="font-display text-xl font-semibold text-ink-900">
              Resend offer to {offer.candidateName}?
            </h3>
            <p className="mt-2 text-sm text-ink-700/70">
              You can send the letter again exactly as it is, or edit the details first.
            </p>

            {error && (
              <div className="mt-4 rounded-md bg-signal-roseLight px-4 py-2 text-sm text-signal-rose">{error}</div>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleResendAsIs}
                disabled={submitting}
                className="flex-1 rounded-md bg-ink-900 px-5 py-2.5 text-sm font-medium text-paper-50 transition hover:bg-ink-800 disabled:opacity-50"
              >
                {submitting ? 'Sending…' : 'Resend as-is'}
              </button>
              <button
                type="button"
                onClick={() => setStage('edit')}
                className="flex-1 rounded-md border border-paper-200 px-5 py-2.5 text-sm font-medium text-ink-800 transition hover:border-signal-teal hover:text-signal-teal"
              >
                Edit before resending
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="mt-4 w-full text-center text-sm text-ink-700/60 hover:text-ink-900"
            >
              Cancel
            </button>
          </div>
        )}

        {stage === 'edit' && (
          <form onSubmit={(e) => e.preventDefault()}>
            <h3 className="font-display text-xl font-semibold text-ink-900">Edit before resending</h3>
            <p className="mt-1 text-sm text-ink-700/70">
              Candidate email can't be changed here since it's tied to their portal login.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Candidate name</label>
                <input
                  required
                  value={form.candidateName}
                  onChange={update('candidateName')}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Designation</label>
                <input required value={form.designation} onChange={update('designation')} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Department</label>
                <select required value={form.department} onChange={update('department')} className={inputClass}>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Employment type</label>
                <select value={form.employmentType} onChange={handleEmploymentTypeChange} className={inputClass}>
                  {EMPLOYMENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {isInternship && (
                <div>
                  <label className={labelClass}>Internship duration</label>
                  <select
                    required
                    value={form.internshipDurationMonths}
                    onChange={update('internshipDurationMonths')}
                    className={inputClass}
                  >
                    <option value="" disabled>
                      Select duration
                    </option>
                    {INTERNSHIP_DURATIONS.map((m) => (
                      <option key={m} value={m}>
                        {m} months
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className={labelClass}>Date of joining</label>
                <input
                  required
                  type="date"
                  value={form.dateOfJoining}
                  onChange={update('dateOfJoining')}
                  className={inputClass}
                />
              </div>

              {isInternship && (
                <div>
                  <label className={labelClass}>End date (auto-filled)</label>
                  <input
                    readOnly
                    value={computedEndDate}
                    className={`${inputClass} cursor-not-allowed bg-paper-100 text-ink-700/70`}
                  />
                </div>
              )}

              <div>
                <label className={labelClass}>Stipend / CTC</label>
                <input
                  required
                  value={form.stipendOrCTC}
                  onChange={update('stipendOrCTC')}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Reporting manager</label>
                <input
                  value={form.reportingManager}
                  onChange={update('reportingManager')}
                  className={inputClass}
                />
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-md bg-signal-roseLight px-4 py-2 text-sm text-signal-rose">{error}</div>
            )}

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setStage('choice')}
                className="rounded-md border border-paper-200 px-5 py-2.5 text-sm font-medium text-ink-800 transition hover:border-ink-900"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handlePreviewClick}
                className="rounded-md bg-ink-900 px-5 py-2.5 text-sm font-medium text-paper-50 transition hover:bg-ink-800"
              >
                Preview changes
              </button>
            </div>
          </form>
        )}

        {stage === 'preview' && (
          <div>
            <h3 className="font-display text-xl font-semibold text-ink-900">Preview updated letter</h3>
            <div className="mt-4">
              <OfferLetterPreview data={{ ...form, endDate: computedEndDate }} />
            </div>

            {error && (
              <div className="mt-4 rounded-md bg-signal-roseLight px-4 py-2 text-sm text-signal-rose">{error}</div>
            )}

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setStage('edit')}
                className="rounded-md border border-paper-200 px-5 py-2.5 text-sm font-medium text-ink-800 transition hover:border-ink-900"
              >
                Back to edit
              </button>
              <button
                type="button"
                onClick={handleConfirmResend}
                disabled={submitting}
                className="rounded-md bg-signal-teal px-5 py-2.5 text-sm font-medium text-white transition hover:bg-signal-teal/90 disabled:opacity-50"
              >
                {submitting ? 'Sending…' : 'Confirm & resend'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}