import { PeriodEntry, Settings } from '../types';
import { addDays, diffDays, todayISO } from './date';

export type Phase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal';
export type DayStatus = 'period' | 'predictedPeriod' | 'ovulation' | 'fertile';

const MIN_CYCLE = 15;
const MAX_CYCLE = 60;
const LUTEAL_PHASE = 14;

const sortPeriods = (periods: PeriodEntry[]) =>
  [...periods].sort((a, b) => a.startDate.localeCompare(b.startDate));

const average = (nums: number[]) =>
  Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);

export function getCycleLengths(periods: PeriodEntry[]): number[] {
  const sorted = sortPeriods(periods);
  const lengths: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const len = diffDays(sorted[i].startDate, sorted[i - 1].startDate);
    if (len >= MIN_CYCLE && len <= MAX_CYCLE) lengths.push(len);
  }
  return lengths;
}

export function averageCycleLength(periods: PeriodEntry[], settings: Settings): number {
  const recent = getCycleLengths(periods).slice(-6);
  return recent.length ? average(recent) : settings.cycleLength;
}

export function averagePeriodLength(periods: PeriodEntry[], settings: Settings): number {
  const lens = sortPeriods(periods)
    .filter((p) => p.endDate)
    .map((p) => diffDays(p.endDate as string, p.startDate) + 1)
    .filter((n) => n >= 1 && n <= 14)
    .slice(-6);
  return lens.length ? average(lens) : settings.periodLength;
}

export type Prediction = {
  hasData: boolean;
  cycleLength: number;
  periodLength: number;
  lastPeriodStart: string | null;
  cycleDay: number | null;
  phase: Phase | null;
  nextPeriodStart: string | null;
  daysUntilNextPeriod: number | null; // negative = late
  ovulationDate: string | null;
  fertileStart: string | null;
  fertileEnd: string | null;
};

export function getPrediction(
  periods: PeriodEntry[],
  settings: Settings,
  today: string = todayISO()
): Prediction {
  const cycleLength = averageCycleLength(periods, settings);
  const periodLength = averagePeriodLength(periods, settings);

  if (periods.length === 0) {
    return {
      hasData: false, cycleLength, periodLength, lastPeriodStart: null,
      cycleDay: null, phase: null, nextPeriodStart: null,
      daysUntilNextPeriod: null, ovulationDate: null,
      fertileStart: null, fertileEnd: null,
    };
  }

  const sorted = sortPeriods(periods);
  const lastStart = sorted[sorted.length - 1].startDate;
  const cycleDay = diffDays(today, lastStart) + 1;

  const nextPeriodStart = addDays(lastStart, cycleLength);
  const ovulationDate = addDays(nextPeriodStart, -LUTEAL_PHASE);
  const ovulationDay = Math.max(periodLength + 1, cycleLength - LUTEAL_PHASE);

  let phase: Phase;
  if (cycleDay <= periodLength) phase = 'menstrual';
  else if (cycleDay === ovulationDay) phase = 'ovulation';
  else if (cycleDay < ovulationDay) phase = 'follicular';
  else phase = 'luteal';

  return {
    hasData: true,
    cycleLength,
    periodLength,
    lastPeriodStart: lastStart,
    cycleDay,
    phase,
    nextPeriodStart,
    daysUntilNextPeriod: diffDays(nextPeriodStart, today),
    ovulationDate,
    fertileStart: addDays(ovulationDate, -5),
    fertileEnd: addDays(ovulationDate, 1),
  };
}

// Builds a date -> status map for the calendar (Step 5).
// Priority: logged period > predicted period > ovulation > fertile.
export function getDayStatuses(
  periods: PeriodEntry[],
  settings: Settings,
  futureCycles = 6,
  today: string = todayISO()
): Record<string, DayStatus> {
  const map: Record<string, DayStatus> = {};
  if (periods.length === 0) return map;

  const cycleLength = averageCycleLength(periods, settings);
  const periodLength = averagePeriodLength(periods, settings);
  const sorted = sortPeriods(periods);
  const lastStart = sorted[sorted.length - 1].startDate;

  const set = (date: string, status: DayStatus, override = false) => {
    if (override || !map[date]) map[date] = status;
  };

  // 1) logged periods
  for (const p of sorted) {
    let end = p.endDate;
    if (!end) {
      const planned = addDays(p.startDate, periodLength - 1);
      end = today > p.startDate && today < planned ? today : planned;
    }
    const n = diffDays(end, p.startDate);
    for (let i = 0; i <= n; i++) set(addDays(p.startDate, i), 'period', true);
  }

  // 2) predicted cycles
  for (let k = 1; k <= futureCycles; k++) {
    const start = addDays(lastStart, k * cycleLength);
    for (let i = 0; i < periodLength; i++) set(addDays(start, i), 'predictedPeriod');
    const ov = addDays(start, -LUTEAL_PHASE);
    set(ov, 'ovulation');
    for (let i = -5; i <= 1; i++) if (i !== 0) set(addDays(ov, i), 'fertile');
  }

  return map;
}
