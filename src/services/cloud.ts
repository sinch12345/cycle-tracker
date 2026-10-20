import * as SecureStore from 'expo-secure-store';
import { FIREBASE } from '../config/firebase';

const SESSION_KEY = 'ct_cloud_session';
const DB_URL = FIREBASE.databaseURL.replace(/\/+$/, '');

type Session = { uid: string; idToken: string; expiresAt: number };
type Stored = { uid: string; refreshToken: string };

let session: Session | null = null;

async function timedFetch(url: string, init: RequestInit = {}, ms = 12000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

async function signUp(): Promise<Session> {
  const res = await timedFetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE.apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ returnSecureToken: true }),
    }
  );
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message ?? 'Anonymous sign-in failed');
  await SecureStore.setItemAsync(
    SESSION_KEY,
    JSON.stringify({ uid: json.localId, refreshToken: json.refreshToken })
  );
  return {
    uid: json.localId,
    idToken: json.idToken,
    expiresAt: Date.now() + Number(json.expiresIn) * 1000 - 60000,
  };
}

// returns null only when the server says the saved login is no longer valid.
// Network errors are thrown, so we never create a new identity by accident.
async function refresh(stored: Stored): Promise<Session | null> {
  const res = await timedFetch(`https://securetoken.googleapis.com/v1/token?key=${FIREBASE.apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(stored.refreshToken)}`,
  });
  const json = await res.json();
  if (!res.ok) return null;
  await SecureStore.setItemAsync(
    SESSION_KEY,
    JSON.stringify({ uid: json.user_id, refreshToken: json.refresh_token })
  );
  return {
    uid: json.user_id,
    idToken: json.id_token,
    expiresAt: Date.now() + Number(json.expires_in) * 1000 - 60000,
  };
}

export async function getSession(): Promise<Session> {
  if (session && Date.now() < session.expiresAt) return session;
  let stored: Stored | null = null;
  try {
    const raw = await SecureStore.getItemAsync(SESSION_KEY);
    if (raw) stored = JSON.parse(raw);
  } catch {}
  if (stored) {
    const s = await refresh(stored);
    if (s) {
      session = s;
      return s;
    }
  }
  session = await signUp();
  return session;
}

export async function db(path: string, method: 'GET' | 'PUT' | 'PATCH' | 'DELETE', body?: unknown) {
  const { idToken } = await getSession();
  const res = await timedFetch(`${DB_URL}/${path}.json?auth=${idToken}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`${res.status}: ${txt.slice(0, 160)}`);
  }
  return res.json();
}

export async function runConnectionTest(): Promise<string> {
  const { uid } = await getSession();
  const id = 'test' + Math.random().toString(36).slice(2, 10);

  await db(`shares/${id}`, 'PUT', { owner: uid, payload: 'hello', updatedAt: Date.now() });
  const back = await db(`shares/${id}`, 'GET');
  await db(`shares/${id}`, 'DELETE');
  if (!back || back.payload !== 'hello') throw new Error('Read-back did not match');

  let closed = false;
  try {
    await db(`anything/${id}`, 'PUT', { x: 1 });
  } catch {
    closed = true;
  }
  return closed
    ? 'Connected. Anonymous sign-in works, a test record was written, read and deleted, and other paths are locked.'
    : 'Connected, but your rules are too open. Re-check the rules you published in step 5.';
}
