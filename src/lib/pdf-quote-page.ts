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
  detalhe: string;
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

/** Baixa a imagem do produto. Falha nunca derruba a proposta — só fica sem foto. */
const baixarImagem = async (url?: string) => {
  if (!url) return null;
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    const bytes = new Uint8Array(await r.arrayBuffer());
    const tipo: 'png' | 'jpg' =
      bytes[0] === 0xff && bytes[1] === 0xd8 ? 'jpg' : 'png';
    return { bytes, tipo };
  } catch {
    return null;
  }
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
      const detalhe = [
        s.powerSource,
        s.connectors ? `${s.connectors}x ${s.connectorType || 'conector'}` : null,
        s.communication,
        s.model,
      ].filter(Boolean).join(' · ');

      return {
        descricao: [i.productName, i.power].filter(Boolean).join(' — '),
        detalhe,
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

  // Colunas: #, foto, descrição, qtd, preço un., total
  const cx = {
    num: MARGEM + 2,
    foto: MARGEM + 16,
    desc: MARGEM + 54,
    qtd: MARGEM + LARGURA - 150,
    unit: MARGEM + LARGURA - 78,
    total: MARGEM + LARGURA - 2,
  };
  const larguraDesc = cx.qtd - cx.desc - 10;

  y -= 6;
  page.drawLine({ start: { x: MARGEM, y }, end: { x: MARGEM + LARGURA, y }, thickness: 0.7, color: COR.linha });
  y -= 10;
  txt('#', cx.num, y, { size: 7, cor: COR.suave });
  txt('Descrição', cx.desc, y, { size: 7, cor: COR.suave });
  txt('Qtd.', cx.qtd, y, { size: 7, cor: COR.suave });
  txt('Preço un.', cx.unit + 44, y, { size: 7, cor: COR.suave, alinhar: 'dir' });
  txt('Total', cx.total, y, { size: 7, cor: COR.suave, alinhar: 'dir' });
  y -= 5;
  page.drawLine({ start: { x: MARGEM, y }, end: { x: MARGEM + LARGURA, y }, thickness: 0.7, color: COR.linha });

  // Modo adaptativo: poucos itens ganham foto maior e mais respiro.
  const compacto = d.itens.length > 2;
  const hLinha = compacto ? 40 : 62;
  const fotoW = compacto ? 30 : 40;
  const fotoH = compacto ? 34 : 54;

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
    txt(it.detalhe, cx.desc, topo - 22, { size: 7, cor: COR.suave, maxW: larguraDesc });

    txt(String(it.quantidade), cx.qtd + 8, topo - 12, { size: 8, alinhar: 'dir' });
    txt(brl(it.precoUnitario), cx.unit + 44, topo - 12, { size: 8, alinhar: 'dir' });
    txt(brl(subtotal), cx.total, topo - 12, { size: 8, font: neg, alinhar: 'dir' });

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
