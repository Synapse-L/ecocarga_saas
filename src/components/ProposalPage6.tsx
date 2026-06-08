"use client";

import React from 'react';
import { ProposalData } from '@/types/proposal';

interface Props {
  data: ProposalData;
}

export const ProposalPage6: React.FC<Props> = ({ data }) => {
  // Format dates and price variables
  const emissionDateStr = data.metadata?.emissionDate || '19/05/2026';
  const validityDays = data.metadata?.validityDays || 15;
  const priceNumber = data.commercial?.price || 30966.36;
  const productName = data.commercial?.productName || 'Eco SuperFast';
  const power = data.commercial?.power || '40kW';
  
  // Format Price: R$ 30.966,36
  const formattedPrice = priceNumber.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const [priceInteger, priceDecimals] = formattedPrice.split(',');

  // Technical specs
  const powerSource = data.commercial?.technicalSpecs?.powerSource || '3F+N+T';
  const connectors = data.commercial?.technicalSpecs?.connectors || 1;
  const connectorType = data.commercial?.technicalSpecs?.connectorType || 'CCS2';
  const communication = data.commercial?.technicalSpecs?.communication || 'Bluetooth/Wi-Fi/Ethernet/RFID/4G';
  const model = data.commercial?.technicalSpecs?.model || 'Rise Superfast';

  return (
    <div 
      id="proposal-page-6"
      style={{
        width: '210mm',
        height: '297mm',
        padding: '20mm 15mm 15mm 15mm',
        backgroundColor: '#ffffff',
        color: '#004D31',
        fontFamily: '"Outfit", "Inter", "Helvetica Neue", sans-serif',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}
    >
      {/* BACKGROUND WATERMARK */}
      <div 
        style={{
          position: 'absolute',
          right: '5mm',
          top: '-5mm',
          fontSize: '72pt',
          fontWeight: 900,
          color: '#f4f6f5',
          fontFamily: '"Outfit", sans-serif',
          lineHeight: '1.0',
          letterSpacing: '2px',
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
          opacity: 0.8,
          pointerEvents: 'none',
          userSelect: 'none',
          zIndex: 1
        }}
      >
        ECO CAR GA
      </div>

      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10mm', zIndex: 2 }}>
        {/* LOGO */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          <img 
            src="/ecocarga-logo-small.png" 
            alt="EcoCarga Logo" 
            style={{ width: '90px', height: 'auto', display: 'block' }} 
          />
        </div>
      </div>

      {/* TITLE SECTION */}
      <div style={{ marginBottom: '10mm', zIndex: 2 }}>
        <h1 style={{ margin: 0, fontSize: '38pt', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.5px' }}>
          Chegou a hora
        </h1>
        <h2 style={{ margin: 0, fontSize: '24pt', fontWeight: 400, marginTop: '2px', letterSpacing: '-0.5px' }}>
          de fazer a sua escolha
        </h2>
      </div>

      {/* MIDDLE SECTION - TWO COLUMNS GRID */}
      <div style={{ display: 'flex', gap: '8mm', marginBottom: '12mm', zIndex: 2, flex: 1 }}>
        {/* LEFT COLUMN: HERO PRODUCT CARD */}
        <div 
          style={{
            flex: 1,
            borderRadius: '24px',
            background: 'radial-gradient(circle at 50% 50%, #163d2c 0%, #061a12 100%)',
            padding: '8mm',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 20px 40px rgba(0, 77, 49, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            overflow: 'hidden'
          }}
        >
          {/* PRODUCT NAME HEADER */}
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '38pt', fontWeight: 900, color: '#ffffff', lineHeight: 1 }}>Eco</span>
              <span style={{ fontSize: '22pt', fontWeight: 700, color: '#B2D235', lineHeight: 1 }}>{power}</span>
            </div>
            <div style={{ fontSize: '34pt', fontWeight: 900, color: '#ffffff', marginTop: '2px', lineHeight: 0.9 }}>
              SuperFast
            </div>
          </div>

          {/* DYNAMIC SPECS BADGES */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3.5mm', marginTop: '6mm', maxWidth: '55%', zIndex: 3 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', background: 'rgba(0, 0, 0, 0.5)', border: '1px solid rgba(178, 210, 53, 0.25)', borderRadius: '10px', padding: '2.5mm 4mm', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
              <span style={{ color: '#B2D235', display: 'flex', alignItems: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="7" width="16" height="10" rx="2" ry="2"></rect><line x1="22" y1="11" x2="22" y2="13"></line><line x1="6" y1="11" x2="10" y2="11"></line><line x1="6" y1="13" x2="12" y2="13"></line></svg>
              </span>
              <span style={{ fontSize: '10.5pt', fontWeight: 700, color: '#ffffff', marginLeft: '6px' }}>Velocidade</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', background: 'rgba(0, 0, 0, 0.5)', border: '1px solid rgba(178, 210, 53, 0.25)', borderRadius: '10px', padding: '2.5mm 4mm', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
              <span style={{ color: '#B2D235', display: 'flex', alignItems: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>
              </span>
              <span style={{ fontSize: '10.5pt', fontWeight: 700, color: '#ffffff', marginLeft: '6px' }}>Potência</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', background: 'rgba(0, 0, 0, 0.5)', border: '1px solid rgba(178, 210, 53, 0.25)', borderRadius: '10px', padding: '2.5mm 4mm', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
              <span style={{ color: '#B2D235', display: 'flex', alignItems: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
              </span>
              <span style={{ fontSize: '10.5pt', fontWeight: 700, color: '#ffffff', marginLeft: '6px' }}>Autonomia</span>
            </div>
          </div>

          {/* 3D FLOATING CHARGER TOTEM OR IMAGE */}
          <div 
            style={{
              position: 'absolute',
              right: '-4mm',
              bottom: '-8mm',
              width: '180px',
              height: '300px',
              zIndex: 2,
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {data.commercial?.imageUrl ? (
              <img 
                src={data.commercial.imageUrl} 
                alt={productName} 
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.35))'
                }}
              />
            ) : (
              /* Totem Mockup Vector Graphic */
              <svg width="100%" height="100%" viewBox="0 0 200 350" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Stand / Footing */}
                <rect x="85" y="160" width="30" height="190" fill="#717a82" />
                <rect x="80" y="325" width="40" height="10" fill="#4d5359" />
                {/* Cable Wrap Bracket */}
                <rect x="80" y="200" width="40" height="6" fill="#4d5359" rx="2" />
                {/* Wrapped Cable Vector */}
                <path d="M78 203C70 203 70 310 95 310C120 310 120 203 112 203C104 203 72 230 72 260C72 290 120 290 120 250" stroke="#1c1e21" strokeWidth="12" strokeLinecap="round" fill="none" />
                <path d="M78 203C70 203 70 310 95 310C120 310 120 203 112 203C104 203 72 230 72 260C72 290 120 290 120 250" stroke="#2c3035" strokeWidth="8" strokeLinecap="round" fill="none" />
                
                {/* Charger Body */}
                <rect x="65" y="30" width="70" height="140" rx="14" fill="#f4f6f7" stroke="#cbd5e1" strokeWidth="3" />
                {/* Accent Side Panels */}
                <path d="M65 44C65 36.268 71.268 30 79 30H79.5V170H79C71.268 170 65 163.732 65 156V44Z" fill="#1c1e21" />
                <path d="M120.5 30H121C128.732 30 135 36.268 135 44V156C135 163.732 128.732 170 121 170H120.5V30Z" fill="#B2D235" />
                
                {/* Screen Area */}
                <rect x="75" y="45" width="22" height="45" rx="3" fill="#1c1e21" />
                {/* Screen LED Details */}
                <rect x="79" y="50" width="14" height="2" fill="#38bdf8" />
                <rect x="79" y="56" width="14" height="2" fill="#38bdf8" />
                <circle cx="82" cy="75" r="3" fill="#34d399" />
                <circle cx="92" cy="75" r="3" fill="#64748b" />
                
                {/* Brand label on the right accent green panel */}
                <text x="-120" y="130" fill="#004D31" fontWeight="900" fontSize="8" fontFamily="sans-serif" transform="rotate(-90)" letterSpacing="0.5">EcoCarga</text>

                {/* Outlet Plug Details */}
                <rect x="104" y="105" width="10" height="25" rx="2" fill="#334155" />
                <circle cx="109" cy="117" r="2" fill="#1e293b" />
              </svg>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: TECHNICAL INFO TABLE */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* HEADER HEADER */}
          <div 
            style={{
              backgroundColor: '#e6edeb',
              borderRadius: '16px 16px 0 0',
              padding: '4mm 6mm',
              borderLeft: '4px solid #B2D235'
            }}
          >
            <h3 style={{ margin: 0, fontSize: '15pt', fontWeight: 800, color: '#004D31', letterSpacing: '-0.3px' }}>
              Informações técnicas
            </h3>
          </div>

          {/* TABLE BOX */}
          <div 
            style={{
              borderRadius: '0 0 18px 18px',
              overflow: 'hidden',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 8px 24px rgba(0,0,0,0.03)'
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', flex: 1 }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ backgroundColor: '#202329', color: '#ffffff', fontWeight: 600, fontSize: '9.5pt', padding: '3.5mm 5mm', width: '42%' }}>
                    Fonte de energia
                  </td>
                  <td style={{ backgroundColor: '#004D31', color: '#B2D235', fontWeight: 700, fontSize: '9.5pt', padding: '3.5mm 5mm' }}>
                    {powerSource}
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ backgroundColor: '#202329', color: '#ffffff', fontWeight: 600, fontSize: '9.5pt', padding: '3.5mm 5mm' }}>
                    N de Conectores
                  </td>
                  <td style={{ backgroundColor: '#004D31', color: '#B2D235', fontWeight: 700, fontSize: '9.5pt', padding: '3.5mm 5mm' }}>
                    {connectors}
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ backgroundColor: '#202329', color: '#ffffff', fontWeight: 600, fontSize: '9.5pt', padding: '3.5mm 5mm' }}>
                    Tipo do Conector
                  </td>
                  <td style={{ backgroundColor: '#004D31', color: '#B2D235', fontWeight: 700, fontSize: '9.5pt', padding: '3.5mm 5mm' }}>
                    {connectorType}
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ backgroundColor: '#202329', color: '#ffffff', fontWeight: 600, fontSize: '9.5pt', padding: '3.5mm 5mm' }}>
                    Comunicação
                  </td>
                  <td style={{ backgroundColor: '#004D31', color: '#B2D235', fontWeight: 700, fontSize: '9pt', padding: '3.5mm 5mm', lineHeight: 1.3 }}>
                    {communication}
                  </td>
                </tr>
                <tr>
                  <td style={{ backgroundColor: '#202329', color: '#ffffff', fontWeight: 600, fontSize: '9.5pt', padding: '3.5mm 5mm' }}>
                    Marca /Modelo
                  </td>
                  <td style={{ backgroundColor: '#004D31', color: '#B2D235', fontWeight: 700, fontSize: '9.5pt', padding: '3.5mm 5mm' }}>
                    {model}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* LOWER CAPTION */}
          <div style={{ marginTop: '2.5mm', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '8pt', fontWeight: 700, color: '#4a5b54', lineHeight: 1.3 }}>
              Consulte nossos profissionais para mais informações.
            </p>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION - PRICING, VALIDITY, SIGNATURE */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto', zIndex: 2 }}>
        {/* LEFT COLUMN: TOTAL BIG TEXT AND DATES */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3.5mm' }}>
          <div>
            <span style={{ fontSize: '56pt', fontWeight: 900, color: '#004D31', lineHeight: 0.9, letterSpacing: '-1.5px' }}>
              Valor
            </span>
          </div>
          <div>
            <div style={{ fontSize: '17pt', fontWeight: 800, color: '#1c1e21', letterSpacing: '-0.3px' }}>
              Emissão: {emissionDateStr}
            </div>
            <div style={{ fontSize: '12pt', fontWeight: 500, color: '#7c868c', marginTop: '1.5mm' }}>
              Proposta válida por {validityDays} dias.
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: PREMIUM CARDS WITH LIGHTING DETAILS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4mm', width: '47%' }}>
          {/* PREMIUM CARD 1 - CASH VALUE */}
          <div 
            style={{
              backgroundColor: '#1b1d21',
              borderRadius: '16px',
              padding: '3mm 5mm 3.5mm 5mm',
              boxShadow: '0 12px 24px rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative'
            }}
          >
            <div style={{ fontSize: '10.5pt', fontWeight: 500, color: '#9ca3af' }}>
              a partir de
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-baseline', marginTop: '1mm' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', color: '#ffffff' }}>
                <span style={{ fontSize: '26pt', fontWeight: 900, letterSpacing: '-0.5px' }}>R$ {priceInteger}</span>
                <span style={{ fontSize: '16pt', fontWeight: 900, marginLeft: '0.5mm' }}>,{priceDecimals}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5mm', paddingTop: '1.5mm', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: '8pt', color: '#6b7280', fontWeight: 600 }}>+ Frete</span>
              <span style={{ fontSize: '12.5pt', color: '#ffffff', fontWeight: 900, letterSpacing: '-0.3px' }}>à vista</span>
            </div>
          </div>

          {/* PREMIUM CARD 2 - INSTALLMENT DETAILS */}
          <div 
            style={{
              backgroundColor: '#1b1d21',
              borderRadius: '16px',
              padding: '3mm 5mm 3.5mm 5mm',
              boxShadow: '0 12px 24px rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div style={{ fontSize: '10.5pt', fontWeight: 500, color: '#9ca3af' }}>
              parcelado em até
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '1mm' }}>
              <span style={{ fontSize: '32pt', fontWeight: 900, color: '#ffffff', lineHeight: 1 }}>10x</span>
              <span style={{ fontSize: '9.5pt', fontWeight: 700, color: '#ffffff', lineHeight: 1.2, maxWidth: '90px' }}>
                no cartão de crédito
              </span>
            </div>

            <div style={{ marginTop: '1.5mm', paddingTop: '1.5mm', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: '8pt', color: '#6b7280', fontWeight: 600 }}>+ Acréscimo de Juros</span>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER GENERAL LEGAL TERMS */}
      <div 
        style={{
          borderTop: '1px solid #e5e7eb',
          marginTop: '10mm',
          paddingTop: '3.5mm',
          textAlign: 'center',
          zIndex: 2
        }}
      >
        <p style={{ margin: 0, fontSize: '8pt', color: '#6b7280', fontWeight: 500, lineHeight: 1.3 }}>
          Instalação e infraestrutura elétrica são de responsabilidade do cliente.
        </p>
      </div>
    </div>
  );
};

