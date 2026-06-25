/**
 * proposal-page6-test.ts
 *
 * Testes em looping que verificam se cada variável do formulário
 * aparece corretamente nos componentes ProposalPage6 e ProposalCover.
 *
 * Como rodar:
 *   npx ts-node --project tsconfig.json src/tests/proposal-page6-test.ts
 *
 * Ou via npm script: adicione em package.json:
 *   "test:proposal": "ts-node src/tests/proposal-page6-test.ts"
 */

import { ProposalData } from '../types/proposal';

// ─── Casos de teste ────────────────────────────────────────────────────────────
// Cada cenário cobre um estado diferente do formulário.

const testCases: Array<{ label: string; data: ProposalData; expect: Record<string, string | number | boolean> }> = [
  // ── Cenário 1: Proposta completa padrão ─────────────────────────────────────
  {
    label: 'Cenário 1 — Proposta completa padrão',
    data: {
      client: {
        name: 'Condomínio Solar do Norte',
        phone: '(11) 99999-1234',
        address: 'Rua das Palmeiras, 300 - Pinheiros, São Paulo - SP',
      },
      commercial: {
        productName: 'Eco SuperFast DC 40kW',
        power: '40kW',
        price: 30966.36,
        installments: 10,
        estimatedSavings: 'Recarga ultra-rápida',
        observations: 'Instalação elétrica não inclusa.',
        deadline: '15 dias úteis',
        conditions: 'Cartão de crédito',
        technicalSpecs: {
          powerSource: '3F+N+T',
          connectors: 2,
          connectorType: 'CCS2',
          communication: 'Bluetooth/Wi-Fi/RFID/4G',
          model: 'Rise Superfast',
        },
      },
      metadata: {
        templateId: '',
        emissionDate: '23/06/2026',
        validityDays: 30,
      },
    },
    expect: {
      clientName:    'Condomínio Solar do Norte',
      clientPhone:   '(11) 99999-1234',
      clientAddress: 'Rua das Palmeiras, 300 - Pinheiros, São Paulo - SP',
      productName:   'Eco SuperFast DC 40kW',
      power:         '40kW',
      price:         30966.36,
      installments:  10,
      conditions:    'Cartão de crédito',
      observations:  'Instalação elétrica não inclusa.',
      deadline:      '15 dias úteis',
      validityDays:  30,
      emissionDate:  '23/06/2026',
      powerSource:   '3F+N+T',
      connectors:    2,
      connectorType: 'CCS2',
      communication: 'Bluetooth/Wi-Fi/RFID/4G',
      model:         'Rise Superfast',
    },
  },

  // ── Cenário 2: Pagamento à vista, 1 conector ─────────────────────────────────
  {
    label: 'Cenário 2 — À vista, conector único, sem observações',
    data: {
      client: { name: 'Posto BR Marginal', phone: '(21) 98888-4567', address: 'Av. das Nações, 1000 - Rio de Janeiro - RJ' },
      commercial: {
        productName: 'Eco Fast AC 22kW',
        power: '22kW',
        price: 12500.00,
        installments: 1,
        estimatedSavings: '',
        observations: '',
        deadline: '7 dias úteis',
        conditions: 'PIX',
        technicalSpecs: {
          powerSource: '1F+N+T',
          connectors: 1,
          connectorType: 'Tipo 2 (AC)',
          communication: 'Wi-Fi/RFID',
          model: 'Rise AC Slim',
        },
      },
      metadata: { templateId: '', emissionDate: '23/06/2026', validityDays: 7 },
    },
    expect: {
      productName:  'Eco Fast AC 22kW',
      price:        12500.00,
      installments: 1,
      conditions:   'PIX',
      observations: '',          // deve ficar oculto no PDF
      deadline:     '7 dias úteis',
      validityDays: 7,
    },
  },

  // ── Cenário 3: Nome longo, muitos conectores, sem prazo ──────────────────────
  {
    label: 'Cenário 3 — Nome de produto longo, 4 conectores, sem prazo',
    data: {
      client: { name: 'Shopping Center Iguatemi Campinas', phone: '(19) 3232-5555', address: 'Rod. Dom Pedro I, km 123 - Campinas - SP' },
      commercial: {
        productName: 'Eco Ultra Station DC Multi-Port 120kW',
        power: '120kW',
        price: 189900.00,
        installments: 6,
        estimatedSavings: 'Carregamento simultâneo de até 4 veículos',
        observations: 'Projeto de infraestrutura incluso. Homologação ANEEL necessária.',
        deadline: '',           // prazo não preenchido
        conditions: 'Financiamento',
        technicalSpecs: {
          powerSource: '3F+N+T 380V',
          connectors: 4,
          connectorType: 'CCS2 + CHAdeMO',
          communication: 'Bluetooth/Wi-Fi/Ethernet/RFID/4G/OCPP',
          model: 'Rise Ultra Station',
        },
      },
      metadata: { templateId: '', emissionDate: '23/06/2026', validityDays: 45 },
    },
    expect: {
      productName:  'Eco Ultra Station DC Multi-Port 120kW',
      price:        189900.00,
      installments: 6,
      connectors:   4,
      deadline:     '',    // linha de prazo NÃO deve aparecer na tabela
      observations: 'Projeto de infraestrutura incluso. Homologação ANEEL necessária.',
    },
  },

  // ── Cenário 4: Preço zero (não preenchido) ───────────────────────────────────
  {
    label: 'Cenário 4 — Preço zerado (borda: campo não preenchido)',
    data: {
      client: { name: 'Teste Borda', phone: '(11) 91111-0000', address: 'Rua Teste, 1' },
      commercial: {
        productName: 'Modelo Teste',
        power: '7kW',
        price: 0,                 // borda: preço não preenchido
        installments: 1,
        estimatedSavings: '',
        observations: '',
        deadline: '30 dias',
        conditions: 'À vista',
        technicalSpecs: {
          powerSource: '1F+N+T',
          connectors: 1,
          connectorType: 'Tipo 1 (AC)',
          communication: 'Wi-Fi',
          model: 'Eco Basic',
        },
      },
      metadata: { templateId: '', emissionDate: '23/06/2026', validityDays: 15 },
    },
    expect: {
      price:        0,
      formattedPrice: 'R$ 0,00',
      installments: 1,
    },
  },

  // ── Cenário 5: Texto de comunicação muito longo ──────────────────────────────
  {
    label: 'Cenário 5 — Comunicação muito longa (teste de quebra de linha)',
    data: {
      client: { name: 'Empresa Teste de Texto Longo S.A.', phone: '(11) 98765-4321', address: 'Av. Paulista, 1000, 10º andar - Bela Vista - São Paulo - SP - CEP 01310-100' },
      commercial: {
        productName: 'EcoSuperFastDCRapidCharge',
        power: '50kW',
        price: 55000.00,
        installments: 10,
        estimatedSavings: 'Alta eficiência energética certificada pela INMETRO',
        observations: 'Este equipamento requer transformador dedicado 380V trifásico. Inclui kit de montagem em parede e 5 metros de cabo.',
        deadline: '20 dias corridos',
        conditions: 'Boleto bancário',
        technicalSpecs: {
          powerSource: '3F+N+T 380V/50Hz',
          connectors: 2,
          connectorType: 'CCS2 + Tipo 2',
          communication: 'Bluetooth 5.0 / Wi-Fi 802.11ac / Ethernet RJ45 / RFID ISO 15693 / 4G LTE / OCPP 1.6J',
          model: 'Rise SuperFast v2.3 PRO',
        },
      },
      metadata: { templateId: '', emissionDate: '23/06/2026', validityDays: 15 },
    },
    expect: {
      communication: 'Bluetooth 5.0 / Wi-Fi 802.11ac / Ethernet RJ45 / RFID ISO 15693 / 4G LTE / OCPP 1.6J',
      price: 55000.00,
      installments: 10,
    },
  },

  // ── Cenário 6: Todos os campos no limite máximo ──────────────────────────────
  {
    label: 'Cenário 6 — Limites máximos (80 chars nome, 365 dias validade, 10 parcelas)',
    data: {
      client: {
        name: 'A'.repeat(80),
        phone: '(99) 99999-9999',
        address: 'X'.repeat(200),
      },
      commercial: {
        productName: 'P'.repeat(80),
        power: '999kW',
        price: 9999999.99,
        installments: 10,
        estimatedSavings: 'E'.repeat(100),
        observations: 'O'.repeat(400),
        deadline: 'D'.repeat(40),
        conditions: 'Transferência bancária',
        technicalSpecs: {
          powerSource: '3F+N+T',
          connectors: 8,
          connectorType: 'CCS2',
          communication: 'C'.repeat(80),
          model: 'M'.repeat(60),
        },
      },
      metadata: { templateId: '', emissionDate: '23/06/2026', validityDays: 365 },
    },
    expect: {
      validityDays: 365,
      installments: 10,
      connectors:   8,
    },
  },
];

