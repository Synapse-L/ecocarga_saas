import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from 'pdf-lib';
import { ProposalData, lerItens } from '@/types/proposal';

/**
 * Página de orçamento desenhada DIRETO no PDF, com primitivas do pdf-lib.
 *
 * Diferente da capa e da antiga página 6, aqui não há html2canvas: nada é
 * fotografado. Texto sai vetorial e selecionável, a nitidez independe de DPI, e
 * nenhuma das limitações da biblioteca de captura se aplica (filter, object-fit,
 * gradiente sub-pixel, artefato de JPEG). O peso cai de ~2 MB para dezenas de KB.
 *
 * Layout inspirado no padrão de orçamento B2B: cabeçalho do emitente, bloco de
 * identificação em duas colunas, tabela de produtos, totais à direita e
 * condições de fornecimento.
 */

// ─── Identificação do emitente ────────────────────────────────────────────────
// TODO confirmar com o cliente: razão social exata e número do logradouro.
export const EMITENTE = {
  nome: 'ECOCARGA',
  cnpj: '55.412.542/0001-63',
  endereco: 'R. Francisca Maria de Abrantes — Estação, Sousa/PB',
  cep: '58807-305',
  telefone: '(11) 91283-1823',
  email: 'suporte@ecocarga.com.br',
  site: 'ecocargamobi.com.br',
};

// ─── Geometria da folha ───────────────────────────────────────────────────────
const A4 = { w: 595.28, h: 841.89 };
const MARGEM = 34;            // ~12 mm
const LARGURA = A4.w - MARGEM * 2;

// ─── Paleta (sólidas: PDF nativo não tem degradê) ────────────────────────────
const COR = {
  texto: rgb(0.10, 0.10, 0.10),
  suave: rgb(0.42, 0.42, 0.42),
  linha: rgb(0.60, 0.60, 0.60),
  linhaFina: rgb(0.86, 0.86, 0.86),
  verde: rgb(0.043, 0.239, 0.173),   // #0b3d2c
  branco: rgb(1, 1, 1),
};

export type ItemOrcamento = {
  descricao: string;
  /** Uma especificação por posição — cada uma vira uma linha própria na tabela. */
  detalhes: string[];
  quantidade: number;
  precoUnitario: number;
  imagemBytes?: Uint8Array | null;
  imagemTipo?: 'png' | 'jpg';
};

export type DadosOrcamento = {
  cliente: { nome: string; telefone: string; endereco: string };
  emissao: string;
  validadeDias: number;
  prazoEntrega: string;
  condicaoPagamento: string;
  vendedor: string;
  itens: ItemOrcamento[];
  parcelas: number;
  mostrarAVista: boolean;
  mostrarParcelado: boolean;
  observacoes?: string;
};

const brl = (v: number) =>
  v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

type FotoProduto = { bytes: Uint8Array; tipo: 'png' | 'jpg' } | null;

/**
 * Cache das fotos por URL. Sem ele a mesma imagem era rebaixada a cada
 * visualização e a cada download, mesmo quando o vendedor abre a mesma proposta
 * várias vezes seguidas.
 */
const cacheFotos = new Map<string, FotoProduto>();

const LIMITE_IMAGEM_MS = 15000;

/**
 * Baixa a foto do produto. Falha nunca derruba a proposta — só fica sem foto.
 *
 * O tempo limite é essencial: a foto é opcional, mas sem AbortController um
 * armazenamento lento ou inacessível travava a geração inteira do PDF, deixando
 * a interface em carregamento infinito.
 */
