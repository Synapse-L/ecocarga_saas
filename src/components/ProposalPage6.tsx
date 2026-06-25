"use client";

import React from 'react';
import { ProposalData } from '@/types/proposal';
import { useApp } from '@/context/AppContext';

interface Props {
  data: ProposalData;
}

// ─── Ícones inline reutilizáveis ──────────────────────────────────────────────
const IconBolt  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>;
const IconWifi  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="7" width="16" height="10" rx="2"/><line x1="22" y1="11" x2="22" y2="13"/><line x1="6" y1="11" x2="10" y2="11"/><line x1="6" y1="13" x2="12" y2="13"/></svg>;
const IconLeaf  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>;
const IconTruck = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="1" y="3" width="15" height="13"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>;

export const ProposalPage6: React.FC<Props> = ({ data }) => {
  const { t } = useApp();

  // ── Variáveis 100% do formulário — zero fallback com dados fictícios ─────
  const emissionDate  = data.metadata?.emissionDate  || new Date().toLocaleDateString('pt-BR');
  const validityDays  = data.metadata?.validityDays  ?? 15;
  const priceNumber   = data.commercial?.price        ?? 0;
  const installments  = data.commercial?.installments ?? 1;
  const conditions    = data.commercial?.conditions   || (installments <= 1 ? t('cash') : '');
  const observations  = data.commercial?.observations?.trim() || '';
  const deadline      = data.commercial?.deadline?.trim()     || '';
  const productName   = data.commercial?.productName?.trim()  || '—';
  const power         = data.commercial?.power?.trim()        || '—';

  // Ficha técnica
  const powerSource   = data.commercial?.technicalSpecs?.powerSource?.trim()  || '—';
  const connectors    = data.commercial?.technicalSpecs?.connectors            ?? 1;
  const connectorType = data.commercial?.technicalSpecs?.connectorType?.trim() || '—';
  const communication = data.commercial?.technicalSpecs?.communication?.trim() || '—';
  const model         = data.commercial?.technicalSpecs?.model?.trim()         || '—';

  // ── Formatação BRL ────────────────────────────────────────────────────────
  const formattedPrice = priceNumber.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const [priceInt, priceDec] = formattedPrice.split(',');

  // Valor por parcela
  const installmentValue = installments > 1
    ? (priceNumber / installments).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
    : null;

  // Label do card de parcelamento
  const installLabel = installments <= 1 ? t('cash') : `${installments}×`;

  // Linhas da tabela técnica (com prazo se preenchido)
  const techRows = [
    { label: t('powerSource'),  value: powerSource },
    { label: t('connectors'),   value: String(connectors) },
    { label: t('connectorType'),value: connectorType },
    { label: t('communication'),value: communication },
    { label: t('chargerModel'), value: model },
    ...(deadline ? [{ label: 'Prazo', value: deadline }] : []),
  ];

  return (
    <div
      id="proposal-page-6"
      style={{
        width: '210mm',
        height: '297mm',
        padding: '14mm 14mm 10mm 14mm',
        backgroundColor: '#ffffff',
        color: '#004D31',
        fontFamily: '"Outfit", "Inter", "Helvetica Neue", sans-serif',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* ── Marca d'água ────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', right: '3mm', top: '-8mm',
        fontSize: '66pt', fontWeight: 900, color: '#f0f2f0',
        writingMode: 'vertical-rl', textOrientation: 'mixed',
        opacity: 0.9, pointerEvents: 'none', userSelect: 'none', zIndex: 1,
        lineHeight: 1, letterSpacing: '3px',
        fontFamily: '"Outfit", sans-serif',
      }}>
        ECO CAR GA
      </div>

      {/* ── HEADER: logo + data de emissão ──────────────────────────────── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: '7mm', zIndex: 2,
      }}>
        <img src="/ecocarga-logo-small.png" alt="EcoCarga" style={{ width: '82px', height: 'auto' }} />

        {/* Data de emissão e validade — vindas do formulário */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '9pt', fontWeight: 700, color: '#7c868c' }}>
            {t('emission')}: <span style={{ color: '#1c1e21' }}>{emissionDate}</span>
          </div>
          <div style={{ fontSize: '8.5pt', fontWeight: 500, color: '#9ca3af', marginTop: '1mm' }}>
            {t('proposalValidity').replace('{days}', String(validityDays))}
          </div>
        </div>
      </div>

      {/* ── TÍTULO ──────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '7mm', zIndex: 2 }}>
        <h1 style={{ margin: 0, fontSize: '32pt', fontWeight: 900, lineHeight: 1.0, letterSpacing: '-0.5px' }}>
          {t('itsTime')}
        </h1>
        <h2 style={{ margin: 0, fontSize: '19pt', fontWeight: 400, marginTop: '1.5mm', letterSpacing: '-0.3px' }}>
          {t('toMakeChoice')}
        </h2>
      </div>

      {/* ── CORPO PRINCIPAL: duas colunas ───────────────────────────────── */}
      <div style={{ display: 'flex', gap: '6mm', zIndex: 2, flex: 1 }}>

        {/* ══ COLUNA ESQUERDA: card escuro do produto ══════════════════════ */}
        <div style={{
          width: '46%',
          borderRadius: '20px',
          background: 'radial-gradient(circle at 50% 40%, #163d2c 0%, #061a12 100%)',
          padding: '7mm 6mm',
          position: 'relative',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 16px 36px rgba(0,77,49,0.18)',
          border: '1px solid rgba(255,255,255,0.05)',
          overflow: 'hidden',
        }}>
          {/* Nome completo do produto — vem de commercial.productName */}
          <div style={{ fontSize: '20pt', fontWeight: 900, color: '#ffffff', lineHeight: 1.1,
            wordBreak: 'break-word', maxWidth: '60%', letterSpacing: '-0.3px' }}>
            {productName}
          </div>

          {/* Potência — vem de commercial.power */}
          <div style={{ fontSize: '15pt', fontWeight: 700, color: '#B2D235', marginTop: '2mm', lineHeight: 1 }}>
            {power}
          </div>

          {/* Badges */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3mm', marginTop: '5mm', maxWidth: '58%', zIndex: 3 }}>
            {[
              { icon: <IconWifi />,  label: t('speedBadge') },
              { icon: <IconBolt />,  label: t('powerBadge') },
              { icon: <IconLeaf />,  label: t('rangeBadge') },
            ].map(({ icon, label }) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                background: 'rgba(0,0,0,0.45)',
                border: '1px solid rgba(178,210,53,0.22)',
                borderRadius: '8px', padding: '2mm 3.5mm',
              }}>
                <span style={{ color: '#B2D235', display: 'flex' }}>{icon}</span>
                <span style={{ fontSize: '9.5pt', fontWeight: 700, color: '#ffffff', marginLeft: '5px' }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Imagem do carregador (upload ou SVG mockup) */}
          <div style={{
            position: 'absolute', right: '-3mm', bottom: '-6mm',
            width: '150px', height: '250px', zIndex: 2, pointerEvents: 'none',
          }}>
            {data.commercial?.imageUrl ? (
              <img src={data.commercial.imageUrl} alt={productName}
                style={{ width: '100%', height: '100%', objectFit: 'contain',
                  filter: 'drop-shadow(0 12px 20px rgba(0,0,0,0.4))' }} />
            ) : (
              <svg width="100%" height="100%" viewBox="0 0 200 350" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="85" y="160" width="30" height="190" fill="#717a82"/>
                <rect x="80" y="325" width="40" height="10" fill="#4d5359"/>
                <rect x="80" y="200" width="40" height="6" fill="#4d5359" rx="2"/>
                <path d="M78 203C70 203 70 310 95 310C120 310 120 203 112 203C104 203 72 230 72 260C72 290 120 290 120 250" stroke="#1c1e21" strokeWidth="12" strokeLinecap="round" fill="none"/>
                <path d="M78 203C70 203 70 310 95 310C120 310 120 203 112 203C104 203 72 230 72 260C72 290 120 290 120 250" stroke="#2c3035" strokeWidth="8" strokeLinecap="round" fill="none"/>
                <rect x="65" y="30" width="70" height="140" rx="14" fill="#f4f6f7" stroke="#cbd5e1" strokeWidth="3"/>
                <path d="M65 44C65 36.268 71.268 30 79 30H79.5V170H79C71.268 170 65 163.732 65 156V44Z" fill="#1c1e21"/>
                <path d="M120.5 30H121C128.732 30 135 36.268 135 44V156C135 163.732 128.732 170 121 170H120.5V30Z" fill="#B2D235"/>
                <rect x="75" y="45" width="22" height="45" rx="3" fill="#1c1e21"/>
                <rect x="79" y="50" width="14" height="2" fill="#38bdf8"/>
                <rect x="79" y="56" width="14" height="2" fill="#38bdf8"/>
                <circle cx="82" cy="75" r="3" fill="#34d399"/>
                <circle cx="92" cy="75" r="3" fill="#64748b"/>
                <text x="-120" y="130" fill="#004D31" fontWeight="900" fontSize="8" fontFamily="sans-serif" transform="rotate(-90)" letterSpacing="0.5">EcoCarga</text>
                <rect x="104" y="105" width="10" height="25" rx="2" fill="#334155"/>
                <circle cx="109" cy="117" r="2" fill="#1e293b"/>
              </svg>
            )}
          </div>
        </div>

        {/* ══ COLUNA DIREITA: cards de preço (TOPO) + ficha técnica ════════ */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5mm' }}>

          {/* ── CARDS DE PREÇO — posicionados no TOPO da coluna direita ──── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3.5mm' }}>

            {/* Card 1: Valor total */}
            <div style={{
              backgroundColor: '#1b1d21',
              borderRadius: '14px',
              padding: '3.5mm 5mm',
              boxShadow: '0 10px 20px rgba(0,0,0,0.22)',
              border: '1px solid rgba(255,255,255,0.07)',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Destaque de luz */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0,
                height: '1px', background: 'linear-gradient(90deg, transparent, rgba(178,210,53,0.4), transparent)',
              }} />
              <div style={{ fontSize: '9pt', fontWeight: 500, color: '#9ca3af' }}>
                {t('startingFrom')}
              </div>

              {/* Preço vindo de commercial.price */}
              <div style={{ display: 'flex', alignItems: 'baseline', color: '#ffffff', marginTop: '0.5mm' }}>
                <span style={{ fontSize: '8pt', fontWeight: 700, color: '#B2D235', marginRight: '2px' }}>R$</span>
                <span style={{ fontSize: '24pt', fontWeight: 900, letterSpacing: '-0.5px', lineHeight: 1 }}>
                  {priceInt}
                </span>
                <span style={{ fontSize: '14pt', fontWeight: 900, marginLeft: '0.5mm', lineHeight: 1 }}>
                  ,{priceDec}
                </span>
              </div>

              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginTop: '2mm', paddingTop: '2mm',
                borderTop: '1px solid rgba(255,255,255,0.06)',
              }}>
                {/* + Frete */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#6b7280' }}>
                  <IconTruck />
                  <span style={{ fontSize: '7.5pt', fontWeight: 600 }}>{t('plusShipping')}</span>
                </div>
                {/* Condições de pagamento — vindas do select do formulário */}
                <span style={{ fontSize: '11pt', color: '#B2D235', fontWeight: 900, letterSpacing: '-0.2px' }}>
                  {conditions}
                </span>
              </div>
            </div>

            {/* Card 2: Parcelamento — vindo de commercial.installments */}
            <div style={{
              backgroundColor: '#1b1d21',
              borderRadius: '14px',
              padding: '3.5mm 5mm',
              boxShadow: '0 10px 20px rgba(0,0,0,0.22)',
              border: '1px solid rgba(255,255,255,0.07)',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0,
                height: '1px', background: 'linear-gradient(90deg, transparent, rgba(178,210,53,0.25), transparent)',
              }} />
              <div style={{ fontSize: '9pt', fontWeight: 500, color: '#9ca3af' }}>
                {installments > 1 ? t('installmentUpTo') : 'Forma de pagamento'}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '0.5mm' }}>
                {/* Número de parcelas ou "À vista" */}
                <span style={{ fontSize: '28pt', fontWeight: 900, color: '#ffffff', lineHeight: 1 }}>
                  {installLabel}
                </span>

                {/* Valor de cada parcela — calculado automaticamente */}
                {installments > 1 && installmentValue ? (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '7.5pt', color: '#9ca3af', fontWeight: 500 }}>de</span>
                    <span style={{ fontSize: '12pt', fontWeight: 900, color: '#B2D235', lineHeight: 1 }}>
                      R$ {installmentValue}
                    </span>
                  </div>
                ) : (
                  <span style={{ fontSize: '9pt', fontWeight: 700, color: '#ffffff', lineHeight: 1.2, maxWidth: '85px' }}>
                    {t('onCreditCard')}
                  </span>
                )}
              </div>

              <div style={{ marginTop: '2mm', paddingTop: '2mm', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: '7.5pt', color: '#6b7280', fontWeight: 600 }}>
                  {installments > 1 ? t('plusInterest') : t('plusShipping')}
                </span>
              </div>
            </div>
          </div>

          {/* ── FICHA TÉCNICA — abaixo dos cards de preço ─────────────────── */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Cabeçalho da tabela */}
            <div style={{
              backgroundColor: '#e6edeb',
              borderRadius: '12px 12px 0 0',
              padding: '3mm 5mm',
              borderLeft: '4px solid #B2D235',
            }}>
              <h3 style={{ margin: 0, fontSize: '12pt', fontWeight: 800, color: '#004D31', letterSpacing: '-0.2px' }}>
                {t('technicalInfo')}
              </h3>
            </div>

            {/* Tabela de especificações — cada linha vem de technicalSpecs do formulário */}
            <div style={{
              borderRadius: '0 0 14px 14px',
              overflow: 'hidden',
              flex: 1,
              boxShadow: '0 6px 18px rgba(0,0,0,0.04)',
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {techRows.map((row, idx) => (
                    <tr key={row.label}
                      style={{ borderBottom: idx < techRows.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                      <td style={{
                        backgroundColor: '#202329', color: '#ffffff',
                        fontWeight: 600, fontSize: '8.5pt',
                        padding: '2.8mm 4.5mm', width: '42%',
                      }}>
                        {row.label}
                      </td>
                      <td style={{
                        backgroundColor: '#004D31', color: '#B2D235',
                        fontWeight: 700, fontSize: '8.5pt',
                        padding: '2.8mm 4.5mm', lineHeight: 1.3,
                      }}>
                        {row.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Observações — exibidas somente se preenchidas no formulário */}
            {observations && (
              <div style={{
                marginTop: '3mm',
                padding: '2.5mm 4mm',
                backgroundColor: '#f8faf9',
                borderRadius: '8px',
                border: '1px solid #e6edeb',
              }}>
                <p style={{ margin: 0, fontSize: '7.5pt', color: '#6b7280', fontWeight: 500, lineHeight: 1.4, fontStyle: 'italic' }}>
                  * {observations}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── FOOTER: disclaimer ──────────────────────────────────────────── */}
      <div style={{
        borderTop: '1px solid #e5e7eb',
        marginTop: '5mm',
        paddingTop: '3mm',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 2,
      }}>
        <p style={{ margin: 0, fontSize: '7pt', color: '#6b7280', fontWeight: 500, lineHeight: 1.3, flex: 1 }}>
          {t('infrastructureDisclaimer')}
        </p>
        <p style={{ margin: 0, fontSize: '7pt', color: '#9ca3af', fontWeight: 600, textAlign: 'right', whiteSpace: 'nowrap', paddingLeft: '8mm' }}>
          {t('copyright')}
        </p>
      </div>
    </div>
  );
};
