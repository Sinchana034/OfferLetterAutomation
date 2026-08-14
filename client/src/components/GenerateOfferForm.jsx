import { useState, useMemo } from 'react';
import { api, getErrorMessage } from '../api/client';
import {
  DEPARTMENTS,
  EMPLOYMENT_TYPES,
  INTERNSHIP_DURATIONS,
  addMonthsToDateString,
} from '../constants';
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
  const [step, setStep] = useState('form');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const update = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const isInternship = form.employmentType === 'Internship';

  const { managers } = useManagers();

  const managersInDepartment = useMemo(
    () => managers.filter((m) => m.department === form.department),
    [managers, form.department]
  );

  // Live preview only - backend remains the source of truth.
  const computedEndDate = useMemo(() => {
    if (!isInternship) return '';

    return addMonthsToDateString(
      form.dateOfJoining,
      form.internshipDurationMonths
    );
  }, [
    isInternship,
    form.dateOfJoining,
    form.internshipDurationMonths,
  ]);

  const handleEmploymentTypeChange = (e) => {
    const value = e.target.value;

    setForm((f) => ({
      ...f,
      employmentType: value,
      internshipDurationMonths:
        value === 'Internship'
          ? f.internshipDurationMonths
          : '',
    }));
  };

  // Existing validation logic.
  const handlePreviewClick = (e) => {
    const formEl = e.target.closest('form');

    if (!formEl.reportValidity()) return;

    setError('');
    setStep('preview');
  };

  // Existing API/send logic.
  const handleConfirmSend = async () => {
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const payload = { ...form };

      if (!isInternship) {
        delete payload.internshipDurationMonths;
      }

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
      setStep('form');
    } finally {
      setSubmitting(false);
    }
  };

  /* --------------------------------------------------
     UI classes only
  -------------------------------------------------- */

  const inputClass = `
    w-full
    rounded-xl
    border
    border-paper-200
    bg-white/80
    px-4
    py-3
    text-sm
    text-ink-900
    outline-none
    backdrop-blur-sm
    transition-all
    duration-200
    placeholder:text-ink-700/40
    hover:border-paper-300
    hover:bg-white
    focus:border-signal-teal
    focus:bg-white
    focus:ring-4
    focus:ring-signal-teal/10
  `;

  const labelClass = `
    mb-1.5
    block
    text-xs
    font-semibold
    uppercase
    tracking-wide
    text-ink-700/70
  `;

  /* --------------------------------------------------
     Preview
  -------------------------------------------------- */

  if (step === 'preview') {
    return (
      <div>
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="record-id uppercase text-signal-teal">
              Preview
            </p>

            <h3 className="mt-1 font-display text-xl font-semibold text-ink-900">
              This is what {form.candidateName || 'the candidate'} will receive
            </h3>
          </div>

          <button
            type="button"
            onClick={() => setStep('form')}
            className="
              w-fit
              rounded-xl
              border
              border-paper-200
              bg-white/80
              px-4
              py-2.5
              text-sm
              font-medium
              text-ink-800
              backdrop-blur-sm
              transition
              hover:border-ink-300
              hover:bg-white
            "
          >
            ← Edit details
          </button>
        </div>

        <div
          className="
            rounded-2xl
            border
            border-paper-200
            bg-white/85
            p-6
            shadow-sm
            backdrop-blur-md
          "
        >
          <OfferLetterPreview
            data={{
              ...form,
              endDate: computedEndDate,
            }}
          />
        </div>

        {error && (
          <div className="mt-5 rounded-xl border border-signal-rose/20 bg-signal-roseLight px-4 py-3 text-sm text-signal-rose">
            {error}
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setStep('form')}
            className="
              rounded-xl
              border
              border-paper-200
              bg-white/80
              px-5
              py-2.5
              text-sm
              font-medium
              text-ink-800
              transition
              hover:border-ink-300
              hover:bg-white
            "
          >
            Edit
          </button>

          <button
            type="button"
            onClick={handleConfirmSend}
            disabled={submitting}
            className="
              rounded-xl
              bg-ink-900
              px-5
              py-2.5
              text-sm
              font-medium
              text-paper-50
              shadow-sm
              transition-all
              duration-200
              hover:-translate-y-0.5
              hover:bg-ink-800
              hover:shadow-md
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            {submitting
              ? 'Sending…'
              : 'Confirm & send offer letter'}
          </button>
        </div>
      </div>
    );
  }

  /* --------------------------------------------------
     Generate Offer Form
  -------------------------------------------------- */

  return (
    <form
      className="
        overflow-hidden
        rounded-2xl
        border
        border-white/80
        bg-white/75
        shadow-sm
        backdrop-blur-md
      "
      onSubmit={(e) => e.preventDefault()}
    >
      {/* Header */}

      <div className="border-b border-paper-200 px-6 py-6">
        <p className="record-id uppercase text-signal-teal">
          New offer
        </p>

        <h2 className="mt-1 font-display text-xl font-semibold text-ink-900">
          Generate offer letter
        </h2>

        <p className="mt-1 max-w-2xl text-sm text-ink-700/60">
          Enter the candidate details below to create and preview
          the offer letter.
        </p>
      </div>

      {/* Fields */}

      <div className="grid grid-cols-1 gap-x-6 gap-y-5 p-6 sm:grid-cols-2">

        {/* Candidate name */}

        <div>
          <label className={labelClass}>
            Candidate name
          </label>

          <input
            required
            type="text"
            placeholder="Enter candidate name"
            value={form.candidateName}
            onChange={update('candidateName')}
            className={inputClass}
          />
        </div>

        {/* Candidate email */}

        <div>
          <label className={labelClass}>
            Candidate email
          </label>

          <input
            required
            type="email"
            placeholder="candidate@example.com"
            value={form.candidateEmail}
            onChange={update('candidateEmail')}
            className={inputClass}
          />
        </div>

        {/* Designation */}

        <div>
          <label className={labelClass}>
            Designation
          </label>

          <input
            required
            type="text"
            placeholder="e.g. Software Engineer Intern"
            value={form.designation}
            onChange={update('designation')}
            className={inputClass}
          />
        </div>

        {/* Department */}

        <div>
          <label className={labelClass}>
            Department
          </label>

          <select
            required
            value={form.department}
            onChange={update('department')}
            className={inputClass}
          >
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

        {/* Employment type */}

        <div>
          <label className={labelClass}>
            Employment type
          </label>

          <select
            value={form.employmentType}
            onChange={handleEmploymentTypeChange}
            className={inputClass}
          >
            {EMPLOYMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Internship duration */}

        {isInternship && (
          <div>
            <label className={labelClass}>
              Internship duration
            </label>

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

        {/* Joining date */}

        <div>
          <label className={labelClass}>
            Date of joining
          </label>

          <input
            required
            type="date"
            value={form.dateOfJoining}
            onChange={update('dateOfJoining')}
            className={inputClass}
          />
        </div>

        {/* End date */}

        {isInternship && (
          <div>
            <label className={labelClass}>
              End date
            </label>

            <div className="relative">
              <input
                readOnly
                value={computedEndDate}
                placeholder="Set start date + duration first"
                className={`
                  ${inputClass}
                  cursor-not-allowed
                  bg-paper-50
                  pr-14
                  text-ink-700/70
                `}
              />

              {computedEndDate && (
                <span
                  className="
                    absolute
                    right-3
                    top-1/2
                    -translate-y-1/2
                    rounded-full
                    bg-signal-tealLight
                    px-2
                    py-0.5
                    text-[10px]
                    font-semibold
                    uppercase
                    tracking-wide
                    text-signal-teal
                  "
                >
                  Auto
                </span>
              )}
            </div>
          </div>
        )}

        {/* Stipend */}

        <div>
          <label className={labelClass}>
            Stipend / CTC
          </label>

          <input
            required
            type="text"
            placeholder="e.g. ₹25,000 / month"
            value={form.stipendOrCTC}
            onChange={update('stipendOrCTC')}
            className={inputClass}
          />
        </div>

        {/* Reporting manager */}

        <div className="sm:col-span-2">
          <label className={labelClass}>
            Reporting manager
          </label>

          {form.department &&
          managersInDepartment.length === 0 ? (
            <div className="rounded-xl border border-dashed border-paper-300 bg-paper-50/80 px-4 py-3 text-sm text-ink-700/60">
              No manager assigned to{' '}
              <strong className="font-medium text-ink-800">
                {form.department}
              </strong>{' '}
              yet — leave blank or ask Admin to create one.
            </div>
          ) : (
            <select
              value={form.reportingManager}
              onChange={update('reportingManager')}
              className={inputClass}
            >
              <option value="">
                No reporting manager
              </option>

              {managersInDepartment.map((m) => (
                <option key={m._id} value={m.name}>
                  {m.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Messages */}

      <div className="px-6">
        {error && (
          <div className="rounded-xl border border-signal-rose/20 bg-signal-roseLight px-4 py-3 text-sm text-signal-rose">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-signal-teal/20 bg-signal-tealLight px-4 py-3 text-sm text-signal-teal">
            {success}
          </div>
        )}
      </div>

      {/* Footer */}

      <div className="mt-6 flex flex-col gap-4 border-t border-paper-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-ink-700/50">
          All required fields must be completed.
        </p>

        <button
          type="button"
          onClick={handlePreviewClick}
          className="
            w-full
            rounded-xl
            bg-ink-900
            px-6
            py-3
            text-sm
            font-medium
            text-paper-50
            shadow-sm
            transition-all
            duration-200
            hover:-translate-y-0.5
            hover:bg-ink-800
            hover:shadow-md
            active:translate-y-0
            sm:w-auto
          "
        >
          Preview offer letter →
        </button>
      </div>
    </form>
  );
}