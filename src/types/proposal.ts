/**
 * Um produto dentro da proposta.
 *
 * `chargerModelId` é o vínculo com o catálogo (`charger_models`). Os demais
 * campos são SNAPSHOT: ficam gravados como estavam no momento da venda, para
 * que renomear ou reprecificar um modelo depois não reescreva o histórico.
 */
export interface ItemProposta {
  chargerModelId?: string | null;
  productName: string;
  power: string;
  quantity: number;
  unitPrice: number;
  imageUrl?: string;
  technicalSpecs: {
    powerSource: string;
    connectors: number;
    connectorType: string;
    communication: string;
    model: string;
  };
}

export interface ProposalData {
  client: {
    name: string;
    phone: string;
    address: string;
  };
  commercial: {
    /**
     * Produtos da proposta. Fonte da verdade para valores e para o PDF.
     *
     * Opcional porque propostas salvas antes do multi-produto não têm o campo.
     * Nunca leia direto: use `lerItens(commercial)`, que converte esses casos
     * numa lista de um item só a partir dos campos espelho.
     */
    itens?: ItemProposta[];

    /**
     * CAMPOS ESPELHO — não edite à mão, são recalculados a partir de `itens`.
     *
     * `price` guarda o TOTAL da proposta. Ele é lido em 13 lugares (KPIs do
     * dashboard, tabela, kanban, relatórios); mantê-lo preenchido é o que
     * permitiu introduzir múltiplos produtos sem reescrever nada disso.
     * `productName`, `power` e `technicalSpecs` espelham o PRIMEIRO item, pelo
     * mesmo motivo — telas antigas continuam mostrando algo coerente.
     */
    price: number;
    productName: string;
    power: string;
    technicalSpecs: {
      powerSource: string;
      connectors: number;
      connectorType: string;
      communication: string;
      model: string;
    };

    /** Condições da proposta como um todo (não variam por item). */
    installments: number;
    estimatedSavings: string;
    observations: string;
    deadline: string;
    conditions: string;
    /** Quais blocos de preço aparecem no PDF. Ausente = true (propostas antigas). */
    showCashPrice?: boolean;
    showInstallments?: boolean;
    /** @deprecated Use `itens[n].imageUrl`. Mantido para propostas antigas. */
    imageUrl?: string;
  };
  metadata: {
    templateId: string;
    emissionDate: string;
    validityDays: number;
  };
}

/** Os status que uma proposta assume no kanban. */
export type StatusProposta = 'Rascunho' | 'Enviado' | 'Negociação' | 'Concluído' | 'Vencido';

/**
 * Uma linha da tabela `proposals`, como ela chega do Supabase.
 *
 * Existe para que `commercial_data` pare de entrar na aplicação como `any`.
 * Enquanto era `any`, renomear um campo do JSONB não gerava erro em nenhum dos
 * treze pontos que leem `commercial.price` — o dado simplesmente virava
 * `undefined` em produção, e num campo de valor isso vira R$ 0 numa proposta.
 *
 * `client` e `template` só vêm preenchidos nas consultas que fazem o join.
 */
export interface LinhaProposta {
  id: string;
  user_id: string;
  client_id: string | null;
  template_id: string | null;
  title: string;
  status: StatusProposta | string;
  commercial_data: ProposalData;
  final_pdf_url?: string | null;
  public_token?: string | null;
  is_public?: boolean | null;
  client_signature?: string | null;
  client_signed_at?: string | null;
  lead_id?: string | null;
  created_at: string;
  updated_at: string;
  client?: { name: string } | null;
  template?: { file_url: string } | null;
}

/**
 * Estado do formulário de criação. Difere de `ProposalData` num ponto: aqui
 * `itens` é obrigatório, porque o formulário sempre nasce com um item em
 * branco. `ProposalData` mantém o campo opcional para ler propostas antigas.
 */
export type ProposalFormData = ProposalData & {
  commercial: ProposalData['commercial'] & { itens: ItemProposta[] };
};

/** Item vazio, pronto para o vendedor preencher. */
export const criarItemVazio = (): ItemProposta => ({
  chargerModelId: null,
  productName: '',
  power: '',
  quantity: 1,
  unitPrice: 0,
  technicalSpecs: {
    powerSource: '',
    connectors: 1,
    connectorType: '',
    communication: '',
    model: '',
  },
});

/**
 * Lê os itens de uma proposta, incluindo as salvas antes do multi-produto.
 * Aquelas não têm `itens` — são convertidas para uma lista de um item só, de
 * modo que histórico, KPIs e PDF continuem corretos sem migrar o banco.
 */
export const lerItens = (commercial: any): ItemProposta[] => {
  if (Array.isArray(commercial?.itens) && commercial.itens.length > 0) {
    return commercial.itens;
  }
  return [{
    chargerModelId: null,
    productName: commercial?.productName || '',
    power: commercial?.power || '',
    quantity: 1,
    unitPrice: commercial?.price || 0,
    imageUrl: commercial?.imageUrl,
    technicalSpecs: commercial?.technicalSpecs || {
      powerSource: '', connectors: 1, connectorType: '', communication: '', model: '',
    },
  }];
};

/** Total da proposta: soma de quantidade × preço unitário. */
export const calcularTotal = (itens: ItemProposta[]): number =>
  itens.reduce((s, i) => s + (Number(i.unitPrice) || 0) * (Number(i.quantity) || 0), 0);

/**
 * Reconstrói os campos espelho a partir dos itens. Chame sempre antes de salvar.
 */
export const sincronizarEspelhos = (commercial: ProposalData['commercial']): ProposalData['commercial'] => {
  const itens = commercial.itens?.length ? commercial.itens : [criarItemVazio()];
  const primeiro = itens[0];
  return {
    ...commercial,
    itens,
    price: calcularTotal(itens),
    productName: primeiro.productName,
    power: primeiro.power,
    technicalSpecs: primeiro.technicalSpecs,
    imageUrl: primeiro.imageUrl,
  };
};