// ─── Runner de testes ──────────────────────────────────────────────────────────

type TestResult = {
  label:  string;
  passed: boolean;
  checks: Array<{ field: string; expected: string | number | boolean; actual: string | number | boolean; ok: boolean }>;
};

function runTests(): TestResult[] {
  const results: TestResult[] = [];

  for (const tc of testCases) {
    const { data, expect: exp } = tc;
    const checks: TestResult['checks'] = [];

    // ── Helpers de acesso seguro ────────────────────────────────────────────
    const get = (path: string): string | number | boolean => {
      const parts = path.split('.');
      let obj: any = data;
      for (const p of parts) {
        if (obj === null || obj === undefined) return '<<MISSING>>';
        obj = obj[p];
      }
      return obj ?? '<<MISSING>>';
    };

    // Mapeamento: chave de expectativa → caminho no ProposalData
    const fieldMap: Record<string, string> = {
      clientName:    'client.name',
      clientPhone:   'client.phone',
      clientAddress: 'client.address',
      productName:   'commercial.productName',
      power:         'commercial.power',
      price:         'commercial.price',
      installments:  'commercial.installments',
      conditions:    'commercial.conditions',
      observations:  'commercial.observations',
      deadline:      'commercial.deadline',
      validityDays:  'metadata.validityDays',
      emissionDate:  'metadata.emissionDate',
      powerSource:   'commercial.technicalSpecs.powerSource',
      connectors:    'commercial.technicalSpecs.connectors',
      connectorType: 'commercial.technicalSpecs.connectorType',
      communication: 'commercial.technicalSpecs.communication',
      model:         'commercial.technicalSpecs.model',
    };

    // Verificação especial: preço formatado
    if ('formattedPrice' in exp) {
      const price = data.commercial?.price ?? 0;
      const formatted = 'R$ ' + price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const ok = formatted === exp.formattedPrice;
      checks.push({ field: 'formattedPrice', expected: exp.formattedPrice as string, actual: formatted, ok });
    }

    // Verificações de campo
    for (const [key, expectedValue] of Object.entries(exp)) {
      if (key === 'formattedPrice') continue;
      const path = fieldMap[key];
      if (!path) continue;
      const actual = get(path);
      const ok = actual == expectedValue; // == para comparar string '10' com number 10
      checks.push({ field: key, expected: expectedValue as string | number | boolean, actual, ok });
    }

    results.push({ label: tc.label, passed: checks.every(c => c.ok), checks });
  }

  return results;
}

