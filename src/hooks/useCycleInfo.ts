import { useMemo } from 'react';
import { useAppData } from '../context/AppDataContext';
import { todayISO } from '../utils/date';
import { getDayStatuses, getPrediction, Phase } from '../utils/prediction';
import { PHASE_INFO, pregnancyChance } from '../utils/phaseContent';

export function useCycleInfo() {
  const { periods, settings } = useAppData();
  const today = todayISO();
  const p = useMemo(() => getPrediction(periods, settings, today), [periods, settings, today]);
  const statuses = useMemo(() => getDayStatuses(periods, settings), [periods, settings]);
  const phase: Phase | null = p.hasData ? (p.phase as Phase) : null;
  const info = phase ? PHASE_INFO[phase] : null;
  const day = p.hasData ? Math.max(1, p.cycleDay as number) : 0;
  const chance = pregnancyChance(p, today);
  return { today, p, statuses, phase, info, day, chance, showIntimacy: settings.showIntimacy !== false };
}
