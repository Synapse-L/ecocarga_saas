"use client";

import React from 'react';
import { ProposalData } from '@/types/proposal';
import { useApp } from '@/context/AppContext';

interface Props {
  data: ProposalData;
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const IconSpeed = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
  </svg>
);
const IconPower = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="2" x2="12" y2="12"/><path d="M8.56 3.69a9 9 0 1 0 6.88 0"/>
  </svg>
);
const IconRange = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
  </svg>
);

// ─── EV Charger SVG ───────────────────────────────────────────────────────────
const ChargerSVG = () => (
  <svg width="100%" height="100%" viewBox="0 0 110 230" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="47" y="185" width="16" height="42" rx="3" fill="#9aa4b2"/>
    <rect x="40" y="222" width="30" height="7" rx="3" fill="#78838e"/>
    <rect x="25" y="28" width="60" height="160" rx="11" fill="rgba(0,0,0,0.18)"/>
    <rect x="23" y="26" width="64" height="160" rx="11" fill="#f0f4f6" stroke="#cdd6de" strokeWidth="1.2"/>
    <rect x="23" y="26" width="13" height="160" fill="#181c20"/>
    <rect x="23" y="26" width="13" height="160" rx="11 0 0 11" fill="#181c20"/>
    <rect x="74" y="26" width="13" height="160" rx="0 11 11 0" fill="#2e6e2e"/>
    <rect x="40" y="38" width="30" height="50" rx="4" fill="#0a0d10"/>
    <rect x="43" y="42" width="24" height="5" rx="1.5" fill="#1e90ff" opacity="0.9"/>
    <rect x="43" y="50" width="24" height="5" rx="1.5" fill="#1e90ff" opacity="0.65"/>
    <rect x="43" y="58" width="18" height="5" rx="1.5" fill="#1e90ff" opacity="0.4"/>
    <rect x="46" y="67" width="18" height="18" rx="2" fill="#f8f8f8"/>
    <rect x="48" y="69" width="6" height="6" rx="0.8" fill="#181c20"/>
    <rect x="57" y="69" width="6" height="6" rx="0.8" fill="#181c20"/>
    <rect x="48" y="78" width="6" height="6" rx="0.8" fill="#181c20"/>
    <rect x="57" y="78" width="3" height="3" rx="0.5" fill="#181c20"/>
    <rect x="52" y="75" width="3" height="3" rx="0.5" fill="#181c20"/>
    <text x="34" y="100" fill="#2e6e2e" fontWeight="900" fontSize="5.2" fontFamily="sans-serif" letterSpacing="0.5">EcoCarga</text>
    <rect x="34" y="106" width="42" height="32" rx="5" fill="#dde6ed" stroke="#bcc8d4" strokeWidth="1"/>
    <rect x="37" y="110" width="16" height="24" rx="3.5" fill="#adbdcc"/>
    <rect x="57" y="110" width="16" height="24" rx="3.5" fill="#adbdcc"/>
    <circle cx="45" cy="118" r="2" fill="#7a8fa0"/>
    <circle cx="45" cy="125" r="2" fill="#7a8fa0"/>
    <circle cx="65" cy="118" r="2" fill="#7a8fa0"/>
    <circle cx="65" cy="125" r="2" fill="#7a8fa0"/>
    <path d="M33 122 C16 122 14 168 24 178 C30 184 32 205 32 218" stroke="#181c20" strokeWidth="10" strokeLinecap="round" fill="none"/>
    <path d="M33 122 C16 122 14 168 24 178 C30 184 32 205 32 218" stroke="#26292d" strokeWidth="6" strokeLinecap="round" fill="none"/>
    <path d="M77 122 C94 122 96 165 86 177 C80 184 78 205 78 218" stroke="#181c20" strokeWidth="10" strokeLinecap="round" fill="none"/>
    <path d="M77 122 C94 122 96 165 86 177 C80 184 78 205 78 218" stroke="#26292d" strokeWidth="6" strokeLinecap="round" fill="none"/>
    <rect x="24" y="214" width="16" height="10" rx="3" fill="#424b57"/>
    <rect x="70" y="214" width="16" height="10" rx="3" fill="#424b57"/>
    <rect x="48" y="28" width="14" height="4" rx="2" fill="#4caf50"/>
    <defs>
      <linearGradient id="bodySheen" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="white" stopOpacity="0.7"/>
        <stop offset="100%" stopColor="white" stopOpacity="0"/>
      </linearGradient>
    </defs>
    <rect x="38" y="28" width="32" height="60" rx="4" fill="url(#bodySheen)" opacity="0.3"/>
  </svg>
);

