export type PeriodEntry = {
  id: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string;  // YYYY-MM-DD, empty while period is ongoing
};

export type FlowLevel = 'spotting' | 'light' | 'medium' | 'heavy';

export type DayLog = {
  date: string; // YYYY-MM-DD
  flow?: FlowLevel;
  symptoms: string[];
  mood?: string;
  notes?: string;
};

export type Settings = {
  cycleLength: number;   // default average cycle length
  periodLength: number;  // default average period length
  remindersEnabled: boolean;
};

export type AppData = {
  periods: PeriodEntry[];
  logs: Record<string, DayLog>; // keyed by date
  settings: Settings;
};

export const DEFAULT_SETTINGS: Settings = {
  cycleLength: 28,
  periodLength: 5,
  remindersEnabled: false,
};

export const EMPTY_DATA: AppData = {
  periods: [],
  logs: {},
  settings: DEFAULT_SETTINGS,
};
