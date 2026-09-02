// QR Code signing and verification - server side only
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

const QR_WINDOW_SECS = 60; // payloads expire after 60 seconds

export interface QrPayload {
  v: number;       // version
  sid: string;     // session id
  ts: number;      // unix timestamp
  n: string;       // random nonce
  sig: string;     // HMAC-SHA256 signature
}

function sign(sid: string, ts: number, nonce: string, sessionSecret: string): string {
  const data = `${sid}|${ts}|${nonce}`;
  return createHmac('sha256', sessionSecret).update(data).digest('hex');
}

/** Generate a signed QR payload for a session */
export function generateQrPayload(sessionId: string, sessionSecret: string): QrPayload {
  const ts = Math.floor(Date.now() / 1000);
  const nonce = randomBytes(4).toString('hex');
  const sig = sign(sessionId, ts, nonce, sessionSecret);
  return { v: 1, sid: sessionId, ts, n: nonce, sig };
}

/** Encode payload as base64url for embedding in URL */
export function encodeQrPayload(payload: QrPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

/** Decode payload from base64url string */
export function decodeQrPayload(encoded: string): QrPayload | null {
  try {
    return JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

export type VerifyResult =
  | { ok: true; sessionId: string }
  | { ok: false; reason: 'invalid_format' | 'expired' | 'bad_signature' | 'no_secret' };

/** Verify a QR payload against the session secret from DB */
export function verifyQrPayload(payload: QrPayload, sessionSecret: string | null): VerifyResult {
  if (!sessionSecret) return { ok: false, reason: 'no_secret' };
  if (payload.v !== 1 || !payload.sid || !payload.ts || !payload.n || !payload.sig) {
    return { ok: false, reason: 'invalid_format' };
  }
  const nowSecs = Math.floor(Date.now() / 1000);
  if (nowSecs - payload.ts > QR_WINDOW_SECS) {
    return { ok: false, reason: 'expired' };
  }
  const expected = sign(payload.sid, payload.ts, payload.n, sessionSecret);
  const expectedBuf = Buffer.from(expected, 'hex');
  const actualBuf = Buffer.from(payload.sig, 'hex');
  if (expectedBuf.length !== actualBuf.length || !timingSafeEqual(expectedBuf, actualBuf)) {
    return { ok: false, reason: 'bad_signature' };
  }
  return { ok: true, sessionId: payload.sid };
}

/** Generate a random session secret */
export function generateSessionSecret(): string {
  return randomBytes(32).toString('hex');
}
