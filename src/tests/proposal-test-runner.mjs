/**
 * proposal-test-runner.mjs
 *
 * Testes em looping — verifica se todas as variáveis do formulário
 * são corretamente mapeadas para os componentes ProposalCover e ProposalPage6.
 *
 * Roda diretamente com Node.js:
 *   node src/tests/proposal-test-runner.mjs
 */

// ─── Simulação das funções internas dos componentes ───────────────────────────
// Replica EXATAMENTE a lógica de extração de variáveis dos componentes TSX.

function extractPage6Vars(data) {
  return {
    emissionDate:  data.metadata?.emissionDate  || new Date().toLocaleDateString('pt-BR'),
    validityDays:  data.metadata?.validityDays  ?? 15,
    price:         data.commercial?.price        ?? 0,
    installments:  data.commercial?.installments ?? 1,
    conditions:    data.commercial?.conditions   || '',
    observations:  data.commercial?.observations?.trim() || '',
    deadline:      data.commercial?.deadline?.trim()     || '',
    productName:   data.commercial?.productName?.trim()  || '—',
    power:         data.commercial?.power?.trim()        || '—',
    powerSource:   data.commercial?.technicalSpecs?.powerSource?.trim()  || '—',
    connectors:    data.commercial?.technicalSpecs?.connectors            ?? 1,
    connectorType: data.commercial?.technicalSpecs?.connectorType?.trim() || '—',
    communication: data.commercial?.technicalSpecs?.communication?.trim() || '—',
    model:         data.commercial?.technicalSpecs?.model?.trim()         || '—',
    // Calculados
    installmentValue: data.commercial?.installments > 1
      ? (data.commercial.price / data.commercial.installments)
      : null,
    techRowsCount: [
      data.commercial?.technicalSpecs?.powerSource,
      data.commercial?.technicalSpecs?.connectors,
      data.commercial?.technicalSpecs?.connectorType,
      data.commercial?.technicalSpecs?.communication,
      data.commercial?.technicalSpecs?.model,
      data.commercial?.deadline?.trim() || null,   // só aparece se preenchido
    ].filter(v => v !== null && v !== undefined && v !== '').length,
    formattedPrice: (data.commercial?.price ?? 0).toLocaleString('pt-BR', {
      minimumFractionDigits: 2, maximumFractionDigits: 2,
    }),
  };
}

function extractCoverVars(data, representativeName) {
  return {
    clientName:    data.client?.name?.trim()    || '—',
    consultantName: representativeName?.trim()  || 'Consultor Comercial',
    emissionDate:  data.metadata?.emissionDate  || new Date().toLocaleDateString('pt-BR'),
    validityDays:  data.metadata?.validityDays  ?? 15,
    address:       data.client?.address?.trim() || '',
  };
}

// ─── Casos de teste ────────────────────────────────────────────────────────────

