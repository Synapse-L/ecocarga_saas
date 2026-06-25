"use client";

import React from 'react';
import { ProposalData } from '@/types/proposal';
import { useApp } from '@/context/AppContext';

interface Props {
  data: ProposalData;
  representativeName?: string;
}

export const ProposalCover: React.FC<Props> = ({ data, representativeName }) => {
  const { t } = useApp();

  // ── Variáveis do formulário — sem fallbacks com dados falsos ──────────────
  const clientName    = data.client?.name?.trim()    || '—';
  const consultantName = representativeName?.trim()  || 'Consultor Comercial';
  const emissionDate  = data.metadata?.emissionDate  || new Date().toLocaleDateString('pt-BR');
  const validityDays  = data.metadata?.validityDays  ?? 15;

  return (
    <div
      id="proposal-cover"
      style={{
        width: '210mm',
        height: '297mm',
        backgroundColor: '#ffffff',
        fontFamily: '"Outfit", "Inter", "Helvetica Neue", sans-serif',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* ── Logo topo esquerdo ─────────────────────────────────────────── */}
      <div style={{ padding: '15mm 20mm 0 20mm', zIndex: 10 }}>
        <img
          src="/ecocarga-logo-small.png"
          alt="EcoCarga Logo"
          style={{ width: '85px', height: 'auto', display: 'block' }}
        />
      </div>

      {/* ── Conteúdo central ──────────────────────────────────────────── */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        marginTop: '-10mm',
      }}>

        {/* Logo principal */}
        <div style={{ marginBottom: '12mm' }}>
          <img
            src="/ecocarga-logo-main.png"
            alt="EcoCarga Logo Large"
            style={{ width: '350px', height: 'auto', display: 'block' }}
          />
        </div>

        {/* Pílula "Proposta" + "Comercial" */}
        <div style={{ zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          <div style={{
            backgroundColor: '#002116',
            borderRadius: '24px',
            padding: '4.5mm 0',
            width: '145mm',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)',
            marginBottom: '4mm',
          }}>
            <span style={{ fontSize: '30pt', fontWeight: 900, color: '#ffffff', letterSpacing: '0.5px' }}>
              {t('proposal')}
            </span>
          </div>
          <div style={{ fontSize: '32pt', fontWeight: 900, color: '#004D31', letterSpacing: '1px' }}>
            {t('commercial')}
          </div>
        </div>

        {/* ── Dados dinâmicos do formulário ────────────────────────────── */}
        <div style={{
          zIndex: 2,
          alignSelf: 'flex-start',
          paddingLeft: '20mm',
          marginTop: '25mm',
          display: 'flex',
          flexDirection: 'column',
          gap: '2.5mm',
        }}>
          {/* Representante */}
          <div style={{ fontSize: '15pt', color: '#004D31', lineHeight: '1.4' }}>
            <span style={{ fontWeight: 800 }}>{t('representative')}: </span>
            <span style={{ fontWeight: 500 }}>{consultantName}</span>
          </div>

          {/* Cliente */}
          <div style={{ fontSize: '15pt', color: '#004D31', lineHeight: '1.4' }}>
            <span style={{ fontWeight: 800 }}>{t('client')}: </span>
            <span style={{ fontWeight: 500 }}>{clientName}</span>
          </div>

          {/* Endereço do cliente */}
          {data.client?.address && (
            <div style={{ fontSize: '11pt', color: '#4a5b54', lineHeight: '1.4', marginTop: '1mm', maxWidth: '140mm' }}>
              {data.client.address}
            </div>
          )}

          {/* Data de emissão e validade */}
          <div style={{ fontSize: '11pt', color: '#7c868c', marginTop: '2mm', lineHeight: '1.5' }}>
            <span style={{ fontWeight: 700 }}>{t('emission')}: </span>
            <span>{emissionDate}</span>
            {'  ·  '}
            <span style={{ fontWeight: 700 }}>Validade: </span>
            <span>{validityDays} dias</span>
          </div>
        </div>
      </div>

      {/* ── Rodapé ────────────────────────────────────────────────────── */}
      <div style={{ zIndex: 5, width: '100%', marginTop: 'auto' }}>
        {/* Barra de contato */}
        <div style={{
          backgroundColor: '#eceeed',
          width: '100%',
          padding: '5.5mm 20mm',
          boxSizing: 'border-box',
          display: 'flex',
          gap: '12mm',
          alignItems: 'center',
          borderBottom: '1px solid #dcdfe1',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3.5px', color: '#004D31' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <span style={{ fontSize: '10.5pt', fontWeight: 800, marginLeft: '4px' }}>(11) 91283-1823</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3.5px', color: '#004D31' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span style={{ fontSize: '10.5pt', fontWeight: 800, marginLeft: '4px' }}>ecocargamobi.com.br</span>
          </div>
        </div>

        {/* Copyright */}
        <div style={{ padding: '3mm 20mm 4.5mm 20mm', textAlign: 'center', backgroundColor: '#ffffff' }}>
          <p style={{ margin: 0, fontSize: '6.5pt', color: '#889296', fontWeight: 700 }}>
            {t('copyright')}
          </p>
        </div>
      </div>
    </div>
  );
};
