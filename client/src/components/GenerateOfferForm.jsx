import { useState, useMemo } from 'react';
import { api, getErrorMessage } from '../api/client';
import { DEPARTMENTS, EMPLOYMENT_TYPES, INTERNSHIP_DURATIONS, addMonthsToDateString } from '../constants';
import { useManagers } from '../hooks/useManagers';
import OfferLetterPreview from './OfferLetterPreview';

const EMPTY = {
  candidateName: '',
  candidateEmail: '',
  designation: '',
  department: '',
  employmentType: 'Internship',
  internshipDurationMonths: '',
  dateOfJoining: '',
  stipendOrCTC: '',
  reportingManager: '',
};

export default function GenerateOfferForm({ onGenerated }) {
  const [form, setForm] = useState(EMPTY);
  const [step, setStep] = useState('form'); // 'form' | 'preview'
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const isInternship = form.employmentType === 'Internship';

  const { managers } = useManagers();
  const managersInDepartment = useMemo(
    () => managers.filter((m) => m.department === form.department),
    [managers, form.department]
  );

  // Live preview only - the backend recomputes this itself as the source of truth.
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

  // Native form validation (required fields, email format) before allowing
  // the person into the preview step - reuses the browser's own validity check.
  const handlePreviewClick = (e) => {
    const formEl = e.target.closest('form');
    if (!formEl.reportValidity()) return;
    setError('');
    setStep('preview');
  };

  const handleConfirmSend = async () => {
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const payload = { ...form };
      if (!isInternship) delete payload.internshipDurationMonths;
      const { data } = await api.post('/offers/generate', payload);
      const status = data.offer.emailStatus;
      setSuccess(
        status === 'Sent'
          ? `Offer letter generated and emailed to ${data.offer.candidateName}.`
          : `Offer letter created, but the email is "${status}". Check the records table and retry from there if needed.`
      );
      setForm(EMPTY);
      setStep('form');
      onGenerated?.();
    } catch (err) {
      setError(getErrorMessage(err));
      setStep('form'); // send the person back to fix whatever the backend rejected
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-md border border-paper-200 bg-white px-3 py-2 text-sm outline-none focus:border-signal-teal';
  const labelClass = 'mb-1 block text-xs font-medium uppercase tracking-wide text-ink-700/70';

  if (step === 'preview') {
    return (
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="record-id uppercase text-signal-teal">Preview</p>
            <h3 className="font-display text-lg font-semibold text-ink-900">
              This is what {form.candidateName || 'the candidate'} will receive
            </h3>
          </div>
        </div>

        <OfferLetterPreview data={{ ...form, endDate: computedEndDate }} />

        {error && (
          <div className="mt-4 rounded-md bg-signal-roseLight px-4 py-2 text-sm text-signal-rose">{error}</div>
        )}

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={() => setStep('form')}
            className="rounded-md border border-paper-200 px-5 py-2.5 text-sm font-medium text-ink-800 transition hover:border-ink-900"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={handleConfirmSend}
            disabled={submitting}
            className="rounded-md bg-ink-900 px-5 py-2.5 text-sm font-medium text-paper-50 transition hover:bg-ink-800 disabled:opacity-50"
          >
            {submitting ? 'Sending…' : 'Confirm & send offer letter'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="rounded-lg border border-paper-200 bg-white p-6" onSubmit={(e) => e.preventDefault()}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Candidate name</label>
          <input required value={form.candidateName} onChange={update('candidateName')} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Candidate email</label>
          <input
            required
            type="email"
            value={form.candidateEmail}
            onChange={update('candidateEmail')}
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
              placeholder="Set start date + duration first"
              className={`${inputClass} cursor-not-allowed bg-paper-100 text-ink-700/70`}
            />
          </div>
        )}

        <div>
          <label className={labelClass}>Stipend / CTC</label>
          <input required value={form.stipendOrCTC} onChange={update('stipendOrCTC')} className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Reporting manager</label>
          {form.department && managersInDepartment.length === 0 ? (
            <div className="rounded-md border border-dashed border-paper-200 bg-paper-50 px-3 py-2 text-sm text-ink-700/60">
              No manager assigned to {form.department} yet — leave blank or ask Admin to create one.
            </div>
          ) : (
            <select value={form.reportingManager} onChange={update('reportingManager')} className={inputClass}>
              <option value="">No reporting manager</option>
              {managersInDepartment.map((m) => (
                <option key={m._id} value={m.name}>
                  {m.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {error && <div className="mt-4 rounded-md bg-signal-roseLight px-4 py-2 text-sm text-signal-rose">{error}</div>}
      {success && (
        <div className="mt-4 rounded-md bg-signal-tealLight px-4 py-2 text-sm text-signal-teal">{success}</div>
      )}

      <button
        type="button"
        onClick={handlePreviewClick}
        className="mt-5 rounded-md bg-ink-900 px-5 py-2.5 text-sm font-medium text-paper-50 transition hover:bg-ink-800"
      >
        Preview offer letter
      </button>
    </form>
  );
}