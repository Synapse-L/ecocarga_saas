"use client";

import React, { useState, useEffect } from 'react';
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
  ChevronRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ProposalPage6 } from '@/components/ProposalPage6';
import { ProposalCover } from '@/components/ProposalCover';
import { PDFService } from '@/lib/pdf-service';
import { ProposalData } from '@/types/proposal';

const steps = [
  { id: 'client', title: 'Cliente', icon: User },
  { id: 'commercial', title: 'Comercial', icon: DollarSign },
  { id: 'template', title: 'Template', icon: FileText },
  { id: 'preview', title: 'Revisão', icon: Eye },
];

export default function NewProposalPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [chargerModels, setChargerModels] = useState<any[]>([]);
  const [previewTab, setPreviewTab] = useState<'cover' | 'page6'>('cover');
  const [profile, setProfile] = useState<any>(null);
  const router = useRouter();

  const [formData, setFormData] = useState<ProposalData>({
    client: {
      name: 'Cliente Teste',
      phone: '(11) 99999-9999',
      address: 'Rua das Palmeiras, 300 - São Paulo - SP',
    },
    commercial: {
      productName: 'Eco SuperFast',
      power: '40kW',
      price: 30966.36,
      installments: 10,
      estimatedSavings: 'Alta velocidade de recarga',
      observations: 'Instalação não inclusa.',
      deadline: '15 dias',
      conditions: 'À vista',
      technicalSpecs: {
        powerSource: '3F+N+T',
        connectors: 1,
        connectorType: 'CCS2',
        communication: 'Bluetooth/Wi-Fi/Ethernet/RFID/4G',
        model: 'Rise Superfast',
      }
    },
    metadata: {
      templateId: '',
      emissionDate: '19/05/2026',
      validityDays: 15,
    }
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setProfile(profileData || { full_name: user.email?.split('@')[0] });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }

    const { data: clientsData } = await supabase.from('clients').select('*');
    const { data: templatesData } = await supabase.from('templates').select('*');
    const { data: modelsData } = await supabase.from('charger_models').select('*').order('name', { ascending: true });
    
    setClients(clientsData || []);
    setTemplates(templatesData || []);
    setChargerModels(modelsData || []);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) setCurrentStep(v => v + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(v => v - 1);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      // 1. Create client if it doesn't exist (simplified)
      let clientId = null;
      if (formData.client.name) {
        const { data: client } = await supabase
          .from('clients')
          .upsert({ user_id: user.id, name: formData.client.name, phone: formData.client.phone, address: formData.client.address })
          .select()
          .single();
        clientId = client?.id;
      }

      // 2. Save proposal
      const { data: proposal, error: propError } = await supabase
        .from('proposals')
        .insert({
          user_id: user.id,
          client_id: clientId,
          template_id: formData.metadata.templateId || null,
          title: `Proposta - ${formData.client.name || 'S/ nome'}`,
          commercial_data: formData,
          status: 'Rascunho'
        })
        .select()
        .single();

      if (propError) throw propError;

      // 3. Generate PDF (optional step, could be done later)
      // For now, just redirect to dashboard
      router.push('/');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar proposta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/30 flex flex-col">
      {/* Top Bar */}
      <header className="h-16 bg-white border-b border-gray-100 px-8 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold">Nova Proposta</h1>
        </div>

        <div className="flex items-center gap-2">
          {steps.map((step, i) => (
            <React.Fragment key={step.id}>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                i === currentStep ? 'bg-primary text-white shadow-lg shadow-primary/20' : 
                i < currentStep ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'
              }`}>
                <step.icon size={14} />
                <span className="hidden sm:inline">{step.title}</span>
                {i < currentStep && <Check size={12} />}
              </div>
              {i < steps.length - 1 && <ChevronRight size={14} className="text-gray-300" />}
            </React.Fragment>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button 
            disabled={currentStep === 0}
            onClick={handleBack}
            className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-900 disabled:opacity-30"
          >
            Voltar
          </button>
          {currentStep === steps.length - 1 ? (
            <button 
              onClick={handleSave}
              disabled={loading}
              className="bg-primary text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              Salvar Proposta
            </button>
          ) : (
            <button 
              onClick={handleNext}
              className="bg-primary text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-sm active:scale-95"
            >
              Continuar
              <ArrowRight size={18} />
            </button>
          )}
        </div>
      </header>

      {/* Form Content */}
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
              {currentStep === 0 && (
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                  <h2 className="text-xl font-bold text-gray-900">Informações do Cliente</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase ml-1">Nome ou Empresa</label>
                      <input 
                        type="text" 
                        value={formData.client.name}
                        onChange={(e) => setFormData({...formData, client: {...formData.client, name: e.target.value}})}
                        className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all text-sm"
                        placeholder="Ex: Condomínio Solar"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase ml-1">Telefone / WhatsApp</label>
                      <input 
                        type="text" 
                        value={formData.client.phone}
                        onChange={(e) => setFormData({...formData, client: {...formData.client, phone: e.target.value}})}
                        className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all text-sm"
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase ml-1">Endereço Completo</label>
                      <input 
                        type="text" 
                        value={formData.client.address}
                        onChange={(e) => setFormData({...formData, client: {...formData.client, address: e.target.value}})}
                        className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all text-sm"
                        placeholder="Rua Exemplo, 123 - Bairro, Cidade - UF"
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 1 && (
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                  <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                    <h2 className="text-xl font-bold text-gray-900">Detalhes Comerciais</h2>
                    <span className="text-xs text-gray-400 font-semibold uppercase">Passo 2 de 4</span>
                  </div>
                  
                  {/* PRE-DETERMINED CHARGER SELECTION */}
                  <div className="space-y-2 p-5 bg-gradient-to-r from-green-950 to-green-900 rounded-2xl text-white shadow-sm border border-green-800">
                    <label className="text-xs font-black uppercase text-accent tracking-wider">Selecionar Modelo Pré-determinado</label>
                    <select 
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        if (!selectedId) return;
                        const model = chargerModels.find(m => m.id === selectedId);
                        if (model) {
                          setFormData({
                            ...formData,
                            commercial: {
                              ...formData.commercial,
                              productName: model.name,
                              power: model.power,
                              price: model.price,
                              imageUrl: model.image_url,
                              technicalSpecs: {
                                powerSource: model.power_source,
                                connectors: model.connectors,
                                connectorType: model.connector_type,
                                communication: model.communication,
                                model: model.model_name
                              }
                            }
                          });
                        }
                      }}
                      className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-white focus:bg-green-950 focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all text-sm font-bold cursor-pointer"
                    >
                      <option value="" className="text-gray-400 bg-green-950">-- Escolha um carregador cadastrado --</option>
                      {chargerModels.map(m => (
                        <option key={m.id} value={m.id} className="text-white bg-green-950">
                          {m.name} ({m.power}) — R$ {m.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-gray-300 font-medium">
                      Selecionar um modelo carregará automaticamente o preço e todas as especificações técnicas da ficha da EcoCarga.
                    </p>
                  </div>

                  {/* PRICE & COMMERCIAL SPECS */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider border-l-2 border-primary pl-2">Informações de Venda</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase ml-1">Produto / Modelo Comercial</label>
                        <input 
                          type="text" 
                          value={formData.commercial.productName}
                          onChange={(e) => setFormData({...formData, commercial: {...formData.commercial, productName: e.target.value}})}
                          className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all text-sm"
                          placeholder="Eco SuperFast"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase ml-1">Potência de Recarga</label>
                        <input 
                          type="text" 
                          value={formData.commercial.power}
                          onChange={(e) => setFormData({...formData, commercial: {...formData.commercial, power: e.target.value}})}
                          className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all text-sm"
                          placeholder="40kW"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase ml-1">Valor Unitário (R$)</label>
                        <input 
                          type="number" 
                          step="0.01"
                          value={formData.commercial.price}
                          onChange={(e) => setFormData({...formData, commercial: {...formData.commercial, price: parseFloat(e.target.value) || 0}})}
                          className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all text-sm"
                          placeholder="30966.36"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase ml-1">Parcelamento (Até 10x)</label>
                        <input 
                          type="number" 
                          value={formData.commercial.installments}
                          onChange={(e) => setFormData({...formData, commercial: {...formData.commercial, installments: parseInt(e.target.value) || 1}})}
                          className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all text-sm"
                          placeholder="10"
                        />
                      </div>
                    </div>
                  </div>

                  {/* ADVANCED TECHNICAL SPECIFICATIONS */}
                  <div className="space-y-4 pt-4 border-t border-gray-50">
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider border-l-2 border-primary pl-2">Ficha Técnica do Carregador (Página 6)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase ml-1">Fonte de Energia</label>
                        <input 
                          type="text" 
                          value={formData.commercial.technicalSpecs?.powerSource || ''}
                          onChange={(e) => setFormData({
                            ...formData, 
                            commercial: {
                              ...formData.commercial, 
                              technicalSpecs: {
                                ...formData.commercial.technicalSpecs, 
                                powerSource: e.target.value
                              }
                            }
                          })}
                          className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all text-sm"
                          placeholder="3F+N+T"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase ml-1">Nº de Conectores</label>
                        <input 
                          type="number" 
                          value={formData.commercial.technicalSpecs?.connectors || 1}
                          onChange={(e) => setFormData({
                            ...formData, 
                            commercial: {
                              ...formData.commercial, 
                              technicalSpecs: {
                                ...formData.commercial.technicalSpecs, 
                                connectors: parseInt(e.target.value) || 1
                              }
                            }
                          })}
                          className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all text-sm"
                          placeholder="1"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase ml-1">Tipo de Conector</label>
                        <input 
                          type="text" 
                          value={formData.commercial.technicalSpecs?.connectorType || ''}
                          onChange={(e) => setFormData({
                            ...formData, 
                            commercial: {
                              ...formData.commercial, 
                              technicalSpecs: {
                                ...formData.commercial.technicalSpecs, 
                                connectorType: e.target.value
                              }
                            }
                          })}
                          className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all text-sm"
                          placeholder="CCS2"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-bold text-gray-400 uppercase ml-1">Comunicação</label>
                        <input 
                          type="text" 
                          value={formData.commercial.technicalSpecs?.communication || ''}
                          onChange={(e) => setFormData({
                            ...formData, 
                            commercial: {
                              ...formData.commercial, 
                              technicalSpecs: {
                                ...formData.commercial.technicalSpecs, 
                                communication: e.target.value
                              }
                            }
                          })}
                          className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all text-sm"
                          placeholder="Bluetooth/Wi-Fi/RFID"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase ml-1">Marca / Modelo Técnico</label>
                        <input 
                          type="text" 
                          value={formData.commercial.technicalSpecs?.model || ''}
                          onChange={(e) => setFormData({
                            ...formData, 
                            commercial: {
                              ...formData.commercial, 
                              technicalSpecs: {
                                ...formData.commercial.technicalSpecs, 
                                model: e.target.value
                              }
                            }
                          })}
                          className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all text-sm"
                          placeholder="Rise Superfast"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                  <h2 className="text-xl font-bold text-gray-900">Seleção de Template</h2>
                  {templates.length === 0 ? (
                    <div className="p-8 text-center border-2 border-dashed border-gray-100 rounded-2xl">
                      <FileText className="mx-auto text-gray-300 mb-4" size={40} />
                      <p className="text-gray-500">Nenhum template PDF encontrado.</p>
                      <button onClick={() => router.push('/templates')} className="text-primary font-bold mt-2">
                        Upload de Templates
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {templates.map(t => (
                        <div 
                          key={t.id}
                          onClick={() => setFormData({...formData, metadata: {...formData.metadata, templateId: t.id}})}
                          className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                            formData.metadata.templateId === t.id ? 'border-primary bg-primary/5' : 'border-gray-50 hover:border-gray-200'
                          }`}
                        >
                          <div className="h-40 bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                            <FileText className="text-gray-400" size={32} />
                          </div>
                          <p className="text-sm font-bold text-gray-900 truncate">{t.name}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {currentStep === 3 && (
                <div className="flex flex-col items-center gap-6">
                  {/* Tab Selector */}
                  <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
                    <button
                      type="button"
                      onClick={() => setPreviewTab('cover')}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                        previewTab === 'cover' 
                          ? 'bg-white text-primary shadow-sm' 
                          : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      Capa da Proposta
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewTab('page6')}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                        previewTab === 'page6' 
                          ? 'bg-white text-primary shadow-sm' 
                          : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      Ficha Técnica (Página 6)
                    </button>
                  </div>

                  {/* Capturable scale wrapper */}
                  <div className="relative w-[210mm] h-[180mm] md:h-[240mm] overflow-hidden rounded-2xl border border-gray-100 shadow-2xl">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 scale-[0.55] origin-top md:scale-[0.78] bg-white p-2 rounded-lg">
                      {previewTab === 'cover' ? (
                        <ProposalCover data={formData} representativeName={profile?.full_name} />
                      ) : (
                        <ProposalPage6 data={formData} />
                      )}
                    </div>
                  </div>

                  <div className="text-center mt-4">
                    <h3 className="text-xl font-bold">Tudo pronto!</h3>
                    <p className="text-gray-500 max-w-md mt-2">
                      Sua proposta está configurada. Após salvar, você poderá baixar o PDF completo com as 6 páginas.
                    </p>
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
