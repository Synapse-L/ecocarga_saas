import { ProposalData, lerItens } from '@/types/proposal';
import { askGemini } from '@/lib/ai';
import { ItemVendido, NOME_SEM_PRODUTO, potenciaEmKw } from '@/lib/proposal-items';

export interface DashboardProposal {
  id: string;
  title: string;
  status: 'Rascunho' | 'Enviado' | 'Concluído' | 'Vencido' | 'Negociação';
  created_at: string;
  updated_at: string;
  client?: {
    name: string;
  };
  commercial_data: ProposalData;
  template?: {
    file_url: string;
  };
  client_signed_at?: string | null;
}

// Generates 25 realistic historical proposals spread over the last 12 months
const generateMockProposals = (): DashboardProposal[] => {
  const clients = [
    'Condomínio Spazio', 'Auto Posto Alvorada', 'Shopping Plaza', 
    'Frotas Logística', 'Eletroposto Central', 'Condomínio Green Park', 
    'Supermercado Nova Era', 'Faculdade Dom Bosco', 'Hotel Miramar', 
    'Academia Alpha', 'Transportadora TransFast', 'Condomínio Vila Flores'
  ];

  const products = [
    { name: 'Wallbox 7kW', power: '7kW', price: 8500.00 },
    { name: 'Wallbox 22kW', power: '22kW', price: 14200.00 },
    { name: 'Carregador DC 60kW', power: '60kW', price: 89000.00 },
    { name: 'Carregador DC 120kW', power: '120kW', price: 145000.00 },
    { name: 'Eco SuperFast', power: '40kW', price: 30966.36 }
  ];

  const statuses: DashboardProposal['status'][] = [
    'Concluído', 'Concluído', 'Concluído', 'Concluído', 'Concluído',
    'Enviado', 'Enviado', 'Enviado',
    'Negociação', 'Negociação', 'Negociação',
    'Vencido', 'Vencido',
    'Rascunho'
  ];

  const mockProposals: DashboardProposal[] = [];
  const now = new Date();

  // Create baseline proposals over past 12 months
  for (let i = 0; i < 28; i++) {
    // Distribute creation dates over past 12 months
    const dateOffsetDays = Math.floor(Math.random() * 365);
    const createdDate = new Date();
    createdDate.setDate(now.getDate() - dateOffsetDays);
    
    // Updated date is 3-15 days after created date
    const updatedDate = new Date(createdDate.getTime());
    updatedDate.setDate(createdDate.getDate() + Math.floor(Math.random() * 12) + 3);

    const clientName = clients[i % clients.length];
    const product = products[i % products.length];
    const status = statuses[i % statuses.length];

    mockProposals.push({
      id: `mock-uuid-${i}`,
      title: `Proposta - ${clientName}`,
      status,
      created_at: createdDate.toISOString(),
      updated_at: updatedDate.toISOString(),
      client: { name: clientName },
      commercial_data: {
        client: {
          name: clientName,
          phone: '(11) 98888-7777',
          address: 'Av. das Nações Unidas, 1000 - São Paulo - SP',
        },
        commercial: {
          productName: product.name,
          power: product.power,
          price: product.price,
          installments: 10,
          estimatedSavings: 'Alta performance de recarga',
          observations: 'Prazo médio de entrega.',
          deadline: '10 dias',
          conditions: 'À vista ou parcelado',
          technicalSpecs: {
            powerSource: '3F+N+T',
            connectors: product.power.includes('kW') && parseInt(product.power) > 22 ? 2 : 1,
            connectorType: product.power.includes('kW') && parseInt(product.power) > 22 ? 'CCS2' : 'T2',
            communication: 'Bluetooth/Wi-Fi/Ethernet/OCPP',
            model: `Eco-${product.name.replace(' ', '-')}`
          }
        },
        metadata: {
          templateId: '',
          emissionDate: createdDate.toLocaleDateString('pt-BR'),
          validityDays: 15
        }
      }
    });
  }

  // Sort by created_at descending
  return mockProposals.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

/** Um carregador no ranking de vendas. */
export interface CarregadorNoRanking {
  name: string;
  /** Unidades e receita das propostas fechadas. */
  unidades: number;
  receita: number;
  /** Os mesmos números somando toda proposta, fechada ou não. */
  unidadesPropostas: number;
  receitaProposta: number;
  potenciaKw: number | null;
}

/**
 * Ranking de carregadores por unidades e por receita.
 *
 * Os itens vêm da tabela proposal_items, mas o STATUS não: ele vem da lista de
 * propostas que a tela já tem em mãos. Assim mover um card no kanban muda o
 * ranking na hora, sem ida ao banco, e o gráfico nunca discorda dos KPIs ao
 * lado dele.
 *
 * Proposta sem linha na tabela — as de demonstração, e as salvas antes da
 * migração — cai para lerItens() sobre o próprio JSONB. É a mesma leitura que o
 * PDF faz, então o resultado é o mesmo; só não passa pelo banco.
 */
const montarRankingCarregadores = (
  allProposals: DashboardProposal[],
  itensVendidos: ItemVendido[],
): CarregadorNoRanking[] => {
  const itensPorProposta = new Map<string, ItemVendido[]>();
  for (const item of itensVendidos) {
    const lista = itensPorProposta.get(item.proposalId);
    if (lista) lista.push(item);
    else itensPorProposta.set(item.proposalId, [item]);
  }

  const acumulado = new Map<string, CarregadorNoRanking>();

  for (const proposta of allProposals) {
    const doBanco = itensPorProposta.get(proposta.id);
    const itens: ItemVendido[] = doBanco ?? lerItens(proposta.commercial_data?.commercial).map(i => ({
      proposalId: proposta.id,
      nome: i.productName?.trim() || NOME_SEM_PRODUTO,
      potenciaKw: potenciaEmKw(i.power),
      quantidade: Number(i.quantity) || 0,
      subtotal: (Number(i.unitPrice) || 0) * (Number(i.quantity) || 0),
    }));

    const fechada = proposta.status === 'Concluído';

    for (const item of itens) {
      const atual = acumulado.get(item.nome) ?? {
        name: item.nome,
        unidades: 0,
        receita: 0,
        unidadesPropostas: 0,
        receitaProposta: 0,
        potenciaKw: item.potenciaKw,
      };

      atual.unidadesPropostas += item.quantidade;
      atual.receitaProposta += item.subtotal;
      if (fechada) {
        atual.unidades += item.quantidade;
        atual.receita += item.subtotal;
      }
      if (atual.potenciaKw === null) atual.potenciaKw = item.potenciaKw;

      acumulado.set(item.nome, atual);
    }
  }

  return [...acumulado.values()].sort((a, b) => b.receita - a.receita || b.unidades - a.unidades);
};

export const getDashboardStats = async (
  realProposals: any[],
  userId?: string,
  skipAi = false,
  itensVendidos: ItemVendido[] = [],
  /**
   * Liga as 28 propostas de demonstração. Só quem pede vê.
   *
   * Antes elas entravam sozinhas sempre que a base parecia vazia, e um flag no
   * localStorage decidia quando parar. Quem abrisse a conta pela primeira vez
   * via faturamento, ticket médio e taxa de conversão inventados, sem nada na
   * tela dizendo isso — números que dá para repetir numa reunião sem perceber.
   * Num sistema comercial esse erro é pior que tela vazia.
   */
  demonstracao = false,
) => {
  let mockProposals: DashboardProposal[] = [];

  if (demonstracao) {
    // Guardadas na sessão para sobreviver à navegação: sem isso cada recarga
    // sorteia outro conjunto e os gráficos mudam sozinhos durante uma demo.
    const mockKey = userId ? `proposalpro_mock_proposals_${userId}` : 'proposalpro_mock_proposals';
    if (typeof window === 'undefined') {
      mockProposals = generateMockProposals();
    } else {
      const saved = sessionStorage.getItem(mockKey);
      try {
        mockProposals = saved ? JSON.parse(saved) : generateMockProposals();
      } catch {
        mockProposals = generateMockProposals();
      }
      if (!saved) sessionStorage.setItem(mockKey, JSON.stringify(mockProposals));
    }
  }

  // Combine real database proposals with mock base proposals
  // Ensure real proposals override mock ones or they just stack together
  // Map real proposals to our DashboardProposal type
  const formattedRealProposals: DashboardProposal[] = realProposals.map(p => ({
    id: p.id,
    title: p.title,
    status: p.status === 'Aprovada' ? 'Concluído' : p.status === 'Recusada' ? 'Vencido' : p.status,
    created_at: p.created_at,
    updated_at: p.updated_at,
    client: p.client ? { name: p.client.name } : { name: p.commercial_data?.client?.name || 'Cliente s/ nome' },
    commercial_data: p.commercial_data,
    template: p.template,
    client_signed_at: p.client_signed_at
  }));

  const allProposals = [...formattedRealProposals, ...mockProposals];

  // Helper date metrics
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Get current and previous month records
  const currentMonthProposals = allProposals.filter(p => {
    const d = new Date(p.created_at);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const previousMonthProposals = allProposals.filter(p => {
    const d = new Date(p.created_at);
    // Previous month logic
    const prevM = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevY = currentMonth === 0 ? currentYear - 1 : currentYear;
    return d.getMonth() === prevM && d.getFullYear() === prevY;
  });

  // 1. Total de Propostas
  const totalCount = allProposals.length;
  const prevCount = previousMonthProposals.length;
  // Sem propostas no mês anterior não há base de comparação: variação = 0
  // (nada de números inventados no dashboard com o banco vazio)
  const countGrowth = prevCount > 0 ? ((currentMonthProposals.length - prevCount) / prevCount) * 100 : 0;

  // 2. Valor Total Proposto
  const totalValue = allProposals.reduce((sum, p) => sum + (p.commercial_data?.commercial?.price || 0), 0);

  // 3. Receita Potencial (Enviada + Negociação)
  const potentialValue = allProposals
    .filter(p => p.status === 'Enviado' || p.status === 'Negociação')
    .reduce((sum, p) => sum + (p.commercial_data?.commercial?.price || 0), 0);

  // 4. Taxa de Conversão
  const closedCount = allProposals.filter(p => p.status === 'Concluído').length;
  const conversionRate = totalCount > 0 ? (closedCount / totalCount) * 100 : 0;
  
  // Variação da taxa de conversão vs. mês anterior.
  // Sem propostas no mês anterior não há base de comparação: variação = 0.
  // (Antes usava um fallback fixo de 35, o que fazia o card mostrar "-35%"
  // com o banco de dados vazio — um número totalmente inventado.)
  const prevClosed = previousMonthProposals.filter(p => p.status === 'Concluído').length;
  const conversionGrowth = prevCount > 0
    ? conversionRate - (prevClosed / prevCount) * 100
    : 0;

  // 5. Ticket Médio
  const averageTicket = totalCount > 0 ? totalValue / totalCount : 0;

  // 6. Tempo Médio de Fechamento (days)
  const closedProposals = allProposals.filter(p => p.status === 'Concluído');
  let totalDays = 0;
  closedProposals.forEach(p => {
    const start = new Date(p.created_at);
    const end = new Date(p.updated_at);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    totalDays += diffDays || 5; // fallback min 5 days
  });
  // Sem propostas fechadas não há média: 0 (antes mostrava "8 dias" inventados)
  const avgClosingTimeDays = closedProposals.length > 0 ? Math.round(totalDays / closedProposals.length) : 0;

  // 7. Graph 1: Area Chart (Evolução 12 meses)
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const evolutionData: any[] = [];
  
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(now.getMonth() - i);
    const m = d.getMonth();
    const y = d.getFullYear();

    const monthProps = allProposals.filter(p => {
      const pd = new Date(p.created_at);
      return pd.getMonth() === m && pd.getFullYear() === y;
    });

    const monthClosed = monthProps.filter(p => p.status === 'Concluído');

    evolutionData.push({
      name: `${monthNames[m]} ${y.toString().substring(2)}`,
      Criadas: monthProps.length,
      Fechadas: monthClosed.length,
      Faturamento: monthClosed.reduce((sum, p) => sum + (p.commercial_data?.commercial?.price || 0), 0)
    });
  }

  // 8. Graph 2: Funnel Chart
  // Funnel steps: Lead -> Contato -> Proposta -> Negociação -> Fechado
  const funnelData = [
    { name: 'Lead', value: Math.round(totalCount * 1.6), loss: '0%' },
    { name: 'Contato', value: Math.round(totalCount * 1.3), loss: '18%' },
    { name: 'Proposta', value: totalCount, loss: '23%' },
    { name: 'Negociação', value: allProposals.filter(p => p.status === 'Enviado' || p.status === 'Negociação' || p.status === 'Concluído').length, loss: '30%' },
    { name: 'Fechado', value: closedCount, loss: '45%' },
  ];

  // 9. Graph 3: Status Chart (Donut)
  const statusData = [
    { name: 'Rascunho', value: allProposals.filter(p => p.status === 'Rascunho').length, color: '#94a3b8' },
    { name: 'Enviada', value: allProposals.filter(p => p.status === 'Enviado').length, color: '#3b82f6' },
    { name: 'Negociação', value: allProposals.filter(p => p.status === 'Negociação').length, color: '#a855f7' },
    { name: 'Aprovada', value: closedCount, color: '#10b981' },
    { name: 'Recusada', value: allProposals.filter(p => p.status === 'Vencido').length, color: '#ef4444' },
  ].filter(item => item.value > 0);

  // 10. Mercado de Mobilidade Elétrica
  const totalPowerKW = allProposals.reduce((sum, p) => {
    const powerStr = p.commercial_data?.commercial?.power || '0';
    const parsedPower = parseFloat(powerStr.replace(/[^\d.]/g, '')) || 0;
    return sum + parsedPower;
  }, 0);

  const proposedChargers = allProposals.reduce((sum, p) => {
    return sum + (p.commercial_data?.commercial?.technicalSpecs?.connectors || 1);
  }, 0);

  const avgPowerPerProject = totalCount > 0 ? totalPowerKW / totalCount : 0;

  // 11. Top Clientes (Ranking 10)
  const clientMap: Record<string, { count: number; value: number }> = {};
  allProposals.forEach(p => {
    const name = p.client?.name || p.commercial_data?.client?.name || 'Cliente s/ nome';
    if (!clientMap[name]) {
      clientMap[name] = { count: 0, value: 0 };
    }
    clientMap[name].count += 1;
    clientMap[name].value += p.commercial_data?.commercial?.price || 0;
  });

  const topClients = Object.keys(clientMap)
    .map(name => ({
      name,
      count: clientMap[name].count,
      value: clientMap[name].value
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // 12. Top Produtos
  const productMap: Record<string, { count: number; value: number }> = {};
  allProposals.forEach(p => {
    const name = p.commercial_data?.commercial?.productName || 'Carregador Eco';
    if (!productMap[name]) {
      productMap[name] = { count: 0, value: 0 };
    }
    productMap[name].count += 1;
    productMap[name].value += p.commercial_data?.commercial?.price || 0;
  });

  const topProducts = Object.keys(productMap)
    .map(name => ({
      name,
      count: productMap[name].count,
      value: productMap[name].value
    }))
    .sort((a, b) => b.value - a.value);

  // 12b. Ranking de carregadores por unidades e por receita.
  // Diferente de topProducts, que conta PROPOSTAS e lê só o produto espelhado,
  // este conta os produtos um a um, com quantidade — que é o que responde
  // "qual carregador mais vende".
  const chargerRanking = montarRankingCarregadores(allProposals, itensVendidos);
  const chargerRankingPorUnidades = [...chargerRanking]
    .sort((a, b) => b.unidades - a.unidades || b.receita - a.receita)
    .slice(0, 6);
  const chargerRankingPorReceita = chargerRanking.slice(0, 6);
  const totalUnidadesVendidas = chargerRanking.reduce((s, c) => s + c.unidades, 0);
  const receitaTotalVendida = chargerRanking.reduce((s, c) => s + c.receita, 0);

  // 13. IA Insights dinâmicos (Gemini)
  const insights: Array<{ type: string; title: string; description: string }> = [];
  
  if (skipAi) {
    // Fill in a simple static placeholder. This gets overridden by previous insights in page.tsx anyway.
    insights.push({
      type: 'success',
      title: 'Desempenho Comercial',
      description: `Taxa de conversão atual de ${conversionRate.toFixed(1)}%.`
    });
  } else {
    try {
      const query = 'Forneça insights comerciais curtos e acionáveis baseados nos KPIs atuais.';
      const aiResponse = await askGemini(query, [], {
        totalProposals: totalCount,
        totalProposalsGrowth: countGrowth,
      totalValue: totalValue,
      totalValueGrowth: 0,
      conversionRate: conversionRate,
      conversionRateGrowth: conversionGrowth,
      averageTicket: averageTicket,
      averageTicketGrowth: 0,
      powerInstalled: totalPowerKW,
      powerInstalledGrowth: 0,
      proposalsByStatus: {
        concluido: closedCount,
        negociacao: allProposals.filter(p => p.status === 'Negociação').length,
        apresentada: allProposals.filter(p => p.status === 'Enviado').length,
        perdido: allProposals.filter(p => p.status === 'Vencido').length
      },
      proposalsByProduct: {},
      topClients: [],
    } as any);
    // Assume Gemini returns a JSON array string or markdown list; we parse simple lines
    const lines = aiResponse.split('\n').filter(l => l.trim().length > 0);
    lines.forEach(line => {
      const parts = line.split(' - ');
      if (parts.length === 3) {
        insights.push({ type: parts[0].trim(), title: parts[1].trim(), description: parts[2].trim() });
      }
    });
    } catch (e) {
      console.error('Failed to get AI insights', e);
      // fallback to static insights
      insights.push({
        type: 'success',
        title: 'Desempenho Comercial',
        description: `Suas conversões cresceram ${(conversionGrowth >= 0 ? '+' : '')}${conversionGrowth.toFixed(1)}% nos últimos 30 dias.`
      });
      insights.push({
        type: 'info',
        title: 'Taxa de Fechamento por Valor',
        description: 'Projetos com carregadores rápidos (DC) acima de R$ 80.000 possuem taxa de fechamento 23% maior.'
      });
      insights.push({
        type: 'revenue',
        title: 'Previsão de Fechamento',
        description: `Você pode fechar aproximadamente R$ ${Math.round(potentialValue * 0.45).toLocaleString('pt-BR')} neste mês.`
      });
    }
  }

  // 14. Timeline dynamic events
  const timelineEvents: any[] = [];
  const latestProposals = allProposals.slice(0, 5);
  const actionTypes = ['criada', 'enviada', 'aprovada', 'PDF gerado'];
  const times = ['10:30', '11:20', '14:00', '15:10', '16:40'];

  latestProposals.forEach((p, idx) => {
    const date = new Date(p.created_at);
    let action = 'Proposta criada';
    if (p.status === 'Enviado') action = 'Proposta enviada';
    if (p.status === 'Negociação') action = 'Proposta em negociação';
    if (p.status === 'Concluído') action = 'Cliente aprovou proposta';
    if (p.status === 'Vencido') action = 'Proposta expirada';

    timelineEvents.push({
      time: times[idx % times.length],
      date: date.toLocaleDateString('pt-BR'),
      action,
      client: p.client?.name || 'Cliente',
      title: p.title
    });
  });

  return {
    allProposals,
    formattedRealProposals,
    kpis: {
      totalProposals: {
        value: totalCount,
        growth: countGrowth
      },
      totalValue: {
        value: totalValue
      },
      potentialValue: {
        value: potentialValue
      },
      conversionRate: {
        value: conversionRate,
        growth: conversionGrowth
      },
      averageTicket: {
        value: averageTicket
      },
      avgClosingTimeDays: {
        value: avgClosingTimeDays
      }
    },
    charts: {
      evolutionData,
      funnelData,
      statusData,
      chargerRankingPorUnidades,
      chargerRankingPorReceita
    },
    vendasPorCarregador: {
      ranking: chargerRanking,
      totalUnidades: totalUnidadesVendidas,
      receitaTotal: receitaTotalVendida
    },
    market: {
      proposedChargers,
      totalPowerKW,
      potentialValue,
      avgPowerPerProject,
      growth: countGrowth
    },
    insights,
    topClients,
    topProducts,
    timelineEvents
  };
};
