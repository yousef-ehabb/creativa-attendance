import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createSupabaseServer } from '@/lib/supabase-server';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const { reason } = await req.json();

  await supabaseAdmin.from('att_finalization_log').insert({
    course_id: id, step: 'reopened', performed_by: user.email,
    snapshot: { reason: reason ?? 'No reason provided' }
  });
  await supabaseAdmin.from('att_courses').update({ status: 'active', finalized_at: null }).eq('id', id);

  revalidatePath('/admin');
  revalidatePath('/admin/courses');
  revalidatePath(`/admin/courses/${id}`);

  return NextResponse.json({ ok: true });
}