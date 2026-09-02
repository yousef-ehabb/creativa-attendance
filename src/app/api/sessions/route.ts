import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createSupabaseServer } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const { course_id, session_date, session_number, start_time, end_time } = await req.json();
  if (!course_id || !session_date) return NextResponse.json({ ok: false, error: 'Missing fields' }, { status: 400 });

  let nextSessionNum = session_number;
  if (!nextSessionNum) {
    const { count } = await supabaseAdmin
      .from('att_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', course_id);
    nextSessionNum = (count ?? 0) + 1;
  }

  const { data, error } = await supabaseAdmin.from('att_sessions').insert({
    course_id,
    session_date,
    session_number: nextSessionNum,
    start_time: start_time || null,
    end_time: end_time || null,
    status: 'scheduled',
  }).select().single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, data }, { status: 201 });
}