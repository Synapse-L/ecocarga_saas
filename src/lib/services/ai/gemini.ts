interface ChatMessage {
  role: 'user' | 'model' | 'assistant';
  content: string;
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
  allProposals?: any[];
  charts?: {
    evolutionData: any[];
    funnelData: any[];
    statusData: any[];
  };
}

/**
 * Normalizes the raw stats object sent by the frontend (which is nested under kpis, market, charts, etc.)
 * to the flat DashboardStats interface format expected by the Kepler Assistant.
 */
function normalizeStats(rawStats: any): DashboardStats {
  if (!rawStats) {
    return {
      totalProposals: 0,
      totalProposalsGrowth: 0,
      totalValue: 0,
      totalValueGrowth: 0,
      conversionRate: 0,
      conversionRateGrowth: 0,
      averageTicket: 0,
      averageTicketGrowth: 0,
      powerInstalled: 0,
      powerInstalledGrowth: 0,
      proposalsByStatus: { concluido: 0, negociacao: 0, apresentada: 0, perdido: 0 },
      proposalsByProduct: {},
      topClients: [],
      allProposals: [],
      charts: { evolutionData: [], funnelData: [], statusData: [] }
    };
  }

  // If the stats are already in the normalized flat format, return them
  if (typeof rawStats.totalProposals === 'number' && rawStats.kpis === undefined) {
    return rawStats;
  }

  const kpis = rawStats.kpis || {};
  const market = rawStats.market || {};
  const allProposals = rawStats.allProposals || [];
  
  // Calculate status counts
  const statusCounts = {
    concluido: allProposals.filter((p: any) => p.status === 'Concluído').length,
    negociacao: allProposals.filter((p: any) => p.status === 'Negociação').length,
    apresentada: allProposals.filter((p: any) => p.status === 'Enviado').length,
    perdido: allProposals.filter((p: any) => p.status === 'Vencido').length
  };

  // Calculate product counts
  const productCounts: Record<string, number> = {};
  allProposals.forEach((p: any) => {
    const prodName = p.commercial_data?.commercial?.productName || p.commercial_data?.product_name || 'Desconhecido';
    if (prodName) {
      productCounts[prodName] = (productCounts[prodName] || 0) + 1;
    }
  });

  // Calculate top clients list formatted for the AI
  const rawTopClients = rawStats.topClients || [];
  const topClients = rawTopClients.map((tc: any) => ({
    client: tc.name || tc.client || 'Desconhecido',
    value: tc.value || 0,
    count: tc.count || 0
  }));

  return {
    totalProposals: kpis.totalProposals?.value ?? 0,
    totalProposalsGrowth: kpis.totalProposals?.growth ?? 0,
    totalValue: kpis.totalValue?.value ?? 0,
    totalValueGrowth: kpis.totalValueGrowth?.value ?? 0,
    conversionRate: kpis.conversionRate?.value ?? 0,
    conversionRateGrowth: kpis.conversionRate?.growth ?? 0,
    averageTicket: kpis.averageTicket?.value ?? 0,
    averageTicketGrowth: kpis.averageTicketGrowth?.value ?? 0,
    powerInstalled: market.totalPowerKW ?? rawStats.market?.totalPowerKW ?? 0,
    powerInstalledGrowth: market.growth ?? rawStats.market?.growth ?? 0,
    proposalsByStatus: statusCounts,
    proposalsByProduct: productCounts,
    topClients: topClients,
    allProposals: allProposals,
    charts: rawStats.charts || { evolutionData: [], funnelData: [], statusData: [] }
  };
}

/**
 * Normalizes the message history to Gemini API format (role is user/model).
 */
function formatHistory(messages: ChatMessage[]) {
  return messages.map((msg) => {
    // Map 'assistant' role to 'model' for Gemini
    const role = msg.role === 'assistant' ? 'model' : msg.role;
    return {
      role,
      parts: [{ text: msg.content }],
    };
  });
}

/**
 * Generates a mock response for common questions based on dashboard statistics
 * when GEMINI_API_KEY is not defined or when the API call fails.
 */
