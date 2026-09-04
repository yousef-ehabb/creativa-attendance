import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createSupabaseServer } from '@/lib/supabase-server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const { data, error } = await supabaseAdmin.from('att_courses').select('*').eq('id', id).single();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 404 });
  return NextResponse.json({ ok: true, data });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const { error } = await supabaseAdmin.from('att_courses').update(body).eq('id', id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });

  revalidatePath('/admin');
  revalidatePath('/admin/courses');
  revalidatePath(`/admin/courses/${id}`);

  return NextResponse.json({ ok: true });
}