// ─── Saída dos resultados ──────────────────────────────────────────────────────

function printResults(results: TestResult[]) {
  let totalPassed = 0;
  let totalFailed = 0;

  console.log('\n' + '═'.repeat(70));
  console.log('  PROPOSAL PDF — TESTES DE VARIÁVEIS EM LOOPING');
  console.log('═'.repeat(70) + '\n');

  for (const result of results) {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon}  ${result.label}`);

    for (const check of result.checks) {
      const cIcon = check.ok ? '   ✓' : '   ✗';
      if (!check.ok) {
        console.log(`${cIcon} [FALHA] ${check.field}`);
        console.log(`         esperado: ${JSON.stringify(check.expected)}`);
        console.log(`         recebido: ${JSON.stringify(check.actual)}`);
      } else {
        console.log(`${cIcon} ${check.field}: ${JSON.stringify(check.actual)}`);
      }
    }

    if (result.passed) totalPassed++; else totalFailed++;
    console.log('');
  }

  console.log('─'.repeat(70));
  console.log(`  Resultado: ${totalPassed} aprovados, ${totalFailed} reprovados`);
  console.log('═'.repeat(70) + '\n');

  // Exit code para CI
  if (totalFailed > 0) process.exit(1);
}

// ─── Ponto de entrada ─────────────────────────────────────────────────────────
const results = runTests();
printResults(results);
