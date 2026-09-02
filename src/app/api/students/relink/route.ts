import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { issueDeviceToken, hashDeviceToken } from '@/lib/device-token';

export async function POST(req: NextRequest) {
  try {
    const { email, phone } = await req.json();
    if (!email || !phone) {
      return NextResponse.json(
        { ok: false, error: 'Please enter both your registered email and phone number.' },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPhone = String(phone).trim();

    // Query student matching email AND phone for security
    const { data: student, error } = await supabaseAdmin
      .from('att_students')
      .select('id, full_name, email, phone')
      .eq('email', cleanEmail)
      .eq('phone', cleanPhone)
      .single();

    if (error || !student) {
      return NextResponse.json(
        { ok: false, error: 'No registered student was found matching this email and phone number combination.' },
        { status: 404 }
      );
    }

    // Always issue a fresh device token and store its hash
    const token = await issueDeviceToken(student.id);
    const tokenHash = hashDeviceToken(token);
    await supabaseAdmin
      .from('att_students')
      .update({ device_token_hash: tokenHash })
      .eq('id', student.id);

    return NextResponse.json({
      ok: true,
      data: {
        student_id: student.id,
        full_name: student.full_name,
        device_token: token,
      },
    });
  } catch (err: any) {
    console.error('[relink]', err);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}