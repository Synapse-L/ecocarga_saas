/**
 * quote-page-test-runner.mjs
 *
 * Testes da página de valores (src/lib/pdf-quote-page.ts) nos dois formatos de
 * proposta: as salvas ANTES do multi-produto, que não têm o campo `itens`, e as
 * novas, com vários carregadores.
 *
 * Diferente do runner antigo, aqui nada é replicado: o módulo real é compilado
 * e importado, o PDF é gerado de verdade e o que se confere é o texto que
 * acabou desenhado na folha — lido de volta do content stream do arquivo. Um
 * teste que reescreve a lógica do componente só prova que a cópia concorda com
 * ela mesma.
 *
 * Roda diretamente com Node.js:
 *   node src/tests/quote-page-test-runner.mjs
 */

import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { inflateSync } from 'node:zlib';
import { PDFDocument } from 'pdf-lib';

// ─── Compilação ───────────────────────────────────────────────────────────────
// O módulo é TypeScript e usa o atalho `@/`, que só existe dentro do bundler do
// Next. Para rodar no Node puro, compila num diretório temporário e troca o
// atalho por um caminho relativo.

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

// O compilado fica dentro do projeto, e não em %TEMP%, porque de lá o Node não
// enxergaria o node_modules para resolver o `pdf-lib` que o módulo importa.
const cache = join(raiz, 'node_modules', '.cache');
mkdirSync(cache, { recursive: true });
const saida = mkdtempSync(join(cache, 'quote-page-'));

function compilar() {
  // Chama o tsc pelo Node, e não por `npx`: no Windows o npx é um .cmd, que o
  // Node 24 só executa através de um shell — e aí a chamada vira uma linha de
  // comando montada por concatenação, que é justamente o que o aviso DEP0190
  // pede para evitar.
  // Resolvido pelo Node, e não montado à mão: num git worktree o node_modules
  // fica no diretório principal do repositório, não ao lado deste arquivo.
  const tsc = createRequire(import.meta.url).resolve('typescript/bin/tsc');
  let saidaTsc = '';
  try {
    execFileSync(process.execPath, [
      tsc, 'src/lib/pdf-quote-page.ts', 'src/types/proposal.ts',
      '--outDir', saida, '--rootDir', 'src',
      '--target', 'es2022', '--module', 'es2022',
      '--moduleResolution', 'bundler', '--skipLibCheck',
    ], { cwd: raiz, stdio: 'pipe' });
  } catch (e) {
    // O único erro esperado é o `@/types/proposal` não resolvido: o tsc reclama
    // do atalho, mas emite o JavaScript assim mesmo. A conferência de que deu
    // certo é a existência do arquivo, logo abaixo.
    saidaTsc = `${e.stdout ?? ''}${e.stderr ?? ''}${e.message ?? ''}`;
  }

  const arquivo = join(saida, 'lib', 'pdf-quote-page.js');
  let compilado;
  try {
    compilado = readFileSync(arquivo, 'utf8');
  } catch {
    console.error('Não foi possível compilar a página de valores:\n' + saidaTsc);
    rmSync(saida, { recursive: true, force: true });
    process.exit(1);
  }

  writeFileSync(arquivo, compilado.replace("'@/types/proposal'", "'../types/proposal.js'"));
  writeFileSync(join(saida, 'package.json'), '{ "type": "module" }\n');
}

compilar();

const { montarDadosOrcamento, drawQuotePage, gerarOrcamentoBlob } =
  await import(pathToFileURL(join(saida, 'lib', 'pdf-quote-page.js')));
const { lerItens, calcularTotal, sincronizarEspelhos } =
  await import(pathToFileURL(join(saida, 'types', 'proposal.js')));

// ─── Leitura do PDF gerado ────────────────────────────────────────────────────

