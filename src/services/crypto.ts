import nacl from 'tweetnacl';
import { decodeBase64, decodeUTF8, encodeBase64, encodeUTF8 } from 'tweetnacl-util';
import * as Crypto from 'expo-crypto';

// give tweetnacl a secure random source (React Native has none built in)
nacl.setPRNG((x: Uint8Array, n: number) => {
  const b = Crypto.getRandomBytes(n);
  for (let i = 0; i < n; i++) x[i] = b[i];
});

// Crockford base32: no I, L, O or U, so codes are hard to misread
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const ID_LEN = 13;    // 64-bit share id
const SEED_LEN = 26;  // 128-bit secret

export function toBase32(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

export function fromBase32(str: string): Uint8Array {
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of str) {
    const idx = ALPHABET.indexOf(ch);
    if (idx < 0) throw new Error('Invalid code');
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Uint8Array.from(out);
}

function checkChar(s: string): string {
  let sum = 0;
  for (let i = 0; i < s.length; i++) sum += ALPHABET.indexOf(s[i]) * (i + 1);
  return ALPHABET[sum % 32];
}

const keyFromSeed = (seed: string): Uint8Array =>
  nacl.hash(fromBase32(seed)).slice(0, 32);

const formatCode = (raw: string): string => (raw.match(/.{1,4}/g) as string[]).join('-');

export type Pairing = { id: string; key: Uint8Array; code: string };

export function newPairing(): Pairing {
  const id = toBase32(nacl.randomBytes(8)).slice(0, ID_LEN);
  const seed = toBase32(nacl.randomBytes(16)).slice(0, SEED_LEN);
  const body = id + seed;
  return { id, key: keyFromSeed(seed), code: formatCode(body + checkChar(body)) };
}

// accepts the code typed in any case, or pasted inside a longer message
export function parseCode(input: string): Pairing | null {
  const upper = input.toUpperCase().replace(/O/g, '0').replace(/[IL]/g, '1');
  const match = upper.match(/(?:[0-9A-Z]{4}-){9}[0-9A-Z]{4}/);
  const raw = match ? match[0].replace(/-/g, '') : upper.replace(/[^0-9A-Z]/g, '');
  if (raw.length !== ID_LEN + SEED_LEN + 1) return null;
  for (const c of raw) if (!ALPHABET.includes(c)) return null;
  const body = raw.slice(0, ID_LEN + SEED_LEN);
  if (checkChar(body) !== raw[raw.length - 1]) return null;
  return {
    id: raw.slice(0, ID_LEN),
    key: keyFromSeed(raw.slice(ID_LEN, ID_LEN + SEED_LEN)),
    code: formatCode(raw),
  };
}

export function encryptJson(obj: unknown, key: Uint8Array): string {
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
  const box = nacl.secretbox(decodeUTF8(JSON.stringify(obj)), nonce, key);
  const full = new Uint8Array(nonce.length + box.length);
  full.set(nonce);
  full.set(box, nonce.length);
  return encodeBase64(full);
}

export function decryptJson<T>(data: string, key: Uint8Array): T | null {
  try {
    const full = decodeBase64(data);
    const nonce = full.slice(0, nacl.secretbox.nonceLength);
    const box = full.slice(nacl.secretbox.nonceLength);
    const opened = nacl.secretbox.open(box, nonce, key);
    if (!opened) return null;
    return JSON.parse(encodeUTF8(opened)) as T;
  } catch {
    return null;
  }
}
