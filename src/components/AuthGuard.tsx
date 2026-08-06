"use client";

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

/**
 * Exige sessão para tudo, menos o que estiver declarado como público aqui.
 *
 * Antes cada tela repetia `getUser()` e, se não houvesse usuário,
 * `router.push('/login')`. Funcionava, mas a proteção dependia de o autor da
 * próxima tela lembrar de escrevê-la — e a página renderizava uma vez antes do
 * redirecionamento. Invertendo o padrão, esquecer passa a ser o caso seguro:
 * uma tela nova nasce protegida, e abrir uma exceção exige vir até este
 * arquivo e dizer qual é.
 *
 * Isto NÃO substitui a RLS. É navegação — quem protege os dados é o banco.
 */

/** Caminhos exatos que dispensam sessão. */
const ROTAS_PUBLICAS = ['/login', '/signup', '/forgot-password', '/reset-password'];

/** Prefixos públicos: a proposta que o cliente abre pelo link, sem conta. */
const PREFIXOS_PUBLICOS = ['/p/'];

const ehPublica = (pathname: string) =>
  ROTAS_PUBLICAS.includes(pathname) ||
  PREFIXOS_PUBLICOS.some((prefixo) => pathname.startsWith(prefixo));

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const publica = ehPublica(pathname);

  // Começa liberado nas públicas para não piscar um spinner no login.
  const [liberado, setLiberado] = useState(publica);

  useEffect(() => {
    if (publica) {
      setLiberado(true);
      return;
    }

    let vivo = true;
    setLiberado(false);

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!vivo) return;
        if (data.session) {
          setLiberado(true);
        } else {
          router.replace('/login');
        }
      })
      .catch((err) => {
        // Falha de rede não é falta de sessão. Mandar para o login aqui tiraria
        // a pessoa da tela por causa de uma oscilação de conexão; as telas já
        // sabem mostrar erro de carregamento, e a RLS continua de pé.
        console.error('Não foi possível verificar a sessão:', err);
        if (vivo) setLiberado(true);
      });

    // Sair numa aba tem que refletir nas outras.
    const { data: listener } = supabase.auth.onAuthStateChange((evento) => {
      if (evento === 'SIGNED_OUT') router.replace('/login');
    });

    return () => {
      vivo = false;
      listener.subscription.unsubscribe();
    };
  }, [pathname, publica, router]);

  if (!liberado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50 dark:bg-slate-950">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    );
  }

  return <>{children}</>;
}
