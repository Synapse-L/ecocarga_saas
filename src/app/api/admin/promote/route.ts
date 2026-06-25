import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { key } = await request.json();
    const masterKey = process.env.ADMIN_PROMOTION_KEY;

    if (!key || key !== masterKey) {
      return NextResponse.json({ error: 'Chave mestra inválida.' }, { status: 401 });
    }

    // Criar o client do Supabase integrado com os cookies da sessão
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Pode ser ignorado se houver middleware renovando sessões
            }
          },
        },
      }
    );

    // Obter o usuário logado a partir da sessão ativa nos cookies
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Usuário não autenticado.' }, { status: 401 });
    }

    // Promover o usuário logado para admin na tabela de perfis
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', user.id);

    if (updateError) {
      console.error('Erro de update do Supabase:', updateError);
      return NextResponse.json({ error: `Erro ao atualizar nível de acesso no banco de dados: ${updateError.message} (${updateError.code})` }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Usuário promovido a administrador!' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro interno do servidor.' }, { status: 500 });
  }
}