// ─── Gaussian blur white light overlay ────────────────────────────────────────
const Glow = ({
  top, left, right, bottom,
  w = 90, h = 50, blur = 22, op = 0.13,
}: {
  top?: string|number; left?: string|number; right?: string|number; bottom?: string|number;
  w?: number; h?: number; blur?: number; op?: number;
}) => (
  <div style={{
    position: 'absolute', top, left, right, bottom,
    width: w, height: h,
    background: `radial-gradient(ellipse at 50% 30%, rgba(255,255,255,${op + 0.07}) 0%, rgba(255,255,255,${op * 0.25}) 55%, transparent 100%)`,
    filter: `blur(${blur}px)`,
    borderRadius: '50%',
    pointerEvents: 'none',
    zIndex: 10,
  }}/>
);

// ─── Specular top-edge 1px streak ────────────────────────────────────────────
const TopStreak = ({ opacity = 0.38 }: { opacity?: number }) => (
  <div style={{
    position: 'absolute', top: 0, left: '6%', right: '6%', height: '1px',
    background: `linear-gradient(90deg, transparent, rgba(255,255,255,${opacity}) 35%, rgba(255,255,255,${opacity * 0.5}) 65%, transparent)`,
    pointerEvents: 'none', zIndex: 12,
  }}/>
);

