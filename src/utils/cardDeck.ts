import AsyncStorage from '@react-native-async-storage/async-storage';
import { Phase } from './prediction';
import { Card, CARDS } from '../content/cards';

const KEY = 'cycle-tracker:cards:v1';
export const DECK_SIZE = 10;

type State = { day: string; ids: string[]; seen: string[] };

let memo: { day: string; ids: string[] } | null = null;
export const peekDeck = (day: string): string[] | null => (memo && memo.day === day ? memo.ids : null);

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// avoid two cards of the same category in a row
function spread(list: Card[], rand: () => number): Card[] {
  const rest = shuffle(list, rand);
  const out: Card[] = [];
  while (rest.length) {
    const last = out[out.length - 1];
    let i = rest.findIndex((c) => !last || c.cat !== last.cat);
    if (i < 0) i = 0;
    out.push(rest.splice(i, 1)[0]);
  }
  return out;
}

function buildDeck(day: string, phase: Phase, seen: Set<string>, showLove: boolean): string[] {
  const rand = mulberry32(hash(day));
  const pool = CARDS.filter((c) => showLove || c.cat !== 'love');

  // cards you have not seen yet come first
  const prefer = (list: Card[]) => {
    const s = shuffle(list, rand);
    return [...s.filter((c) => !seen.has(c.id)), ...s.filter((c) => seen.has(c.id))];
  };

  const phaseCards = prefer(pool.filter((c) => c.cat !== 'love' && c.ph.includes(phase)));
  const loveCards = showLove
    ? prefer(pool.filter((c) => c.cat === 'love' && (c.ph.length === 0 || c.ph.includes(phase))))
    : [];
  const general = prefer(pool.filter((c) => c.cat !== 'love' && c.ph.length === 0));

  const picked: Card[] = [];
  const take = (list: Card[], n: number) => {
    for (const c of list) {
      if (n <= 0) break;
      if (!picked.includes(c)) {
        picked.push(c);
        n--;
      }
    }
  };
  take(phaseCards, 4);
  take(loveCards, 2);
  take(general, DECK_SIZE - picked.length);
  if (picked.length < DECK_SIZE) take(prefer(pool), DECK_SIZE - picked.length);

  return spread(picked, rand).map((c) => c.id);
}

// The same 10 cards all day, a new set each day.
export async function getTodayDeck(phase: Phase, showLove: boolean, today: string): Promise<string[]> {
  let st: State = { day: '', ids: [], seen: [] };
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) st = { ...st, ...JSON.parse(raw) };
  } catch {}

  if (st.day === today && st.ids.length) {
    memo = { day: today, ids: st.ids };
    return st.ids;
  }

  let seen = new Set<string>(st.seen);
  if (seen.size >= CARDS.length - DECK_SIZE) seen = new Set<string>(); // start a fresh round

  const ids = buildDeck(today, phase, seen, showLove);
  ids.forEach((id) => seen.add(id));
  memo = { day: today, ids };
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify({ day: today, ids, seen: [...seen] }));
  } catch {}
  return ids;
}

export async function clearCardState() {
  memo = null;
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {}
}
