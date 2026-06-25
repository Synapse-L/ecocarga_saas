import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role to bypass RLS for public read + signed write
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/proposals/[token] — Fetch public proposal by token
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const { data, error } = await supabaseAdmin
    .from('proposals')
    .select(`
      id,
      title,
      status,
      commercial_data,
      is_public,
      client_signed_at,
      created_at,
      client:clients(name, phone, address)
    `)
    .eq('public_token', token)
    .eq('is_public', true)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Proposta não encontrada ou link inválido.' }, { status: 404 });
  }

  return NextResponse.json({ proposal: data });
}

// POST /api/proposals/[token] — Save client digital signature
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Corpo inválido.' }, { status: 400 });
  }

  const { signature } = body;

  if (!signature || typeof signature !== 'string') {
    return NextResponse.json({ error: 'Assinatura inválida.' }, { status: 400 });
  }

  // Check proposal exists and is not already signed
  const { data: existing } = await supabaseAdmin
    .from('proposals')
    .select('id, client_signed_at')
    .eq('public_token', token)
    .eq('is_public', true)
    .single();

  if (!existing) {
    return NextResponse.json({ error: 'Proposta não encontrada.' }, { status: 404 });
  }

  if (existing.client_signed_at) {
    return NextResponse.json({ error: 'Esta proposta já foi assinada.' }, { status: 409 });
  }

  const { error } = await supabaseAdmin
    .from('proposals')
    .update({
      client_signature: signature,
      client_signed_at: new Date().toISOString(),
      status: 'Concluído',
    })
    .eq('id', existing.id);

  if (error) {
    return NextResponse.json({ error: 'Erro ao salvar assinatura.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