/** WinAnsi → texto. Igual a latin1, menos a faixa 0x80–0x9F. */
const WINANSI_ALTO = { 0x91: '‘', 0x92: '’', 0x93: '“', 0x94: '”', 0x95: '•', 0x96: '–', 0x97: '—' };
const deWinAnsi = (buf) => {
  let s = '';
  for (const b of buf) s += WINANSI_ALTO[b] ?? String.fromCharCode(b);
  return s;
};

/** Descomprime todos os streams do PDF e devolve o conteúdo concatenado. */
function conteudoDoPdf(bytes) {
  const buf = Buffer.from(bytes);
  const cru = buf.toString('latin1');
  let conteudo = '';
  const re = /stream\r?\n/g;
  let m;
  while ((m = re.exec(cru))) {
    const ini = m.index + m[0].length;
    const fim = cru.indexOf('endstream', ini);
    if (fim < 0) continue;
    try {
      conteudo += inflateSync(buf.subarray(ini, fim)).toString('latin1') + '\n';
    } catch {
      // stream que não é Flate (fonte embutida, imagem) — não interessa aqui
    }
  }
  return conteudo;
}

/** Os textos desenhados, na ordem. O pdf-lib os grava como <hex> Tj. */
const textoDoPdf = (conteudo) =>
  [...conteudo.matchAll(/<([0-9A-Fa-f]+)>\s*Tj/g)].map(m => deWinAnsi(Buffer.from(m[1], 'hex')));

/**
 * A linha de base mais baixa em que algum texto foi escrito — é assim que se
 * detecta estouro de página. Só as matrizes de texto (Tm) entram na conta: as
 * de path (cm) trazem `1 0 0 1 0 0 cm`, um zero que não é posição nenhuma.
 */
const menorY = (conteudo) =>
  Math.min(...[...conteudo.matchAll(/1 0 0 1 [\d.-]+ ([\d.-]+) Tm/g)].map(m => Number(m[1])));

// ─── Cenários ─────────────────────────────────────────────────────────────────

const brl = (v) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const specs = (extra = {}) => ({
  powerSource: '3F+N+T', connectors: 2, connectorType: 'CCS2',
  communication: 'Wi-Fi/4G', model: 'Rise Superfast', ...extra,
});

const comItens = (itens, extra = {}) => sincronizarEspelhos({
  itens, price: 0, productName: '', power: '', technicalSpecs: specs(),
  installments: 10, estimatedSavings: '', observations: '',
  deadline: '20 dias corridos', conditions: 'Cartão de crédito', ...extra,
});

