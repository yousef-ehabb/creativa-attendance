import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createSupabaseServer } from '@/lib/supabase-server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const { data, error } = await supabaseAdmin
    .from('att_attendance')
    .select('id, checked_in_at, check_in_method, att_students(id, full_name, email, phone)')
    .eq('session_id', id)
    .order('checked_in_at');
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, data });
}