import { useEffect } from 'react';
import { useAppData } from '../context/AppDataContext';
import { getPrediction } from '../utils/prediction';
import { cancelReminders, scheduleReminders } from '../utils/notifications';

// Keeps scheduled reminders in sync with the data. Renders nothing.
export default function ReminderSync() {
  const { loading, periods, settings } = useAppData();

  useEffect(() => {
    if (loading) return;
    if (!settings.remindersEnabled) {
      cancelReminders().catch(() => {});
      return;
    }
    const p = getPrediction(periods, settings);
    scheduleReminders(p.nextPeriodStart).catch((e) => console.warn('Reminder error', e));
  }, [loading, periods, settings]);

  return null;
}
