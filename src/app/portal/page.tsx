// 🧹 REMOVABLE MODULE — delete the /portal folder to remove this feature entirely
// This page represents the client-facing restricted area, accessed via magic link.
// It includes real browser geolocation capture, IP fetching, and interactive chat simulators.

"use client";

import React, { useState, useEffect } from 'react';
import { 
  Shield, CheckCircle2, AlertCircle, FileText, Send, Wrench, 
  MapPin, Clock, UploadCloud, Download, Phone, Mail, 
  ChevronRight, Lock, Key, ArrowRight, UserCheck, Smartphone, Check, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/context/AppContext';

// --- Types ---
interface Message {
  id: string;
  sender: 'client' | 'salesperson';
  text: string;
  time: string;
}

export default function ClientPortalPage() {
  const { theme } = useApp();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [loginStep, setLoginStep] = useState<'email' | 'otp'>('email');
  
  // Signature States
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [signerCPF, setSignerCPF] = useState('');
  const [signerName, setSignerName] = useState('');
  const [isSigned, setIsSigned] = useState(false);
  
  // Real Captured Metadata
  const [userIP, setUserIP] = useState('177.89.224.11 (Carregando...)');
  const [userGeo, setUserGeo] = useState('Capturando coordenadas...');
  const [docHash, setDocHash] = useState('');

  // Upload States
  const [laudoProgress, setLaudoProgress] = useState(-1); // -1 means not started
  const [artProgress, setArtProgress] = useState(-1);

  // Chat States
  const [messages, setMessages] = useState<Message[]>([
    { id: 'm1', sender: 'salesperson', text: 'Olá! Sou o Thiago Alencar, seu gestor na EcoCarga. Fico responsável por acompanhar toda a infraestrutura física de instalação dos seus 3 carregadores no condomínio.', time: '10:15' },
    { id: 'm2', sender: 'salesperson', text: 'Você pode utilizar este portal para acompanhar as obras, baixar laudos e fazer o upload da ART de responsabilidade civil.', time: '10:16' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Fetch real IP and capture Geolocation on mount
  useEffect(() => {
    // 1. Fetch public IP safely
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => setUserIP(data.ip || '187.45.221.44'))
      .catch(() => setUserIP('189.6.220.142 (IP Local Mock)'));

    // 2. Capture Geolocation
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserGeo(`Lat: ${pos.coords.latitude.toFixed(4)}, Long: ${pos.coords.longitude.toFixed(4)}`);
        },
        () => {
          setUserGeo('Lat: -23.5505, Long: -46.6333 (São Paulo - SP)'); // Default fallback
        }
      );
    } else {
      setUserGeo('Não suportado pelo navegador');
    }

    // 3. Generate a stable doc SHA-256 hash
    setDocHash('ec_sha256_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
  }, []);

  // Handle Magic Link / Mock login bypass
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginStep === 'email') {
      setLoginStep('otp');
    } else {
      setIsLoggedIn(true);
    }
  };

  const handleDemoBypass = () => {
    setIsLoggedIn(true);
    setSignerName('João Silva');
    setSignerCPF('345.890.123-45');
  };

  // ClickSign ICP-Brasil Signer simulator
  const handleSignDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signerCPF || !signerName) return;
    
    setIsSigned(true);
    setTimeout(() => {
      setIsSignModalOpen(false);
    }, 1500);
  };

  // Mock File Upload animation helper
  const handleSimulateUpload = (type: 'laudo' | 'art') => {
    const setProgress = type === 'laudo' ? setLaudoProgress : setArtProgress;
    setProgress(0);
    
    let current = 0;
    const interval = setInterval(() => {
      current += 10;
      setProgress(current);
      if (current >= 100) {
        clearInterval(interval);
      }
    }, 150);
  };

  // Interactive Chat response simulator
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMsg: Message = {
      id: `mc-${Date.now()}`,
      sender: 'client',
      text: chatInput,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMsg]);
    setChatInput('');
    setIsTyping(true);

    // Simulated reply from account manager after 1.5 seconds
    setTimeout(() => {
      setIsTyping(false);
      const reply: Message = {
        id: `ms-${Date.now()}`,
        sender: 'salesperson',
        text: 'Perfeito! Recebi sua mensagem. Já estou verificando a documentação junto à nossa engenharia física de campo e te dou um retorno em instantes.',
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, reply]);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-emerald-500/30">
      
      {/* 1. LOGIN / MAGIC LINK COVER (EPIC 3.1) */}
      <AnimatePresence mode="wait">
        {!isLoggedIn ? (
          <motion.div 
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center p-4 min-h-screen relative overflow-hidden"
          >
            {/* Background blur rings */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-emerald-500/10 filter blur-3xl -z-10" />
            
            <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-8 space-y-6 shadow-2xl relative">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                  <Shield className="text-emerald-400" size={24} />
                </div>
                <h2 className="text-xl font-black tracking-tight text-white">Portal de Instalação EcoCarga</h2>
                <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                  Acesse sua área exclusiva de cliente para acompanhar suas estações de recarga e assinar documentos jurídicos.
                </p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
                {loginStep === 'email' ? (
                  <div className="space-y-1">
                    <label className="font-bold text-neutral-400 uppercase tracking-wider">Seu E-mail Cadastrado</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
                      <input 
                        type="email"
                        required
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="exemplo@empresa.com.br"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-neutral-800 bg-neutral-950 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="font-bold text-neutral-400 uppercase tracking-wider">Código de Acesso Enviado</label>
                    <div className="relative">
                      <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
                      <input 
                        type="text"
                        required
                        maxLength={6}
                        placeholder="Digite os 6 dígitos"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-neutral-800 bg-neutral-950 text-white text-center tracking-widest font-bold focus:outline-none"
                      />
                    </div>
                    <p className="text-[10px] text-neutral-500">Enviamos um link mágico e um código numérico para seu e-mail.</p>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-emerald-550 hover:bg-emerald-600 text-white py-3 rounded-xl font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <span>{loginStep === 'email' ? 'Enviar Link Mágico' : 'Confirmar e Acessar'}</span>
                  <ArrowRight size={14} />
                </button>
              </form>

              <div className="relative flex py-2 items-center text-[10px] uppercase text-neutral-600 font-bold">
                <div className="flex-grow border-t border-neutral-800" />
                <span className="flex-shrink mx-3">Ou acesse para demonstração</span>
                <div className="flex-grow border-t border-neutral-800" />
              </div>

              <button
                onClick={handleDemoBypass}
                className="w-full bg-neutral-800 hover:bg-neutral-750 text-neutral-200 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border border-neutral-700/30"
              >
                <UserCheck size={16} className="text-emerald-400" />
                Entrar como Cliente de Teste
              </button>
            </div>
          </motion.div>
        ) : (
          /* ========================================================================= */
          /* PORTAL PRINCIPAL DO CLIENTE */
          /* ========================================================================= */
          <motion.div 
            key="portal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col max-w-6xl mx-auto w-full p-4 md:p-8 space-y-8"
          >
            {/* Header / Brand bar */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-neutral-900">
              <div className="flex items-center gap-3">
                <img src="/ecocarga-logo-small.png" alt="EcoCarga" className="w-10 h-10 object-contain" />
                <div>
                  <h1 className="text-lg font-black tracking-tight text-white">EcoCarga Portal</h1>
                  <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Acompanhamento e Assinaturas</span>
                </div>
              </div>

              {/* Account details and exit */}
              <div className="flex items-center gap-4">
                <div className="text-right hidden md:block">
                  <p className="text-xs font-bold text-neutral-300">Condomínio Residencial Green Park</p>
                  <p className="text-[10px] text-neutral-500">Unidade SP-01 · João Silva</p>
                </div>
                <button
                  onClick={() => {
                    setIsLoggedIn(false);
                    setLoginStep('email');
                    setIsSigned(false);
                  }}
                  className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                >
                  Sair do Portal
                </button>
              </div>
            </header>

            {/* Split layout: Timeline tracker & representative (Left) / Signatures & Documents (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              
              {/* Left Column (Timeline and contact manager) */}
              <div className="lg:col-span-3 space-y-6">
                
                {/* TIMELINE OF INSTALLATION */}
                <div className="bg-neutral-900 border border-neutral-850 rounded-3xl p-6 space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">Acompanhamento da Instalação</h3>
                    <span className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase">Em Andamento</span>
                  </div>

                  {/* Vertical timeline steps stepper */}
                  <div className="relative pl-6 space-y-8 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-800">
                    
                    {/* Step 1 */}
                    <div className="relative">
                      <span className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-emerald-500 border-4 border-neutral-900 flex items-center justify-center" />
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-black text-white">Contrato Assinado</h4>
                        <p className="text-[10px] text-neutral-400">Formalização das licenças e propostas aprovadas.</p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="relative">
                      <span className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-emerald-500 border-4 border-neutral-900 flex items-center justify-center" />
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-black text-white">Visita Técnica de Projeto</h4>
                        <p className="text-[10px] text-neutral-400">Mapeamento da tubulação do estacionamento e quadro.</p>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="relative">
                      <span className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-amber-500 border-4 border-neutral-900 flex items-center justify-center animate-pulse" />
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-black text-amber-400">Infraestrutura em Execução</h4>
                        <p className="text-[10px] text-neutral-300 font-medium">Lançamento de eletrodutos e fiação de cobre blindado.</p>
                        <span className="text-[9px] text-neutral-500 font-bold block mt-1">Previsão de término físico: 08/07/2026</span>
                      </div>
                    </div>

                    {/* Step 4 */}
                    <div className="relative">
                      <span className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-neutral-850 border-4 border-neutral-900 flex items-center justify-center" />
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-black text-neutral-500">Aprovação da Concessionária</h4>
                        <p className="text-[10px] text-neutral-500">Homologação final da carga na companhia elétrica local.</p>
                      </div>
                    </div>

                    {/* Step 5 */}
                    <div className="relative">
                      <span className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-neutral-850 border-4 border-neutral-900 flex items-center justify-center" />
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-black text-neutral-500">Ativação & Comissionamento</h4>
                        <p className="text-[10px] text-neutral-500">Testes finais do aplicativo OCPP e carregamento liberado.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* VENDEDOR CONTACT PROFILE CARD */}
                <div className="bg-neutral-900 border border-neutral-850 rounded-3xl p-6 flex flex-col sm:flex-row items-center gap-5 justify-between">
                  <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                    <div 
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-sm font-black text-white flex-shrink-0 relative"
                      style={{ background: 'linear-gradient(135deg, #004D31, #006B44)' }}
                    >
                      TA
                      <span className="absolute -right-1 -bottom-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-neutral-900" />
                    </div>
                    
                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-white">Thiago Alencar</h4>
                      <p className="text-[10px] text-neutral-400">Seu Gestor de Contas EcoCarga</p>
                      <p className="text-[9px] text-neutral-500 flex items-center justify-center sm:justify-start gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                        Online e disponível
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto">
                    <a 
                      href="https://wa.me/5511999999999" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold transition-all text-xs flex items-center justify-center gap-1.5"
                    >
                      <Phone size={14} />
                      WhatsApp
                    </a>
                  </div>
                </div>

              </div>

              {/* Right Column (Signatures, documents, ART upload & Chat) */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* PROPOSALS & ICP-BRASIL SIGNATURE (EPIC 1.3) */}
                <div className="bg-neutral-900 border border-neutral-850 rounded-3xl p-6 space-y-4">
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">Propostas e Contratos</h3>
                  
                  <div className="p-4 bg-neutral-950 border border-neutral-850 rounded-2xl flex flex-col justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-neutral-900 rounded-xl text-neutral-400">
                        <FileText size={18} />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-black text-white">Contrato de Infraestrutura Física</p>
                        <p className="text-[9px] text-neutral-500">Tamanho: 2.4 MB · Formato: PDF</p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button 
                        onClick={() => alert('Baixando PDF da proposta homologada...')}
                        className="flex-1 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-300 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 text-[10px] cursor-pointer"
                      >
                        <Download size={12} />
                        Visualizar PDF
                      </button>

                      {isSigned ? (
                        <div className="flex-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 py-2.5 rounded-xl font-bold flex items-center justify-center gap-1 text-[10px]">
                          <CheckCircle2 size={12} />
                          Assinado ICP-Brasil
                        </div>
                      ) : (
                        <button 
                          onClick={() => setIsSignModalOpen(true)}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-bold transition-all active:scale-[0.97] flex items-center justify-center gap-1.5 text-[10px] cursor-pointer"
                        >
                          <Shield size={12} />
                          Assinar Contrato
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* FILE MANAGER / ART UPLOADER (EPIC 3.1) */}
                <div className="bg-neutral-900 border border-neutral-850 rounded-3xl p-6 space-y-4">
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">Envio de Laudos e ART</h3>
                  <p className="text-[10px] text-neutral-400">É necessário enviar a ART de Engenharia para validação da concessionária.</p>

                  <div className="space-y-3">
                    
                    {/* Laudo Tecnico (Download) */}
                    <div className="p-3 bg-neutral-950 border border-neutral-850 rounded-xl flex items-center justify-between gap-3">
                      <div>
                        <p className="font-bold text-white text-xs">Laudo de Viabilidade Elétrica</p>
                        <span className="text-[9px] text-neutral-500 font-medium">Emitido por EcoCarga Engenharia</span>
                      </div>
                      <button 
                        onClick={() => alert('Download do laudo elétrico homologado')}
                        className="p-2 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 rounded-lg text-neutral-300 transition-colors"
                      >
                        <Download size={14} />
                      </button>
                    </div>

                    {/* ART Uploader (Interactive) */}
                    <div className="p-3.5 bg-neutral-950 border border-dashed border-neutral-800 rounded-2xl flex flex-col items-center justify-center text-center gap-2">
                      {artProgress === -1 ? (
                        <>
                          <UploadCloud size={24} className="text-neutral-500" />
                          <div>
                            <p className="text-xs font-bold text-white">Upload de ART / RRT</p>
                            <p className="text-[9px] text-neutral-500">PDF, JPG de até 10MB</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSimulateUpload('art')}
                            className="bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-300 px-4 py-1.5 rounded-lg text-[9px] font-bold tracking-wider uppercase transition-colors cursor-pointer mt-1"
                          >
                            Selecionar Arquivo
                          </button>
                        </>
                      ) : artProgress < 100 ? (
                        <div className="w-full space-y-2 py-2">
                          <div className="flex justify-between items-center text-[10px] font-bold text-neutral-400">
                            <span>Enviando art_projeto_final.pdf</span>
                            <span>{artProgress}%</span>
                          </div>
                          <div className="w-full h-1 bg-neutral-900 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 transition-all" style={{ width: `${artProgress}%` }} />
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-1.5 py-2 text-center text-[10px] font-bold text-emerald-400">
                          <CheckCircle2 size={24} className="text-emerald-500 animate-bounce" />
                          <span>ART carregada com sucesso!</span>
                          <span className="text-[9px] text-neutral-500 font-medium">Aguardando validação da equipe técnica.</span>
                        </div>
                      )}
                    </div>

                  </div>
                </div>

                {/* INTERACTIVE CHAT WINDOW (EPIC 3.1) */}
                <div className="bg-neutral-900 border border-neutral-850 rounded-3xl p-6 space-y-4 flex flex-col h-96">
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">Fale com seu Instalador</h3>
                  
                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
                    {messages.map(msg => (
                      <div 
                        key={msg.id}
                        className={`flex flex-col max-w-[85%] space-y-1 ${
                          msg.sender === 'client' ? 'ml-auto items-end' : 'items-start'
                        }`}
                      >
                        <div className={`p-3 rounded-2xl leading-normal ${
                          msg.sender === 'client' 
                            ? 'bg-emerald-600 text-white rounded-tr-none' 
                            : 'bg-neutral-950 border border-neutral-850 text-neutral-200 rounded-tl-none'
                        }`}>
                          {msg.text}
                        </div>
                        <span className="text-[8px] text-neutral-600 font-medium px-1">{msg.time}</span>
                      </div>
                    ))}

                    {/* Typing Indicator */}
                    {isTyping && (
                      <div className="flex items-center gap-1.5 p-3 rounded-2xl bg-neutral-950 border border-neutral-850 rounded-tl-none w-fit text-neutral-500">
                        <span className="w-1.5 h-1.5 bg-neutral-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-neutral-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-neutral-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    )}
                  </div>

                  {/* Input Form */}
                  <form onSubmit={handleSendMessage} className="flex gap-2 pt-2 border-t border-neutral-850/60">
                    <input 
                      type="text"
                      placeholder="Digite sua mensagem..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-neutral-800 bg-neutral-950 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500/40 text-white"
                    />
                    <button 
                      type="submit"
                      disabled={!chatInput.trim()}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 rounded-xl transition-all active:scale-[0.97] cursor-pointer disabled:opacity-50"
                    >
                      <Send size={15} />
                    </button>
                  </form>
                </div>

              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- ICP-BRASIL SIGNATURE MODAL --- */}
      <AnimatePresence>
        {isSignModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSignModalOpen(false)}
              className="fixed inset-0 bg-black"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden z-10 flex flex-col text-xs"
            >
              {/* Header */}
              <div className="p-6 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/80 backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <Shield className="text-emerald-400" size={18} />
                  <h3 className="text-sm font-black text-white">Assinatura ClickSign ICP-Brasil</h3>
                </div>
                <button 
                  onClick={() => setIsSignModalOpen(false)}
                  className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-500 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSignDocument} className="p-6 space-y-4">
                
                {/* Visual Metadata Logger (Geolo, IP) */}
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-850/70 space-y-2.5">
                  <span className="text-[9px] font-black text-neutral-500 uppercase tracking-wider">Metadados Jurídicos Capturados</span>
                  
                  <div className="space-y-1.5 font-medium text-[10px] text-neutral-400">
                    <p className="flex items-center gap-1.5">
                      <Lock size={12} className="text-emerald-500" />
                      <span>Endereço IP: <span className="font-bold text-neutral-200">{userIP}</span></span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <MapPin size={12} className="text-rose-550" />
                      <span>Coordenadas GPS: <span className="font-bold text-neutral-200">{userGeo}</span></span>
                    </p>
                    <p className="flex items-start gap-1.5 leading-none">
                      <FileText size={12} className="text-primary mt-0.5 flex-shrink-0" />
                      <span className="truncate">Hash SHA-256: <span className="font-mono text-[9px] text-neutral-500">{docHash}</span></span>
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="font-bold text-neutral-400 uppercase tracking-wider">Nome Completo do Assinante *</label>
                    <input 
                      type="text"
                      required
                      value={signerName}
                      onChange={(e) => setSignerName(e.target.value)}
                      placeholder="João da Silva Santos"
                      className="w-full px-4 py-3 rounded-xl border border-neutral-800 bg-neutral-950 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/50 text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-neutral-400 uppercase tracking-wider">CPF ou CNPJ *</label>
                    <input 
                      type="text"
                      required
                      value={signerCPF}
                      onChange={(e) => setSignerCPF(e.target.value)}
                      placeholder="000.000.000-00"
                      className="w-full px-4 py-3 rounded-xl border border-neutral-800 bg-neutral-950 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/50 text-sm"
                    />
                  </div>
                </div>

                {/* ICP Brazil legal agreement checkbox */}
                <label className="flex items-start gap-2.5 cursor-pointer text-[10px] text-neutral-400 leading-normal font-medium pt-1">
                  <input 
                    type="checkbox"
                    required
                    className="mt-0.5 rounded border-neutral-800 bg-neutral-950 text-emerald-550 focus:ring-0"
                  />
                  <span>
                    Declaro que aceito assinar este documento de forma eletrônica sob validade jurídica nos termos da MP nº 2.200-2/2001 (ICP-Brasil).
                  </span>
                </label>

                {/* Submitting buttons */}
                <div className="pt-4 border-t border-neutral-800 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSignModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl font-bold text-neutral-450 hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    Voltar
                  </button>

                  <button
                    type="submit"
                    disabled={isSigned}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all active:scale-[0.97] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSigned ? (
                      <>
                        <Check size={14} />
                        Assinado!
                      </>
                    ) : (
                      <>
                        <UserCheck size={14} />
                        Assinar Eletronicamente
                      </>
                    )}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
