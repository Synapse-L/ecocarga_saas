"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  FileText, 
  User, 
  DollarSign, 
  Eye, 
  Save, 
  Loader2,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ProposalPage6 } from '@/components/ProposalPage6';
import { ProposalCover } from '@/components/ProposalCover';
import { ProposalData } from '@/types/proposal';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/components/Toast';

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Retorna a data atual formatada como DD/MM/AAAA */
function todayFormatted(): string {
  return new Date().toLocaleDateString('pt-BR');
}

/** Aplica máscara de telefone brasileiro: (99) 99999-9999 ou (99) 9999-9999 */
function maskPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return digits
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}

/** Formata número como moeda BRL sem o símbolo, ex: 30.966,36 */
function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Converte string de moeda BRL de volta para number */
function parseCurrency(raw: string): number {
  const cleaned = raw.replace(/[^\d,]/g, '').replace(',', '.');
  const val = parseFloat(cleaned);
  return isNaN(val) ? 0 : val;
}

// ─── Tipos de validação ────────────────────────────────────────────────────────

interface FormErrors {
  clientName?: string;
  clientPhone?: string;
  clientAddress?: string;
  productName?: string;
  power?: string;
  price?: string;
  installments?: string;
  deadline?: string;
  validityDays?: string;
}

// ─── Estado inicial limpo (sem dados falsos) ───────────────────────────────────

function buildInitialFormData(): ProposalData {
  return {
    client: {
      name: '',
      phone: '',
      address: '',
    },
    commercial: {
      productName: '',
      power: '',
      price: 0,
      installments: 1,
      estimatedSavings: '',
      observations: '',
      deadline: '15 dias úteis',
      conditions: 'À vista',
      technicalSpecs: {
        powerSource: '',
        connectors: 1,
        connectorType: '',
        communication: '',
        model: '',
      },
    },
    metadata: {
      templateId: '',
      // Data de hoje automática — nunca mais vai ficar "19/05/2026" hardcoded
      emissionDate: todayFormatted(),
      validityDays: 15,
    },
  };
}

// ─── Componente de campo com label e mensagem de erro ─────────────────────────