const baixarImagem = async (url?: string): Promise<FotoProduto> => {
  if (!url) return null;
  if (cacheFotos.has(url)) return cacheFotos.get(url)!;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), LIMITE_IMAGEM_MS);
  let resultado: FotoProduto = null;
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    if (r.ok) {
      const bytes = new Uint8Array(await r.arrayBuffer());
      const tipo: 'png' | 'jpg' = bytes[0] === 0xff && bytes[1] === 0xd8 ? 'jpg' : 'png';
      resultado = { bytes, tipo };
    } else {
      console.warn(`Foto do produto indisponível (HTTP ${r.status}):`, url);
    }
  } catch (e: any) {
    console.warn(
      e?.name === 'AbortError'
        ? `Foto do produto demorou mais de ${LIMITE_IMAGEM_MS / 1000}s; seguindo sem ela.`
        : 'Falha ao baixar a foto do produto; seguindo sem ela.',
      url
    );
  } finally {
    clearTimeout(timer);
  }

  cacheFotos.set(url, resultado);
  return resultado;
};

/**
 * Traduz a proposta salva no banco para o formato da página de orçamento.
 * Usa lerItens(), então funciona igual para propostas antigas (um item) e novas.
 */
export async function montarDadosOrcamento(
  data: ProposalData,
  vendedor: string
): Promise<DadosOrcamento> {
  const itensBrutos = lerItens(data.commercial);

  const itens: ItemOrcamento[] = await Promise.all(
    itensBrutos.map(async (i) => {
      const img = await baixarImagem(i.imageUrl);
      const s = i.technicalSpecs || ({} as any);
      // Uma especificação por linha, com rótulo. Antes iam todas concatenadas
      // numa linha só, o que espremia a coluna de descrição e empurrava as
      // colunas de preço uma sobre a outra.
      const detalhes = [
        s.powerSource   ? `Fonte de energia: ${s.powerSource}` : null,
        s.connectors    ? `Conectores: ${s.connectors}` : null,
        s.connectorType ? `Tipo do conector: ${s.connectorType}` : null,
        s.communication ? `Comunicação: ${s.communication}` : null,
        s.model         ? `Marca/Modelo: ${s.model}` : null,
      ].filter(Boolean) as string[];

      return {
        descricao: [i.productName, i.power].filter(Boolean).join(' — '),
        detalhes,
        quantidade: Number(i.quantity) || 1,
        precoUnitario: Number(i.unitPrice) || 0,
        imagemBytes: img?.bytes ?? null,
        imagemTipo: img?.tipo,
      };
    })
  );

  return {
    cliente: {
      nome: data.client?.name || '',
      telefone: data.client?.phone || '',
      endereco: data.client?.address || '',
    },
    emissao: data.metadata?.emissionDate || new Date().toLocaleDateString('pt-BR'),
    validadeDias: data.metadata?.validityDays ?? 15,
    prazoEntrega: data.commercial?.deadline || '',
    condicaoPagamento: data.commercial?.conditions || '',
    vendedor,
    itens,
    parcelas: data.commercial?.installments || 10,
    mostrarAVista: data.commercial?.showCashPrice !== false,
    mostrarParcelado: data.commercial?.showInstallments !== false,
    observacoes: data.commercial?.observations || undefined,
  };
}

/**
 * Gera a página de orçamento sozinha, como Blob.
 *
 * É o que a tela de revisão exibe: em vez de renderizar um HTML "parecido" com
 * o PDF, mostra o PDF de verdade num iframe. Assim a pré-visualização e o
 * arquivo final não podem divergir — que foi a origem de boa parte dos
 * problemas do formato anterior.
 */
export async function gerarOrcamentoBlob(data: ProposalData, vendedor: string): Promise<Blob> {
  const doc = await PDFDocument.create();
  await drawQuotePage(doc, await montarDadosOrcamento(data, vendedor));
  const bytes = await doc.save();
  return new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
}

/** Corta o texto para caber em `maxW`, terminando em reticências. */
const cortar = (txt: string, font: PDFFont, size: number, maxW: number) => {
  if (font.widthOfTextAtSize(txt, size) <= maxW) return txt;
  let s = txt;
  while (s.length > 1 && font.widthOfTextAtSize(s + '…', size) > maxW) s = s.slice(0, -1);
  return s + '…';
};

/** Retângulo só com contorno. */
const caixa = (p: PDFPage, x: number, y: number, w: number, h: number, cor = COR.linha) =>
  p.drawRectangle({ x, y, width: w, height: h, borderColor: cor, borderWidth: 0.7 });

