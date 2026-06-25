"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

type Theme = 'light' | 'dark' | 'ecocarga';
type Language = 'pt' | 'en';

interface AppContextProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  profile: any;
  setProfile: (profile: any) => void;
  updateNickname: (name: string) => Promise<boolean>;
  t: (key: string) => string;
}

const translations = {
  pt: {
    dashboard: "Dashboard",
    proposals: "Propostas",
    clients: "Clientes",
    chargers: "Carregadores",
    templates: "Templates",
    settings: "Configurações",
    logout: "Sair",
    search: "Pesquisar...",
    newProposal: "Nova Proposta",
    totalProposals: "Total Propostas",
    openProposals: "Em Aberto",
    completedProposals: "Concluídas",
    conversionRate: "Conversão",
    recentProposals: "Propostas Recentes",
    viewAll: "Ver todas",
    clientName: "Cliente",
    title: "Título",
    date: "Data",
    status: "Status",
    actions: "Ações",
    emptyProposals: "Nenhuma proposta encontrada. Clique em 'Nova Proposta' para começar.",
    noChargers: "Nenhum carregador encontrado. Cadastre o seu primeiro modelo personalizado de carregador.",
    noTemplates: "Nenhum template encontrado. Faça o upload do seu primeiro PDF comercial para começar.",
    duplicate: "Duplicar",
    view: "Visualizar",
    download: "Baixar",
    delete: "Excluir",
    confirmDeleteProposal: "Deseja realmente excluir esta proposta?",
    confirmDeleteTemplate: "Tem certeza que deseja excluir este template?",
    confirmDeleteCharger: "Deseja realmente excluir este modelo de carregador?",
    theme: "Tema",
    themeLight: "Modo Branco",
    themeDark: "Modo Black",
    themeEcocarga: "Modo EcoCarga",
    language: "Idioma",
    langPt: "Português",
    langEn: "Inglês",
    nickname: "Nickname / Nome de Exibição",
    profile: "Perfil",
    save: "Salvar",
    saving: "Salvando...",
    cancel: "Cancelar",
    saveSuccess: "Configurações salvas com sucesso!",
    saveError: "Erro ao salvar configurações.",
    addCharger: "Cadastrar Modelo",
    editCharger: "Editar Modelo",
    chargerName: "Nome de Exibição (ex: Eco SuperFast)",
    chargerPower: "Potência (ex: 40kW)",
    chargerPrice: "Valor de Venda (R$)",
    chargerModel: "Marca / Modelo Técnico",
    powerSource: "Fonte de Energia",
    connectors: "Nº de Conectores",
    connectorType: "Tipo do Conector",
    communication: "Comunicação",
    chargerPhoto: "Foto do Carregador (PNG ou JPG)",
    systemModel: "SISTEMA",
    customModel: "PERSONALIZADO",
    startingFrom: "a partir de",
    protectedModel: "Modelo protegido",
    searchModels: "Pesquisar modelos...",
    modelName: "Nome do Modelo",
    // Templates page
    manageTemplates: "Gerenciar Templates",
    uploadPdf: "Upload PDF",
    defaultTemplate: "PADRÃO",
    viewOriginal: "Visualizar Original",
    emptyTemplates: "Nenhum template encontrado",
    uploadFirstTemplate: "Faça o upload do seu primeiro PDF comercial para começar.",
    // New proposal page
    stepClient: "Cliente",
    stepCommercial: "Comercial",
    stepTemplate: "Template",
    stepPreview: "Revisão",
    clientInfo: "Informações do Cliente",
    clientBusinessName: "Nome ou Empresa",
    clientPhone: "Telefone / WhatsApp",
    clientAddress: "Endereço Completo",
    commercialDetails: "Detalhes Comerciais",
    selectPredetermined: "Selecionar Modelo Pré-determinado",
    chooseCharger: "-- Escolha um carregador cadastrado --",
    autoselectHelp: "Selecionar um modelo carregará automaticamente o preço e todas as especificações técnicas da ficha da EcoCarga.",
    salesInfo: "Informações de Venda",
    productCommercialModel: "Produto / Modelo Comercial",
    chargingPower: "Potência de Recarga",
    unitValue: "Valor Unitário (R$)",
    installments: "Parcelamento (Até 10x)",
    techSpecsPage6: "Ficha Técnica do Carregador (Página 6)",
    selectTemplate: "Seleção de Template",
    noTemplatesFound: "Nenhum template PDF encontrado.",
    ready: "Tudo pronto!",
    readyHelp: "Sua proposta está configurada. Após salvar, você poderá baixar o PDF completo com as 6 páginas.",
    saveProposal: "Salvar Proposta",
    continue: "Continuar",
    back: "Voltar",
    // Reorder modal
    organizePdfPages: "Organizar Páginas do PDF",
    organizePdfHelp: "Defina a ordem em que as páginas aparecerão no PDF final.",
    loadingTemplatePages: "Analisando páginas do modelo...",
    saasPageLabel: "Página criada pelo SaaS",
    templatePageLabel: "Página do Modelo",
    confirmAndDownload: "Confirmar e Baixar",
    close: "Fechar",
    representative: "Representante",
    client: "Cliente",
    proposal: "Proposta",
    commercial: "Comercial",
    copyright: "Copyright © 2026 Ecocarga. Todos os direitos reservados.",
    itsTime: "Chegou a hora",
    toMakeChoice: "de fazer a sua escolha",
    technicalInfo: "Informações técnicas",
    consultProfessionals: "Consulte nossos profissionais para mais informações.",
    value: "Valor",
    emission: "Emissão",
    proposalValidity: "Proposta válida por {days} dias.",
    cash: "à vista",
    plusShipping: "+ Frete",
    installmentUpTo: "parcelado em até",
    onCreditCard: "no cartão de crédito",
    plusInterest: "+ Acréscimo de Juros",
    infrastructureDisclaimer: "Instalação e infraestrutura elétrica são de responsabilidade do cliente.",
    speedBadge: "Velocidade",
    powerBadge: "Potência",
    rangeBadge: "Autonomia",
    previewTabCover: "Capa da Proposta",
    previewTabPage6: "Ficha Técnica (Página 6)",
    saveProposalError: "Erro ao salvar proposta.",
    stepOf: "de",
  },
  en: {
    dashboard: "Dashboard",
    proposals: "Proposals",
    clients: "Clients",
    chargers: "Chargers",
    templates: "Templates",
    settings: "Settings",
    logout: "Logout",
    search: "Search...",
    newProposal: "New Proposal",
    totalProposals: "Total Proposals",
    openProposals: "Pending",
    completedProposals: "Completed",
    conversionRate: "Conversion",
    recentProposals: "Recent Proposals",
    viewAll: "View all",
    clientName: "Client",
    title: "Title",
    date: "Date",
    status: "Status",
    actions: "Actions",
    emptyProposals: "No proposals found. Click on 'New Proposal' to start.",
    noChargers: "No chargers found. Register your first custom charger model.",
    noTemplates: "No templates found. Upload your first commercial PDF to start.",
    duplicate: "Duplicate",
    view: "View",
    download: "Download",
    delete: "Delete",
    confirmDeleteProposal: "Are you sure you want to delete this proposal?",
    confirmDeleteTemplate: "Are you sure you want to delete this template?",
    confirmDeleteCharger: "Are you sure you want to delete this charger model?",
    theme: "Theme",
    themeLight: "White Mode",
    themeDark: "Black Mode",
    themeEcocarga: "EcoCarga Mode",
    language: "Language",
    langPt: "Portuguese",
    langEn: "English",
    nickname: "Nickname / Display Name",
    profile: "Profile",
    save: "Save",
    saving: "Saving...",
    cancel: "Cancel",
    saveSuccess: "Settings saved successfully!",
    saveError: "Error saving settings.",
    addCharger: "Register Model",
    editCharger: "Edit Model",
    chargerName: "Display Name (e.g. Eco SuperFast)",
    chargerPower: "Power (e.g. 40kW)",
    chargerPrice: "Sale Value (R$)",
    chargerModel: "Technical Brand / Model",
    powerSource: "Power Source",
    connectors: "No. of Connectors",
    connectorType: "Connector Type",
    communication: "Communication",
    chargerPhoto: "Charger Photo (PNG or JPG)",
    systemModel: "SYSTEM",
    customModel: "CUSTOM",
    startingFrom: "starting from",
    protectedModel: "Protected model",
    searchModels: "Search models...",
    modelName: "Model Name",
    // Templates page
    manageTemplates: "Manage Templates",
    uploadPdf: "Upload PDF",
    defaultTemplate: "DEFAULT",
    viewOriginal: "View Original",
    emptyTemplates: "No templates found",
    uploadFirstTemplate: "Upload your first commercial PDF to start.",
    // New proposal page
    stepClient: "Client",
    stepCommercial: "Commercial",
    stepTemplate: "Template",
    stepPreview: "Review",
    clientInfo: "Client Information",
    clientBusinessName: "Name or Company",
    clientPhone: "Phone / WhatsApp",
    clientAddress: "Full Address",
    commercialDetails: "Commercial Details",
    selectPredetermined: "Select Predetermined Model",
    chooseCharger: "-- Choose a registered charger --",
    autoselectHelp: "Selecting a model will automatically load the price and all technical specifications of the EcoCarga sheet.",
    salesInfo: "Sales Information",
    productCommercialModel: "Product / Commercial Model",
    chargingPower: "Charging Power",
    unitValue: "Unit Value (R$)",
    installments: "Installments (Up to 10x)",
    techSpecsPage6: "Charger Technical Sheet (Page 6)",
    selectTemplate: "Select Template",
    noTemplatesFound: "No template PDF found.",
    ready: "All ready!",
    readyHelp: "Your proposal is configured. After saving, you can download the complete 6-page PDF.",
    saveProposal: "Save Proposal",
    continue: "Continue",
    back: "Back",
    // Reorder modal
    organizePdfPages: "Organize PDF Pages",
    organizePdfHelp: "Define the order in which the pages will appear in the final PDF.",
    loadingTemplatePages: "Analyzing model pages...",
    saasPageLabel: "Page created by SaaS",
    templatePageLabel: "Model Page",
    confirmAndDownload: "Confirm & Download",
    close: "Close",
    representative: "Representative",
    client: "Client",
    proposal: "Proposal",
    commercial: "Commercial",
    copyright: "Copyright © 2026 Ecocarga. All rights reserved.",
    itsTime: "It's time",
    toMakeChoice: "to make your choice",
    technicalInfo: "Technical specifications",
    consultProfessionals: "Consult our professionals for more information.",
    value: "Price",
    emission: "Issued",
    proposalValidity: "Proposal valid for {days} days.",
    cash: "cash",
    plusShipping: "+ Shipping",
    installmentUpTo: "installments up to",
    onCreditCard: "on credit card",
    plusInterest: "+ Interest rate",
    infrastructureDisclaimer: "Installation and electrical infrastructure are the customer's responsibility.",
    speedBadge: "Speed",
    powerBadge: "Power",
    rangeBadge: "Range",
    previewTabCover: "Proposal Cover",
    previewTabPage6: "Technical Sheet (Page 6)",
    saveProposalError: "Error saving proposal.",
    stepOf: "of",
  }
};

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('light');
  const [language, setLanguageState] = useState<Language>('pt');
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    // 1. Load theme from localStorage
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme === 'dark' || savedTheme === 'light' || savedTheme === 'ecocarga') {
      setThemeState(savedTheme);
      applyTheme(savedTheme);
    } else {
      // Default to system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const defaultTheme = prefersDark ? 'dark' : 'light';
      setThemeState(defaultTheme);
      applyTheme(defaultTheme);
    }

    // 2. Load language from localStorage
    const savedLang = localStorage.getItem('language') as Language;
    if (savedLang === 'pt' || savedLang === 'en') {
      setLanguageState(savedLang);
    }

    // 3. Listen to auth state and load profile
    const fetchProfile = async (userId: string) => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (data) {
          setProfile(data);
        } else {
          // Fallback e criação automática do perfil se estiver faltando no banco
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const defaultName = user.email?.split('@')[0] || 'Vendedor';
            
            // Tenta inserir o perfil padrão
            const { data: newProfile, error: insertErr } = await supabase
              .from('profiles')
              .insert({
                id: userId,
                full_name: defaultName,
                company_name: 'EcoCarga',
                role: 'vendedor',
                completed_tour: false
              })
              .select()
              .single();

            if (!insertErr && newProfile) {
              setProfile(newProfile);
            } else {
              if (insertErr) {
                console.error('Erro detalhado do insert do perfil no Supabase:', insertErr);
              }
              // Se der erro de permissão ou outro, usa fallback em memória
              setProfile({ id: userId, full_name: defaultName, role: 'vendedor', completed_tour: false });
            }
          }
        }
      } catch (err) {
        console.error('Error fetching profile in AppContext:', err);
      }
    };

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        fetchProfile(user.id);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const applyTheme = (t: Theme) => {
    const root = window.document.documentElement;
    root.classList.remove('dark', 'ecocarga');
    if (t === 'dark') {
      root.classList.add('dark');
    } else if (t === 'ecocarga') {
      root.classList.add('ecocarga');
    }
  };

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem('theme', t);
    applyTheme(t);
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const updateNickname = async (name: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Update the profile row matching the user id (aligns with UPDATE policy)
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: name,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      setProfile((prev: any) => ({ ...prev, id: user.id, full_name: name }));
      return true;
    } catch (err) {
      console.error('Error updating nickname in AppContext:', err);
      return false;
    }
  };

  const t = (key: string): string => {
    const dict = translations[language] as Record<string, string>;
    return dict[key] || key;
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        setTheme,
        language,
        setLanguage,
        profile,
        setProfile,
        updateNickname,
        t,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
