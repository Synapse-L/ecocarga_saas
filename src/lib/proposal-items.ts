import { supabase } from '@/lib/supabase';
import { ProposalData, lerItens } from '@/types/proposal';

/**
 * Espelho relacional dos produtos da proposta (tabela `proposal_items`).
 *
 * Os itens continuam morando no JSONB `commercial_data`, que é o que gera o PDF
 * e o que as telas leem. Esta tabela existe para a pergunta que o JSONB não
 * responde bem — "qual carregador mais vende, em unidades e em receita?" —, já
 * que agrupar por produto dentro de um documento JSON obriga a varrer todas as
 * propostas a cada consulta.
 *
 * A migração fica em migration_proposal_items.sql.
 */

/** Uma linha da tabela, como a aplicação a envia. */
type LinhaItem = {
  proposal_id: string;
  user_id: string;
  charger_model_id: string | null;
  nome_snapshot: string;
  potencia_kw: number | null;
  quantidade: number;
  preco_unitario: number;
  // `subtotal` não entra: é coluna gerada no banco, justamente para não haver
  // duas versões do mesmo número.
};

/** O que o dashboard precisa de volta para montar o ranking. */
export interface ItemVendido {
  proposalId: string;
  nome: string;
  potenciaKw: number | null;
  quantidade: number;
  subtotal: number;
}

export const NOME_SEM_PRODUTO = 'Carregador sem nome';

/**
 * "40kW" → 40, "7,4 kW" → 7.4, "" → null.
 * Sem número reconhecível o resultado é null, e não zero: zero seria uma
 * potência inventada, que entraria nas somas como se fosse medida.
 */
export const potenciaEmKw = (power?: string): number | null => {
  const achado = (power ?? '').replace(',', '.').match(/(\d+(\.\d+)?)/);
  return achado ? Number(achado[1]) : null;
};

const inteiroNaoNegativo = (v: unknown, padrao: number): number => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : padrao;
};

const naoNegativo = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

/**
 * Traduz os produtos de uma proposta para linhas da tabela.
 *
 * Passa por lerItens(), então propostas antigas — as salvas antes do
 * multi-produto, sem o campo `itens` — viram uma linha só, montada dos campos
 * espelho. É a mesma conversão que o PDF usa, de modo que os dois não podem
 * divergir.
 */
export const montarLinhasDeItens = (
  proposalId: string,
  userId: string,
  commercial: ProposalData['commercial'],
): LinhaItem[] =>
  lerItens(commercial).map((item) => ({
    proposal_id: proposalId,
    user_id: userId,
    charger_model_id: item.chargerModelId || null,
    nome_snapshot: item.productName?.trim() || NOME_SEM_PRODUTO,
    potencia_kw: potenciaEmKw(item.power),
    quantidade: inteiroNaoNegativo(item.quantity, 1),
    preco_unitario: naoNegativo(item.unitPrice),
  }));

/**
 * Grava os itens de uma proposta recém-criada.
 *
 * Devolve se conseguiu, em vez de estourar: a proposta em si já foi salva, e
 * derrubar o fluxo depois disso faria o vendedor achar que perdeu o trabalho
 * por causa de uma tabela de apoio. Quem chama decide como avisar.
 */
export async function gravarItensDaProposta(
  proposalId: string,
  userId: string,
  commercial: ProposalData['commercial'],
): Promise<boolean> {
  const linhas = montarLinhasDeItens(proposalId, userId, commercial);
  if (linhas.length === 0) return true;

  const { error } = await supabase.from('proposal_items').insert(linhas);
  if (error) {
    console.error('Não foi possível gravar os itens da proposta para análise:', error);
    return false;
  }
  return true;
}

/**
 * Todos os itens vendidos pelo usuário.
 *
 * Não traz o status: ele muda no kanban a todo momento, e o dashboard já tem a
 * lista de propostas em mãos. Cruzar por `proposalId` na hora de montar o
 * gráfico mantém o ranking coerente com o que está na tela, sem ir ao banco a
 * cada arrastar de card.
 */
export async function buscarItensVendidos(userId: string): Promise<ItemVendido[]> {
  const { data, error } = await supabase
    .from('proposal_items')
    .select('proposal_id, nome_snapshot, potencia_kw, quantidade, subtotal')
    .eq('user_id', userId);

  if (error) {
    // Mais provável: a migração ainda não foi rodada neste projeto. O dashboard
    // continua de pé — o ranking cai para o cálculo a partir das propostas.
    console.warn('Itens de proposta indisponíveis; usando as propostas como fonte.', error.message);
    return [];
  }

  return (data ?? []).map((linha) => ({
    proposalId: linha.proposal_id,
    nome: linha.nome_snapshot,
    potenciaKw: linha.potencia_kw === null ? null : Number(linha.potencia_kw),
    quantidade: Number(linha.quantidade) || 0,
    subtotal: Number(linha.subtotal) || 0,
  }));
}