const cases = [
  // ── 1: Proposta completa padrão ─────────────────────────────────────────────
  {
    label: 'Cenário 1 — Proposta completa padrão',
    data: {
      client: { name: 'Condomínio Solar do Norte', phone: '(11) 99999-1234', address: 'Rua das Palmeiras, 300 - SP' },
      commercial: {
        productName: 'Eco SuperFast DC 40kW', power: '40kW', price: 30966.36,
        installments: 10, estimatedSavings: 'Recarga ultra-rápida',
        observations: 'Instalação elétrica não inclusa.', deadline: '15 dias úteis',
        conditions: 'Cartão de crédito',
        technicalSpecs: { powerSource: '3F+N+T', connectors: 2, connectorType: 'CCS2', communication: 'Bluetooth/Wi-Fi/RFID/4G', model: 'Rise Superfast' },
      },
      metadata: { templateId: '', emissionDate: '23/06/2026', validityDays: 30 },
    },
    representative: 'João Silva',
    checks: {
      // Page6
      'page6.productName':   'Eco SuperFast DC 40kW',
      'page6.power':         '40kW',
      'page6.price':         30966.36,
      'page6.installments':  10,
      'page6.conditions':    'Cartão de crédito',
      'page6.observations':  'Instalação elétrica não inclusa.',
      'page6.deadline':      '15 dias úteis',
      'page6.validityDays':  30,
      'page6.emissionDate':  '23/06/2026',
      'page6.powerSource':   '3F+N+T',
      'page6.connectors':    2,
      'page6.connectorType': 'CCS2',
      'page6.communication': 'Bluetooth/Wi-Fi/RFID/4G',
      'page6.model':         'Rise Superfast',
      'page6.techRowsCount': 6,          // 5 specs + prazo
      // Cover
      'cover.clientName':    'Condomínio Solar do Norte',
      'cover.consultantName':'João Silva',
      'cover.emissionDate':  '23/06/2026',
      'cover.validityDays':  30,
      'cover.address':       'Rua das Palmeiras, 300 - SP',
    },
  },

  // ── 2: À vista, sem observações ──────────────────────────────────────────────
  {
    label: 'Cenário 2 — À vista, sem observações, sem prazo',
    data: {
      client: { name: 'Posto BR Marginal', phone: '(21) 98888-4567', address: 'Av. das Nações, 1000 - RJ' },
      commercial: {
        productName: 'Eco Fast AC 22kW', power: '22kW', price: 12500.00,
        installments: 1, estimatedSavings: '', observations: '', deadline: '',
        conditions: 'PIX',
        technicalSpecs: { powerSource: '1F+N+T', connectors: 1, connectorType: 'Tipo 2 (AC)', communication: 'Wi-Fi/RFID', model: 'Rise AC Slim' },
      },
      metadata: { templateId: '', emissionDate: '23/06/2026', validityDays: 7 },
    },
    representative: 'Maria Souza',
    checks: {
      'page6.productName':   'Eco Fast AC 22kW',
      'page6.price':         12500.00,
      'page6.installments':  1,
      'page6.conditions':    'PIX',
      'page6.observations':  '',       // deve ficar oculto (string vazia)
      'page6.deadline':      '',       // linha "Prazo" NÃO deve aparecer
      'page6.techRowsCount': 5,        // 5 specs, sem prazo
      'page6.installmentValue': null,  // à vista = sem parcelas
      'cover.clientName':    'Posto BR Marginal',
      'cover.consultantName':'Maria Souza',
    },
  },

  // ── 3: Preço zerado ───────────────────────────────────────────────────────────
  {
    label: 'Cenário 3 — Preço zerado (borda)',
    data: {
      client: { name: 'Teste Borda', phone: '(11) 91111-0000', address: 'Rua Teste, 1' },
      commercial: {
        productName: 'Modelo Teste', power: '7kW', price: 0, installments: 1,
        estimatedSavings: '', observations: '', deadline: '30 dias', conditions: 'À vista',
        technicalSpecs: { powerSource: '1F+N+T', connectors: 1, connectorType: 'Tipo 1 (AC)', communication: 'Wi-Fi', model: 'Eco Basic' },
      },
      metadata: { templateId: '', emissionDate: '23/06/2026', validityDays: 15 },
    },
    representative: undefined,
    checks: {
      'page6.price':          0,
      'page6.formattedPrice': '0,00',
      'page6.installments':   1,
      'cover.consultantName': 'Consultor Comercial', // fallback quando sem representante
    },
  },

  // ── 4: 10 parcelas, valor calculado correto ───────────────────────────────────
  {
    label: 'Cenário 4 — Parcelamento 10×, cálculo da parcela',
    data: {
      client: { name: 'Cliente Parcelado', phone: '(11) 90000-1111', address: 'Rua A, 1' },
      commercial: {
        productName: 'Eco Dual 80kW', power: '80kW', price: 100000.00,
        installments: 10, estimatedSavings: '', observations: '', deadline: '25 dias',
        conditions: 'Cartão de crédito',
        technicalSpecs: { powerSource: '3F+N+T', connectors: 2, connectorType: 'CCS2', communication: 'Wi-Fi/4G', model: 'Rise Dual' },
      },
      metadata: { templateId: '', emissionDate: '23/06/2026', validityDays: 30 },
    },
    representative: 'Carlos Lima',
    checks: {
      'page6.installments':     10,
      'page6.installmentValue': 10000,  // 100000 / 10 = 10000
      'page6.techRowsCount':    6,      // 5 specs + prazo
    },
  },

  // ── 5: Texto de comunicação longo ─────────────────────────────────────────────
  {
    label: 'Cenário 5 — Comunicação longa (não deve ser truncada no dado)',
    data: {
      client: { name: 'Shopping Iguatemi', phone: '(19) 3232-5555', address: 'Rod. Dom Pedro I, km 123 - Campinas - SP' },
      commercial: {
        productName: 'Eco Ultra Station', power: '120kW', price: 189900.00,
        installments: 6, estimatedSavings: '', observations: 'Obs de teste.',
        deadline: '20 dias corridos', conditions: 'Financiamento',
        technicalSpecs: {
          powerSource: '3F+N+T 380V', connectors: 4, connectorType: 'CCS2 + CHAdeMO',
          communication: 'Bluetooth 5.0 / Wi-Fi 802.11ac / Ethernet RJ45 / RFID ISO 15693 / 4G LTE / OCPP 1.6J',
          model: 'Rise Ultra Station',
        },
      },
      metadata: { templateId: '', emissionDate: '23/06/2026', validityDays: 45 },
    },
    representative: 'Ana Torres',
    checks: {
      'page6.communication': 'Bluetooth 5.0 / Wi-Fi 802.11ac / Ethernet RJ45 / RFID ISO 15693 / 4G LTE / OCPP 1.6J',
      'page6.connectors':    4,
      'page6.installments':  6,
      'page6.installmentValue': 189900.00 / 6,
    },
  },

  // ── 6: Sem nome de cliente ────────────────────────────────────────────────────
  {
    label: 'Cenário 6 — Cliente sem nome (fallback "—")',
    data: {
      client: { name: '', phone: '', address: '' },
      commercial: {
        productName: '', power: '', price: 0, installments: 1,
        estimatedSavings: '', observations: '', deadline: '', conditions: '',
        technicalSpecs: { powerSource: '', connectors: 1, connectorType: '', communication: '', model: '' },
      },
      metadata: { templateId: '', emissionDate: '23/06/2026', validityDays: 15 },
    },
    representative: '',
    checks: {
      'cover.clientName':     '—',             // fallback para string vazia
      'cover.consultantName': 'Consultor Comercial',
      'page6.productName':    '—',
      'page6.power':          '—',
      'page6.powerSource':    '—',
      'page6.connectorType':  '—',
      'page6.communication':  '—',
      'page6.model':          '—',
    },
  },
];

