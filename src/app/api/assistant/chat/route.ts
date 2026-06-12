import { NextResponse } from 'next/server';
import { askGemini } from '@/lib/services/ai/gemini';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    });

    // 1. Authenticate user session
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Acesso não autorizado. Por favor, faça login.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { query, history, stats } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'A mensagem do usuário é obrigatória.' },
        { status: 400 }
      );
    }

    // 2. Fetch all system and custom charger models from database
    const { data: chargerModels } = await supabase
      .from('charger_models')
      .select('*')
      .order('name', { ascending: true });

    // 3. Call the Gemini service with charger models list
    const reply = await askGemini(query, history || [], stats, chargerModels || []);

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error('[POST /api/assistant/chat Route Error]', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno no servidor de IA.' },
      { status: 500 }
    );
  }
}
