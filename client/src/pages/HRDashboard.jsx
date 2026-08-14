import { useEffect, useState } from 'react';
import { api, getErrorMessage } from '../api/client';
import DashboardShell from '../components/DashboardShell';
import OfferTable from '../components/OfferTable';
import GenerateOfferForm from '../components/GenerateOfferForm';

export default function HRDashboard() {
  const [tab, setTab] = useState('generate');

  const [stats, setStats] = useState({
    totalCandidates: 0,
    selectedCandidates: 0,
    offersGenerated: 0,
    emailsSent: 0,
    pendingEmails: 0,
    failedEmails: 0,
  });

  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setStatsLoading(true);

        const { data } = await api.get('/offers/stats');

        setStats(data.stats);
      } catch (err) {
        console.error(
          'Failed to load HR dashboard stats:',
          getErrorMessage(err)
        );
      } finally {
        setStatsLoading(false);
      }
    };

    loadStats();
  }, []);

  const tabs = [
    { id: 'generate', label: 'Generate offer' },
    { id: 'offers', label: 'All offer letters' },
  ];

  return (
    <DashboardShell eyebrow="HR desk" title="Offer letter management">

      {/* Dashboard Statistics */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="dashboard-card p-6">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-700/60">
            Total Candidates
          </p>
          <p className="relative z-10 mt-3 text-4xl font-bold tracking-tight text-signal-violet">
            {statsLoading ? '—' : stats.totalCandidates}
          </p>
        </div>

        <div className="dashboard-card p-6">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-700/60">
            Selected Candidates
          </p>
          <p className="relative z-10 mt-3 text-4xl font-bold tracking-tight text-signal-violet">
            {statsLoading ? '—' : stats.selectedCandidates}
          </p>
        </div>

        <div className="dashboard-card p-6">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-700/60">
            Offers Generated
          </p>
          <p className="mt-2 text-3xl font-semibold text-signal-violet">
            {statsLoading ? '—' : stats.offersGenerated}
          </p>
        </div>

        <div className="dashboard-card p-6">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-700/60">
            Emails Sent
          </p>
          <p className="mt-2 text-3xl font-semibold text-signal-teal">
            {statsLoading ? '—' : stats.emailsSent}
          </p>
        </div>

        <div className="dashboard-card p-6">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-700/60">
            Pending Emails
          </p>
          <p className="mt-2 text-3xl font-semibold text-signal-amber">
            {statsLoading ? '—' : stats.pendingEmails}
          </p>
        </div>

        <div className="dashboard-card p-6">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-700/60">
            Failed Emails
          </p>
          <p className="mt-2 text-3xl font-semibold text-signal-rose">
            {statsLoading ? '—' : stats.failedEmails}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 rounded-xl border border-paper-200/80 bg-white/60 p-1 backdrop-blur-md">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
            tab === t.id
              ? 'bg-ink-900 text-white shadow-sm'
              : 'text-ink-700/60 hover:bg-white/80 hover:text-ink-900'
          }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'generate' && <GenerateOfferForm />}
      {tab === 'offers' && <OfferTable canResend />}
    </DashboardShell>
  );
}