// ─── Runner ───────────────────────────────────────────────────────────────────

let totalPassed = 0;
let totalFailed = 0;
const failures = [];

console.log('\n' + '═'.repeat(72));
console.log('  📋  PROPOSAL PDF — TESTES DE VARIÁVEIS EM LOOPING');
console.log('═'.repeat(72));

for (const tc of cases) {
  const p6 = extractPage6Vars(tc.data);
  const cv = extractCoverVars(tc.data, tc.representative);
  const combined = {};
  for (const [k, v] of Object.entries(p6)) combined[`page6.${k}`] = v;
  for (const [k, v] of Object.entries(cv)) combined[`cover.${k}`] = v;

  let caseOk = true;
  const caseLines = [];

  for (const [field, expected] of Object.entries(tc.checks)) {
    const actual = combined[field];
    // Comparação numérica com tolerância de ponto flutuante
    const ok = typeof expected === 'number' && typeof actual === 'number'
      ? Math.abs(expected - actual) < 0.001
      : actual === expected;

    if (ok) {
      caseLines.push(`   ✓  ${field}: ${JSON.stringify(actual)}`);
    } else {
      caseOk = false;
      caseLines.push(`   ✗  ${field}`);
      caseLines.push(`      esperado: ${JSON.stringify(expected)}`);
      caseLines.push(`      recebido: ${JSON.stringify(actual)}`);
      failures.push({ case: tc.label, field, expected, actual });
    }
  }

  const icon = caseOk ? '✅' : '❌';
  console.log(`\n${icon}  ${tc.label}`);
  caseLines.forEach(l => console.log(l));

  if (caseOk) totalPassed++; else totalFailed++;
}

// ── Resumo ────────────────────────────────────────────────────────────────────

console.log('\n' + '─'.repeat(72));
console.log(`  Resultado: ${totalPassed}/${cases.length} cenários aprovados`);

if (failures.length > 0) {
  console.log(`\n  ⚠️  ${failures.length} verificação(ões) falharam:`);
  for (const f of failures) {
    console.log(`    • [${f.case}] ${f.field}: esperado ${JSON.stringify(f.expected)}, recebido ${JSON.stringify(f.actual)}`);
  }
  console.log('');
  process.exit(1);
} else {
  console.log('\n  🎉  Todos os campos mapeiam corretamente do formulário para o PDF!');
}

console.log('═'.repeat(72) + '\n');
