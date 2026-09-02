import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createSupabaseServer } from '@/lib/supabase-server';
import { generateSessionSecret } from '@/lib/qr-crypto';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const secret = generateSessionSecret();

  const { error } = await supabaseAdmin.from('att_sessions').update({
    status: 'active',
    qr_secret: secret,
    started_at: new Date().toISOString(),
  }).eq('id', id).in('status', ['scheduled', 'draft']);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}