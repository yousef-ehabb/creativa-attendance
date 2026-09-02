import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createSupabaseServer } from '@/lib/supabase-server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  // Fetch session with course name
  const { data: session, error: se } = await supabaseAdmin
    .from('att_sessions')
    .select('id, course_id, session_number, status, session_date, att_courses(name)')
    .eq('id', id)
    .single();

  if (se || !session) {
    return NextResponse.json({ ok: false, error: 'Session not found' }, { status: 404 });
  }

  // Fetch attendance with student data (via supabaseAdmin — bypasses RLS)
  const { data: attendance, error: ae } = await supabaseAdmin
    .from('att_attendance')
    .select('id, student_id, checked_in_at, check_in_method, att_students(id, full_name, email, phone)')
    .eq('session_id', id)
    .order('checked_in_at');

  if (ae) return NextResponse.json({ ok: false, error: ae.message }, { status: 500 });

  // Map to flat attendee shape expected by the live dashboard
  const attendees = (attendance ?? []).map((a: any) => ({
    id: a.id,
    student_id: a.student_id,
    student_name: a.att_students?.full_name ?? 'Unknown',
    checked_in_at: a.checked_in_at,
    method: a.check_in_method,
  }));

  return NextResponse.json({ ok: true, data: { session, attendees } });
}