function generateMockResponse(query: string, rawStats?: any): string {
  const stats = normalizeStats(rawStats);
  const q = query.toLowerCase();
  
  // Format numbers to BRL Currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const totalValueStr = stats ? formatCurrency(stats.totalValue) : 'R$ 1.250.000,00';
  const totalCount = stats ? stats.totalProposals : 45;
  const growth = stats ? stats.totalProposalsGrowth : 18;
  const avgTicket = stats ? formatCurrency(stats.averageTicket) : 'R$ 27.700,00';
  const power = stats ? stats.powerInstalled : 340;

  // Let's answer specifically for closed proposals if asked
  if (q.includes('fechada') || q.includes('concluída') || q.includes('concluidas') || q.includes('fechadas') || q.includes('aprovadas') || q.includes('aprovados')) {
    const concluido = stats.proposalsByStatus.concluido;
    const closedValue = stats.allProposals 
      ? stats.allProposals.filter((p: any) => p.status === 'Concluído').reduce((sum: number, p: any) => sum + (p.commercial_data?.commercial?.price || 0), 0)
      : 450000;
    
    return `Atualmente, temos **${concluido} propostas fechadas (concluídas)** no painel da EcoCarga. 
    
O faturamento total dessas propostas aprovadas é de **${formatCurrency(closedValue)}**. 

Se precisar de detalhes sobre as propostas fechadas ou sobre os clientes específicos que assinaram esses contratos, me avise!`;
  }

  if (q.includes('faturamento') || q.includes('valor total') || q.includes('quanto') || q.includes('receita') || q.includes('vendas')) {
    return `De acordo com os dados atuais do dashboard, o faturamento total acumulado (propostas fechadas e em andamento) é de **${totalValueStr}**, distribuído em **${totalCount} propostas** comerciais. 

Isso representa um crescimento de **+${growth}%** em comparação com o mês anterior. O seu ticket médio por proposta é de **${avgTicket}**. Deseja ver detalhes de alguma proposta específica ou cliente no topo da lista?`;
  }

  if (q.includes('carregador') || q.includes('produto') || q.includes('ac') || q.includes('dc') || q.includes('wallbox')) {
    const productsList = stats && stats.proposalsByProduct && Object.keys(stats.proposalsByProduct).length > 0
      ? Object.entries(stats.proposalsByProduct)
          .map(([name, count]) => `- **${name}**: ${count} unidades propostas`)
          .join('\n')
      : `- **Wallbox Slim AC (7.4 kW)**: 18 unidades\n- **Fast Charger DC (50 kW)**: 12 unidades\n- **Supercharger Ultra DC (150 kW)**: 6 unidades`;

    return `Os carregadores veiculares de portfólio registram a seguinte demanda nas suas propostas atuais:

${productsList}

**Dica de Vendas Kepler**: Os carregadores AC de 7.4kW e 22kW são ideais para condomínios residenciais e estacionamentos de longa permanência (shoppings e hotéis). Já os modelos rápidos DC (50kW a 150kW) são voltados para rodovias e frotas comerciais que exigem recarga em menos de 30 minutos.`;
  }

  if (q.includes('cliente') || q.includes('parceiro') || q.includes('top')) {
    const clientsList = stats && stats.topClients && stats.topClients.length > 0
      ? stats.topClients
          .map((c, i) => `${i + 1}. **${c.client}**: ${formatCurrency(c.value)} (${c.count} propostas)`)
          .join('\n')
      : `1. **Eletroposto Rodovia Sul**: R$ 350.000,00 (3 propostas)\n2. **Condomínio Green Park**: R$ 180.000,00 (2 propostas)\n3. **Frotas Express Ltda**: R$ 145.000,00 (1 proposta)`;

    return `Aqui está o ranking dos seus principais clientes por valor proposto acumulado:

${clientsList}

Focar no relacionamento com esses clientes ou ofertar contratos de manutenção preventiva da infraestrutura de recarga pode ser uma excelente estratégia de upsell.`;
  }

  if (q.includes('status') || q.includes('conversão') || q.includes('funil')) {
    const rate = stats ? stats.conversionRate : 64.5;
    const concluido = stats.proposalsByStatus.concluido;
    const negociacao = stats.proposalsByStatus.negociacao;
    const apresentada = stats.proposalsByStatus.apresentada;
    const perdido = stats.proposalsByStatus.perdido;

    return `O seu funil de vendas atual de eletromobilidade apresenta uma **taxa de conversão de ${rate}%**.

Distribuição por Status:
- **Concluídas**: ${concluido} propostas (Gerando receita e prontas para instalação)
- **Em Negociação**: ${negociacao} propostas (Acompanhamento crítico necessário!)
- **Apresentadas**: ${apresentada} propostas (Aguardando feedback inicial)
- **Perdidas**: ${perdido} propostas

Recomendo enviar um follow-up para as propostas com status "Apresentada" há mais de 5 dias úteis para acelerar o fechamento.`;
  }

  if (q.includes('ajuda') || q.includes('como usar') || q.includes('o que você faz') || q.includes('menu')) {
    return `Olá! Eu sou o **Kepler's Assistant**, a Inteligência Comercial da EcoCarga. Eu posso te ajudar com:

1. 📊 **Análise de Métricas**: Pergunte sobre seu faturamento, taxa de conversão ou ticket médio.
2. 🔌 **Portfólio de Carregadores**: Entenda quais produtos (AC/DC) estão saindo mais ou tire dúvidas técnicas sobre potência.
3. 🏆 **Top Clientes**: Veja quem são os seus principais parceiros comerciais.
4. 📈 **Estratégias de Venda**: Peça sugestões para aumentar as conversões de propostas abertas.

Como posso te ajudar a fechar mais negócios hoje?`;
  }

  // Generic intelligent response matching a commercial sales advisor
  return `Olá! Sou o **Kepler's Assistant**, seu consultor de vendas em eletromobilidade. 

Analisando o dashboard da **EcoCarga**, vejo que você tem um volume de negócios acumulado de **${totalValueStr}** ativo. A potência total de carregadores propostos soma **${power} kW**.

Se você quiser saber como otimizar suas vendas, entender a diferença entre carregadores rápidos DC e convencionais AC, ou obter insights sobre seus principais clientes, basta me perguntar!`;
}