export const ProposalPage6: React.FC<Props> = ({ data }) => {
  const { t } = useApp();

  const emissionDate  = data.metadata?.emissionDate  || new Date().toLocaleDateString('pt-BR');
  const validityDays  = data.metadata?.validityDays  ?? 15;
  const priceNumber   = data.commercial?.price        ?? 0;
  const installments  = data.commercial?.installments ?? 1;
  const productName   = data.commercial?.productName?.trim()  || 'Eco SuperFast';
  const power         = data.commercial?.power?.trim()        || '60kW';
  const powerSource   = data.commercial?.technicalSpecs?.powerSource?.trim()  || '—';
  const connectors    = data.commercial?.technicalSpecs?.connectors            ?? 1;
  const connectorType = data.commercial?.technicalSpecs?.connectorType?.trim() || '—';
  const communication = data.commercial?.technicalSpecs?.communication?.trim() || '—';
  const model         = data.commercial?.technicalSpecs?.model?.trim()         || '—';
  const observations  = data.commercial?.observations?.trim() || '';
  const deadline      = data.commercial?.deadline?.trim()     || '';

  const formatted = priceNumber.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  const [priceInt, priceDec] = formatted.split(',');

  const techRows = [
    { label: 'Fonte de energia',  value: powerSource },
    { label: 'N de Conectores',   value: String(connectors) },
    { label: 'Tipo do Conector',  value: connectorType },
    { label: 'Comunicação',       value: communication },
    { label: 'Marca /Modelo',     value: model },
    ...(deadline ? [{ label: 'Prazo de Entrega', value: deadline }] : []),
  ];

  const shadow = '0 5px 20px rgba(0,0,0,0.36), 0 2px 6px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.07)';
  const nameParts = productName.split(' ');
  const firstName = nameParts[0];
  const restName  = nameParts.slice(1).join(' ');

  return (
    /*
     * ROOT: position:relative + exact A4 dimensions.
     * All 5 zones are placed with position:absolute using mm-based top/left/right/bottom.
     * This guarantees nothing can ever overflow into a neighbour zone.
     */
    <div
      id="proposal-page-6"
      style={{
        width: '210mm',
        height: '297mm',
        backgroundColor: '#ffffff',
        fontFamily: '"Outfit", "Inter", "Helvetica Neue", sans-serif',
        position: 'relative',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* ── WATERMARK ─────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', right: '-1mm', top: '2mm',
        display: 'flex', flexDirection: 'column',
        pointerEvents: 'none', userSelect: 'none', zIndex: 0,
      }}>
        {['ECO', 'CAR', 'GA'].map(w => (
          <div key={w} style={{
            fontSize: '68pt', fontWeight: 900,
            color: '#e8ece8', fontFamily: '"Outfit", sans-serif',
            lineHeight: 0.87, letterSpacing: '2px',
          }}>{w}</div>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          ZONE 1 — HEADER  (top: 11mm, height: 16mm)
      ══════════════════════════════════════════════════════════════════ */}
      <div style={{
        position: 'absolute', top: '11mm', left: '13mm', right: '13mm',
        height: '16mm', zIndex: 2,
        display: 'flex', alignItems: 'center',
      }}>
        <img src="/ecocarga-logo-small.png" alt="EcoCarga" style={{ width: '90px', height: 'auto' }} />
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          ZONE 2 — TITLE  (top: 27mm, height: 26mm)
      ══════════════════════════════════════════════════════════════════ */}
      <div style={{
        position: 'absolute', top: '27mm', left: '13mm', right: '13mm',
        height: '26mm', zIndex: 2,
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
      }}>
        <div style={{ fontSize: '34pt', fontWeight: 900, lineHeight: 1.0, color: '#142a1c', letterSpacing: '-0.8px' }}>
          Chegou a hora
        </div>
        <div style={{ fontSize: '17pt', fontWeight: 400, color: '#142a1c', marginTop: '1.5mm', letterSpacing: '-0.2px' }}>
          de fazer a sua escolha
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          ZONE 3 — PRODUCT CARD + TECH INFO  (top: 54mm, height: 109mm)
      ══════════════════════════════════════════════════════════════════ */}
      <div style={{
        position: 'absolute', top: '54mm', left: '13mm', right: '13mm',
        height: '109mm', zIndex: 2,
        display: 'flex', gap: '5mm', alignItems: 'flex-start',
        overflow: 'visible',
      }}>

        {/* LEFT 46%: dark card with charger image overflowing as sibling */}
        <div style={{ width: '46%', position: 'relative', flexShrink: 0, height: '78mm' }}>

          {/* Dark card — reduced height, overflow:hidden clips internal glows */}
          <div style={{
            position: 'absolute', inset: 0,
            borderRadius: '18px',
            background: 'linear-gradient(148deg, #1e4030 0%, #0e2318 55%, #091710 100%)',
            overflow: 'hidden',
            boxShadow: shadow,
            border: '1px solid rgba(255,255,255,0.055)',
          }}>
            {/* Lighting layer 1: main top-left ambient */}
            <Glow top={-20} left={-20} w={180} h={100} blur={40} op={0.13}/>
            {/* Lighting layer 2: soft centre-top fill */}
            <div style={{
              position: 'absolute', top: 0, left: '5%', right: '30%', height: '45%',
              background: 'radial-gradient(ellipse at 30% 0%, rgba(255,255,255,0.10) 0%, transparent 70%)',
              filter: 'blur(10px)', pointerEvents: 'none', zIndex: 10,
            }}/>
            {/* Specular 1px streak */}
            <TopStreak opacity={0.42}/>
          </div>

          {/* Card content */}
          <div style={{
            position: 'absolute', top: '7mm', left: '6mm',
            right: '36%',
            bottom: '7mm',
            zIndex: 12,
            display: 'flex', flexDirection: 'column',
          }}>
            {/* Product name */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '20pt', fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', lineHeight: 1.0 }}>
                {firstName}
              </span>
              <span style={{ fontSize: '12pt', fontWeight: 700, color: '#B2D235', lineHeight: 1.0 }}>
                {power}
              </span>
            </div>
            {restName && (
              <div style={{ fontSize: '20pt', fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', lineHeight: 1.0, marginTop: '0.5mm' }}>
                {restName}
              </div>
            )}

            {/* Badges — subidos, logo após o nome */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2mm', marginTop: '3mm' }}>
              {[
                { icon: <IconSpeed />, label: 'Velocidade' },
                { icon: <IconPower />, label: 'Potência' },
                { icon: <IconRange />, label: 'Autonomia' },
              ].map(({ icon, label }) => (
                <div key={label} style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  background: 'rgba(0,0,0,0.42)',
                  border: '1px solid rgba(178,210,53,0.28)',
                  borderRadius: '8px',
                  padding: '1.8mm 3mm',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.07)',
                }}>
                  <span style={{ color: '#B2D235', display: 'flex', flexShrink: 0 }}>{icon}</span>
                  <span style={{ fontSize: '8.5pt', fontWeight: 700, color: '#fff' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Charger — sangra em todas as direções, inclusive bem abaixo do card */}
          <div style={{
            position: 'absolute',
            right: '-32px',    /* invade coluna técnica à direita */
            top: '-40px',      /* voa acima do card */
            bottom: '-130px',  /* desce ~130px abaixo da base do card */
            width: '130px',
            zIndex: 15,
            pointerEvents: 'none',
            filter: 'drop-shadow(0 16px 28px rgba(0,0,0,0.60)) drop-shadow(0 4px 10px rgba(0,0,0,0.32))',
          }}>
            {data.commercial?.imageUrl ? (
              <img src={data.commercial.imageUrl} alt={productName}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : <ChargerSVG />}
          </div>
        </div>

        {/* RIGHT: Technical info with overlapping card design */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0', height: '100%', overflow: 'visible' }}>
          
          {/* Header Tab (light gray) */}
          <div style={{
            backgroundColor: '#dde4dd',
            color: '#142a1c',
            fontWeight: 800,
            fontSize: '13pt',
            padding: '2.5mm 5mm 2.2mm 5mm',
            width: 'fit-content',
            borderRadius: '12px 12px 0 0',
            border: '1px solid #c4ccc4',
            borderBottom: 'none',
            zIndex: 1,
            lineHeight: 1.1,
          }}>
            Informações técnicas
          </div>

          {/* Overlapping Cards Container */}
          <div style={{
            display: 'flex',
            height: '62mm',
            position: 'relative',
            overflow: 'visible',
            zIndex: 2,
          }}>
            
            {/* LEFT CARD: Dark labels (52% width) */}
            <div style={{
              width: '52%',
              backgroundColor: '#1b1d1e',
              background: 'linear-gradient(180deg, #222425 0%, #151718 100%)',
              borderRadius: '0 0 0 12px', /* top-left is covered by header, bottom-left rounded */
              padding: '3mm 4mm 3mm 4mm',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              borderLeft: '1px solid rgba(255,255,255,0.05)',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}>
              <TopStreak opacity={0.3}/>
              {techRows.map((row) => (
                <div key={row.label} style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  color: '#fff',
                  fontSize: '8.5pt',
                  fontWeight: 500,
                  lineHeight: 1.25,
                }}>
                  {row.label}
                </div>
              ))}
            </div>

            {/* RIGHT CARD: Green values (52% width, overlapping left card by 4%) */}
            <div style={{
              width: '52%',
              marginLeft: '-4%',
              backgroundColor: '#02422e',
              background: 'linear-gradient(148deg, #024c34 0%, #013222 100%)',
              borderRadius: '12px',
              padding: '3mm 4.5mm',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 8px 24px rgba(0,0,0,0.36), -4px 0 12px rgba(0,0,0,0.22)',
              border: '1px solid rgba(255,255,255,0.075)',
              zIndex: 3,
            }}>
              <TopStreak opacity={0.4}/>
              <Glow top={-15} left={-15} w={110} h={60} blur={24} op={0.12}/>
              
              {techRows.map((row) => (
                <div key={row.label} style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  color: '#fff',
                  fontSize: '8.8pt',
                  fontWeight: 600,
                  lineHeight: 1.25,
                }}>
                  {row.value}
                </div>
              ))}
            </div>

          </div>

          {/* Note */}
          <div style={{ fontSize: '7pt', color: '#4a5260', lineHeight: 1.45, fontStyle: 'italic', marginTop: '2.5mm' }}>
            {observations ? `* ${observations}` : 'Para mais informações, consulte o manual com os nossos profissionais'}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          ZONE 4 — VALOR SECTION  (top: 170mm, height: 100mm)
      ══════════════════════════════════════════════════════════════════ */}
      <div style={{
        position: 'absolute', top: '170mm', left: '13mm', right: '13mm',
        height: '100mm', zIndex: 2,
        display: 'flex', gap: '5mm', alignItems: 'flex-start',
      }}>

        {/* LEFT: "Valor" + date info */}
        <div style={{ width: '46%', flexShrink: 0, display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
          <div style={{
            fontSize: '88pt', fontWeight: 900, color: '#142a1c',
            lineHeight: 0.85, letterSpacing: '-4px',
          }}>
            Valor
          </div>
          <div style={{ fontSize: '15pt', fontWeight: 700, color: '#1a1e22', marginTop: '4mm', lineHeight: 1.4 }}>
            Data da Emissão:<br/>{emissionDate}
          </div>
          <div style={{ fontSize: '11pt', color: '#6b7280', fontWeight: 400, lineHeight: 1.5, marginTop: '3mm' }}>
            Está proposta é válida por<br/>{validityDays} dias após a emissão
          </div>
        </div>

        {/* RIGHT: cards de preço */}
        <div style={{
          flex: 1,
          display: 'flex', flexDirection: 'column', gap: '3mm',
          alignSelf: 'flex-start',
          alignItems: 'flex-end',
        }}>

          {/* ── Price Card 1: Cash ─────────────────────────────────────── */}
          <div style={{
            backgroundColor: '#181c20',
            borderRadius: '15px',
            padding: '5.5mm 7mm',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: shadow,
            border: '1px solid rgba(255,255,255,0.075)',
            width: 'fit-content',
            alignSelf: 'flex-end',
          }}>
            <TopStreak opacity={0.40}/>
            <Glow top={-20} left={-22} w={150} h={80} blur={35} op={0.12}/>
            <Glow top={-10} right={-10} w={90} h={50} blur={25} op={0.06}/>

            <div style={{ fontSize: '9pt', fontWeight: 600, color: '#8a9298', marginBottom: '2mm', position: 'relative', zIndex: 3, textAlign: 'left' }}>
              a partir de
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', position: 'relative', zIndex: 3, textAlign: 'left', whiteSpace: 'nowrap' }}>
              <span style={{ fontSize: '12pt', fontWeight: 800, color: '#d8dde0', alignSelf: 'flex-start', marginTop: '5px', marginRight: '3px' }}>R$</span>
              <span style={{ fontSize: '42pt', fontWeight: 900, color: '#fff', letterSpacing: '-1.5px', lineHeight: 0.95 }}>{priceInt}</span>
              <span style={{ fontSize: '16pt', fontWeight: 500, color: '#d8dde0', lineHeight: 0.95 }}>,{priceDec}</span>
              <span style={{ fontSize: '12pt', fontWeight: 700, color: '#8a9298', marginLeft: '9px', marginBottom: '3px', alignSelf: 'flex-end' }}>à vista</span>
            </div>
            <div style={{ fontSize: '8.5pt', color: '#5a6370', marginTop: '2mm', position: 'relative', zIndex: 3, textAlign: 'left' }}>
              + Frete
            </div>
          </div>

          {/* ── Price Card 2: Installments ─────────────────────────────── */}
          <div style={{
            backgroundColor: '#1e2226',
            borderRadius: '15px',
            padding: '5.5mm 7mm',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: shadow,
            border: '1px solid rgba(255,255,255,0.065)',
            width: 'fit-content',
            alignSelf: 'flex-end',
          }}>
            <TopStreak opacity={0.28}/>
            <Glow top={-18} left={-18} w={130} h={70} blur={30} op={0.10}/>

            <div style={{ fontSize: '9pt', fontWeight: 600, color: '#8a9298', marginBottom: '2mm', position: 'relative', zIndex: 3, textAlign: 'left' }}>
              parcelado em até
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative', zIndex: 3, textAlign: 'left', whiteSpace: 'nowrap' }}>
              <span style={{ fontSize: '38pt', fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '-0.8px' }}>
                {installments > 1 ? `${installments}x` : '10x'}
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <span style={{ fontSize: '8.5pt', fontWeight: 500, color: '#8a9298', lineHeight: 1.25 }}>no cartão de</span>
                <span style={{ fontSize: '8.5pt', fontWeight: 500, color: '#8a9298', lineHeight: 1.25 }}>crédito</span>
              </div>
            </div>
            <div style={{ fontSize: '8.5pt', color: '#5a6370', marginTop: '2mm', position: 'relative', zIndex: 3, textAlign: 'left' }}>
              + Acréscimo de Juros
            </div>
          </div>

          {/* Disclaimer */}
          <div style={{ fontSize: '8pt', color: '#5a6370', lineHeight: 1.5, marginTop: '2.5mm', maxWidth: '110mm', textAlign: 'right' }}>
            Instalação elétrica, adequações técnicas e infraestrutura do eletroposto são de responsabilidade do cliente.
          </div>
        </div>
      </div>


      {/* ══════════════════════════════════════════════════════════════════
          ZONE 5 — FOOTER  (bottom: 7mm, height: 8mm)
      ══════════════════════════════════════════════════════════════════ */}
      <div style={{
        position: 'absolute', bottom: '7mm', left: '13mm', right: '13mm',
        height: '8mm', zIndex: 2,
        borderTop: '1px solid #e2e6e2',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: '6.5pt', color: '#9ca3af', fontWeight: 500 }}>
          Copyright © {new Date().getFullYear()} EcoCarga. Todos os direitos reservados.
        </span>
      </div>
    </div>
  );
};
