import * as SecureStore from 'expo-secure-store';
import { db, getSession } from './cloud';
import { decryptJson, encryptJson, newPairing, parseCode } from './crypto';
import { DayLog, PeriodEntry, Settings } from '../types';
import { getPrediction } from '../utils/prediction';
import { todayISO } from '../utils/date';

export type ShareLevel = 'basic' | 'detailed';

// Notes are never included.
export type Snapshot = {
  v: 1;
  name: string;
  level: ShareLevel;
  lastPeriodStart: string | null;
  cycleLength: number;
  periodLength: number;
  updatedAt: number;
  today?: { flow?: string; symptoms: string[]; mood?: string };
};

export type OwnerShare = { id: string; code: string; level: ShareLevel; name: string };
type ViewerLink = { id: string; code: string };

const OWNER_KEY = 'ct_share_owner';
const VIEWER_KEY = 'ct_share_viewer';

async function readJson<T>(k: string): Promise<T | null> {
  try {
    const raw = await SecureStore.getItemAsync(k);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export const getOwnerShare = () => readJson<OwnerShare>(OWNER_KEY);
export const getViewerLink = () => readJson<ViewerLink>(VIEWER_KEY);

export function buildSnapshot(
  periods: PeriodEntry[],
  logs: Record<string, DayLog>,
  settings: Settings,
  level: ShareLevel,
  name: string
): Snapshot {
  const p = getPrediction(periods, settings);
  const snap: Snapshot = {
    v: 1,
    name,
    level,
    lastPeriodStart: p.lastPeriodStart,
    cycleLength: p.cycleLength,
    periodLength: p.periodLength,
    updatedAt: Date.now(),
  };
  if (level === 'detailed') {
    const l = logs[todayISO()];
    snap.today = { flow: l?.flow, symptoms: l?.symptoms ?? [], mood: l?.mood };
  }
  return snap;
}

// the partner's phone works out phase and dates from the shared basics
export function predictionFromSnapshot(s: Snapshot) {
  const periods: PeriodEntry[] = s.lastPeriodStart
    ? [{ id: 'shared', startDate: s.lastPeriodStart }]
    : [];
  return getPrediction(periods, {
    cycleLength: s.cycleLength,
    periodLength: s.periodLength,
    remindersEnabled: false,
  });
}

// ---------- sharer side ----------
export async function startSharing(
  level: ShareLevel,
  name: string,
  periods: PeriodEntry[],
  logs: Record<string, DayLog>,
  settings: Settings
): Promise<OwnerShare> {
  if (await getOwnerShare()) await stopSharing();
  const { uid } = await getSession();
  const pairing = newPairing();
  const snap = buildSnapshot(periods, logs, settings, level, name);
  await db(`shares/${pairing.id}`, 'PUT', {
    owner: uid,
    payload: encryptJson(snap, pairing.key),
    updatedAt: snap.updatedAt,
  });
  const owner: OwnerShare = { id: pairing.id, code: pairing.code, level, name };
  await SecureStore.setItemAsync(OWNER_KEY, JSON.stringify(owner));
  return owner;
}

export async function pushSnapshot(
  periods: PeriodEntry[],
  logs: Record<string, DayLog>,
  settings: Settings
): Promise<void> {
  const o = await getOwnerShare();
  if (!o) return;
  const parsed = parseCode(o.code);
  if (!parsed) return;
  const snap = buildSnapshot(periods, logs, settings, o.level, o.name);
  await db(`shares/${o.id}`, 'PATCH', {
    payload: encryptJson(snap, parsed.key),
    updatedAt: snap.updatedAt,
  });
}

export async function updateShareOptions(
  level: ShareLevel,
  name: string,
  periods: PeriodEntry[],
  logs: Record<string, DayLog>,
  settings: Settings
): Promise<void> {
  const o = await getOwnerShare();
  if (!o) return;
  await SecureStore.setItemAsync(OWNER_KEY, JSON.stringify({ ...o, level, name }));
  await pushSnapshot(periods, logs, settings);
}

export async function stopSharing(): Promise<void> {
  const o = await getOwnerShare();
  if (!o) return;
  await db(`shares/${o.id}`, 'DELETE');
  await SecureStore.deleteItemAsync(OWNER_KEY);
}

export type PartnerStatus = 'waiting' | 'connected' | 'left' | 'gone';

export async function getPartnerStatus(): Promise<PartnerStatus | null> {
  const o = await getOwnerShare();
  if (!o) return null;
  try {
    const v = await db(`shares/${o.id}/partner`, 'GET');
    if (v === null || v === undefined) return 'waiting';
    return v === 'left' ? 'left' : 'connected';
  } catch (e: any) {
    if (String(e?.message).startsWith('401')) return 'gone';
    throw e;
  }
}

// ---------- partner side ----------
export async function joinWithCode(input: string): Promise<void> {
  const parsed = parseCode(input);
  if (!parsed) throw new Error('That code does not look right. Check it and try again.');
  const { uid } = await getSession();

  let row: any = null;
  try {
    row = await db(`shares/${parsed.id}`, 'GET'); // works only if already linked
  } catch {}

  if (!row) {
    try {
      await db(`shares/${parsed.id}/partner`, 'PUT', uid);
    } catch {
      throw new Error('This code was not found, or someone has already used it. Ask for a new code.');
    }
    row = await db(`shares/${parsed.id}`, 'GET');
  }
  if (row?.owner === uid) throw new Error('This is your own code. Send it to your partner instead.');

  const snap = decryptJson<Snapshot>(row?.payload, parsed.key);
  if (!snap) throw new Error('Connected, but the data could not be unlocked. Ask for a new code.');

  await SecureStore.setItemAsync(VIEWER_KEY, JSON.stringify({ id: parsed.id, code: parsed.code }));
}

export type PartnerView =
  | { status: 'ok'; snapshot: Snapshot; updatedAt: number }
  | { status: 'gone' }
  | { status: 'locked' };

export async function fetchPartnerView(): Promise<PartnerView | null> {
  const v = await getViewerLink();
  if (!v) return null;
  const parsed = parseCode(v.code);
  if (!parsed) return { status: 'locked' };
  let row: any;
  try {
    row = await db(`shares/${v.id}`, 'GET');
  } catch (e: any) {
    if (String(e?.message).startsWith('401')) return { status: 'gone' };
    throw e;
  }
  if (!row) return { status: 'gone' };
  const snap = decryptJson<Snapshot>(row.payload, parsed.key);
  if (!snap) return { status: 'locked' };
  return { status: 'ok', snapshot: snap, updatedAt: row.updatedAt ?? snap.updatedAt };
}

export async function leaveShare(): Promise<void> {
  const v = await getViewerLink();
  if (!v) return;
  const { uid } = await getSession();
  try {
    await db(`shares/${v.id}/partner`, 'PUT', 'left');
  } catch (e: any) {
    if (!String(e?.message).startsWith('401')) throw e;
  }
  void uid;
  await SecureStore.deleteItemAsync(VIEWER_KEY);
}

// ---------- self test ----------
export async function runSharingSelfTest(): Promise<string> {
  const { uid } = await getSession();
  const pairing = newPairing();
  const snap: Snapshot = {
    v: 1, name: 'Test', level: 'detailed', lastPeriodStart: '2026-10-01',
    cycleLength: 28, periodLength: 5, updatedAt: Date.now(),
    today: { symptoms: ['Cramps'], mood: 'Calm' },
  };

  const parsed = parseCode('hello ' + pairing.code.toLowerCase() + ' bye');
  if (!parsed || parsed.id !== pairing.id) throw new Error('Code parsing failed');
  if (parseCode(pairing.code.replace(/^./, pairing.code[0] === '0' ? '1' : '0'))) {
    throw new Error('Typo in code was not detected');
  }

  await db(`shares/${pairing.id}`, 'PUT', {
    owner: uid,
    payload: encryptJson(snap, pairing.key),
    updatedAt: snap.updatedAt,
  });
  try {
    const row = await db(`shares/${pairing.id}`, 'GET');
    const back = decryptJson<Snapshot>(row.payload, parsed.key);
    if (!back || back.name !== 'Test' || back.today?.mood !== 'Calm') throw new Error('Decrypt failed');
    if (decryptJson(row.payload, newPairing().key)) throw new Error('A wrong key was accepted');
  } finally {
    await db(`shares/${pairing.id}`, 'DELETE');
  }
  return 'Sharing engine OK: pairing code, typo check, encryption and decryption all work.';
}
