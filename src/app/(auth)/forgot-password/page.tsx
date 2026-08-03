"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Mail, Loader2, ArrowRight, ArrowLeft, MailCheck } from 'lucide-react';
import Link from 'next/link';

/**
 * O Supabase devolve as mensagens de erro em inglês. Traduz as que aparecem no
 * pedido de redefinição; o resto passa como veio, para não esconder informação
 * de diagnóstico.
 */
function traduzirErroEnvio(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('rate limit') || m.includes('too many requests')) {
    return 'Muitos pedidos seguidos. Aguarde alguns minutos e tente de novo.';
  }
  if (m.includes('invalid email') || m.includes('unable to validate email')) {
    return 'E-mail inválido. Confira se digitou corretamente.';
  }
  if (m.includes('failed to fetch')) {
    return 'Sem conexão com o servidor. Verifique sua internet e tente de novo.';
  }
  return msg || 'Não foi possível enviar o e-mail de redefinição.';
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        // A tela que recebe o link precisa estar cadastrada em
        // Authentication → URL Configuration → Redirect URLs no painel do
        // Supabase, senão o link volta para a Site URL e cai no dashboard.
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      setEnviado(true);
    } catch (err: unknown) {
      const bruto = err instanceof Error ? err.message : String(err);
      setError(traduzirErroEnvio(bruto));
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
          {enviado ? (
            <>
              <div className="flex flex-col items-center mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                  <MailCheck className="text-primary" size={24} />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Verifique seu e-mail</h1>
                <p className="text-gray-500 text-sm mt-2 text-center">
                  Se <span className="font-bold text-gray-700">{email}</span> estiver cadastrado,
                  enviamos um link para você criar uma nova senha.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-500 leading-relaxed">
                O link vale por 1 hora e só pode ser usado uma vez. Não esqueça de olhar a
                caixa de spam — e abra o link{' '}
                <span className="font-bold text-gray-700">neste mesmo navegador</span>, senão
                a validação não funciona.
              </div>

              <button
                onClick={() => { setEnviado(false); setError(null); }}
                className="w-full mt-4 py-3 rounded-xl font-bold text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all"
              >
                Não chegou? Enviar de novo
              </button>

              <p className="mt-4 text-center text-sm text-gray-500">
                <Link href="/login" className="text-primary font-bold hover:underline inline-flex items-center gap-1">
                  <ArrowLeft size={14} />
                  Voltar para o login
                </Link>
              </p>
            </>
          ) : (
            <>
              <div className="flex flex-col items-center mb-8">
                <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center mb-4">
                  <span className="text-white font-bold text-2xl">P</span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Esqueceu a senha?</h1>
                <p className="text-gray-500 text-sm mt-2 text-center">
                  Informe o e-mail da sua conta e enviaremos um link para você criar uma nova.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase ml-1">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="exemplo@empresa.com"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all text-sm"
                      required
                      autoFocus
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
                      Enviar link de redefinição
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              <p className="mt-8 text-center text-sm text-gray-500">
                Lembrou a senha?{' '}
                <Link href="/login" className="text-primary font-bold hover:underline">
                  Fazer login
                </Link>
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
