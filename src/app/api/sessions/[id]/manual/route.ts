import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createSupabaseServer } from '@/lib/supabase-server';

// POST to add, DELETE to remove
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const { id: sessionId } = await params;
  const { student_id } = await req.json();
  if (!student_id) return NextResponse.json({ ok: false, error: 'student_id required' }, { status: 400 });

  const { data: session } = await supabaseAdmin.from('att_sessions').select('course_id').eq('id', sessionId).single();
  if (!session) return NextResponse.json({ ok: false, error: 'Session not found' }, { status: 404 });

  let { data: enr } = await supabaseAdmin.from('att_enrollments').select('id').eq('student_id', student_id).eq('course_id', session.course_id).single();
  if (!enr) {
    const { data: newEnr } = await supabaseAdmin.from('att_enrollments').insert({ student_id, course_id: session.course_id }).select('id').single();
    enr = newEnr;
  }

  const { error } = await supabaseAdmin.from('att_attendance').insert({
    session_id: sessionId, student_id, enrollment_id: enr?.id, check_in_method: 'manual'
  });
  if (error && error.code !== '23505') return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const { id: sessionId } = await params;
  const { student_id } = await req.json();
  if (!student_id) return NextResponse.json({ ok: false, error: 'student_id required' }, { status: 400 });
  const { error } = await supabaseAdmin.from('att_attendance').delete().eq('session_id', sessionId).eq('student_id', student_id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}