interface FieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}
function Field({ label, error, required, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase ml-1 flex items-center gap-1">
        {label}
        {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1 ml-1">
          <AlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  );
}

// ─── Classes reutilizáveis para inputs ────────────────────────────────────────

const inputCls = (hasError?: boolean) =>
  `w-full px-4 py-3 rounded-xl border transition-all text-sm bg-gray-50/50 dark:bg-slate-950 text-gray-950 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 ${
    hasError
      ? 'border-red-400 focus:ring-red-400/20'
      : 'border-gray-100 dark:border-slate-800 focus:ring-primary/10'
  }`;

// ─── Página principal ──────────────────────────────────────────────────────────

function NewProposalPage() {
  const { profile, t } = useApp();
  const toast = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [chargerModels, setChargerModels] = useState<any[]>([]);
  const [previewTab, setPreviewTab] = useState<'cover' | 'page6'>('cover');
  const [errors, setErrors] = useState<FormErrors>({});

  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isLeadSelected, setIsLeadSelected] = useState(false);

  // Estado de exibição do preço como string formatada (ex: "30.966,36")
  const [priceDisplay, setPriceDisplay] = useState('');

  const [formData, setFormData] = useState<ProposalData>(buildInitialFormData);

  const steps = [
    { id: 'client',     title: t('stepClient'),     icon: User },
    { id: 'commercial', title: t('stepCommercial'),  icon: DollarSign },
    { id: 'template',   title: t('stepTemplate'),    icon: FileText },
    { id: 'preview',    title: t('stepPreview'),     icon: Eye },
  ];

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const leadId = searchParams.get('leadId');
    const name = searchParams.get('name');
    const phone = searchParams.get('phone');
    const address = searchParams.get('address');

    if (name || phone || address) {
      setFormData(prev => ({
        ...prev,
        client: {
          name: name ? decodeURIComponent(name) : prev.client.name,
          phone: phone ? decodeURIComponent(phone) : prev.client.phone,
          address: address ? decodeURIComponent(address) : prev.client.address,
        }
      }));
    }
    
    if (leadId) {
      setSelectedClientId(leadId);
      setIsLeadSelected(true);
    }
  }, [searchParams]);

  const fetchData = async () => {
    const { data: clientsData }   = await supabase.from('clients').select('*');
    const { data: templatesData } = await supabase.from('templates').select('*');
    const { data: modelsData }    = await supabase.from('charger_models').select('*').order('name', { ascending: true });
    setClients(clientsData   || []);
    setTemplates(templatesData || []);
    setChargerModels(modelsData || []);
  };

  const handleSelectClient = (client: any) => {
    setSelectedClientId(client.id);
    setIsLeadSelected(client.is_lead);
    setFormData(prev => ({
      ...prev,
      client: {
        name: client.name || '',
        phone: client.phone || '',
        address: client.address || '',
      }
    }));
  };

  // ── Validação por etapa ──────────────────────────────────────────────────────

  const validateStep = useCallback((step: number): boolean => {
    const newErrors: FormErrors = {};

    if (step === 0) {
      if (!formData.client.name.trim())
        newErrors.clientName = 'Nome do cliente é obrigatório.';
      if (!formData.client.phone.trim())
        newErrors.clientPhone = 'Telefone é obrigatório.';
      else if (formData.client.phone.replace(/\D/g, '').length < 10)
        newErrors.clientPhone = 'Telefone inválido. Mínimo 10 dígitos.';
      if (!formData.client.address.trim())
        newErrors.clientAddress = 'Endereço é obrigatório.';
    }

    if (step === 1) {
      if (!formData.commercial.productName.trim())
        newErrors.productName = 'Nome do produto é obrigatório.';
      if (!formData.commercial.power.trim())
        newErrors.power = 'Potência é obrigatória.';
      if (formData.commercial.price <= 0)
        newErrors.price = 'O valor deve ser maior que zero.';
      if (formData.commercial.installments < 1 || formData.commercial.installments > 10)
        newErrors.installments = 'Parcelamento deve ser entre 1 e 10.';
      if (!formData.commercial.deadline.trim())
        newErrors.deadline = 'Prazo de entrega é obrigatório.';
      if (formData.metadata.validityDays < 1 || formData.metadata.validityDays > 365)
        newErrors.validityDays = 'Validade deve ser entre 1 e 365 dias.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // ── Navegação entre etapas ───────────────────────────────────────────────────

  const handleNext = () => {
    if (!validateStep(currentStep)) return;
    if (currentStep < steps.length - 1) setCurrentStep(v => v + 1);
  };

  const handleBack = () => {
    setErrors({});
    if (currentStep > 0) setCurrentStep(v => v - 1);
  };

  // ── Seleção de modelo de carregador ─────────────────────────────────────────

  const handleSelectCharger = (selectedId: string) => {
    if (!selectedId) return;
    const model = chargerModels.find(m => m.id === selectedId);
    if (!model) return;
    setFormData(prev => ({
      ...prev,
      commercial: {
        ...prev.commercial,
        productName: model.name,
        power: model.power,
        price: model.price,
        imageUrl: model.image_url,
        technicalSpecs: {
          powerSource:   model.power_source,
          connectors:    model.connectors,
          connectorType: model.connector_type,
          communication: model.communication,
          model:         model.model_name,
        },
      },
    }));
    // Atualiza o display do preço ao selecionar carregador
    setPriceDisplay(formatCurrency(model.price));
  };

  // ── Handler do preço com máscara BRL ────────────────────────────────────────

  const handlePriceChange = (raw: string) => {
    // Remove tudo que não seja dígito ou vírgula
    const digitsOnly = raw.replace(/[^\d,]/g, '');
    setPriceDisplay(digitsOnly);
    const numeric = parseCurrency(digitsOnly);
    setFormData(prev => ({
      ...prev,
      commercial: { ...prev.commercial, price: numeric },
    }));
  };

  const handlePriceBlur = () => {
    // Ao sair do campo, formata como moeda
    if (formData.commercial.price > 0) {
      setPriceDisplay(formatCurrency(formData.commercial.price));
    }
  };

  // ── Salvar proposta ──────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!validateStep(currentStep)) return;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado.');

      // 1. Criar ou atualizar cliente
      let clientId = selectedClientId;
      const clientPayload: any = {
        user_id: user.id,
        name:    formData.client.name,
        phone:   formData.client.phone,
        address: formData.client.address,
      };

      if (clientId) {
        clientPayload.id = clientId;
        if (isLeadSelected) {
          clientPayload.is_lead = false;
          clientPayload.lead_status = 'proposal';
          clientPayload.timeline = [
            { event: 'Convertido em Cliente (Proposta Criada)', time: todayFormatted(), type: 'system' }
          ];
        }
      }

      const { data: client, error: clientErr } = await supabase
        .from('clients')
        .upsert(clientPayload)
        .select()
        .single();

      if (clientErr) throw clientErr;
      clientId = client?.id;

      // 2. Salvar proposta com data de emissão atual
      const { error: propError } = await supabase
        .from('proposals')
        .insert({
          user_id:         user.id,
          client_id:       clientId,
          template_id:     formData.metadata.templateId || null,
          title:           `Proposta - ${formData.client.name || 'S/ nome'}`,
          commercial_data: {
            ...formData,
            metadata: {
              ...formData.metadata,
              emissionDate: todayFormatted(), // garante data atual no momento do save
            },
          },
          status: 'Rascunho',
        });

      if (propError) throw propError;

      toast('Proposta criada com sucesso! ✅', 'success');
      router.push('/');
    } catch (err: any) {
      console.error(err);
      toast(err?.message || t('saveProposalError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50/30 dark:bg-slate-950 flex flex-col transition-colors duration-300">

      {/* ── Top Bar ────────────────────────────────────────────────────────── */}
      <header className="h-16 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 px-8 flex items-center justify-between sticky top-0 z-20 transition-colors duration-300">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-gray-500 dark:text-gray-400">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-gray-800 dark:text-white">{t('newProposal')}</h1>
        </div>

        {/* Indicador de etapas */}
        <div className="flex items-center gap-2">
          {steps.map((step, i) => (
            <React.Fragment key={step.id}>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                i === currentStep ? 'bg-primary text-white shadow-lg shadow-primary/20' :
                i < currentStep  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' :
                                   'bg-gray-100 text-gray-400 dark:bg-slate-800 dark:text-slate-500'
              }`}>
                <step.icon size={14} />
                <span className="hidden sm:inline">{step.title}</span>
                {i < currentStep && <Check size={12} />}
              </div>
              {i < steps.length - 1 && <ChevronRight size={14} className="text-gray-300 dark:text-slate-700" />}
            </React.Fragment>
          ))}
        </div>

        {/* Navegação */}
        <div className="flex items-center gap-3">
          <button
            disabled={currentStep === 0}
            onClick={handleBack}
            className="px-4 py-2 text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-30"
          >
            {t('back')}
          </button>
          {currentStep === steps.length - 1 ? (
            <button
              onClick={handleSave}
              disabled={loading}
              className="bg-primary text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {t('saveProposal')}
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="bg-primary text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-sm active:scale-95"
            >
              {t('continue')}
              <ArrowRight size={18} />
            </button>
          )}
        </div>
      </header>

      {/* ── Conteúdo do formulário ─────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto p-8 flex justify-center">
        <div className="max-w-4xl w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >

              {/* ══ ETAPA 1: CLIENTE ══════════════════════════════════════════ */}
              {currentStep === 0 && (
                <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-6 transition-colors duration-300">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('clientInfo')}</h2>

                  {selectedClientId && (
                    <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-dashed border-emerald-250 dark:border-emerald-900/30 rounded-xl p-4 flex items-center justify-between transition-all">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400">
                          Vinculado a {isLeadSelected ? 'um Lead WhatsApp' : 'um Cliente existente'} (cadastro editável abaixo)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedClientId(null);
                          setIsLeadSelected(false);
                        }}
                        className="text-xs font-black text-red-500 hover:text-red-700 transition-colors uppercase tracking-wider"
                      >
                        Desvincular
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    <Field label={t('clientBusinessName')} error={errors.clientName} required>
                      <div className="relative">
                        <input
                          type="text"
                          value={formData.client.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData(prev => ({ ...prev, client: { ...prev.client, name: val } }));
                            if (errors.clientName) setErrors(prev => ({ ...prev, clientName: undefined }));
                            setSelectedClientId(null);
                            setIsLeadSelected(false);
                          }}
                          className={inputCls(!!errors.clientName)}
                          placeholder="Ex: Condomínio Solar"
                          maxLength={120}
                          autoComplete="organization"
                        />
                        {/* Dropdown de sugestões */}
                        {formData.client.name && !selectedClientId && clients.filter(c => c.name.toLowerCase().includes(formData.client.name.toLowerCase())).length > 0 && (
                          <div className="absolute z-30 left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-xl">
                            {clients
                              .filter(c => c.name.toLowerCase().includes(formData.client.name.toLowerCase()))
                              .map(client => (
                                <button
                                  key={client.id}
                                  type="button"
                                  onClick={() => handleSelectClient(client)}
                                  className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-900/60 text-sm text-gray-800 dark:text-gray-200 transition-colors flex items-center justify-between border-b border-gray-100 dark:border-slate-800/40 last:border-0"
                                >
                                  <div>
                                    <p className="font-bold text-xs">{client.name}</p>
                                    <p className="text-[10px] text-gray-400 mt-0.5">{client.phone || 'Sem telefone'}</p>
                                  </div>
                                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                    client.is_lead 
                                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30'
                                      : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30'
                                  }`}>
                                    {client.is_lead ? 'Lead' : 'Cliente'}
                                  </span>
                                </button>
                              ))}
                          </div>
                        )}
                      </div>
                    </Field>

                    <Field label={t('clientPhone')} error={errors.clientPhone} required>
                      <input
                        type="tel"
                        value={formData.client.phone}
                        onChange={(e) => {
                          const masked = maskPhone(e.target.value);
                          setFormData(prev => ({ ...prev, client: { ...prev.client, phone: masked } }));
                          if (errors.clientPhone) setErrors(prev => ({ ...prev, clientPhone: undefined }));
                        }}
                        className={inputCls(!!errors.clientPhone)}
                        placeholder="(11) 99999-9999"
                        maxLength={15}
                        inputMode="tel"
                        autoComplete="tel"
                      />
                    </Field>

                    <div className="md:col-span-2">
                      <Field label={t('clientAddress')} error={errors.clientAddress} required>
                        <input
                          type="text"
                          value={formData.client.address}
                          onChange={(e) => {
                            setFormData(prev => ({ ...prev, client: { ...prev.client, address: e.target.value } }));
                            if (errors.clientAddress) setErrors(prev => ({ ...prev, clientAddress: undefined }));
                          }}
                          className={inputCls(!!errors.clientAddress)}
                          placeholder="Rua Exemplo, 123 - Bairro, Cidade - UF"
                          maxLength={200}
                          autoComplete="street-address"
                        />
                      </Field>
                    </div>

                  </div>
                </div>
              )}

              {/* ══ ETAPA 2: COMERCIAL ════════════════════════════════════════ */}
              {currentStep === 1 && (
                <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-6 transition-colors duration-300">
                  <div className="flex justify-between items-center border-b border-gray-50 dark:border-slate-800 pb-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('commercialDetails')}</h2>
                    <span className="text-xs text-gray-400 dark:text-gray-500 font-semibold uppercase">
                      {t('stepCommercial')} — 2 {t('stepOf')} 4
                    </span>
                  </div>

                  {/* Seleção de modelo de carregador pré-cadastrado */}
                  <div className="space-y-2 p-5 bg-gradient-to-r from-green-950 to-green-900 rounded-2xl text-white shadow-sm border border-green-800">
                    <label className="text-xs font-black uppercase text-accent tracking-wider">{t('selectPredetermined')}</label>
                    <select
                      onChange={(e) => handleSelectCharger(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-white focus:bg-green-950 focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all text-sm font-bold cursor-pointer"
                    >
                      <option value="" className="text-gray-400 bg-green-950">{t('chooseCharger')}</option>
                      {chargerModels.map(m => (
                        <option key={m.id} value={m.id} className="text-white bg-green-950">
                          {m.name} ({m.power}) — R$ {m.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-gray-300 font-medium">{t('autoselectHelp')}</p>
                  </div>

                  {/* ── Informações de venda ──────────────────────────────── */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-700 dark:text-slate-350 uppercase tracking-wider border-l-2 border-primary pl-2">{t('salesInfo')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                      <Field label={t('productCommercialModel')} error={errors.productName} required>
                        <input
                          type="text"
                          value={formData.commercial.productName}
                          onChange={(e) => {
                            setFormData(prev => ({ ...prev, commercial: { ...prev.commercial, productName: e.target.value } }));
                            if (errors.productName) setErrors(prev => ({ ...prev, productName: undefined }));
                          }}
                          className={inputCls(!!errors.productName)}
                          placeholder="Ex: Eco SuperFast"
                          maxLength={80}
                        />
                      </Field>

                      <Field label={t('chargingPower')} error={errors.power} required>
                        <input
                          type="text"
                          value={formData.commercial.power}
                          onChange={(e) => {
                            // Aceita números e unidades como "kW", "kVA"
                            const val = e.target.value.replace(/[^0-9a-zA-ZÀ-ÿ\s.,/+]/g, '');
                            setFormData(prev => ({ ...prev, commercial: { ...prev.commercial, power: val } }));
                            if (errors.power) setErrors(prev => ({ ...prev, power: undefined }));
                          }}
                          className={inputCls(!!errors.power)}
                          placeholder="Ex: 40kW"
                          maxLength={20}
                        />
                      </Field>

                      {/* Preço com máscara BRL */}
                      <Field label={`${t('unitValue')} (R$)`} error={errors.price} required>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">R$</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={priceDisplay}
                            onChange={(e) => {
                              handlePriceChange(e.target.value);
                              if (errors.price) setErrors(prev => ({ ...prev, price: undefined }));
                            }}
                            onBlur={handlePriceBlur}
                            className={`${inputCls(!!errors.price)} pl-10`}
                            placeholder="0,00"
                          />
                        </div>
                      </Field>

                      {/* Parcelamento — somente inteiros de 1 a 10 */}
                      <Field label={t('installments')} error={errors.installments} required>
                        <select
                          value={formData.commercial.installments}
                          onChange={(e) => {
                            setFormData(prev => ({ ...prev, commercial: { ...prev.commercial, installments: parseInt(e.target.value) } }));
                            if (errors.installments) setErrors(prev => ({ ...prev, installments: undefined }));
                          }}
                          className={inputCls(!!errors.installments)}
                        >
                          {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                            <option key={n} value={n}>{n === 1 ? 'À vista (1×)' : `${n}× parcelas`}</option>
                          ))}
                        </select>
                      </Field>

                      {/* Prazo de entrega */}
                      <Field label="Prazo de Entrega" error={errors.deadline} required>
                        <input
                          type="text"
                          value={formData.commercial.deadline}
                          onChange={(e) => {
                            setFormData(prev => ({ ...prev, commercial: { ...prev.commercial, deadline: e.target.value } }));
                            if (errors.deadline) setErrors(prev => ({ ...prev, deadline: undefined }));
                          }}
                          className={inputCls(!!errors.deadline)}
                          placeholder="Ex: 15 dias úteis"
                          maxLength={40}
                        />
                      </Field>

                      {/* Condições de pagamento */}
                      <Field label="Condições de Pagamento">
                        <select
                          value={formData.commercial.conditions}
                          onChange={(e) => setFormData(prev => ({ ...prev, commercial: { ...prev.commercial, conditions: e.target.value } }))}
                          className={inputCls()}
                        >
                          <option value="À vista">À vista</option>
                          <option value="Cartão de crédito">Cartão de crédito</option>
                          <option value="Boleto bancário">Boleto bancário</option>
                          <option value="PIX">PIX</option>
                          <option value="Financiamento">Financiamento</option>
                          <option value="Transferência bancária">Transferência bancária</option>
                        </select>
                      </Field>

                    </div>
                  </div>

                  {/* ── Validade e observações ────────────────────────────── */}
                  <div className="space-y-4 pt-4 border-t border-gray-50 dark:border-slate-800">
                    <h3 className="text-sm font-bold text-gray-700 dark:text-slate-350 uppercase tracking-wider border-l-2 border-primary pl-2">Proposta & Observações</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                      {/* Validade em dias — somente números inteiros */}
                      <Field label="Validade da Proposta (dias)" error={errors.validityDays} required>
                        <input
                          type="number"
                          inputMode="numeric"
                          min={1}
                          max={365}
                          value={formData.metadata.validityDays}
                          onChange={(e) => {
                            const val = Math.max(1, Math.min(365, parseInt(e.target.value) || 1));
                            setFormData(prev => ({ ...prev, metadata: { ...prev.metadata, validityDays: val } }));
                            if (errors.validityDays) setErrors(prev => ({ ...prev, validityDays: undefined }));
                          }}
                          className={inputCls(!!errors.validityDays)}
                          placeholder="15"
                        />
                      </Field>

                      {/* Benefício / Economia estimada */}
                      <Field label="Benefício / Economia Estimada">
                        <input
                          type="text"
                          value={formData.commercial.estimatedSavings}
                          onChange={(e) => setFormData(prev => ({ ...prev, commercial: { ...prev.commercial, estimatedSavings: e.target.value } }))}
                          className={inputCls()}
                          placeholder="Ex: Alta velocidade de recarga"
                          maxLength={100}
                        />
                      </Field>

                      {/* Observações — textarea */}
                      <div className="md:col-span-2">
                        <Field label="Observações">
                          <textarea
                            value={formData.commercial.observations}
                            onChange={(e) => setFormData(prev => ({ ...prev, commercial: { ...prev.commercial, observations: e.target.value } }))}
                            className={`${inputCls()} resize-none h-24`}
                            placeholder="Ex: Instalação elétrica não inclusa. Projeto de infraestrutura por conta do cliente."
                            maxLength={400}
                          />
                        </Field>
                      </div>

                    </div>
                  </div>

                  {/* ── Ficha técnica (Página 6) ──────────────────────────── */}
                  <div className="space-y-4 pt-4 border-t border-gray-50 dark:border-slate-800">
                    <h3 className="text-sm font-bold text-gray-700 dark:text-slate-350 uppercase tracking-wider border-l-2 border-primary pl-2">{t('techSpecsPage6')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                      <Field label={t('powerSource')}>
                        <input
                          type="text"
                          value={formData.commercial.technicalSpecs?.powerSource || ''}
                          onChange={(e) => {
                            // Aceita texto técnico com +, letras, números
                            const val = e.target.value.replace(/[^0-9a-zA-Z+\-/\s]/g, '');
                            setFormData(prev => ({ ...prev, commercial: { ...prev.commercial, technicalSpecs: { ...prev.commercial.technicalSpecs, powerSource: val } } }));
                          }}
                          className={inputCls()}
                          placeholder="3F+N+T"
                          maxLength={20}
                        />
                      </Field>

                      <Field label={t('connectors')}>
                        <input
                          type="number"
                          inputMode="numeric"
                          min={1}
                          max={8}
                          value={formData.commercial.technicalSpecs?.connectors || 1}
                          onChange={(e) => {
                            const val = Math.max(1, Math.min(8, parseInt(e.target.value) || 1));
                            setFormData(prev => ({ ...prev, commercial: { ...prev.commercial, technicalSpecs: { ...prev.commercial.technicalSpecs, connectors: val } } }));
                          }}
                          className={inputCls()}
                          placeholder="1"
                        />
                      </Field>

                      <Field label={t('connectorType')}>
                        <select
                          value={formData.commercial.technicalSpecs?.connectorType || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, commercial: { ...prev.commercial, technicalSpecs: { ...prev.commercial.technicalSpecs, connectorType: e.target.value } } }))}
                          className={inputCls()}
                        >
                          <option value="">-- Selecione --</option>
                          <option value="CCS2">CCS2</option>
                          <option value="CHAdeMO">CHAdeMO</option>
                          <option value="Tipo 2 (AC)">Tipo 2 (AC)</option>
                          <option value="Tipo 1 (AC)">Tipo 1 (AC)</option>
                          <option value="GB/T">GB/T</option>
                          <option value="CCS2 + CHAdeMO">CCS2 + CHAdeMO</option>
                          <option value="CCS2 + Tipo 2">CCS2 + Tipo 2</option>
                        </select>
                      </Field>

                      <div className="md:col-span-2">
                        <Field label={t('communication')}>
                          <input
                            type="text"
                            value={formData.commercial.technicalSpecs?.communication || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, commercial: { ...prev.commercial, technicalSpecs: { ...prev.commercial.technicalSpecs, communication: e.target.value } } }))}
                            className={inputCls()}
                            placeholder="Ex: Bluetooth/Wi-Fi/RFID/4G"
                            maxLength={80}
                          />
                        </Field>
                      </div>

                      <Field label={t('chargerModel')}>
                        <input
                          type="text"
                          value={formData.commercial.technicalSpecs?.model || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, commercial: { ...prev.commercial, technicalSpecs: { ...prev.commercial.technicalSpecs, model: e.target.value } } }))}
                          className={inputCls()}
                          placeholder="Ex: Rise Superfast"
                          maxLength={60}
                        />
                      </Field>

                    </div>
                  </div>
                </div>
              )}

              {/* ══ ETAPA 3: TEMPLATE ═════════════════════════════════════════ */}
              {currentStep === 2 && (
                <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-6 transition-colors duration-300">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('selectTemplate')}</h2>
                  {templates.length === 0 ? (
                    <div className="p-8 text-center border-2 border-dashed border-gray-100 dark:border-slate-800 rounded-2xl">
                      <FileText className="mx-auto text-gray-300 dark:text-slate-700 mb-4" size={40} />
                      <p className="text-gray-500 dark:text-slate-400">{t('noTemplatesFound')}</p>
                      <button onClick={() => router.push('/templates')} className="text-primary dark:text-accent font-bold mt-2">
                        {t('manageTemplates')}
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {templates.map(tItem => (
                        <div
                          key={tItem.id}
                          onClick={() => setFormData(prev => ({ ...prev, metadata: { ...prev.metadata, templateId: tItem.id } }))}
                          className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                            formData.metadata.templateId === tItem.id
                              ? 'border-primary bg-primary/5 dark:border-accent dark:bg-accent/5'
                              : 'border-gray-50 dark:border-slate-800 hover:border-gray-200 dark:hover:border-slate-700'
                          }`}
                        >
                          <div className="h-40 bg-gray-100 dark:bg-slate-950 rounded-lg mb-3 flex items-center justify-center">
                            <FileText className="text-gray-400 dark:text-slate-700" size={32} />
                          </div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{tItem.name}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ══ ETAPA 4: REVISÃO / PREVIEW ════════════════════════════════ */}
              {currentStep === 3 && (
                <div className="flex flex-col items-center gap-6">

                  {/* Seletor de aba (capa / ficha técnica) */}
                  <div className="flex bg-gray-100 dark:bg-slate-900 p-1 rounded-xl gap-1">
                    <button
                      type="button"
                      onClick={() => setPreviewTab('cover')}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                        previewTab === 'cover'
                          ? 'bg-white text-primary shadow-sm dark:bg-slate-800 dark:text-white'
                          : 'text-gray-500 hover:text-gray-800 dark:text-gray-450 dark:hover:text-slate-200'
                      }`}
                    >
                      {t('previewTabCover')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewTab('page6')}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                        previewTab === 'page6'
                          ? 'bg-white text-primary shadow-sm dark:bg-slate-800 dark:text-white'
                          : 'text-gray-500 hover:text-gray-800 dark:text-gray-450 dark:hover:text-slate-200'
                      }`}
                    >
                      {t('previewTabPage6')}
                    </button>
                  </div>

                  {/*
                    ── Preview com escala matematicamente correta ─────────────
                    A4 real: 210mm × 297mm
                    Fator de escala: 0.52 (desktop), 0.38 (mobile)

                    O container externo tem exatamente:
                      largura  = 210mm × 0.52 ≈ 109mm
                      altura   = 297mm × 0.52 ≈ 154mm

                    O inner div tem o tamanho real do A4 e é escalado com
                    transform-origin: top left — sem cortes, sem desalinhamento.
                  */}
                  <div
                    style={{
                      /* largura e altura do container = A4 × escala */
                      width:    'calc(210mm * 0.52)',
                      height:   'calc(297mm * 0.52)',
                      position: 'relative',
                      overflow: 'hidden',
                      borderRadius: '12px',
                      boxShadow: '0 25px 60px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06)',
                      flexShrink: 0,
                    }}
                    className="md:!w-[calc(210mm*0.65)] md:!h-[calc(297mm*0.65)]"
                  >
                    {/* Inner: tamanho real A4, escalado a partir do canto superior esquerdo */}
                    <div
                      style={{
                        position:       'absolute',
                        top:            0,
                        left:           0,
                        width:          '210mm',
                        height:         '297mm',
                        transformOrigin: 'top left',
                        transform:      'scale(0.52)',
                        pointerEvents:  'none', /* preview não é interativo */
                      }}
                      className="md:![transform:scale(0.65)]"
                    >
                      {previewTab === 'cover' ? (
                        <ProposalCover data={formData} representativeName={profile?.full_name} />
                      ) : (
                        <ProposalPage6 data={formData} />
                      )}
                    </div>
                  </div>

                  <div className="text-center mt-2">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('ready')}</h3>
                    <p className="text-gray-500 dark:text-slate-400 max-w-md mt-2">{t('readyHelp')}</p>
                  </div>
                </div>
              )}


            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default function NewProposalPageWrapper() {
  return (
    <React.Suspense fallback={
      <div className="flex h-screen w-screen items-center justify-center bg-[var(--background)] text-[var(--foreground)]">
        <Loader2 className="animate-spin text-[#004D31]" size={32} />
      </div>
    }>
      <NewProposalPage />
    </React.Suspense>
  );
}
