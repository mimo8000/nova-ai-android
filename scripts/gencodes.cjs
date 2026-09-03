#!/usr/bin/env node
/**
 * Nova AI — subscription code generator (ADMIN TOOL)
 *
 * Generates shareable/sellable activation codes for the Nova AI APK.
 * Codes are verified offline inside the app with the SAME secret below.
 *
 * Usage:
 *   node scripts/gencodes.cjs -u 100 -n 10        -> 10 user codes, 100 uses each
 *   node scripts/gencodes.cjs -u 500 -n 25        -> 25 codes x 500 uses
 *   node scripts/gencodes.cjs --admin             -> 1 ADMIN code (unlimited)
 *   node scripts/gencodes.cjs -u 100 -n 10 --out codes.txt
 *
 * IMPORTANT: keep NOVA_SECRET stable and private. Changing it invalidates all
 * previously issued codes.
 */
const crypto = require('crypto');

const SECRET = process.env.NOVA_SECRET || 'nova-…c9e4';
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function b32(buf, n) {
  let bits = 0, value = 0, out = '';
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5 && out.length < n) {
      out += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  while (out.length < n) {
    value <<= 5; bits += 5;
    out += ALPHABET[(value >>> (bits - 5)) & 31];
    bits -= 5;
  }
  return out;
}

function sign(payload) {
  return b32(crypto.createHmac('sha256', SECRET).update(payload).digest(), 5);
}

function randomChars(n) {
  const b = crypto.randomBytes(n);
  let s = '';
  for (let i = 0; i < n; i++) s += ALPHABET[b[i] % ALPHABET.length];
  return s;
}

function userCode(uses) {
  const digit = uses >= 100 ? 0 : Math.max(1, Math.min(9, Math.round(uses / 10)));
  const payload = randomChars(4) + String(digit);
  return `NOVA-${payload}-${sign(payload)}`;
}

function adminCode() {
  const payload = 'ADMN' + randomChars(1);
  return `NOVA-${payload}-${sign(payload)}`;
}

const args = process.argv.slice(2);
let uses = 100, count = 5, admin = false, out = null;
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--admin') admin = true;
  else if (a === '-u' || a === '--uses') uses = parseInt(args[++i], 10);
  else if (a === '-n' || a === '--count') count = parseInt(args[++i], 10);
  else if (a === '--out') out = args[++i];
}

const codes = [];
if (admin) codes.push(adminCode());
for (let i = 0; i < (admin ? 0 : count); i++) codes.push(userCode(uses));

const text = codes.join('\n') + '\n';
if (out) require('fs').writeFileSync(out, text);
process.stdout.write(text);
if (!admin) console.error(`# ${count} user code(s), ${uses} uses each. Keep them private.`);
