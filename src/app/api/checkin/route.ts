// POST /api/checkin
// Called when a returning student scans a QR code
// Requires valid device token + valid QR payload
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyDeviceToken, extractBearerToken, hashDeviceToken } from '@/lib/device-token';
import { decodeQrPayload, verifyQrPayload } from '@/lib/qr-crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { qr_token } = body;
    const rawToken = extractBearerToken(req.headers.get('authorization'));

    if (!rawToken) return NextResponse.json({ ok: false, error: 'No device token' }, { status: 401 });
    if (!qr_token) return NextResponse.json({ ok: false, error: 'No QR token' }, { status: 400 });

    // Verify device token
    const studentId = await verifyDeviceToken(rawToken);
    if (!studentId) return NextResponse.json({ ok: false, error: 'Invalid or expired device token' }, { status: 401 });

    // Verify device token matches stored hash
    const tokenHash = hashDeviceToken(rawToken);
    const { data: student } = await supabaseAdmin
      .from('att_students').select('id, full_name, device_token_hash').eq('id', studentId).single();
    if (!student || student.device_token_hash !== tokenHash) {
      return NextResponse.json({ ok: false, error: 'Device token revoked' }, { status: 401 });
    }

    // Verify QR payload
    const payload = decodeQrPayload(qr_token);
    if (!payload) return NextResponse.json({ ok: false, error: 'Invalid QR code' }, { status: 400 });

    const { data: session } = await supabaseAdmin
      .from('att_sessions').select('id, course_id, status, qr_secret').eq('id', payload.sid).single();
    if (!session) return NextResponse.json({ ok: false, error: 'Session not found' }, { status: 404 });
    if (session.status !== 'active') {
      return NextResponse.json({ ok: false, error: 'This session has ended. Contact your coordinator.' }, { status: 400 });
    }

    const verify = verifyQrPayload(payload, session.qr_secret);
    if (!verify.ok) {
      const msg = verify.reason === 'expired' ? 'QR code has expired. Please scan the current code.' : 'Invalid QR code.';
      return NextResponse.json({ ok: false, error: msg, code: verify.reason }, { status: 400 });
    }

    // Ensure enrollment exists (auto-enroll on new course)
    const { data: existingEnrollment } = await supabaseAdmin
      .from('att_enrollments')
      .select('id').eq('student_id', studentId).eq('course_id', session.course_id).single();

    let enrollmentId = existingEnrollment?.id;
    if (!enrollmentId) {
      const { data: newEnrollment } = await supabaseAdmin
        .from('att_enrollments')
        .insert({ student_id: studentId, course_id: session.course_id })
        .select('id').single();
      enrollmentId = newEnrollment?.id;
    }

    // Record attendance
    const { error: ae } = await supabaseAdmin.from('att_attendance').insert({
      session_id: session.id,
      student_id: studentId,
      enrollment_id: enrollmentId,
      check_in_method: 'qr_scan',
    });

    if (ae && ae.code !== '23505') throw new Error('Failed to record: ' + ae.message);

    // Get session info for response
    const { data: courseData } = await supabaseAdmin
      .from('att_courses').select('name').eq('id', session.course_id).single();
    const { count: sessionCount } = await supabaseAdmin
      .from('att_sessions').select('*', { count: 'exact', head: true })
      .eq('course_id', session.course_id).eq('status', 'closed');
    const { data: sessionInfo } = await supabaseAdmin
      .from('att_sessions').select('session_number').eq('id', session.id).single();

    revalidatePath('/admin');

    return NextResponse.json({
      ok: true,
      data: {
        already_checked_in: ae?.code === '23505',
        student_name: student.full_name,
        course_name: courseData?.name,
        session_number: (sessionInfo as any)?.session_number,
      }
    });
  } catch (err: any) {
    console.error('[checkin]', err);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}