const cenarios = [
  {
    label: 'Proposta ANTIGA — salva antes do multi-produto, sem o campo `itens`',
    data: {
      client: { name: 'Condomínio Solar do Norte', phone: '(11) 99999-1234', address: 'Rua das Palmeiras, 300 — São Paulo/SP' },
      commercial: {
        // Nas antigas não há `itens`: o PDF tem que se virar com os espelhos.
        productName: 'Eco SuperFast DC 40kW', power: '40kW', price: 30966.36,
        installments: 10, estimatedSavings: '', observations: '',
        deadline: '15 dias úteis', conditions: 'Cartão de crédito',
        technicalSpecs: specs(),
      },
      metadata: { templateId: '', emissionDate: '03/08/2026', validityDays: 30 },
    },
    esperado: { qtdItens: 1, total: 30966.36, totalQtd: 1 },
  },
  {
    label: 'Proposta NOVA — 2 carregadores',
    data: {
      client: { name: 'Posto BR Marginal', phone: '(21) 98888-4567', address: 'Av. das Nações, 1000 — Rio de Janeiro/RJ' },
      commercial: comItens([
        { chargerModelId: 'a1', productName: 'Eco SuperFast DC 40kW', power: '40kW', quantity: 2, unitPrice: 18500.00, technicalSpecs: specs() },
        { chargerModelId: 'b2', productName: 'Eco Fast AC 22kW', power: '22kW', quantity: 3, unitPrice: 7250.50, technicalSpecs: specs({ connectors: 1, connectorType: 'Tipo 2 (AC)', model: 'Rise AC Slim' }) },
      ], { observations: 'Frete por conta do cliente.' }),
      metadata: { templateId: '', emissionDate: '03/08/2026', validityDays: 15 },
    },
    esperado: { qtdItens: 2, total: 2 * 18500.00 + 3 * 7250.50, totalQtd: 5 },
  },
  {
    label: 'Proposta NOVA — 3 carregadores (layout compacto)',
    data: {
      client: { name: 'Shopping Iguatemi', phone: '(19) 3232-5555', address: 'Rod. Dom Pedro I, km 123 — Campinas/SP' },
      commercial: comItens([
        { chargerModelId: 'a1', productName: 'Eco Ultra Station 120kW', power: '120kW', quantity: 1, unitPrice: 189900.00, technicalSpecs: specs({ connectors: 4 }) },
        { chargerModelId: 'b2', productName: 'Eco SuperFast DC 40kW', power: '40kW', quantity: 4, unitPrice: 18500.00, technicalSpecs: specs() },
        { chargerModelId: 'c3', productName: 'Eco Fast AC 22kW', power: '22kW', quantity: 10, unitPrice: 7250.50, technicalSpecs: specs({ connectors: 1 }) },
      ], { installments: 12, conditions: 'Financiamento' }),
      metadata: { templateId: '', emissionDate: '03/08/2026', validityDays: 45 },
    },
    esperado: { qtdItens: 3, total: 189900.00 + 4 * 18500.00 + 10 * 7250.50, totalQtd: 15 },
  },
  {
    label: 'Proposta NOVA — item com preço zerado e quantidade alta',
    data: {
      client: { name: 'Cliente Borda', phone: '', address: '' },
      commercial: comItens([
        { chargerModelId: 'a1', productName: 'Eco Fast AC 22kW', power: '22kW', quantity: 12, unitPrice: 7250.50, technicalSpecs: specs() },
        { chargerModelId: 'b2', productName: 'Cabo extra (cortesia)', power: '', quantity: 3, unitPrice: 0, technicalSpecs: specs({ connectors: 1 }) },
      ]),
      metadata: { templateId: '', emissionDate: '03/08/2026', validityDays: 15 },
    },
    esperado: { qtdItens: 2, total: 12 * 7250.50, totalQtd: 15 },
  },
];

// ─── Runner ───────────────────────────────────────────────────────────────────

let falhas = 0;
const linhas = [];
const ok = (cond, msg, detalhe = '') => {
  linhas.push(`   ${cond ? '✓' : '✗'}  ${msg}${!cond && detalhe ? ` — ${detalhe}` : ''}`);
  if (!cond) falhas++;
};

console.log('\n' + '═'.repeat(72));
console.log('  📄  PÁGINA DE VALORES — proposta antiga vs. multi-produto');
console.log('═'.repeat(72));

