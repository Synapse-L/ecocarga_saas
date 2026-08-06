"use client";

import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

/**
 * Confirmação em diálogo próprio, no lugar do confirm() do navegador.
 *
 * A interface é uma promessa justamente para o código chamador continuar
 * parecido com o que era — `if (!await confirmar(...)) return;` no lugar de
 * `if (!confirm(...)) return;`. Sem isso, cada troca viraria uma reescrita do
 * fluxo em callbacks.
 *
 * Motivo de existir: confirm() é bloqueante, ignora o tema, não dá para
 * escrever o rótulo do botão e alguns navegadores oferecem "impedir que esta
 * página crie mais diálogos" — que desliga a confirmação de exclusão sem a
 * aplicação ficar sabendo.
 */

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Pinta o botão de vermelho. Use para exclusão e afins. */
  destructive?: boolean;
}

type Confirmar = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<Confirmar | undefined>(undefined);

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  // Guarda o resolve da promessa aberta até o clique do usuário chegar.
  const resolverRef = useRef<((v: boolean) => void) | null>(null);

  const confirmar = useCallback<Confirmar>((opts) => {
    // Se já houver um diálogo aberto, o anterior é resolvido como cancelado —
    // deixar a promessa pendente para sempre travaria o fluxo que a aguarda.
    resolverRef.current?.(false);
    setOptions(opts);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const responder = (resposta: boolean) => {
    resolverRef.current?.(resposta);
    resolverRef.current = null;
    setOptions(null);
  };

  return (
    <ConfirmContext.Provider value={confirmar}>
      {children}

      {/* Sem AnimatePresence de propósito.
          Com framer-motion 12 + React 19, a saída daqui não completava: a
          promessa resolvia, mas a sobreposição continuava na tela e prendia a
          pessoa na página — e um diálogo que não fecha é pior defeito que a
          falta de um esmaecimento. A entrada continua animada; a saída é
          remoção direta. */}
      {options && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => responder(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              role="alertdialog"
              aria-modal="true"
              className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-2xl max-w-sm w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                    options.destructive
                      ? 'bg-red-50 dark:bg-red-950/30'
                      : 'bg-primary/5'
                  }`}
                >
                  <AlertTriangle
                    size={20}
                    className={options.destructive ? 'text-red-500' : 'text-primary'}
                  />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-gray-900 dark:text-white leading-snug">
                    {options.title}
                  </h2>
                  {options.description && (
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                      {options.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => responder(false)}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm text-gray-600 dark:text-slate-300 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  {options.cancelLabel ?? 'Cancelar'}
                </button>
                <button
                  autoFocus
                  onClick={() => responder(true)}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-sm text-white transition-all active:scale-[0.98] cursor-pointer ${
                    options.destructive
                      ? 'bg-red-500 hover:bg-red-600'
                      : 'bg-primary hover:opacity-90'
                  }`}
                >
                  {options.confirmLabel ?? 'Confirmar'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
    </ConfirmContext.Provider>
  );
};

export const useConfirm = (): Confirmar => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm precisa estar dentro de ConfirmProvider');
  return ctx;
};
