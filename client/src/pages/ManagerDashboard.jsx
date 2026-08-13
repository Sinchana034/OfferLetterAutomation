import { useAuth } from '../context/AuthContext';
import DashboardShell from '../components/DashboardShell';
import OfferTable from '../components/OfferTable';

export default function ManagerDashboard() {
  const { staffUser } = useAuth();

  return (
    <DashboardShell eyebrow={`${staffUser?.department || ''} department`} title="Department offer records">
      <p className="mb-6 max-w-2xl text-sm text-ink-700/70">
        You're viewing offer letters for the <strong>{staffUser?.department}</strong> department only.
        This view is read-only — reach out to HR to generate or resend a letter.
      </p>
      <OfferTable canResend={false} />
    </DashboardShell>
  );
}
