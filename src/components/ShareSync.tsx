import { useEffect } from 'react';
import { useAppData } from '../context/AppDataContext';
import { getOwnerShare, pushSnapshot } from '../services/sharing';

// Keeps the encrypted partner summary up to date. Renders nothing,
// and does nothing at all unless sharing has been started.
export default function ShareSync() {
  const { loading, periods, logs, settings } = useAppData();

  useEffect(() => {
    if (loading) return;
    const t = setTimeout(async () => {
      try {
        if (!(await getOwnerShare())) return;
        await pushSnapshot(periods, logs, settings);
      } catch (e) {
        console.warn('Share sync failed', e);
      }
    }, 2500);
    return () => clearTimeout(t);
  }, [loading, periods, logs, settings]);

  return null;
}
