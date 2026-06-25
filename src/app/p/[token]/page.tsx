"use client";

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2, PenLine, AlertCircle, Zap, Calendar, DollarSign, User } from 'lucide-react';

export default function PublicProposalPage({ params }: { params: { token: string } }) {
  const { token } = params;

  const [proposal, setProposal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<'view' | 'sign' | 'done'>('view');
  const [signing, setSigning] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    fetch(`/api/proposals/${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setProposal(data.proposal);
          if (data.proposal.client_signed_at) {
            setPhase('done');
          }
        }
      })
      .catch(() => setError('Erro ao carregar a proposta.'))
      .finally(() => setLoading(false));
  }, [token]);

  // Canvas drawing helpers
  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    setIsDrawing(true);
    lastPos.current = getPos(e, canvas);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    const ctx = canvas.getContext('2d');
    if (!ctx || !lastPos.current) return;
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#004D31';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    lastPos.current = pos;
    setHasSignature(true);
  };

  const stopDraw = () => {
    setIsDrawing(false);
    lastPos.current = null;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSign = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) return;
    setSigning(true);
    const signature = canvas.toDataURL('image/png');
    try {
      const res = await fetch(`/api/proposals/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signature }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPhase('done');
    } catch (err: any) {
      alert(err.message || 'Erro ao assinar. Tente novamente.');
    } finally {
      setSigning(false);
    }
  };

  // ─── LOADING ───
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-[#004D31]" size={40} />
          <p className="text-sm text-gray-400 font-semibold">Carregando proposta...</p>
        </div>
      </div>
    );
  }

  // ─── ERROR ───
  if (error || !proposal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl border border-red-100 p-10 text-center max-w-sm shadow-xl">
          <AlertCircle className="mx-auto text-red-400 mb-4" size={40} />
          <h1 className="text-xl font-black text-gray-900 mb-2">Link inválido</h1>
          <p className="text-sm text-gray-500">{error || 'Esta proposta não está disponível ou o link expirou.'}</p>
        </div>
      </div>
    );
  }

  const cd = proposal.commercial_data;
  const price = cd?.commercial?.price || 0;
  const installments = cd?.commercial?.installments || 1;
  const clientName = proposal.client?.name || cd?.client?.name || '—';
  const clientAddr = proposal.client?.address || cd?.client?.address || '';
  const productName = cd?.commercial?.productName || '—';
  const power = cd?.commercial?.power || '—';
  const deadline = cd?.commercial?.deadline || '—';
  const conditions = cd?.commercial?.conditions || '—';
  const observations = cd?.commercial?.observations || '';
  const createdAt = new Date(proposal.created_at).toLocaleDateString('pt-BR');

  // ─── SIGNED ───
  if (phase === 'done') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl border border-emerald-100 p-10 text-center max-w-sm shadow-2xl shadow-emerald-100/50"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
          >
            <CheckCircle2 className="mx-auto text-emerald-500 mb-5" size={56} />
          </motion.div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">Proposta Assinada!</h1>
          <p className="text-sm text-gray-500 mb-6">
            Obrigado, <strong>{clientName}</strong>! Sua assinatura foi registrada com sucesso.
            Nossa equipe entrará em contato em breve.
          </p>
          <div className="bg-emerald-50 rounded-2xl p-4 text-left space-y-2">
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Resumo</p>
            <p className="text-sm font-semibold text-gray-700">{productName}</p>
            <p className="text-sm text-gray-500">R$ {price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
          <p className="text-[11px] text-gray-300 mt-6">© EcoCarga — Kepler's Proposal</p>
        </motion.div>
      </div>
    );
  }

  // ─── MAIN PROPOSAL VIEW ───
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#004D31] rounded-lg flex items-center justify-center">
            <Zap size={16} className="text-[#B2D235]" />
          </div>
          <span className="font-black text-gray-900 text-sm">EcoCarga</span>
        </div>
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Proposta Comercial</span>
      </header>

      <main className="max-w-2xl mx-auto p-6 space-y-6 pb-32">
        {/* Title card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-[#004D31] to-[#006B44] rounded-3xl p-6 text-white"
        >
          <p className="text-xs font-bold text-[#B2D235] uppercase tracking-widest mb-1">Proposta Personalizada</p>
          <h1 className="text-2xl font-black leading-tight">{proposal.title}</h1>
          <div className="flex items-center gap-4 mt-4 text-sm text-white/70">
            <span className="flex items-center gap-1.5"><Calendar size={13} /> {createdAt}</span>
            <span className="flex items-center gap-1.5"><User size={13} /> {clientName}</span>
          </div>
        </motion.div>

        {/* Client info */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm"
        >
          <h2 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-4">Dados do Cliente</h2>
          <div className="space-y-2">
            <p className="font-bold text-gray-900">{clientName}</p>
            {clientAddr && <p className="text-sm text-gray-500">{clientAddr}</p>}
            {cd?.client?.phone && <p className="text-sm text-gray-500">{cd.client.phone}</p>}
          </div>
        </motion.div>

        {/* Product */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm"
        >
          <h2 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-4">Produto</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-black text-gray-900 text-lg">{productName}</p>
              <p className="text-sm text-gray-500 mt-1">Potência: {power}</p>
              {cd?.commercial?.technicalSpecs?.connectorType && (
                <p className="text-sm text-gray-500">Conector: {cd.commercial.technicalSpecs.connectorType}</p>
              )}
            </div>
            <div className="w-16 h-16 bg-[#004D31]/5 rounded-2xl flex items-center justify-center">
              <Zap size={28} className="text-[#004D31]" />
            </div>
          </div>
        </motion.div>

        {/* Pricing */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm"
        >
          <h2 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-4">Condições Comerciais</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-xs font-bold text-gray-400 uppercase">Valor Total</p>
              <p className="text-xl font-black text-gray-900 mt-1">
                R$ {price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            {installments > 1 && (
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-xs font-bold text-gray-400 uppercase">Parcelamento</p>
                <p className="text-base font-black text-gray-900 mt-1">
                  Até {installments}x de R$ {(price / installments).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            )}
            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-xs font-bold text-gray-400 uppercase">Prazo de Entrega</p>
              <p className="font-black text-gray-900 mt-1">{deadline}</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-xs font-bold text-gray-400 uppercase">Condição</p>
              <p className="font-black text-gray-900 mt-1">{conditions}</p>
            </div>
          </div>
          {observations && (
            <p className="text-xs text-gray-400 mt-4 italic border-t border-gray-50 pt-4">{observations}</p>
          )}
        </motion.div>

        {/* Tech specs */}
        {cd?.commercial?.technicalSpecs && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm"
          >
            <h2 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-4">Especificações Técnicas</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {Object.entries(cd.commercial.technicalSpecs).map(([k, v]) => (
                <div key={k} className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">{k}</span>
                  <span className="font-semibold text-gray-800">{String(v)}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </main>

      {/* Signature CTA — fixed bottom */}
      <AnimatePresence>
        {phase === 'view' && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-2xl shadow-black/10 p-6"
          >
            <button
              onClick={() => setPhase('sign')}
              className="w-full bg-[#004D31] text-white py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-[#004D31]/20"
            >
              <PenLine size={20} />
              Assinar Proposta Digitalmente
            </button>
            <p className="text-[11px] text-gray-400 text-center mt-3">
              Ao assinar, você confirma que leu e concorda com os termos desta proposta comercial.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Signature modal */}
      <AnimatePresence>
        {phase === 'sign' && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setPhase('view')}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 p-6 shadow-2xl"
            >
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />
              <h3 className="text-lg font-black text-gray-900 mb-1">Assinar Proposta</h3>
              <p className="text-sm text-gray-500 mb-4">Desenhe sua assinatura abaixo com o dedo ou mouse.</p>

              {/* Canvas */}
              <div className="relative border-2 border-dashed border-[#004D31]/30 rounded-2xl bg-gray-50 overflow-hidden mb-4">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={160}
                  className="w-full touch-none cursor-crosshair"
                  onMouseDown={startDraw}
                  onMouseMove={draw}
                  onMouseUp={stopDraw}
                  onMouseLeave={stopDraw}
                  onTouchStart={startDraw}
                  onTouchMove={draw}
                  onTouchEnd={stopDraw}
                />
                {!hasSignature && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <p className="text-gray-300 text-sm font-semibold">Assine aqui...</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={clearCanvas}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Limpar
                </button>
                <button
                  onClick={handleSign}
                  disabled={!hasSignature || signing}
                  className="flex-2 flex-grow-[2] py-3 rounded-xl bg-[#004D31] text-white font-black text-sm flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-40 transition-all cursor-pointer"
                >
                  {signing ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                  {signing ? 'Salvando...' : 'Confirmar Assinatura'}
                </button>
              </div>

              <p className="text-[11px] text-gray-400 text-center mt-4">
                Sua assinatura será salva com data e hora. Esta ação não pode ser desfeita.
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
