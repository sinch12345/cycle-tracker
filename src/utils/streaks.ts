import { DayLog, PeriodEntry } from '../types';
import { addDays, diffDays } from './date';
import { getCycleLengths } from './prediction';

export const isLogged = (l?: DayLog): boolean =>
  !!l && (!!l.flow || !!l.mood || (l.symptoms?.length ?? 0) > 0 || !!l.notes);

export type StreakInfo = {
  current: number;
  best: number;
  total: number;
  todayDone: boolean;
  last7: { date: string; done: boolean }[];
};

export function computeStreaks(logs: Record<string, DayLog>, today: string): StreakInfo {
  const days = Object.keys(logs).filter((d) => isLogged(logs[d])).sort();
  const set = new Set(days);

  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of days) {
    run = prev && diffDays(d, prev) === 1 ? run + 1 : 1;
    if (run > best) best = run;
    prev = d;
  }

  const todayDone = set.has(today);
  let cursor = todayDone ? today : addDays(today, -1);
  let current = 0;
  while (set.has(cursor)) {
    current++;
    cursor = addDays(cursor, -1);
  }

  const last7 = [-6, -5, -4, -3, -2, -1, 0].map((n) => {
    const date = addDays(today, n);
    return { date, done: set.has(date) };
  });

  return { current, best, total: days.length, todayDone, last7 };
}

const E = (...cp: number[]) => String.fromCodePoint(...cp);

export type Badge = {
  id: string;
  emoji: string;
  title: string;
  desc: string;
  value: number;
  target: number;
  earned: boolean;
};

export function computeBadges(
  logs: Record<string, DayLog>,
  periods: PeriodEntry[],
  streak: StreakInfo
): Badge[] {
  const all = Object.values(logs);
  const symptomDays = all.filter((l) => (l.symptoms?.length ?? 0) > 0).length;
  const moodDays = all.filter((l) => !!l.mood).length;
  const cycles = getCycleLengths(periods).length;

  const defs: [string, string, string, string, number, number][] = [
    ['first', E(0x1F331), 'First step', 'Log your first day', streak.total, 1],
    ['s3', E(0x1F525), '3 in a row', 'Log 3 days in a row', streak.best, 3],
    ['s7', E(0x2B50), 'One week streak', 'Log 7 days in a row', streak.best, 7],
    ['s14', E(0x1F31F), 'Two weeks strong', 'Log 14 days in a row', streak.best, 14],
    ['s30', E(0x1F3C6), '30-day streak', 'Log 30 days in a row', streak.best, 30],
    ['d10', E(0x1F4D2), '10 days logged', 'Log 10 days in total', streak.total, 10],
    ['d30', E(0x1F4DA), '30 days logged', 'Log 30 days in total', streak.total, 30],
    ['d100', E(0x1F48E), '100 days logged', 'Log 100 days in total', streak.total, 100],
    ['p1', E(0x1F4A7), 'Period tracked', 'Log your first period', periods.length, 1],
    ['c1', E(0x1F319), 'First full cycle', 'Track one complete cycle', cycles, 1],
    ['c3', E(0x1F315), 'Three cycles', 'Track three complete cycles', cycles, 3],
    ['sym10', E(0x1F50D), 'Symptom spotter', 'Log symptoms on 10 days', symptomDays, 10],
    ['mood10', E(0x1F60A), 'Mood mapper', 'Log your mood on 10 days', moodDays, 10],
  ];

  return defs.map(([id, emoji, title, desc, value, target]) => ({
    id, emoji, title, desc, value, target, earned: value >= target,
  }));
}
