import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppData, DayLog, EMPTY_DATA, PeriodEntry, Settings } from '../types';
import { loadData, saveData } from '../utils/storage';

type AppDataContextType = {
  loading: boolean;
  periods: PeriodEntry[];
  logs: Record<string, DayLog>;
  settings: Settings;
  startPeriod: (startDate: string) => void;
  endPeriod: (id: string, endDate: string) => void;
  deletePeriod: (id: string) => void;
  saveLog: (log: DayLog) => void;
  updateSettings: (partial: Partial<Settings>) => void;
  resetAll: () => void;
};

const AppDataContext = createContext<AppDataContextType | null>(null);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);

  // load once on startup
  useEffect(() => {
    loadData().then((d) => {
      setData(d);
      setLoading(false);
    });
  }, []);

  // save whenever data changes (but not before the first load finishes)
  useEffect(() => {
    if (!loading) saveData(data);
  }, [data, loading]);

  const startPeriod = (startDate: string) =>
    setData((prev) => {
      if (prev.periods.some((p) => p.startDate === startDate)) return prev;
      const entry: PeriodEntry = { id: String(Date.now()), startDate };
      const periods = [...prev.periods, entry].sort((a, b) =>
        a.startDate.localeCompare(b.startDate)
      );
      return { ...prev, periods };
    });

  const endPeriod = (id: string, endDate: string) =>
    setData((prev) => ({
      ...prev,
      periods: prev.periods.map((p) => (p.id === id ? { ...p, endDate } : p)),
    }));

  const deletePeriod = (id: string) =>
    setData((prev) => ({
      ...prev,
      periods: prev.periods.filter((p) => p.id !== id),
    }));

  const saveLog = (log: DayLog) =>
    setData((prev) => ({ ...prev, logs: { ...prev.logs, [log.date]: log } }));

  const updateSettings = (partial: Partial<Settings>) =>
    setData((prev) => ({ ...prev, settings: { ...prev.settings, ...partial } }));

  const resetAll = () => setData(EMPTY_DATA);

  return (
    <AppDataContext.Provider
      value={{
        loading,
        periods: data.periods,
        logs: data.logs,
        settings: data.settings,
        startPeriod,
        endPeriod,
        deletePeriod,
        saveLog,
        updateSettings,
        resetAll,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used inside AppDataProvider');
  return ctx;
}
