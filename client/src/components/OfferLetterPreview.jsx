const formatDate = (dateString) => {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
};

// Mirrors the fields shown on the actual PDF (server/templates/offerLetter.html)
// so what the person sees here is a faithful preview of what gets sent.
export default function OfferLetterPreview({ data, companyName = 'RGT-vertex' }) {
  const isInternship = data.employmentType === 'Internship';

  const rows = [
    ['Candidate Name', data.candidateName || '—'],
    ['Designation', data.designation || '—'],
    ['Department', data.department || '—'],
    ['Employment Type', data.employmentType || '—'],
    ['Duration', isInternship ? `${data.internshipDurationMonths || '—'} months` : 'N/A (Full-time)'],
    ['Date of Joining', formatDate(data.dateOfJoining)],
    ['End Date', isInternship ? formatDate(data.endDate) : 'N/A'],
    ['Stipend / CTC', data.stipendOrCTC || '—'],
    ['Reporting Manager', data.reportingManager || 'N/A'],
  ];

  return (
    <div className="rounded-lg border border-paper-200 bg-white p-8">
      <div className="mb-6 flex items-center justify-between border-b-2 border-signal-teal pb-3">
        <span className="font-display text-lg font-semibold text-signal-teal">{companyName}</span>
        <span className="record-id">{formatDate(new Date())}</span>
      </div>

      <p className="text-sm text-ink-900">
        Dear <strong>{data.candidateName || '[Candidate Name]'}</strong>,
      </p>
      <p className="mt-3 text-sm font-semibold underline underline-offset-2">
        Subject: Offer of {data.employmentType || 'Employment'} - {data.designation || '[Designation]'}
      </p>
      <p className="mt-3 text-sm leading-relaxed text-ink-800">
        We are pleased to offer you the position of <strong>{data.designation || '[Designation]'}</strong> in the{' '}
        <strong>{data.department || '[Department]'}</strong> department at {companyName}. This letter outlines the
        key terms of your engagement with us.
      </p>

      <table className="mt-5 w-full text-sm">
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label} className="border-b border-paper-200">
              <td className="w-48 py-2 font-medium text-ink-700">{label}</td>
              <td className="py-2 text-ink-900">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-5 text-sm leading-relaxed text-ink-800">
        Please confirm your acceptance of this offer by logging into your candidate portal. We look forward to
        having you on the team.
      </p>

      <p className="mt-6 text-sm text-ink-800">
        Warm regards,
        <br />
        <strong>HR Team</strong>
        <br />
        {companyName}
      </p>
    </div>
  );
}