export async function drawQuotePage(doc: PDFDocument, d: DadosOrcamento): Promise<PDFPage> {
  const page = doc.addPage([A4.w, A4.h]);
  const reg = await doc.embedFont(StandardFonts.Helvetica);
  const neg = await doc.embedFont(StandardFonts.HelveticaBold);

  const txt = (
    s: string, x: number, y: number,
    o: { size?: number; font?: PDFFont; cor?: any; maxW?: number; alinhar?: 'esq' | 'dir' } = {}
  ) => {
    const size = o.size ?? 8;
    const font = o.font ?? reg;
    const corpo = o.maxW ? cortar(s, font, size, o.maxW) : s;
    const px = o.alinhar === 'dir' ? x - font.widthOfTextAtSize(corpo, size) : x;
    page.drawText(corpo, { x: px, y, size, font, color: o.cor ?? COR.texto });
    return font.widthOfTextAtSize(corpo, size);
  };

  const rotulo = (r: string, v: string, x: number, y: number, maxW: number, vFont = reg) => {
    const w = txt(r, x, y, { size: 7.5, cor: COR.suave });
    txt(v, x + w + 3, y, { size: 7.5, font: vFont, maxW: maxW - w - 3 });
  };

  let y = A4.h - MARGEM;

  // ── 1. Cabeçalho do emitente ────────────────────────────────────────────────
  const hCab = 46;
  y -= hCab;
  caixa(page, MARGEM, y, LARGURA, hCab);
  {
    let ly = y + hCab - 12;
    txt(EMITENTE.nome, MARGEM + 8, ly, { size: 9, font: neg });
    ly -= 10;
    rotulo('CNPJ:', EMITENTE.cnpj, MARGEM + 8, ly, 260);
    ly -= 9.5;
    rotulo('Endereço:', `${EMITENTE.endereco} — CEP ${EMITENTE.cep}`, MARGEM + 8, ly, 330);
    ly -= 9.5;
    rotulo('Contato:', `${EMITENTE.telefone} · ${EMITENTE.email}`, MARGEM + 8, ly, 330);

    txt('EcoCarga', MARGEM + LARGURA - 8, y + hCab - 14, {
      size: 12, font: neg, cor: COR.verde, alinhar: 'dir',
    });
    txt(EMITENTE.site, MARGEM + LARGURA - 8, y + hCab - 25, {
      size: 7, cor: COR.suave, alinhar: 'dir',
    });
  }

  // ── 2. Faixa do tipo de documento ───────────────────────────────────────────
  const hFaixa = 15;
  y -= hFaixa;
  caixa(page, MARGEM, y, LARGURA, hFaixa);
  rotulo('Tipo do documento:', 'Proposta comercial', MARGEM + 8, y + 4.5, 300);

  // ── 3. Identificação, duas colunas ──────────────────────────────────────────
  const hId = 56;
  y -= hId;
  caixa(page, MARGEM, y, LARGURA, hId);
  {
    const colE = MARGEM + 8;
    const colD = MARGEM + LARGURA / 2 + 4;
    const larg = LARGURA / 2 - 14;
    let ly = y + hId - 12;

    rotulo('Cliente:', d.cliente.nome || '—', colE, ly, larg, neg);
    rotulo('Emissão:', d.emissao, colD, ly, larg);
    ly -= 10.5;
    rotulo('Endereço:', d.cliente.endereco || '—', colE, ly, larg);
    rotulo('Validade:', `${d.validadeDias} dias`, colD, ly, larg);
    ly -= 10.5;
    rotulo('Telefone:', d.cliente.telefone || '—', colE, ly, larg);
    rotulo('Prazo de entrega:', d.prazoEntrega || '—', colD, ly, larg);
    ly -= 10.5;
    rotulo('Vendedor:', d.vendedor || '—', colE, ly, larg);
    rotulo('Pagamento:', d.condicaoPagamento || '—', colD, ly, larg);
  }

  // ── 4. Tabela de produtos ───────────────────────────────────────────────────
  y -= 16;
  txt('PRODUTOS', MARGEM, y, { size: 7.5, font: neg, cor: COR.suave });

  // ── Colunas ───────────────────────────────────────────────────────────────
  // Definidas pela BORDA DIREITA, porque os três números são alinhados à
  // direita. A versão anterior deixava só 32 pt entre as bordas de "preço un."
  // e "total", mas um valor como 171.626,36 ocupa ~44 pt em Helvetica 8 — daí
  // a sobreposição. Agora cada coluna tem largura própria e folga explícita.
  const GAP = 10;
  const W_TOTAL = 62;
  const W_UNIT = 62;
  const W_QTD = 26;

  const dirTotal = MARGEM + LARGURA;
  const dirUnit  = dirTotal - W_TOTAL - GAP;
  const dirQtd   = dirUnit  - W_UNIT  - GAP;

  const cx = {
    num: MARGEM + 2,
    foto: MARGEM + 16,
    desc: MARGEM + 56,
  };
  // A descrição termina onde a coluna de quantidade começa.
  const larguraDesc = (dirQtd - W_QTD) - cx.desc - GAP;

  y -= 6;
  page.drawLine({ start: { x: MARGEM, y }, end: { x: MARGEM + LARGURA, y }, thickness: 0.7, color: COR.linha });
  y -= 10;
  txt('#', cx.num, y, { size: 7, cor: COR.suave });
  txt('Descrição', cx.desc, y, { size: 7, cor: COR.suave });
  txt('Qtd.', dirQtd, y, { size: 7, cor: COR.suave, alinhar: 'dir' });
  txt('Preço un.', dirUnit, y, { size: 7, cor: COR.suave, alinhar: 'dir' });
  txt('Total', dirTotal, y, { size: 7, cor: COR.suave, alinhar: 'dir' });
  y -= 5;
  page.drawLine({ start: { x: MARGEM, y }, end: { x: MARGEM + LARGURA, y }, thickness: 0.7, color: COR.linha });

  // Altura da linha acompanha a quantidade de especificações, já que cada uma
  // ocupa uma linha própria. Com poucos itens a foto é maior.
  const compacto = d.itens.length > 2;
  const H_ESPEC = compacto ? 9 : 10;      // altura de cada linha de especificação
  const fotoW = compacto ? 34 : 44;
  const maxEspecs = Math.max(1, ...d.itens.map(i => i.detalhes.length));
  const hLinha = 16 + maxEspecs * H_ESPEC + 8;
  const fotoH = Math.min(hLinha - 12, compacto ? 46 : 62);

  let totalGeral = 0;
  let totalQtd = 0;

  for (let i = 0; i < d.itens.length; i++) {
    const it = d.itens[i];
    const subtotal = it.precoUnitario * it.quantidade;
    totalGeral += subtotal;
    totalQtd += it.quantidade;

    const topo = y;
    y -= hLinha;

    txt(String(i + 1), cx.num, topo - 12, { size: 7.5, cor: COR.suave });

    if (it.imagemBytes) {
      try {
        const img = it.imagemTipo === 'jpg'
          ? await doc.embedJpg(it.imagemBytes)
          : await doc.embedPng(it.imagemBytes);
        // contain: preserva proporção dentro da caixa reservada
        const k = Math.min(fotoW / img.width, fotoH / img.height);
        const w = img.width * k, h = img.height * k;
        page.drawImage(img, {
          x: cx.foto + (fotoW - w) / 2,
          y: topo - 8 - h,
          width: w, height: h,
        });
      } catch {
        // imagem inválida não pode derrubar a proposta inteira
      }
    }

    txt(it.descricao, cx.desc, topo - 12, { size: 8.5, font: neg, maxW: larguraDesc });

    // Uma especificação por linha, com espaçamento uniforme.
    let ey = topo - 12 - H_ESPEC - 2;
    for (const esp of it.detalhes) {
      txt(esp, cx.desc, ey, { size: 7, cor: COR.suave, maxW: larguraDesc });
      ey -= H_ESPEC;
    }

    txt(String(it.quantidade), dirQtd, topo - 12, { size: 8, alinhar: 'dir' });
    txt(brl(it.precoUnitario), dirUnit, topo - 12, { size: 8, alinhar: 'dir' });
    txt(brl(subtotal), dirTotal, topo - 12, { size: 8, font: neg, alinhar: 'dir' });

    const ultimo = i === d.itens.length - 1;
    page.drawLine({
      start: { x: MARGEM, y }, end: { x: MARGEM + LARGURA, y },
      thickness: ultimo ? 0.7 : 0.4,
      color: ultimo ? COR.linha : COR.linhaFina,
    });
  }

  // ── 5. Totais ───────────────────────────────────────────────────────────────
  y -= 10;
  txt(`Quantidade total: ${totalQtd} ${totalQtd === 1 ? 'item' : 'itens'}`, MARGEM, y - 8, {
    size: 7.5, cor: COR.suave,
  });

  const boxW = 200;
  const boxX = MARGEM + LARGURA - boxW;
  const hTot = 14 + (d.mostrarAVista ? 22 : 0) + (d.mostrarParcelado ? 14 : 0);
  const topoTot = y;
  y -= hTot;
  caixa(page, boxX, y, boxW, hTot);

  {
    let ly = topoTot - 10;
    txt('Valor total', boxX + 8, ly, { size: 7.5, cor: COR.suave });
    txt(`R$ ${brl(totalGeral)}`, boxX + boxW - 8, ly, { size: 8, alinhar: 'dir' });

    if (d.mostrarAVista) {
      ly -= 6;
      page.drawRectangle({ x: boxX, y: ly - 16, width: boxW, height: 22, color: COR.verde });
      txt('À vista', boxX + 8, ly - 9, { size: 8, cor: COR.branco });
      txt(`R$ ${brl(totalGeral)}`, boxX + boxW - 8, ly - 10, {
        size: 11, font: neg, cor: COR.branco, alinhar: 'dir',
      });
      ly -= 22;
    }

    if (d.mostrarParcelado) {
      ly -= 10;
      txt('Parcelado', boxX + 8, ly, { size: 7.5, cor: COR.suave });
      txt(`${d.parcelas}x de R$ ${brl(totalGeral / d.parcelas)}`, boxX + boxW - 8, ly, {
        size: 8, alinhar: 'dir',
      });
    }
  }

  // ── 6. Condições de fornecimento ────────────────────────────────────────────
  const condicoes = [
    `Validade da proposta: ${d.validadeDias} dias a partir da emissão.`,
    `Prazo de entrega: ${d.prazoEntrega || 'a combinar'} após confirmação do pedido.`,
    d.mostrarParcelado
      ? `Pagamento à vista ou em até ${d.parcelas}x no cartão de crédito, com acréscimo de juros.`
      : 'Pagamento à vista.',
    'Valores não incluem frete, calculado conforme o endereço de entrega.',
    'Instalação elétrica, adequações técnicas e infraestrutura do eletroposto são de responsabilidade do cliente.',
    'Impostos inclusos conforme legislação vigente na data de emissão da nota fiscal.',
    'Trocas e cancelamentos mediante aprovação do departamento comercial.',
    ...(d.observacoes ? [d.observacoes] : []),
  ];

  y -= 14;
  const hCond = 16 + condicoes.length * 9.5 + 6;
  y -= hCond;
  caixa(page, MARGEM, y, LARGURA, hCond);
  {
    let ly = y + hCond - 11;
    txt('CONDIÇÕES DE FORNECIMENTO', MARGEM + 8, ly, { size: 7, font: neg, cor: COR.suave });
    ly -= 11;
    condicoes.forEach((c, i) => {
      txt(`${i + 1}.`, MARGEM + 8, ly, { size: 7, cor: COR.suave });
      txt(c, MARGEM + 20, ly, { size: 7, maxW: LARGURA - 30 });
      ly -= 9.5;
    });
  }

  return page;
}