/**
 * Sends messages to the Google Gemini API with system guidelines and dashboard context.
 */
export async function askGemini(
  query: string,
  history: ChatMessage[],
  rawStats?: any,
  chargerModels?: any[]
): Promise<string> {
  const stats = normalizeStats(rawStats);
  const apiKey = process.env.GEMINI_API_KEY;

  // If API Key is not configured, fall back to mock simulation immediately
  if (!apiKey) {
    console.warn(
      '[Kepler Assistant API] GEMINI_API_KEY is not defined in environment. Running in Simulator Mode.'
    );
    // Add artificial delay to simulate real network request
    await new Promise((resolve) => setTimeout(resolve, 800));
    return generateMockResponse(query, stats);
  }

  // Dynamically format product catalog from database
  let catalogText = '';
  if (chargerModels && chargerModels.length > 0) {
    catalogText = chargerModels.map((m, idx) => 
      `${idx + 1}. ${m.name} (${m.power}): Modelo "${m.model_name}", Preço Base: R$ ${Number(m.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}, Alimentação: ${m.power_source}, Conectores: ${m.connectors} (Tipo: ${m.connector_type}), Comunicação: ${m.communication}.`
    ).join('\n');
  } else {
    catalogText = `1. Wallbox 7kW (AC): Carga lenta, residencial/estacionamentos longos, monofásico/bifásico 32A.
2. Wallbox 22kW (AC): Carga média, comercial/residencial, trifásico 32A.
3. Eco SuperFast 40kW (DC): Carga rápida, frotas/empresas, ideal para recargas de 1h a 2h.
4. Carregador DC 60kW (DC): Carga rápida, postos/frotas, 2 conectores.
5. Carregador DC 120kW (DC): Carga ultrarrápida, rodovias/eletropostos pesados, 2 conectores CCS2.`;
  }

  // Simplified list of proposals for context (top 20)
  let proposalsListText = 'Não disponível';
  if (stats.allProposals && stats.allProposals.length > 0) {
    proposalsListText = stats.allProposals.slice(0, 20).map((p: any, idx: number) => {
      const clientName = p.client?.name || p.commercial_data?.client?.name || 'Cliente Sem Nome';
      const price = p.commercial_data?.commercial?.price || 0;
      const date = p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : 'Sem data';
      return `${idx + 1}. Cliente: "${clientName}", Título: "${p.title}", Status: "${p.status}", Valor: R$ ${price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}, Criado em: ${date}`;
    }).join('\n');
  }

  // Formatted chart data for the prompt
  let evolutionText = 'Não disponível';
  if (stats.charts?.evolutionData && stats.charts.evolutionData.length > 0) {
    evolutionText = stats.charts.evolutionData.map((e: any) => 
      `- Mês: ${e.name}, Propostas Criadas: ${e.Criadas}, Propostas Fechadas: ${e.Fechadas}, Faturamento Fechado: R$ ${e.Faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    ).join('\n');
  }

  let funnelText = 'Não disponível';
  if (stats.charts?.funnelData && stats.charts.funnelData.length > 0) {
    funnelText = stats.charts.funnelData.map((f: any) => 
      `- Etapa: ${f.name}, Valor/Volume: ${f.value}, Perda acumulada: ${f.loss}`
    ).join('\n');
  }

  const systemInstruction = `Você é o Kepler's Assistant, um assistente virtual e consultor de inteligência comercial especializado integrado ao sistema Kepler's Proposal da EcoCarga (SaaS de venda e propostas de carregadores elétricos veiculares). 
Seu tom é extremamente profissional, encorajador, focado em negócios de eletromobilidade, e com excelente escrita técnica comercial.

Aqui está o contexto de dados atual do dashboard do usuário (valores reais obtidos do banco de dados). Utilize-os para responder perguntas sobre vendas, faturamento, clientes, status, gráficos e produtos se o usuário perguntar:
- Total Proposto (Acumulado de tudo): ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalValue)}
- Quantidade Geral de Propostas: ${stats.totalProposals}
- Crescimento das Propostas: +${stats.totalProposalsGrowth}% vs mês anterior
- Crescimento do Faturamento: +${stats.totalValueGrowth}% vs mês anterior
- Taxa de Conversão: ${stats.conversionRate}% (Crescimento de ${stats.conversionRateGrowth}%)
- Ticket Médio por Proposta: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.averageTicket)}
- Potência de Recarga Proposta Acumulada: ${stats.powerInstalled} kW
- Propostas por Status: ${JSON.stringify(stats.proposalsByStatus)}
- Unidades por Modelo de Carregador/Produto: ${JSON.stringify(stats.proposalsByProduct)}
- Principais Clientes: ${JSON.stringify(stats.topClients)}

