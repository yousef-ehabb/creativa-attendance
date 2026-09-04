import type { NextRequest } from 'next/server';

/**
 * Production canonical domain fallback.
 */
export const CANONICAL_PRODUCTION_DOMAIN = 'creativa-attendance.vercel.app';
export const CANONICAL_PRODUCTION_ORIGIN = `https://${CANONICAL_PRODUCTION_DOMAIN}`;

/**
 * Checks whether a given host or URL points to localhost or a loopback address.
 */
export function isLocalhost(urlOrHost: string): boolean {
  if (!urlOrHost) return false;
  try {
    const raw = urlOrHost.trim();
    const hostname = raw.includes('://') ? new URL(raw).hostname : raw.split(':')[0];
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '::1' ||
      hostname.endsWith('.localhost')
    );
  } catch {
    const lower = urlOrHost.toLowerCase();
    return lower.includes('localhost') || lower.includes('127.0.0.1');
  }
}

/**
 * Determines whether the current execution context is production or a deployed environment.
 */
export function isProductionEnvironment(): boolean {
  return (
    process.env.NODE_ENV === 'production' ||
    process.env.VERCEL_ENV === 'production' ||
    process.env.VERCEL === '1' ||
    Boolean(process.env.NEXT_PUBLIC_VERCEL_ENV)
  );
}

/**
 * Strips trailing slashes and ensures proper protocol.
 */
export function sanitizeBaseUrl(url: string, forceHttps: boolean): string {
  let clean = url.trim().replace(/\/+$/, '');
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = `${forceHttps ? 'https' : 'http'}://${clean}`;
  }
  if (forceHttps) {
    clean = clean.replace(/^http:\/\//i, 'https://');
  }
  return clean;
}

/**
 * Resolves the public-facing application base URL.
 * 
 * Hierarchy:
 * 1. Explicit env var (NEXT_PUBLIC_APP_URL / APP_URL), unless in production and pointing to localhost.
 * 2. Request headers (x-forwarded-host, host) with correct proto.
 * 3. Vercel deployment variables (VERCEL_PROJECT_PRODUCTION_URL, VERCEL_URL).
 * 4. Canonical production fallback (https://creativa-attendance.vercel.app).
 * 5. Localhost (only in development).
 */
export function getPublicBaseUrl(req?: NextRequest): string {
  const isProd = isProductionEnvironment();

  // 1. Check explicit environment variable
  const explicitEnvUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || '').trim();
  if (explicitEnvUrl) {
    const isLocal = isLocalhost(explicitEnvUrl);
    // In production, NEVER accept a localhost env variable
    if (!isProd || !isLocal) {
      return sanitizeBaseUrl(explicitEnvUrl, isProd);
    }
    // If we're in production and someone configured localhost, log a warning and fall through
    console.warn(
      `[SECURITY/CONFIG WARNING] Ignored invalid localhost APP_URL ("${explicitEnvUrl}") in production.`
    );
  }

  // 2. Check incoming request headers if available
  if (req) {
    const forwardedHost = req.headers.get('x-forwarded-host')?.trim();
    const rawHost = req.headers.get('host')?.trim();
    const host = forwardedHost || rawHost;

    if (host) {
      const isLocal = isLocalhost(host);
      if (!isProd || !isLocal) {
        const protoHeader = req.headers.get('x-forwarded-proto')?.trim();
        const scheme = isProd ? 'https' : (protoHeader || 'http');
        return sanitizeBaseUrl(`${scheme}://${host}`, isProd);
      }
    }

    // req.nextUrl fallback
    const nextOrigin = req.nextUrl?.origin;
    if (nextOrigin) {
      const isLocal = isLocalhost(nextOrigin);
      if (!isProd || !isLocal) {
        return sanitizeBaseUrl(nextOrigin, isProd);
      }
    }
  }

  // 3. Check Vercel deployment environment variables
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return sanitizeBaseUrl(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`, true);
  }
  if (process.env.VERCEL_URL) {
    return sanitizeBaseUrl(`https://${process.env.VERCEL_URL}`, true);
  }

  // 4. Canonical production fallback
  if (isProd) {
    return CANONICAL_PRODUCTION_ORIGIN;
  }

  // 5. Development fallback only
  return 'http://localhost:3000';
}

/**
 * Constructs the canonical check-in QR URL for attendance scanning.
 * Throws an assertion error if production ever attempts to generate a localhost URL.
 */
export function buildQrCheckinUrl(encodedToken: string, req?: NextRequest): string {
  const baseUrl = getPublicBaseUrl(req);
  const qrUrl = `${baseUrl}/c?t=${encodedToken}`;

  const isProd = isProductionEnvironment();
  if (isProd) {
    if (isLocalhost(qrUrl) || qrUrl.includes('localhost') || !qrUrl.startsWith('https://')) {
      throw new Error(`CRITICAL SECURITY FAILURE: Generated non-production or non-HTTPS QR URL: ${qrUrl}`);
    }
  }

  return qrUrl;
}
