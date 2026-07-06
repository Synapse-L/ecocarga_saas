import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ============================================================
// PROXY DE SEGURANÇA E RATE LIMITING (ANTI-DDOS)
// Migrado de middleware.ts para proxy.ts (Next.js 16+)
// ============================================================

// Mapa em memória para armazenar o histórico de requisições de cada IP
// Chave: IP do cliente, Valor: { count: total de requisições, resetTime: carimbo de data/hora de reinício }
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Configurações do Limite
const LIMIT = 60;            // Máximo de 60 requisições
const WINDOW_MS = 60 * 1000; // Janela de tempo de 1 minuto (60.000 ms)

export function proxy(req: NextRequest) {
  // Aplicar proteção apenas em rotas de API (/api/*) para poupar processamento
  if (req.nextUrl.pathname.startsWith('/api')) {
    // Captura o IP do cliente de cabeçalhos de proxy (como Vercel/Cloudflare) ou IP direto da conexão
    const ip = req.headers.get('x-forwarded-for') || (req as any).ip || '127.0.0.1';
    
    const now = Date.now();
    const rateData = rateLimitMap.get(ip);

    if (!rateData) {
      // Primeira requisição deste IP na janela de tempo
      rateLimitMap.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    } else {
      if (now > rateData.resetTime) {
        // Se a janela de tempo expirou, reinicia o contador e define nova expiração
        rateLimitMap.set(ip, { count: 1, resetTime: now + WINDOW_MS });
      } else {
        // Incrementa o contador de requisições na janela atual
        rateData.count += 1;
        
        // Se ultrapassar o limite, bloqueia a chamada com HTTP 429
        if (rateData.count > LIMIT) {
          const secondsLeft = Math.ceil((rateData.resetTime - now) / 1000);
          return new NextResponse(
            JSON.stringify({ 
              error: 'Muitas requisições. Proteção anti-DDoS ativa. Tente novamente mais tarde.',
              retryAfterSeconds: secondsLeft
            }),
            {
              status: 429,
              headers: {
                'Content-Type': 'application/json',
                'Retry-After': secondsLeft.toString(),
              },
            }
          );
        }
      }
    }
  }

  // Permite que a requisição siga para a API normal se estiver tudo certo
  return NextResponse.next();
}

// Configura o proxy para rodar apenas nas rotas de API
export const config = {
  matcher: '/api/:path*',
};
