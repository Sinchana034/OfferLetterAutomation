import { useAuth } from '../context/AuthContext';

const ROLE_LABEL = {
  admin: 'Administrator',
  hr: 'HR Executive',
  manager: 'Department Manager',
};

const ROLE_ACCENT = {
  admin: 'text-signal-violet',
  hr: 'text-signal-teal',
  manager: 'text-signal-amber',
};

export default function DashboardShell({ title, eyebrow, children }) {
  const { staffUser, logout } = useAuth();

  return (
    <div className="min-h-screen bg-paper-50">
      <div className="border-b border-paper-200 bg-ink-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-baseline gap-3">
            <span className="font-display text-lg font-semibold text-paper-50">Offer Desk</span>
            <span className={`record-id !text-ink-200`}>
              {staffUser?.role && `role · ${ROLE_LABEL[staffUser.role]}`}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-paper-50">{staffUser?.name}</p>
              <p className="record-id !text-ink-200">{staffUser?.email}</p>
            </div>
            <button
                onClick={() =>
                  window.open(
                    import.meta.env.VITE_GOOGLE_SHEETS_URL,
                    '_blank',
                    'noopener,noreferrer'
                  )
                }
                className="rounded-md border border-paper-600 px-3 py-1.5 text-sm text-paper-100 transition hover:bg-ink-800"
            >
                View Google Sheet
            </button>
            <button
              onClick={logout}
              className="rounded-md border border-ink-700 px-3 py-1.5 text-sm text-paper-100 transition hover:bg-ink-800"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-10">
        {eyebrow && (
          <p className={`record-id mb-1 uppercase ${ROLE_ACCENT[staffUser?.role] || ''}`}>{eyebrow}</p>
        )}
        <h1 className="font-display text-3xl font-semibold text-ink-900">{title}</h1>
        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}