for (const { label, data, esperado } of cenarios) {
  linhas.length = 0;

  const dados = await montarDadosOrcamento(data, 'João Silva');

  ok(dados.itens.length === esperado.qtdItens,
    `${esperado.qtdItens} item(ns) na tabela`, `veio ${dados.itens.length}`);

  const soma = dados.itens.reduce((s, i) => s + i.precoUnitario * i.quantidade, 0);
  ok(Math.abs(soma - esperado.total) < 0.005,
    `soma dos subtotais = ${brl(esperado.total)}`, `veio ${brl(soma)}`);
  ok(Math.abs(calcularTotal(lerItens(data.commercial)) - soma) < 0.005,
    'calcularTotal() bate com a soma dos subtotais');
  ok(Math.abs(data.commercial.price - soma) < 0.005,
    'commercial.price — o total lido em 13 lugares — bate com a soma',
    `price=${brl(data.commercial.price)} soma=${brl(soma)}`);

  const doc = await PDFDocument.create();
  await drawQuotePage(doc, dados);
  const bytes = await doc.save();
  const conteudo = conteudoDoPdf(bytes);
  const texto = textoDoPdf(conteudo);
  const juntos = texto.join('\n');

  ok(doc.getPageCount() === 1, 'uma página');
  ok(bytes.length < 60_000, `arquivo vetorial leve (${(bytes.length / 1024).toFixed(1)} KB)`);

  for (const i of dados.itens) {
    const sub = brl(i.precoUnitario * i.quantidade);
    ok(texto.includes(sub), `subtotal ${sub} desenhado na linha do item`);
  }
  ok(juntos.includes(`R$ ${brl(esperado.total)}`),
    `total R$ ${brl(esperado.total)} desenhado no quadro de valores`);
  ok(texto.some(t => t.includes(`Quantidade total: ${esperado.totalQtd}`)),
    `"Quantidade total: ${esperado.totalQtd}"`);

  const parcelas = data.commercial.installments;
  ok(juntos.includes(`${parcelas}x de R$ ${brl(esperado.total / parcelas)}`),
    `parcelamento ${parcelas}x sobre o mesmo total`);

  ok(texto.some(t => t.startsWith('R. Francisca Maria de Abrantes, S/N')),
    'endereço do emitente sai inteiro, sem corte');
  ok(!juntos.includes('…'), 'nenhum texto truncado com reticências');
  if (data.client.name) ok(texto.includes(data.client.name), 'nome do cliente');

  ok(menorY(conteudo) >= 34, 'a última linha ainda cai dentro da margem',
    `menor y = ${menorY(conteudo).toFixed(1)}`);

  const blob = await gerarOrcamentoBlob(data, 'João Silva');
  ok(blob.size > 0, 'gerarOrcamentoBlob(), o caminho da tela de revisão, funciona');

  console.log(`\n${linhas.some(l => l.includes('✗')) ? '❌' : '✅'}  ${label}`);
  linhas.forEach(l => console.log(l));
}

// ─── Quantos produtos cabem na folha ──────────────────────────────────────────
// A página é uma folha A4 só, sem paginação: a tabela cresce com a quantidade
// de itens e em algum ponto passa da margem. Este bloco mede onde é esse ponto,
// para que uma mudança no layout que o reduza apareça aqui.

const CABEM = 6;

async function menorYCom(n) {
  const itens = Array.from({ length: n }, (_, i) => ({
    chargerModelId: `m${i}`, productName: `Carregador ${i + 1}`, power: '40kW',
    quantity: 2, unitPrice: 18500, technicalSpecs: specs(),
  }));
  const doc = await PDFDocument.create();
  await drawQuotePage(doc, await montarDadosOrcamento({
    client: { name: 'Cliente Teste', phone: '(11) 90000-0000', address: 'Rua A, 1' },
    commercial: comItens(itens),
    metadata: { templateId: '', emissionDate: '03/08/2026', validityDays: 15 },
  }, 'João Silva'));
  return menorY(conteudoDoPdf(await doc.save()));
}

linhas.length = 0;
const yCabe = await menorYCom(CABEM);
const yEstoura = await menorYCom(CABEM + 1);
ok(yCabe >= 34, `${CABEM} produtos ainda cabem dentro da margem`, `menor y = ${yCabe.toFixed(1)}`);
ok(yEstoura < 34, `${CABEM + 1} produtos passam da margem, como esperado`,
  `menor y = ${yEstoura.toFixed(1)} — se agora cabe, aumente CABEM`);
console.log(`\n${linhas.some(l => l.includes('✗')) ? '❌' : '✅'}  Capacidade da folha`);
linhas.forEach(l => console.log(l));
console.log(`   ℹ️   a partir de ${CABEM + 1} produtos a página transborda — precisaria de paginação.`);

rmSync(saida, { recursive: true, force: true });

console.log('\n' + '─'.repeat(72));
if (falhas > 0) {
  console.log(`  ⚠️  ${falhas} verificação(ões) falharam.\n`);
  process.exit(1);
}
console.log('  🎉  Página de valores correta nos dois formatos de proposta.');
console.log('═'.repeat(72) + '\n');
