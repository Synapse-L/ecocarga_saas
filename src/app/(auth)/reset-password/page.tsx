"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Lock, Loader2, ArrowRight, ArrowLeft, Eye, EyeOff, KeyRound, ShieldCheck, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

const MINIMO_SENHA = 6;

/**
 * Tempo máximo de espera pela sessão de recuperação.
 *
 * O cliente do Supabase troca o `code` do link por uma sessão de forma
 * assíncrona ao carregar a página, então não dá para decidir olhando
 * getSession() uma única vez — mas também não dá para esperar para sempre,
 * senão um link inválido deixa a tela girando sem explicação.
 */
const LIMITE_ESPERA_MS = 8000;

type Estado = 'verificando' | 'pronto' | 'invalido' | 'concluido';

/**
 * Parâmetros do link, lidos na avaliação do módulo — não dentro do efeito.
 *
 * O cliente do Supabase limpa a URL sozinho ao carregar a página, inclusive
 * quando o link traz o motivo da recusa em vez de um código válido. Como essa
 * limpeza é assíncrona, ler aqui chega antes dela; ler no useEffect chegava
 * depois, e um link vencido acabava caindo na mensagem genérica só depois de
 * oito segundos girando.
 */
const LINK = typeof window === 'undefined' ? null : {
  caminho: window.location.pathname,
  hash: new URLSearchParams(window.location.hash.replace(/^#/, '')),
  query: new URLSearchParams(window.location.search),
};

/** Os parâmetros capturados, ou uma releitura se o módulo veio de outra tela. */
function lerLink() {
  if (LINK && LINK.caminho === window.location.pathname) return LINK;
  return {
    hash: new URLSearchParams(window.location.hash.replace(/^#/, '')),
    query: new URLSearchParams(window.location.search),
  };
}

/** Traduz o erro que o próprio link traz de volta na URL. */
function traduzirErroLink(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('expired')) {
    return 'Este link expirou. Peça um novo e-mail de redefinição.';
  }
  if (m.includes('already') || m.includes('used')) {
    return 'Este link já foi usado. Peça um novo e-mail de redefinição.';
  }
  return 'Link de redefinição inválido. Peça um novo e-mail.';
}

/** Traduz o erro devolvido ao gravar a nova senha. */
function traduzirErroSenha(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('should be different') || m.includes('same as the old')) {
    return 'A nova senha precisa ser diferente da anterior.';
  }
  if (m.includes('password') && m.includes('6 characters')) {
    return `A senha precisa ter pelo menos ${MINIMO_SENHA} caracteres.`;
  }
  if (m.includes('weak password') || m.includes('pwned')) {
    return 'Esta senha é fácil demais de adivinhar. Escolha outra.';
  }
  if (m.includes('session') || m.includes('jwt') || m.includes('token')) {
    return 'Sua sessão de recuperação expirou. Peça um novo e-mail de redefinição.';
  }
  if (m.includes('rate limit') || m.includes('too many requests')) {
    return 'Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo.';
  }
  if (m.includes('failed to fetch')) {
    return 'Sem conexão com o servidor. Verifique sua internet e tente de novo.';
  }
  return msg || 'Não foi possível alterar a senha.';
}

export default function ResetPasswordPage() {
  const [estado, setEstado] = useState<Estado>('verificando');
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Espera a sessão de recuperação que vem no link do e-mail.
  useEffect(() => {
    let vivo = true;

    const { hash: doHash, query: daQuery } = lerLink();

    // Quando o link está vencido, o Supabase devolve o motivo na própria URL em
    // vez de simplesmente não criar a sessão. Aproveitar isso dá uma mensagem
    // bem melhor que o "link inválido" genérico.
    const erroLink =
      doHash.get('error_description') ?? daQuery.get('error_description') ??
      doHash.get('error') ?? daQuery.get('error');
    if (erroLink) {
      setEstado('invalido');
      setError(traduzirErroLink(erroLink));
      return;
    }

    const temCredencialNaUrl =
      daQuery.has('code') || daQuery.has('token_hash') || doHash.has('access_token');

    const { data: listener } = supabase.auth.onAuthStateChange((_evento, sessao) => {
      if (vivo && sessao) setEstado('pronto');
    });

    supabase.auth.getSession()
      .then(({ data }) => {
        if (!vivo) return;
        if (data.session) {
          setEstado('pronto');
        } else if (!temCredencialNaUrl) {
          // Alguém digitou o endereço direto na barra, sem vir do e-mail.
          setEstado('invalido');
          setError('Abra esta página pelo link que enviamos por e-mail.');
        }
      })
      .catch(() => {
        if (vivo) {
          setEstado('invalido');
          setError('Não foi possível falar com o servidor. Verifique sua internet.');
        }
      });

    const limite = setTimeout(() => {
      if (!vivo) return;
      setEstado((e) => (e === 'verificando' ? 'invalido' : e));
      setError((atual) => atual ??
        'Não conseguimos validar o link. Ele pode ter expirado, ou foi aberto em outro ' +
        'navegador — a redefinição precisa terminar no mesmo navegador onde foi pedida.');
    }, LIMITE_ESPERA_MS);

    return () => {
      vivo = false;
      clearTimeout(limite);
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (senha.length < MINIMO_SENHA) {
      setError(`A senha precisa ter pelo menos ${MINIMO_SENHA} caracteres.`);
      return;
    }
    if (senha !== confirmacao) {
      setError('As duas senhas não são iguais.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: senha });
      if (error) throw error;

      // O link do e-mail vale como credencial de uso único: serve para trocar a
      // senha, não para continuar navegando. Encerrando a sessão aqui, a pessoa
      // entra de novo com a senha nova e confirma na hora que ela funciona.
      await supabase.auth.signOut();
      setEstado('concluido');
      setTimeout(() => {
        router.push('/login?aviso=senha-alterada');
      }, 2500);
    } catch (err: unknown) {
      const bruto = err instanceof Error ? err.message : String(err);
      setError(traduzirErroSenha(bruto));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="bg-white p-8 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100">
          {estado === 'verificando' && (
            <div className="flex flex-col items-center py-8">
              <Loader2 className="animate-spin text-primary mb-4" size={32} />
              <p className="text-sm text-gray-500">Validando seu link de redefinição...</p>
            </div>
          )}

          {estado === 'invalido' && (
            <>
              <div className="flex flex-col items-center mb-6">
                <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
                  <AlertTriangle className="text-red-500" size={24} />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Link inválido</h1>
                <p className="text-gray-500 text-sm mt-2 text-center">
                  {error || 'Não foi possível validar este link de redefinição.'}
                </p>
              </div>

              <Link
                href="/forgot-password"
                className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
              >
                Pedir um novo link
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>

              <p className="mt-6 text-center text-sm text-gray-500">
                <Link href="/login" className="text-primary font-bold hover:underline inline-flex items-center gap-1">
                  <ArrowLeft size={14} />
                  Voltar para o login
                </Link>
              </p>
            </>
          )}

          {estado === 'concluido' && (
            <div className="flex flex-col items-center py-6">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                <ShieldCheck className="text-primary" size={24} />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">Senha alterada</h1>
              <p className="text-gray-500 text-sm mt-2 text-center">
                Tudo certo. Estamos te levando para o login para você entrar com a nova senha.
              </p>
              <Link href="/login" className="text-primary font-bold hover:underline text-sm mt-6">
                Ir agora
              </Link>
            </div>
          )}

          {estado === 'pronto' && (
            <>
              <div className="flex flex-col items-center mb-8">
                <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center mb-4">
                  <KeyRound className="text-white" size={22} />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Crie uma nova senha</h1>
                <p className="text-gray-500 text-sm mt-2 text-center">
                  Escolha uma senha de pelo menos {MINIMO_SENHA} caracteres para voltar a acessar sua conta.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase ml-1">Nova senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type={mostrarSenha ? 'text' : 'password'}
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      placeholder={`Mínimo ${MINIMO_SENHA} caracteres`}
                      className="w-full pl-10 pr-11 py-3 rounded-xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all text-sm"
                      required
                      minLength={MINIMO_SENHA}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarSenha((v) => !v)}
                      aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase ml-1">Confirme a nova senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type={mostrarSenha ? 'text' : 'password'}
                      value={confirmacao}
                      onChange={(e) => setConfirmacao(e.target.value)}
                      placeholder="Repita a senha"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all text-sm"
                      required
                      minLength={MINIMO_SENHA}
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-red-50 text-red-600 text-xs font-medium border border-red-100">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>
                      Salvar nova senha
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
