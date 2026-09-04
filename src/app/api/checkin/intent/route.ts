// POST /api/checkin/intent
// Called when a student or external client scans a QR code.
// Validates the QR token once and returns a 10-minute intent token
// so that QR rotation does not invalidate an in-progress registration or check-in.
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { issueIntentToken } from '@/lib/device-token';
import { decodeQrPayload, verifyQrPayload } from '@/lib/qr-crypto';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ ok: false, error: 'Malformed request payload', code: 'bad_request' }, { status: 400 });
    }

    const { qr_token } = body;
    if (!qr_token || typeof qr_token !== 'string') {
      return NextResponse.json({ ok: false, error: 'No QR session token provided', code: 'missing_token' }, { status: 400 });
    }

    const payload = decodeQrPayload(qr_token.trim());
    if (!payload || !payload.sid || typeof payload.sid !== 'string') {
      return NextResponse.json({ ok: false, error: 'Invalid QR code format', code: 'invalid_format' }, { status: 400 });
    }

    if (!UUID_REGEX.test(payload.sid)) {
      return NextResponse.json({ ok: false, error: 'Invalid session ID in QR token', code: 'invalid_session_id' }, { status: 400 });
    }

    const { data: session, error: dbError } = await supabaseAdmin
      .from('att_sessions')
      .select('id, status, qr_secret')
      .eq('id', payload.sid)
      .single();

    if (dbError || !session) {
      return NextResponse.json({ ok: false, error: 'Attendance session not found', code: 'session_not_found' }, { status: 404 });
    }

    if (session.status !== 'active') {
      return NextResponse.json({ ok: false, error: 'This attendance session has ended or is inactive.', code: 'session_inactive' }, { status: 400 });
    }

    const verify = verifyQrPayload(payload, session.qr_secret);
    if (!verify.ok) {
      const isExpired = verify.reason === 'expired';
      const msg = isExpired
        ? 'QR code has expired. Please scan the current code displayed in the classroom.'
        : 'Invalid QR code signature.';
      return NextResponse.json({ ok: false, error: msg, code: verify.reason }, { status: 400 });
    }

    // Issue a 10-minute intent token containing the session ID
    const intentToken = await issueIntentToken(session.id);

    return NextResponse.json({
      ok: true,
      data: { intent_token: intentToken },
    });
  } catch (err: any) {
    console.error('[checkin/intent] Server-side exception during intent issue:', err);
    return NextResponse.json({ ok: false, error: 'An internal server error occurred while validating the QR token', code: 'server_error' }, { status: 500 });
  }
}
