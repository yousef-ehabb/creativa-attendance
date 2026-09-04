import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createSupabaseServer } from '@/lib/supabase-server';

export async function GET() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const { data, error } = await supabaseAdmin
    .from('att_courses').select('*').order('created_at', { ascending: false });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, data });
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const { name, description, training_hours, planned_sessions, min_attendance_pct, start_date, end_date, month_year } = body;
  if (!name?.trim()) return NextResponse.json({ ok: false, error: 'Course name required' }, { status: 400 });
  const { data, error } = await supabaseAdmin.from('att_courses').insert({
    name: name.trim(), description: description?.trim() || null, training_hours, planned_sessions: planned_sessions ?? 0,
    min_attendance_pct: min_attendance_pct ?? 85, start_date, end_date, month_year, status: 'draft'
  }).select().single();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  revalidatePath('/admin');
  revalidatePath('/admin/courses');

  return NextResponse.json({ ok: true, data }, { status: 201 });
}