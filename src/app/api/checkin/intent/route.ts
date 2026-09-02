// POST /api/checkin/intent
// Called when a first-time student scans a QR code.
// Validates the QR token once and returns a 10-minute intent token
// so that QR rotation does not invalidate an in-progress registration.
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { issueIntentToken } from '@/lib/device-token';
import { decodeQrPayload, verifyQrPayload } from '@/lib/qr-crypto';

export async function POST(req: NextRequest) {
  try {
    const { qr_token } = await req.json();
    if (!qr_token) {
      return NextResponse.json({ ok: false, error: 'No QR token provided' }, { status: 400 });
    }

    const payload = decodeQrPayload(qr_token);
    if (!payload) {
      return NextResponse.json({ ok: false, error: 'Invalid QR code' }, { status: 400 });
    }

    const { data: session } = await supabaseAdmin
      .from('att_sessions')
      .select('id, status, qr_secret')
      .eq('id', payload.sid)
      .single();

    if (!session) {
      return NextResponse.json({ ok: false, error: 'Session not found' }, { status: 404 });
    }
    if (session.status !== 'active') {
      return NextResponse.json({ ok: false, error: 'This session is not active.' }, { status: 400 });
    }

    const verify = verifyQrPayload(payload, session.qr_secret);
    if (!verify.ok) {
      const msg = verify.reason === 'expired'
        ? 'QR code has expired. Please scan the current code displayed in the classroom.'
        : 'Invalid QR code.';
      return NextResponse.json({ ok: false, error: msg, code: verify.reason }, { status: 400 });
    }

    // Issue a 10-minute intent token containing the session ID
    const intentToken = await issueIntentToken(session.id);

    return NextResponse.json({
      ok: true,
      data: { intent_token: intentToken },
    });
  } catch (err: any) {
    console.error('[checkin/intent]', err);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}
