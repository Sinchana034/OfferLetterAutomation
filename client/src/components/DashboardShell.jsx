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
    <div className="dashboard-shell min-h-screen">

      {/* ==================================================
          HEADER
      ================================================== */}
      <div className="border-b border-paper-200 bg-ink-900">
        <div
          className="
            mx-auto
            flex
            max-w-6xl
            items-center
            justify-between
            gap-4
            px-6
            py-4

            max-md:flex-wrap
            max-md:px-4
            max-md:py-3
          "
        >

          {/* Brand + Role */}
          <div
            className="
              flex
              items-baseline
              gap-3

              max-md:min-w-0
              max-md:flex-1
              max-md:flex-wrap
              max-md:gap-2
            "
          >
            <span
              className="
                font-display
                text-lg
                font-semibold
                text-paper-50

                max-md:text-base
              "
            >
              Offer Desk
            </span>

            <span className="record-id !text-ink-200 max-md:text-[10px]">
              {staffUser?.role &&
                `role · ${ROLE_LABEL[staffUser.role]}`}
            </span>
          </div>

          {/* User information + actions */}
          <div
            className="
              flex
              items-center
              gap-4

              max-md:w-full
              max-md:justify-between
              max-md:border-t
              max-md:border-ink-700
              max-md:pt-3
            "
          >

            {/* User */}
            <div className="min-w-0 text-right max-md:text-left">
              <p className="truncate text-sm font-medium text-paper-50">
                {staffUser?.name}
              </p>

              <p className="record-id truncate !text-ink-200">
                {staffUser?.email}
              </p>
            </div>

            {/* Buttons */}
            <div
              className="
                flex
                shrink-0
                items-center
                gap-2

                max-[380px]:flex-col
                max-[380px]:items-stretch
              "
            >
              <button
                onClick={() =>
                  window.open(
                    import.meta.env.VITE_GOOGLE_SHEETS_URL,
                    '_blank',
                    'noopener,noreferrer'
                  )
                }
                className="
                  rounded-md
                  border
                  border-paper-600
                  px-3
                  py-1.5
                  text-sm
                  text-paper-100
                  transition
                  hover:bg-ink-800

                  max-md:px-2.5
                  max-md:py-1.5
                  max-md:text-xs
                "
              >
                View Google Sheet
              </button>

              <button
                onClick={logout}
                className="
                  rounded-md
                  border
                  border-ink-700
                  px-3
                  py-1.5
                  text-sm
                  text-paper-100
                  transition
                  hover:bg-ink-800

                  max-md:px-2.5
                  max-md:py-1.5
                  max-md:text-xs
                "
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================
          MAIN CONTENT
      ================================================== */}
      <div
        className="
          dashboard-content
          mx-auto
          max-w-6xl
          px-6
          py-10

          max-md:px-4
          max-md:py-6

          max-sm:px-3
          max-sm:py-5
        "
      >
        {eyebrow && (
          <p
            className={`
              record-id
              mb-1
              uppercase
              ${ROLE_ACCENT[staffUser?.role] || ''}
            `}
          >
            {eyebrow}
          </p>
        )}

        <h1
          className="
            font-display
            text-3xl
            font-semibold
            text-ink-900

            max-md:text-2xl
            max-sm:text-xl
          "
        >
          {title}
        </h1>

        <div className="mt-8 max-md:mt-6">
          {children}
        </div>
      </div>
    </div>
  );
}