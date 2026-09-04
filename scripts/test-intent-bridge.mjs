import crypto from 'node:crypto';

// Format according to src/lib/qr-crypto.ts
function sign(sid, ts, nonce, sessionSecret) {
  const data = `${sid}|${ts}|${nonce}`;
  return crypto.createHmac('sha256', sessionSecret).update(data).digest('hex');
}

function generateQrToken(sessionId, secret, offsetSecs = 0) {
  const ts = Math.floor(Date.now() / 1000) + offsetSecs;
  const nonce = crypto.randomBytes(4).toString('hex');
  const sig = sign(sessionId, ts, nonce, secret);
  const payload = { v: 1, sid: sessionId, ts, n: nonce, sig };
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

async function runTests() {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const sessionId = '564f973d-e36e-459c-8402-c084909c2685';
  const qrSecret = 'cabb14db3f5a845de96378379a08e46c93a107b3b09cbefd297793ce643e481c';

  console.log(`\n==============================================`);
  console.log(`Running Attendance Flow Integration Tests`);
  console.log(`Target: ${baseUrl}`);
  console.log(`Session: ${sessionId}`);
  console.log(`==============================================\n`);

  let testsPassed = 0;
  let testsFailed = 0;

  async function assertCase(name, fn) {
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      testsPassed++;
    } catch (err) {
      console.error(`❌ [FAIL] ${name}:`, err.message);
      testsFailed++;
    }
  }

  // Test 1: Fresh valid QR token on /c
  await assertCase('Fresh valid QR token on /c renders ClientBridge without crashing', async () => {
    const validToken = generateQrToken(sessionId, qrSecret, 0);
    const res = await fetch(`${baseUrl}/c?t=${encodeURIComponent(validToken)}`);
    if (!res.ok) throw new Error(`HTTP status ${res.status}`);
    const html = await res.text();
    if (!html.includes('Connecting Session...') || !html.includes('Routing to your trainee attendance pass')) {
      throw new Error(`Expected ClientBridge content in response, got: ${html.slice(0, 300)}`);
    }
    if (html.includes('Application Error') || html.includes('A fatal error occurred')) {
      throw new Error('Fatal Application Error detected in output!');
    }
  });

  // Test 2: Expired QR token on /c (>60s)
  await assertCase('Expired QR token (>60s) renders controlled QR Code Expired card', async () => {
    const expiredToken = generateQrToken(sessionId, qrSecret, -120); // 120 seconds ago
    const res = await fetch(`${baseUrl}/c?t=${encodeURIComponent(expiredToken)}`);
    if (!res.ok) throw new Error(`HTTP status ${res.status}`);
    const html = await res.text();
    if (!html.includes('QR Code Expired')) {
      throw new Error(`Expected "QR Code Expired" card, got: ${html.slice(0, 300)}`);
    }
    if (!html.includes('Open Classroom Scanner')) {
      throw new Error('Expected "Open Classroom Scanner" recovery button');
    }
    if (html.includes('Application Error')) {
      throw new Error('Fatal Application Error detected in output!');
    }
  });

  // Test 3: Invalid signature on /c
  await assertCase('Invalid signature QR token renders controlled QR Signature Invalid card', async () => {
    const fakeSecret = '0000000000000000000000000000000000000000000000000000000000000000';
    const badSigToken = generateQrToken(sessionId, fakeSecret, 0);
    const res = await fetch(`${baseUrl}/c?t=${encodeURIComponent(badSigToken)}`);
    if (!res.ok) throw new Error(`HTTP status ${res.status}`);
    const html = await res.text();
    if (!html.includes('QR Signature Invalid')) {
      throw new Error(`Expected "QR Signature Invalid" card, got: ${html.slice(0, 300)}`);
    }
    if (html.includes('Application Error')) {
      throw new Error('Fatal Application Error detected in output!');
    }
  });

  // Test 4: Malformed QR token on /c
  await assertCase('Malformed QR token renders controlled Invalid QR Code card', async () => {
    const res = await fetch(`${baseUrl}/c?t=this-is-not-valid-base64-json`);
    if (!res.ok) throw new Error(`HTTP status ${res.status}`);
    const html = await res.text();
    if (!html.includes('Invalid QR Code')) {
      throw new Error(`Expected "Invalid QR Code" card, got: ${html.slice(0, 300)}`);
    }
    if (html.includes('Application Error')) {
      throw new Error('Fatal Application Error detected in output!');
    }
  });

  // Test 5: Missing token on /c
  await assertCase('Missing token renders No Session Code Found card', async () => {
    const res = await fetch(`${baseUrl}/c`);
    if (!res.ok) throw new Error(`HTTP status ${res.status}`);
    const html = await res.text();
    if (!html.includes('No Session Code Found')) {
      throw new Error(`Expected "No Session Code Found" card, got: ${html.slice(0, 300)}`);
    }
    if (html.includes('Application Error')) {
      throw new Error('Fatal Application Error detected in output!');
    }
  });

  // Test 6: /api/checkin/intent API endpoint validation
  await assertCase('/api/checkin/intent returns intent_token for fresh QR', async () => {
    const validToken = generateQrToken(sessionId, qrSecret, 0);
    const res = await fetch(`${baseUrl}/api/checkin/intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qr_token: validToken }),
    });
    const data = await res.json();
    const intentToken = data.data?.intent_token || data.intent_token;
    if (!res.ok || !data.ok || !intentToken) {
      throw new Error(`Expected { ok: true, intent_token: ... }, got ${JSON.stringify(data)}`);
    }
  });

  // Test 7: /api/checkin/intent API expired QR returns 400 with code 'expired'
  await assertCase('/api/checkin/intent returns 400 with code "expired" for old QR', async () => {
    const expiredToken = generateQrToken(sessionId, qrSecret, -120);
    const res = await fetch(`${baseUrl}/api/checkin/intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qr_token: expiredToken }),
    });
    const data = await res.json();
    if (res.status !== 400 || data.code !== 'expired') {
      throw new Error(`Expected 400 with code "expired", got status ${res.status}: ${JSON.stringify(data)}`);
    }
  });

  console.log(`\n==============================================`);
  console.log(`Test Results: ${testsPassed} passed, ${testsFailed} failed`);
  console.log(`==============================================\n`);

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
