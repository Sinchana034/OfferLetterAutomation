import { useEffect, useState } from 'react';
import { api } from '../api/client';

// Fetches the active manager list once. Both GenerateOfferForm and
// ResendModal use this to populate the "Reporting Manager" dropdown,
// filtered down to the currently selected department.
export function useManagers() {
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/users/managers')
      .then(({ data }) => {
        if (!cancelled) setManagers(data.managers);
      })
      .catch(() => {
        if (!cancelled) setManagers([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { managers, loading };
}