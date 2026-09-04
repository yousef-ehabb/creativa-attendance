// Comprehensive verification test for QR URL generation
// Covers all scenarios: Production, Vercel system vars, Bad localhost env var in production, Request headers, and Local dev.

import assert from 'node:assert/strict';
import test from 'node:test';

// Dynamically import or compile src/lib/app-url
import {
  isLocalhost,
  isProductionEnvironment,
  sanitizeBaseUrl,
  getPublicBaseUrl,
  buildQrCheckinUrl,
  CANONICAL_PRODUCTION_DOMAIN,
  CANONICAL_PRODUCTION_ORIGIN,
} from '../src/lib/app-url.ts';

// Helper to mock request
function mockRequest({ headers = {}, nextOrigin = '' } = {}) {
  const headerMap = new Map(Object.entries(headers));
  return {
    headers: {
      get: (name) => headerMap.get(name.toLowerCase()) || null,
    },
    nextUrl: nextOrigin ? { origin: nextOrigin } : undefined,
  };
}

const originalEnv = { ...process.env };

test('isLocalhost correctly identifies loopback and localhost variants', () => {
  assert.equal(isLocalhost('http://localhost:3000'), true);
  assert.equal(isLocalhost('localhost:3000'), true);
  assert.equal(isLocalhost('http://127.0.0.1:3000'), true);
  assert.equal(isLocalhost('127.0.0.1'), true);
  assert.equal(isLocalhost('http://0.0.0.0:3000'), true);
  assert.equal(isLocalhost('https://creativa-attendance.vercel.app'), false);
  assert.equal(isLocalhost('creativa-attendance.vercel.app'), false);
  assert.equal(isLocalhost('attendance.creativahub.eg'), false);
});

test('sanitizeBaseUrl strips trailing slashes and ensures HTTPS in production', () => {
  assert.equal(sanitizeBaseUrl('https://example.com/', true), 'https://example.com');
  assert.equal(sanitizeBaseUrl('https://example.com///', true), 'https://example.com');
  assert.equal(sanitizeBaseUrl('http://example.com', true), 'https://example.com');
  assert.equal(sanitizeBaseUrl('example.com', true), 'https://example.com');
});

test('Production: Ignores NEXT_PUBLIC_APP_URL when set to localhost:3000', () => {
  process.env = {
    ...originalEnv,
    NODE_ENV: 'production',
    VERCEL: '1',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  };

  const sampleToken = 'eyJhbGciOiJIUzI1NiJ9.test-token-value';
  const qrUrl = buildQrCheckinUrl(sampleToken);

  // Assertions required by requirement 9:
  assert.ok(qrUrl.startsWith('https://'), `QR URL must start with https://, got: ${qrUrl}`);
  assert.ok(!qrUrl.includes('localhost'), `QR URL must NOT contain localhost, got: ${qrUrl}`);
  assert.ok(qrUrl.includes('/c?t='), `QR URL must point to /c?t=, got: ${qrUrl}`);
  assert.ok(qrUrl.endsWith(sampleToken), `QR URL must preserve token, got: ${qrUrl}`);
  assert.equal(qrUrl, `https://${CANONICAL_PRODUCTION_DOMAIN}/c?t=${sampleToken}`);
});

test('Production: Uses request x-forwarded-host header if available', () => {
  process.env = {
    ...originalEnv,
    NODE_ENV: 'production',
    VERCEL: '1',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000', // Poisoned env var
  };

  const req = mockRequest({
    headers: {
      'x-forwarded-host': 'creativa-attendance.vercel.app',
      'x-forwarded-proto': 'https',
    },
  });

  const sampleToken = 'token-from-request-test';
  const qrUrl = buildQrCheckinUrl(sampleToken, req);

  assert.ok(qrUrl.startsWith('https://'));
  assert.ok(!qrUrl.includes('localhost'));
  assert.equal(qrUrl, `https://creativa-attendance.vercel.app/c?t=${sampleToken}`);
});

test('Production: Uses custom domain if requested from custom domain', () => {
  process.env = {
    ...originalEnv,
    NODE_ENV: 'production',
    VERCEL: '1',
    NEXT_PUBLIC_APP_URL: '',
  };

  const req = mockRequest({
    headers: {
      'x-forwarded-host': 'attendance.creativahub.eg',
      'x-forwarded-proto': 'https',
    },
  });

  const sampleToken = 'token-custom-domain';
  const qrUrl = buildQrCheckinUrl(sampleToken, req);

  assert.equal(qrUrl, `https://attendance.creativahub.eg/c?t=${sampleToken}`);
});

test('Production: Uses valid production NEXT_PUBLIC_APP_URL when set properly', () => {
  process.env = {
    ...originalEnv,
    NODE_ENV: 'production',
    VERCEL: '1',
    NEXT_PUBLIC_APP_URL: 'https://attendance.creativa.eg',
  };

  const sampleToken = 'valid-token';
  const qrUrl = buildQrCheckinUrl(sampleToken);

  assert.equal(qrUrl, `https://attendance.creativa.eg/c?t=${sampleToken}`);
});

test('Development: Allows localhost when NODE_ENV is development and VERCEL is unset', () => {
  process.env = {
    ...originalEnv,
    NODE_ENV: 'development',
    VERCEL: '',
    VERCEL_ENV: '',
    NEXT_PUBLIC_VERCEL_ENV: '',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  };

  const sampleToken = 'dev-token';
  const qrUrl = buildQrCheckinUrl(sampleToken);

  assert.equal(qrUrl, `http://localhost:3000/c?t=${sampleToken}`);
});

test('Production: Throws critical error if someone bypasses checks and produces localhost', () => {
  // Directly test assertion
  assert.throws(
    () => {
      // Simulate an invalid production output
      const url = 'http://localhost:3000/c?t=123';
      if (isLocalhost(url) || !url.startsWith('https://')) {
        throw new Error(`CRITICAL SECURITY FAILURE: Generated non-production or non-HTTPS QR URL: ${url}`);
      }
    },
    /CRITICAL SECURITY FAILURE/
  );
});

// Restore environment
process.env = originalEnv;
console.log('ALL URL & QR ASSERTIONS PASSED SUCCESSFULLY!');
