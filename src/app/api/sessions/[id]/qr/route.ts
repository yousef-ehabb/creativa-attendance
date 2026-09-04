// GET /api/sessions/[id]/qr
// Returns a QR code image (data URL) for the active session
// Admin only - uses service role to read qr_secret
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createSupabaseServer } from '@/lib/supabase-server';
import { generateQrPayload, encodeQrPayload } from '@/lib/qr-crypto';
import QRCode from 'qrcode';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const { id: sessionId } = await params;

  const { data: session, error } = await supabaseAdmin
    .from('att_sessions')
    .select('id, status, qr_secret, qr_rotation_secs, course_id')
    .eq('id', sessionId)
    .single();

  if (error || !session) return NextResponse.json({ ok: false, error: 'Session not found' }, { status: 404 });
  if (session.status !== 'active') return NextResponse.json({ ok: false, error: 'Session not active' }, { status: 400 });
  if (!session.qr_secret) return NextResponse.json({ ok: false, error: 'No QR secret' }, { status: 400 });

  const payload = generateQrPayload(session.id, session.qr_secret);
  const encoded = encodeQrPayload(payload);
  
  let baseUrl = (process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin).trim();
  if (!baseUrl.includes('localhost') && !baseUrl.includes('127.0.0.1')) {
    baseUrl = baseUrl.replace(/^http:\/\//i, 'https://');
  }
  baseUrl = baseUrl.replace(/\/+$/, '');
  const qrUrl = `${baseUrl}/c?t=${encoded}`;

  const dataUrl = await QRCode.toDataURL(qrUrl, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 400,
    color: { dark: '#111827', light: '#FFFFFF' },
  });

  return NextResponse.json({
    ok: true,
    data: { qr_data_url: dataUrl, expires_in_secs: 60, rotation_secs: session.qr_rotation_secs, payload_encoded: encoded }
  });
}