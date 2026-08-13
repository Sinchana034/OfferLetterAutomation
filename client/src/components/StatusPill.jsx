const STYLES = {
  Sent: 'bg-signal-tealLight text-signal-teal',
  Pending: 'bg-signal-amberLight text-signal-amber',
  Failed: 'bg-signal-roseLight text-signal-rose',
};

const DOT = {
  Sent: 'bg-signal-teal',
  Pending: 'bg-signal-amber',
  Failed: 'bg-signal-rose',
};

export default function StatusPill({ status }) {
  const style = STYLES[status] || 'bg-ink-100 text-ink-700';
  const dot = DOT[status] || 'bg-ink-500';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${style}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {status}
    </span>
  );
}
