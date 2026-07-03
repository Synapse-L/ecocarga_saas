'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, 
  X, 
  Minus, 
  Send, 
  Sparkles, 
  MessageSquare,
  BarChart2,
  TrendingUp,
  Award,
  Zap,
  HelpCircle,
  Maximize2
} from 'lucide-react';


interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface DashboardStats {
  totalProposals: number;
  totalProposalsGrowth: number;
  totalValue: number;
  totalValueGrowth: number;
  conversionRate: number;
  conversionRateGrowth: number;
  averageTicket: number;
  averageTicketGrowth: number;
  powerInstalled: number;
  powerInstalledGrowth: number;
  proposalsByStatus: {
    concluido: number;
    negociacao: number;
    apresentada: number;
    perdido: number;
  };
  proposalsByProduct: Record<string, number>;
  topClients: Array<{ client: string; value: number; count: number }>;
}

export default function KeplerAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | undefined>(undefined);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load chat history and stats on mount
  useEffect(() => {
    // 1. Initial Welcome message if history is empty
    const savedMessages = sessionStorage.getItem('kepler_chat_messages');
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch (e) {
        initWelcomeMessage();
      }
    } else {
      initWelcomeMessage();
    }

    // 2. Load dashboard stats from sessionStorage
    loadStats();

    // 3. Listen to dashboardStatsUpdated custom event
    const handleStatsUpdate = () => {
      loadStats();
    };

    window.addEventListener('dashboardStatsUpdated', handleStatsUpdate);
    return () => {
      window.removeEventListener('dashboardStatsUpdated', handleStatsUpdate);
    };
  }, []);

  // Scroll to bottom when messages or typing state changes
  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isTyping, isOpen, isMinimized]);

  // Focus input when chat opens or is restored from minimize
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [isOpen, isMinimized]);

  const initWelcomeMessage = () => {
    const welcome: ChatMessage = {
      id: 'welcome',
      role: 'assistant',
      content: "Olá! Sou o **Kepler's Assistant**, o consultor de inteligência comercial da **EcoCarga**. \n\nEstou pronto para ajudar você a analisar seu faturamento, entender o status das propostas, listar seus principais clientes ou esclarecer dúvidas técnicas sobre carregadores rápidos DC e AC. Como posso te ajudar hoje?",
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
    setMessages([welcome]);
  };

  const loadStats = () => {
    if (typeof window !== 'undefined') {
      const rawStats = sessionStorage.getItem('dashboardStats');
      if (rawStats) {
        try {
          setDashboardStats(JSON.parse(rawStats));
        } catch (e) {
          console.error('Failed to parse dashboardStats from sessionStorage', e);
        }
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const saveMessages = (newMessages: ChatMessage[]) => {
    setMessages(newMessages);
    sessionStorage.setItem('kepler_chat_messages', JSON.stringify(newMessages));
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    if (!textToSend) {
      setInputText('');
    }

    // Add user message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...messages, userMsg];
    saveMessages(updatedMessages);
    setIsTyping(true);

    try {
      // Map ChatMessage structure to Gemini service requirements (role must be 'user' | 'model' | 'assistant')
      const chatHistory = updatedMessages.slice(0, -1).map((msg) => ({
        role: msg.role === 'assistant' ? 'model' as const : 'user' as const,
        content: msg.content
      }));

      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: text,
          history: chatHistory,
          stats: dashboardStats
        })
      });

      if (!response.ok) {
        throw new Error('Falha ao obter resposta do assistente.');
      }

      const data = await response.json();
      
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply || 'Desculpe, não consegui processar a resposta.',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };

      saveMessages([...updatedMessages, assistantMsg]);
    } catch (error) {
      console.error('Kepler Assistant error:', error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Ops! Ocorreu um problema de conexão com meus servidores de IA. Mas posso te dar uma ajuda simulada local: as informações de faturamento e propostas estão seguras no seu Dashboard.',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };
      saveMessages([...updatedMessages, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    sessionStorage.removeItem('kepler_chat_messages');
    initWelcomeMessage();
  };

  // Safe formatting of messages with standard markdown support
  const formatMessageContent = (text: string) => {
    // Escape HTML strings to prevent XSS
    let escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // 1. Bold styling: **bold** -> <strong>bold</strong>
    escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // 2. Unordered lists: lines starting with "- " or "* " -> list items
    const lines = escaped.split('\n');
    let inList = false;
    const formattedLines = lines.map((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const itemContent = trimmed.substring(2);
        if (!inList) {
          inList = true;
          return `<ul class="list-disc pl-5 my-2 space-y-1 text-gray-700 dark:text-slate-300"><li>${itemContent}</li>`;
        }
        return `<li>${itemContent}</li>`;
      } else {
        if (inList) {
          inList = false;
          return `</ul>\n${line}`;
        }
        return line;
      }
    });

    if (inList) {
      formattedLines.push('</ul>');
    }

    let resultHtml = formattedLines.join('\n');

    // 3. Newlines to <br /> (excluding inside lists wrappers)
    resultHtml = resultHtml.replace(/\n/g, '<br />');

    return (
      <div 
        dangerouslySetInnerHTML={{ __html: resultHtml }} 
        className="text-xs sm:text-sm leading-relaxed space-y-1 break-words prose prose-sm dark:prose-invert max-w-none"
      />
    );
  };

  const suggestions = [
    { text: 'Qual o meu faturamento proposto?', icon: <TrendingUp size={13} /> },
    { text: 'Quais modelos vendem mais?', icon: <Zap size={13} /> },
    { text: 'Resumo de propostas por status', icon: <BarChart2 size={13} /> },
    { text: 'Quem são meus principais clientes?', icon: <Award size={13} /> },
    { text: 'Como posso melhorar as vendas?', icon: <Sparkles size={13} /> },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      
      {/* 1. Chat Window */}
      <AnimatePresence>
        {isOpen && !isMinimized && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 30 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-[320px] xs:w-[360px] sm:w-[420px] h-[550px] sm:h-[620px] bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col mb-4 transition-colors duration-300"
          >
            {/* Header */}
            <div className="bg-[#004D31] text-white p-4 flex items-center justify-between shadow-md relative overflow-hidden">
              {/* Decorative background element */}
              <div className="absolute -top-10 -left-10 w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none" />
              <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none" />

              <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/10 shadow-inner">
                  <Bot className="text-white w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-wide flex items-center gap-1.5">
                    Kepler's Assistant
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  </h3>
                  <p className="text-[10px] text-white/70 font-medium">Inteligência Comercial EcoCarga</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 relative z-10">
                <button 
                  onClick={() => setIsMinimized(true)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                  title="Minimizar"
                >
                  <Minus size={16} />
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                  title="Fechar"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50 dark:bg-slate-950/20 space-y-4">
              
              {/* Message History */}
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start gap-2.5 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    
                    {/* Bot Icon */}
                    {msg.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-full bg-[#004D31]/10 dark:bg-[#004D31]/30 flex items-center justify-center shrink-0 border border-[#004D31]/5 dark:border-[#004D31]/10">
                        <Bot size={14} className="text-[#004D31]" />
                      </div>
                    )}

                    {/* Bubble */}
                    <div>
                      <div className={`p-3 rounded-2xl shadow-sm ${
                        msg.role === 'user' 
                          ? 'bg-[#004D31] text-white rounded-tr-none' 
                          : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 border border-gray-100 dark:border-slate-800/40 rounded-tl-none'
                      }`}>
                        {formatMessageContent(msg.content)}
                      </div>
                      
                      {/* Timestamp */}
                      <p className={`text-[9px] text-gray-400 dark:text-slate-500 mt-1 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                        {msg.timestamp}
                      </p>
                    </div>

                  </div>
                </div>
              ))}

              {/* Typing Loader */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex items-start gap-2.5 max-w-[80%]">
                    <div className="w-7 h-7 rounded-full bg-[#004D31]/10 dark:bg-[#004D31]/30 flex items-center justify-center shrink-0 border border-[#004D31]/5 dark:border-[#004D31]/10">
                      <Bot size={14} className="text-[#004D31]" />
                    </div>
                    <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-800/40 p-3 rounded-2xl rounded-tl-none shadow-sm flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions Chips */}
            {messages.length < 5 && (
              <div className="px-4 py-2 border-t border-gray-100 dark:border-slate-800/60 bg-white dark:bg-slate-900 transition-colors">
                <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <HelpCircle size={10} /> Sugestões rápidas
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(item.text)}
                      className="text-[11px] font-medium text-[#004D31] hover:text-[#004D31] dark:text-emerald-400 hover:bg-[#004D31]/5 dark:hover:bg-emerald-400/5 bg-gray-50 dark:bg-slate-850 border border-gray-100 dark:border-slate-800 px-2 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                    >
                      {item.icon}
                      {item.text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Form */}
            <div className="p-3 border-t border-gray-100 dark:border-slate-800/60 bg-white dark:bg-slate-900 transition-colors">
              <div className="flex items-end gap-2 bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-2xl p-1.5 pl-3 focus-within:border-[#004D31]/30 dark:focus-within:border-emerald-400/30 focus-within:ring-1 focus-within:ring-[#004D31]/5 transition-all">
                <textarea
                  ref={inputRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escreva sua pergunta comercial..."
                  rows={1}
                  className="flex-1 max-h-24 bg-transparent border-0 outline-none text-xs sm:text-sm text-gray-700 dark:text-slate-200 resize-none font-medium placeholder-gray-400 py-1.5 focus:ring-0 focus:outline-none"
                />
                
                <div className="flex items-center gap-1">
                  {messages.length > 2 && (
                    <button
                      onClick={clearChat}
                      className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-all text-[11px]"
                      title="Limpar histórico"
                    >
                      Limpar
                    </button>
                  )}
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!inputText.trim() || isTyping}
                    className={`p-2 rounded-xl transition-all ${
                      inputText.trim() && !isTyping
                        ? 'bg-[#004D31] hover:bg-[#003B26] text-white shadow-sm shadow-[#004D31]/20'
                        : 'text-gray-300 dark:text-slate-700 cursor-not-allowed'
                    }`}
                  >
                    <Send size={15} />
                  </button>
                </div>
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Minimized Bar */}
      <AnimatePresence>
        {isOpen && isMinimized && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={() => setIsMinimized(false)}
            className="flex items-center gap-3 bg-[#004D31] text-white px-4 py-2.5 rounded-2xl shadow-xl border border-[#004D31]/20 cursor-pointer hover:bg-[#003B26] transition-all mb-4"
          >
            <Bot size={16} className="animate-pulse" />
            <span className="text-xs font-bold tracking-wide">Kepler's Assistant (Minimizado)</span>
            <div className="flex items-center gap-1 ml-2">
              <button 
                onClick={(e) => { e.stopPropagation(); setIsMinimized(false); }}
                className="p-1 rounded hover:bg-white/10"
              >
                <Maximize2 size={12} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                className="p-1 rounded hover:bg-white/10"
              >
                <X size={12} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Floating Button */}
      {!isOpen && (
        <div className="relative">
          {/* Tooltip */}
          <AnimatePresence>
            {showTooltip && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 5 }}
                className="absolute right-16 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs font-bold py-1.5 px-3 rounded-lg shadow-md whitespace-nowrap pointer-events-none z-10"
              >
                Assistente IA
                {/* Arrow */}
                <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Core Floating Button */}
          <button
            onClick={() => {
              setIsOpen(true);
              setIsMinimized(false);
            }}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className="w-14 h-14 bg-[#004D31] text-white rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(0,77,49,0.3)] hover:shadow-[0_8px_30px_rgba(0,77,49,0.5)] hover:scale-105 active:scale-95 transition-all duration-300 relative group overflow-hidden cursor-pointer"
          >
            {/* Pulsing ring */}
            <span className="absolute inset-0 rounded-full bg-[#004D31]/40 group-hover:bg-[#004D31]/50 animate-ping opacity-75 pointer-events-none"></span>
            
            {/* Shine reflection effect */}
            <span className="absolute inset-0 w-full h-full bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></span>

            <Bot size={24} className="group-hover:rotate-12 transition-transform duration-300 relative z-10" />
          </button>
        </div>
      )}

    </div>
  );
}
