import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createSupabaseServer } from '@/lib/supabase-server';
import { calculateEligibility } from '@/lib/eligibility';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  // Check no active sessions
  const { count } = await supabaseAdmin.from('att_sessions').select('*', { count: 'exact', head: true }).eq('course_id', id).eq('status', 'active');
  if ((count ?? 0) > 0) return NextResponse.json({ ok: false, error: 'Close all active sessions before calculating' }, { status: 400 });

  try {
    const snapshot = await calculateEligibility(id);
    await supabaseAdmin.from('att_finalization_log').insert({ course_id: id, step: 'calculate', snapshot, performed_by: user.email });
    await supabaseAdmin.from('att_courses').update({ status: 'reviewing' }).eq('id', id);
    return NextResponse.json({ ok: true, data: snapshot });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}