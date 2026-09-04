import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createSupabaseServer } from '@/lib/supabase-server';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const { data: course } = await supabaseAdmin.from('att_courses').select('status').eq('id', id).single();
  if (!course) return NextResponse.json({ ok: false, error: 'Course not found' }, { status: 404 });
  if (course.status !== 'reviewing') return NextResponse.json({ ok: false, error: 'Must calculate eligibility first' }, { status: 400 });

  const { data: lastCalc } = await supabaseAdmin.from('att_finalization_log')
    .select('snapshot').eq('course_id', id).eq('step', 'calculate').order('performed_at', { ascending: false }).limit(1).single();

  await supabaseAdmin.from('att_finalization_log').insert({
    course_id: id, step: 'lock', snapshot: lastCalc?.snapshot, performed_by: user.email
  });

  await supabaseAdmin.from('att_sessions').update({ status: 'closed', qr_secret: null }).eq('course_id', id).in('status', ['scheduled', 'active']);
  await supabaseAdmin.from('att_courses').update({ status: 'finalized', finalized_at: new Date().toISOString() }).eq('id', id);

  revalidatePath('/admin');
  revalidatePath('/admin/courses');
  revalidatePath(`/admin/courses/${id}`);

  return NextResponse.json({ ok: true });
}