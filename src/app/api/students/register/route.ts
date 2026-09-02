// POST /api/students/register
// Called when a student scans a QR for the first time
// Creates student profile, enrollment, and attendance record
// Accepts intent_token (preferred, survives QR rotation) or qr_token (legacy)
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { issueDeviceToken, hashDeviceToken, verifyIntentToken } from '@/lib/device-token';
import { decodeQrPayload, verifyQrPayload } from '@/lib/qr-crypto';

function processName(fullName: string): string {
  // Take first two words for certificate name
  return fullName.trim().split(/\s+/).slice(0, 2).join(' ');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { intent_token, qr_token, full_name, email, phone, national_id } = body;

    if (!full_name || !email || !phone) {
      return NextResponse.json({ ok: false, error: 'Missing required fields' }, { status: 400 });
    }
    if (!intent_token && !qr_token) {
      return NextResponse.json({ ok: false, error: 'No session token provided' }, { status: 400 });
    }

    // --- Resolve session ID ---
    let sessionId: string;

    if (intent_token) {
      // Preferred path: intent token survives QR rotation (valid 10 min)
      const sid = await verifyIntentToken(intent_token);
      if (!sid) {
        return NextResponse.json(
          { ok: false, error: 'Session intent has expired. Please scan the QR code again.' },
          { status: 400 }
        );
      }
      sessionId = sid;
    } else {
      // Legacy path: verify QR payload directly
      const payload = decodeQrPayload(qr_token);
      if (!payload) return NextResponse.json({ ok: false, error: 'Invalid QR code' }, { status: 400 });

      const { data: qrSession } = await supabaseAdmin
        .from('att_sessions').select('id, status, qr_secret').eq('id', payload.sid).single();
      if (!qrSession) return NextResponse.json({ ok: false, error: 'Session not found' }, { status: 404 });
      if (qrSession.status !== 'active') return NextResponse.json({ ok: false, error: 'Session is not active' }, { status: 400 });

      const verify = verifyQrPayload(payload, qrSession.qr_secret);
      if (!verify.ok) {
        const msg = verify.reason === 'expired' ? 'QR code has expired. Please scan the current code.' : 'Invalid QR code.';
        return NextResponse.json({ ok: false, error: msg, code: verify.reason }, { status: 400 });
      }
      sessionId = qrSession.id;
    }

    // --- Validate session ---
    const { data: session } = await supabaseAdmin
      .from('att_sessions').select('id, course_id, status, session_number').eq('id', sessionId).single();
    if (!session) return NextResponse.json({ ok: false, error: 'Session not found' }, { status: 404 });
    if (session.status !== 'active') return NextResponse.json({ ok: false, error: 'Session is not active' }, { status: 400 });

    // --- Create or find student ---
    const normalizedEmail = email.trim().toLowerCase();
    let { data: student } = await supabaseAdmin
      .from('att_students').select('id').eq('email', normalizedEmail).single();

    if (!student) {
      const { data: newStudent, error: se } = await supabaseAdmin
        .from('att_students')
        .insert({
          full_name: full_name.trim(),
          full_name_en: processName(full_name),
          email: normalizedEmail,
          phone: phone.trim(),
          national_id: national_id?.trim() || null,
        })
        .select('id').single();
      if (se || !newStudent) throw new Error('Failed to create student: ' + se?.message);
      student = newStudent;
    }

    // --- Issue device token ---
    const token = await issueDeviceToken(student.id);
    const tokenHash = hashDeviceToken(token);
    await supabaseAdmin.from('att_students').update({ device_token_hash: tokenHash }).eq('id', student.id);

    // --- Ensure enrollment ---
    const { data: existingEnrollment } = await supabaseAdmin
      .from('att_enrollments')
      .select('id').eq('student_id', student.id).eq('course_id', session.course_id).single();

    let enrollmentId = existingEnrollment?.id;
    if (!enrollmentId) {
      const { data: newEnrollment } = await supabaseAdmin
        .from('att_enrollments')
        .insert({ student_id: student.id, course_id: session.course_id })
        .select('id').single();
      enrollmentId = newEnrollment?.id;
    }

    // --- Record attendance (must succeed before reporting success) ---
    const { error: ae } = await supabaseAdmin.from('att_attendance').insert({
      session_id: session.id,
      student_id: student.id,
      enrollment_id: enrollmentId,
      check_in_method: 'qr_scan',
    });

    if (ae && ae.code !== '23505') { // 23505 = unique violation (already checked in)
      throw new Error('Failed to record attendance: ' + ae.message);
    }

    const alreadyCheckedIn = ae?.code === '23505';

    // --- Get course info for confirmation ---
    const { data: courseData } = await supabaseAdmin
      .from('att_courses').select('name').eq('id', session.course_id).single();

    return NextResponse.json({
      ok: true,
      data: {
        device_token: token,
        student_id: student.id,
        student_name: full_name.trim(),
        course_name: courseData?.name ?? '',
        session_number: session.session_number,
        already_checked_in: alreadyCheckedIn,
      }
    });
  } catch (err: any) {
    console.error('[register]', err);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}
