/**
 * Offline subscription-code licensing for Nova AI.
 *
 * Code format: NOVA-<P1P2P3P4Q>-<CHECKSUM>
 *  - P1..P4 : random id chars (alphabet below)
 *  - Q      : quota digit. 0 => 100 uses, 1..9 => Q*10 uses
 *  - CHECKSUM: first 5 base32 chars of HMAC-SHA256(SECRET, payload)
 *  - payload starting with "ADMN" => ADMIN code (unlimited + admin panel)
 *
 * NOTE (honest limitation): this is a client-side gate. A determined attacker
 * can extract the secret from the APK. It stops casual sharing of codes,
 * not a professional cracker. Central revocation would need a server.
 */

const SECRET = 'nova-…c9e4';
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export interface License {
  id: string;
  code: string;
  admin: boolean;
  pro: boolean;
  tier: 'free' | 'pro' | 'admin';
  quota: number; // total allowed uses (0 = unlimited for admin)
  used: number;
}

const LS_KEY = '***';

// ---------- base32 + HMAC (must match scripts/gencodes.cjs) ----------
function b32(bytes: Uint8Array, n: number): string {
  let out = '';
  let acc = 0;
  let bits = 0;
  for (const byte of bytes) {
    acc = (acc << 8) | byte;
    bits += 8;
    while (bits >= 5 && out.length < n) {
      out += ALPHABET[(acc >> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  while (out.length < n) {
    acc <<= 5;
    bits += 5;
    out += ALPHABET[(acc >> (bits - 5)) & 31];
    bits -= 5;
  }
  return out;
}

async function signPayload(payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  return b32(new Uint8Array(sig), 5);
}

function randomPayloadChars(n: number): string {
  const arr = new Uint8Array(n);
  crypto.getRandomValues(arr);
  let s = '';
  for (let i = 0; i < n; i++) s += ALPHABET[arr[i] % ALPHABET.length];
  return s;
}

// ---------- verification ----------
export interface VerifyResult {
  ok: boolean;
  admin: boolean;
  pro: boolean;
  tier: 'free' | 'pro' | 'admin';
  quota: number;
  id: string;
}

export async function verifyCode(raw: string): Promise<VerifyResult> {
  const fail: VerifyResult = { ok: false, admin: false, pro: false, tier: 'free', quota: 0, id: '' };
  const norm = raw.trim().toUpperCase().replace(/\s+/g, '');
  const m = norm.match(/^NOVA-([A-Z0-9]{5})-([A-Z0-9]{5})$/);
  if (!m) return fail;
  const [, payload, checksum] = m;
  const expect = await signPayload(payload);
  if (expect !== checksum) return fail;
  if (payload.startsWith('ADMN')) {
    return { ok: true, admin: true, pro: true, tier: 'admin', quota: 0, id: payload };
  }
  const q = Number(payload[4]);
  const quota = q === 0 ? 100 : q * 10;
  // payload[1] encodes tier: 'P' => pro, anything else => free (chat only)
  const tier = payload[1] === 'P' ? 'pro' : 'free';
  return { ok: true, admin: false, pro: tier === 'pro', tier, quota, id: payload };
}

// ---------- generation (used by the admin panel inside the app) ----------
export async function generateUserCode(quotaUses: number): Promise<string> {
  const digit = quotaUses >= 100 ? 0 : Math.max(1, Math.min(9, Math.round(quotaUses / 10)));
  const payload = randomPayloadChars(4) + String(digit);
  const checksum = await signPayload(payload);
  return `NOVA-${payload}-${checksum}`;
}

export async function generateAdminCode(): Promise<string> {
  const payload = 'ADMN' + randomPayloadChars(1);
  const checksum = await signPayload(payload);
  return `NOVA-${payload}-${checksum}`;
}

/** PRO code: payload starts with PRO -> full access (image/video/tools) */
export async function generateProCode(quotaUses: number): Promise<string> {
  const digit = quotaUses >= 100 ? 0 : Math.max(1, Math.min(9, Math.round(quotaUses / 10)));
  const payload = 'PRO' + randomPayloadChars(1) + String(digit);
  const checksum = await signPayload(payload);
  return `NOVA-${payload}-${checksum}`;
}

// ---------- stored license ----------
export function getLicense(): License | null {
  try {
    const s = localStorage.getItem(LS_KEY);
    if (!s) return null;
    const lic = JSON.parse(s) as License;
    if (!lic.tier) lic.tier = lic.admin ? 'admin' : 'free';
    if (lic.pro === undefined) lic.pro = lic.tier !== 'free';
    return lic;
  } catch {
    return null;
  }
}

export function saveLicense(lic: License) {
  localStorage.setItem(LS_KEY, JSON.stringify(lic));
}

export function clearLicense() {
  localStorage.removeItem(LS_KEY);
}

export function isAdmin(): boolean {
  const lic = getLicense();
  return !!lic && lic.admin;
}

export function isPro(): boolean {
  const lic = getLicense();
  return !!lic && (lic.admin || lic.tier === 'pro');
}

/** Whether a given tab is allowed for the current license. */
export function canAccessTab(tab: string): boolean {
  const lic = getLicense();
  if (!lic) return false;
  if (lic.admin || lic.tier === 'pro') return true;
  // free tier: chat only
  return tab === 'chat';
}

export function remainingQuota(): number {
  const lic = getLicense();
  if (!lic) return 0;
  if (lic.admin) return Infinity;
  return Math.max(0, lic.quota - lic.used);
}

/** Consume `cost` uses. Returns true if allowed. Admin never consumes. */
export function consumeQuota(cost: number): boolean {
  const lic = getLicense();
  if (!lic) return false;
  if (lic.admin) return true;
  if (lic.used + cost > lic.quota) return false;
  lic.used += cost;
  saveLicense(lic);
  return true;
}

// ---------- admin PIN (password) gate ----------
// The API-key area is locked behind this PIN so a normal user who was given a
// subscription code cannot change keys or reach admin tools. The admin can set
// / change the PIN from the admin panel. Fresh installs (users' phones) fall
// back to DEFAULT_PIN until a custom one is set on that device.
const PIN_KEY = '***';
export const DEFAULT_ADMIN_PIN = '1234';

function normalizePin(pin: string): string {
  // Persian/Arabic digits -> Latin, strip spaces & invisible chars
  return pin
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[\u200B-\u200D\uFEFF\u061C\u2066-\u2069\s]/g, '');
}

async function hashPin(pin: string): Promise<string> {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest('SHA-256', enc.encode('nova-pin:' + normalizePin(pin)));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function hasCustomPin(): boolean {
  return !!localStorage.getItem(PIN_KEY);
}

export async function setAdminPin(pin: string): Promise<void> {
  const h = await hashPin(pin);
  localStorage.setItem(PIN_KEY, h);
}

export async function verifyAdminPin(pin: string): Promise<boolean> {
  const norm = normalizePin(pin);
  const stored = localStorage.getItem(PIN_KEY);
  if (!stored) return norm === DEFAULT_ADMIN_PIN;
  return (await hashPin(norm)) === stored;
}

export function clearAdminPin(): void {
  localStorage.removeItem(PIN_KEY);
}