EVOLUÇÃO MENSAL DAS VENDAS (Exibido no Gráfico de Evolução):
${evolutionText}

FUNIL DE VENDAS ATUAL (Exibido no Gráfico de Funil):
${funnelText}

LISTA DETALHADA DAS PROPOSTAS DO USUÁRIO (Use para responder sobre propostas específicas, clientes específicos, valores ou datas):
${proposalsListText}

CATÁLOGO TÉCNICO DE PRODUTOS ECOCarga (Atualizado em tempo real com o banco de dados):
${catalogText}

DADOS DE BATERIA E FÓRMULAS DE CÁLCULO (Eletromobilidade):
- BYD Dolphin Mini: Bateria de 38 kWh (versão de 5 lugares/maior autonomia) ou 30 kWh. Considere 38 kWh para cálculos padrão.
- BYD Dolphin (padrão): Bateria de 60.5 kWh.
- BYD Seal / GWM Ora 03: ~82 kWh.
- Fórmula de Tempo de Recarga: Tempo (horas) = Capacidade da Bateria (kWh) / Potência do Carregador (kW).
  * Exemplo: BYD Dolphin Mini (38 kWh) em carregador AC de 7kW leva ~5.4 horas de 0% a 100%.
  * Exemplo: Em carregador DC de 40kW, o Dolphin Mini leva ~1 hora de 0% a 100% (ou ~35 min de 20% a 80%, pois a curva de recarga DC desacelera após 80%).
- Dimensionamento de Fluxo (Carros por Dia):
  * Se passam X carros por dia, multiplique X pela energia média consumida (ex: recarga típica de 80% da bateria de 38 kWh = ~30 kWh por carro. 20 carros = 600 kWh de demanda diária total).
  * Divida a demanda de energia (600 kWh) pelas horas operacionais da agência (ex: 10 horas) para encontrar a potência média necessária (~60 kW constante). Sugira carregadores rápidos DC (como 60kW ou múltiplos de 40kW/22kW) para dar conta do fluxo sem criar filas gigantescas.

Diretrizes importantes:
1. Responda em Português do Brasil de forma clara, amigável e objetiva. Use formatação markdown para destacar pontos importantes.
2. Seja preciso ao falar de números e cálculos. Se o usuário pedir para fazer uma média ou dimensionamento (como 20 carros Dolphin Mini), faça a conta detalhada, mostre os passos matemáticos simples e dê a recomendação exata do nosso catálogo (Wallbox 7kW, 22kW, 40kW, 60kW ou 120kW).
3. Seja didático explicando a diferença entre carregamento AC (lento/estacionamento longo) e DC (rápido/giro de carros).
4. Se o usuário fizer perguntas genéricas ou fora do escopo, responda educadamente, mas puxe o assunto de volta para eletromobilidade e vendas de carregadores da EcoCarga.
5. Se o usuário perguntar sobre propostas fechadas ou "aprovadas", analise os dados fornecidos e a lista detalhada de propostas (as que possuem Status: "Concluído") para responder com precisão o número e quem são os clientes!
6. Use todo o contexto fornecido para responder de forma brilhante e precisa, atuando como um consultor comercial de elite da maior SaaS de eletromobilidade.
`;

  try {
    const formattedHistory = formatHistory([...history, { role: 'user', content: query }]);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: formattedHistory,
          systemInstruction: {
            parts: [{ text: systemInstruction }],
          },
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 1500,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Gemini Service API Error]', response.status, errorText);
      throw new Error(`Gemini API returned status ${response.status}`);
    }

    const data = await response.json();
    const assistantText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!assistantText) {
      throw new Error('Empty response from Gemini API');
    }

    return assistantText;
  } catch (error) {
    console.error('[Gemini Service Fallback Triggered]', error);
    // Return mock response as a safe fallback for continuous user operations
    return generateMockResponse(query, stats);
  }
}
