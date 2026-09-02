// Student device token - issued on registration, stored in localStorage
import { SignJWT, jwtVerify } from 'jose';
import { createHash } from 'crypto';

const TOKEN_SECRET = new TextEncoder().encode(
  process.env.STUDENT_TOKEN_SECRET ?? 'fallback-dev-secret-change-me'
);
const TOKEN_EXPIRY = '365d';

/** Issue a signed JWT for a student device */
export async function issueDeviceToken(studentId: string): Promise<string> {
  return new SignJWT({ sub: studentId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(TOKEN_SECRET);
}

/** Verify a device token, returns studentId or null */
export async function verifyDeviceToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, TOKEN_SECRET);
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

/** Hash a device token for DB storage */
export function hashDeviceToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Issue a signed intent token for a check-in session (valid 10 minutes) */
export async function issueIntentToken(sessionId: string): Promise<string> {
  return new SignJWT({ sid: sessionId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('10m')
    .sign(TOKEN_SECRET);
}

/** Verify an intent token, returns sessionId or null */
export async function verifyIntentToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, TOKEN_SECRET);
    return (payload as any).sid ?? null;
  } catch {
    return null;
  }
}

/** Extract device token from Authorization header */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}
