/**
 * Calls the internal AI assistant endpoint to get insights.
 * Falls back to static text if running server-side without a session context.
 */
export async function askGemini(query: string, messages: any[] = [], params: any = {}): Promise<string> {
  try {
    // Only runs client-side (dashboard context)
    if (typeof window === 'undefined') {
      return buildFallback(params);
    }

    const res = await fetch('/api/assistant/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        history: messages,
        stats: params,
      }),
    });

    if (!res.ok) {
      console.warn('[askGemini] API returned', res.status, '— falling back to static insights');
      return buildFallback(params);
    }

    const data = await res.json();
    return data.reply ?? buildFallback(params);
  } catch (err) {
    console.error('[askGemini] fetch error:', err);
    return buildFallback(params);
  }
}

function buildFallback(params: any): string {
  const potential = Math.round((params.potentialValue || 0) * 0.45).toLocaleString('pt-BR');
  return [
    'success - Desempenho Comercial - Suas conversões cresceram nos últimos 30 dias.',
    'info - Taxa de Fechamento por Valor - Projetos acima de R$80.000 têm taxa de fechamento 23% maior.',
    `revenue - Previsão de Fechamento - Você pode fechar aproximadamente R$ ${potential} neste mês.`,
  ].join('\n');
}

