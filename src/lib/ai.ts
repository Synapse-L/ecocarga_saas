export async function askGemini(query: string, messages: any[] = [], params: any = {}): Promise<string> {
  // Placeholder implementation for Gemini AI integration.
  // In a real application, this would call the Google Gemini API with proper authentication.
  // For now, we return a static mock response that matches the expected format:
  // Each line: "type - title - description"
  const mockInsights = [
    "success - Desempenho Comercial - Suas conversões cresceram +5.2% nos últimos 30 dias.",
    "info - Taxa de Fechamento por Valor - Projetos acima de R$80.000 têm taxa de fechamento 23% maior.",
    "revenue - Previsão de Fechamento - Você pode fechar aproximadamente R$ " +
      Math.round((params.potentialValue || 0) * 0.45).toLocaleString('pt-BR') + " neste mês."
  ];
  return mockInsights.join('\n');
}
