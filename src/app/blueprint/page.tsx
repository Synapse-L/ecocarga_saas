// 🧹 REMOVABLE MODULE — delete the /blueprint folder to remove this feature entirely
// This page is a high-fidelity front-end mockup of an AI-powered 3D Electrical Mapping and Blueprint Generator.
// It includes interactive upload simulators, AI scan animations, a dynamic vector CAD/3D viewer simulation, and prompt refining.

"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  Compass, Sparkles, Upload, FileText, Download, Play, RefreshCw, 
  Layers, CheckCircle2, AlertTriangle, Cpu, Info, HelpCircle, 
  ArrowRight, CornerDownLeft, Eye, Zap, ShieldCheck, FileSpreadsheet,
  Volume2, Video, MessageSquare, Terminal, Settings, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AppSidebar from '@/components/AppSidebar';
import { useApp } from '@/context/AppContext';
import * as THREE from 'three';

// --- Types ---
type ViewMode = '3d' | '2d' | 'unifilar';

interface PhotoUpload {
  id: string;
  name: string;
  size: string;
  previewUrl: string;
  type: 'quadro' | 'garagem' | 'trajeto';
  status: 'ready' | 'uploading' | 'done';
}

export default function BlueprintAIPage() {
  const { t } = useApp();
  const [viewMode, setViewMode] = useState<ViewMode>('3d');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [scanDone, setScanDone] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Tab control: Photos vs walking Video
  const [activeTab, setActiveTab] = useState<'photos' | 'video'>('video');
  
  // Interactive prompt input
  const [promptInput, setPromptInput] = useState('');
  const [isApplyingPrompt, setIsApplyingPrompt] = useState(false);
  const [promptHistory, setPromptHistory] = useState<string[]>([]);
  
  // Simulated CAD/3D viewer state
  const [selectedElement, setSelectedElement] = useState<'painel' | 'cabos' | 'carregadores' | null>(null);
  const [activeLayers, setActiveLayers] = useState({
    walls: true,
    conduits: true,
    chargers: true,
    dimensions: true,
    grid: true,
    trajectory: true
  });
  
  // Interactive variables for engineering (NBR 5410)
  const [cableLength, setCableLength] = useState(34);
  const [chargerCount, setChargerCount] = useState(3);
  const [cableBitola, setCableBitola] = useState(10); // in mm²
  const [chargerPower, setChargerPower] = useState(22); // in kW (nominal)
  const [voltageDrop, setVoltageDrop] = useState(1.2); // in %
  const [selectedConduit, setSelectedConduit] = useState('Eletroduto Metálico Galvanizado 1" (Teto)');
  const [smartChargingLimit, setSmartChargingLimit] = useState(63); // in Amps (Demand limit)
  
  // AutoCAD-style CLI State
  const [cliInput, setCliInput] = useState('');
  const [cliHistory, setCliHistory] = useState<string[]>([
    'KEPLER CAD // Versão 2.4.0 (Baseado em NBR 5410)',
    'Digite "HELP" ou "AJUDA" para ver a lista de comandos de engenharia disponíveis.',
    'SISTEMA PRONTO. AGUARDANDO COMANDO...'
  ]);
  const cliEndRef = useRef<HTMLDivElement>(null);

  // 3D Canvas Refs
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const conduitMeshRef = useRef<THREE.Group | null>(null);
  const chargersGroupRef = useRef<THREE.Group | null>(null);
  const flowParticlesRef = useRef<THREE.Mesh[]>([]);
  const trajectoryLineRef = useRef<THREE.Line | null>(null);
  const pointCloudRef = useRef<THREE.Points | null>(null);
  
  // Video SLAM Simulator State
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoFrame, setVideoFrame] = useState(0);
  const [slamFeatures, setSlamFeatures] = useState<{ x: number, y: number }[]>([]);
  const [detectedObjects, setDetectedObjects] = useState<{ label: string, x: number, y: number, w: number, h: number }[]>([]);
  const [transcript, setTranscript] = useState<string>('Clique em "Play" para iniciar a análise do tour por vídeo e voz.');
  const [multimodalLogs, setMultimodalLogs] = useState<string[]>([]);
  const videoCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Mouse tracking for 2D CAD blueprint
  const [cadMousePos, setCadMousePos] = useState({ x: 0, y: 0 });
  const [cadHoverElement, setCadHoverElement] = useState<string | null>(null);
  const cadCanvasRef = useRef<HTMLDivElement>(null);
  
  // File Upload and Real Backend Integration Refs & States
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dxfDownloadUrl, setDxfDownloadUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');

  // Mock Uploaded Photos
  const [uploadedPhotos, setUploadedPhotos] = useState<PhotoUpload[]>([
    {
      id: 'ph-1',
      name: 'Quadro_Eletrico_Entrada.jpg',
      size: '2.4 MB',
      previewUrl: 'https://images.unsplash.com/photo-1558441719-ff34b0524a24?w=400&q=80',
      type: 'quadro',
      status: 'ready'
    },
    {
      id: 'ph-2',
      name: 'Garagem_Subsolo_Vagas.jpg',
      size: '3.1 MB',
      previewUrl: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=400&q=80',
      type: 'garagem',
      status: 'ready'
    }
  ]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // --- Real-time NBR 5410 calculations ---
  useEffect(() => {
    // Current per phase (Trifásico 380V)
    // I = P / (sqrt(3) * V * cos(phi))  -- Assumindo cos(phi) = 0.92 e rendimento = 100%
    const nominalCurrent = (chargerPower * 1000) / (Math.sqrt(3) * 380 * 0.92);
    
    // Total current for all chargers
    let totalCurrent = nominalCurrent * chargerCount;
    
    // Apply Smart Charging Demand Management limit if active
    if (totalCurrent > smartChargingLimit) {
      totalCurrent = smartChargingLimit;
    }

    // Copper resistivity (rho) = 0.0178 ohm * mm² / m
    // Delta V = (sqrt(3) * I * L * rho * cos(phi)) / (V * S)
    const rho = 0.0178;
    const deltaV = (Math.sqrt(3) * totalCurrent * cableLength * rho * 0.92) / (380 * cableBitola);
    const deltaVPercent = (deltaV / 380) * 1000; // calibrated percentage
    
    setVoltageDrop(parseFloat(Math.min(9.9, Math.max(0.1, deltaVPercent)).toFixed(2)));
  }, [cableLength, chargerCount, cableBitola, chargerPower, smartChargingLimit]);

  // --- CLI Command Executor ---
  const executeCliCommand = (cmdStr: string) => {
    const parts = cmdStr.trim().split(/\s+/);
    const cmd = parts[0].toUpperCase();
    const arg1 = parts[1];
    const arg2 = parts[2];
    
    let response = '';
    let success = true;

    switch (cmd) {
      case 'HELP':
      case 'AJUDA':
        response = 'COMANDOS DISPONÍVEIS:\n' +
          '  ADD [n]            - Define o número de carregadores (Ex: ADD 5)\n' +
          '  ROUTE [ceiling/floor/teto/piso] - Altera trajeto dos cabos\n' +
          '  CABLE [bitola]     - Modifica seção do cabo em mm² (Ex: CABLE 16)\n' +
          '  LAYER [nome] [on/off] - Liga/Desliga camadas (walls, conduits, chargers, dimensions, trajectory, grid)\n' +
          '  POWER [kW]         - Define a potência nominal (7.4, 22, 50)\n' +
          '  LIMIT [A]          - Define limite do Smart Charging (Ex: LIMIT 63)\n' +
          '  CLEAR / LIMPAR     - Limpa o terminal\n' +
          '  GRID [ON/OFF]      - Liga ou desliga a grade de engenharia';
        break;
      
      case 'ADD':
        const num = parseInt(arg1);
        if (!isNaN(num) && num >= 1 && num <= 10) {
          setChargerCount(num);
          response = `SUCESSO: Quantidade de carregadores definida para ${num}. Modelo 3D atualizado.`;
        } else {
          response = 'ERRO: Quantidade inválida. Use um número de 1 a 10.';
          success = false;
        }
        break;

      case 'ROUTE':
      case 'ROTA':
        const routeType = (arg1 || '').toUpperCase();
        if (routeType === 'CEILING' || routeType === 'TETO') {
          setSelectedConduit('Eletroduto Metálico Galvanizado 1" (Teto)');
          setCableLength(prev => Math.min(60, prev + 5));
          response = 'SUCESSO: Rota alterada para o Teto (Eletroduto Metálico Galvanizado).';
        } else if (routeType === 'FLOOR' || routeType === 'PISO') {
          setSelectedConduit('Eletroduto Corrugado Reforçado PEAD (Piso)');
          setCableLength(prev => Math.max(15, prev - 5));
          response = 'SUCESSO: Rota alterada para o Piso (Canaleta / Subterrâneo).';
        } else {
          response = 'ERRO: Rota inválida. Use "ceiling" (teto) ou "floor" (piso).';
          success = false;
        }
        break;

      case 'CABLE':
      case 'CABO':
        const bitola = parseInt(arg1);
        const validBitolas = [4, 6, 10, 16, 25, 35, 50];
        if (validBitolas.includes(bitola)) {
          setCableBitola(bitola);
          response = `SUCESSO: Bitola do cabo de cobre definida para ${bitola} mm² (NBR 5410).`;
        } else {
          response = `ERRO: Bitola inválida. Escolha entre: ${validBitolas.join(', ')} mm².`;
          success = false;
        }
        break;

      case 'POWER':
      case 'POTENCIA':
        const power = parseFloat(arg1);
        if (power === 7.4 || power === 22 || power === 50) {
          setChargerPower(power);
          response = `SUCESSO: Potência nominal dos carregadores definida para ${power} kW.`;
        } else {
          response = 'ERRO: Potência inválida. Valores aceitos: 7.4 (Monofásico), 22 (Trifásico), 50 (Rápido DC).';
          success = false;
        }
        break;

      case 'LIMIT':
      case 'LIMITE':
        const limitVal = parseInt(arg1);
        if (!isNaN(limitVal) && limitVal >= 16 && limitVal <= 250) {
          setSmartChargingLimit(limitVal);
          response = `SUCESSO: Limite do Smart Charging (Gestão de Demanda) definido para ${limitVal}A.`;
        } else {
          response = 'ERRO: Limite inválido. Escolha um valor entre 16A e 250A.';
          success = false;
        }
        break;

      case 'LAYER':
      case 'CAMADA':
        const layerName = (arg1 || '').toLowerCase();
        const layerState = (arg2 || '').toUpperCase();
        if (layerName in activeLayers && (layerState === 'ON' || layerState === 'OFF')) {
          const stateBool = layerState === 'ON';
          setActiveLayers(prev => ({ ...prev, [layerName]: stateBool }));
          response = `SUCESSO: Camada "${layerName}" definida como ${layerState}.`;
        } else {
          response = `ERRO: Camada inválida ou comando incompleto. Ex: "LAYER conduits off".\n` +
            `Camadas: walls, conduits, chargers, dimensions, trajectory, grid.`;
          success = false;
        }
        break;

      case 'GRID':
      case 'GRADE':
        const gridState = (arg1 || '').toUpperCase();
        if (gridState === 'ON' || gridState === 'OFF') {
          setActiveLayers(prev => ({ ...prev, grid: gridState === 'ON' }));
          response = `SUCESSO: Grade de engenharia definida como ${gridState}.`;
        } else {
          response = 'ERRO: Use "GRID ON" ou "GRID OFF".';
          success = false;
        }
        break;

      case 'CLEAR':
      case 'LIMPAR':
        setCliHistory([]);
        return;

      default:
        response = `ERRO: Comando "${cmd}" não reconhecido. Digite "HELP" para assistência.`;
        success = false;
        break;
    }

    setCliHistory(prev => [...prev, `\n> ${cmdStr}`, response]);
    if (success) {
      showToast(`⌨️ Comando CAD executado: ${cmd}`);
    }
  };

  const handleCliSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliInput.trim()) return;
    executeCliCommand(cliInput);
    setCliInput('');
  };

  // Scroll CLI to bottom
  useEffect(() => {
    if (cliEndRef.current) {
      cliEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [cliHistory]);

  // --- Real-time Video SLAM Simulator Animation ---
  useEffect(() => {
    let interval: any;
    if (isVideoPlaying && !isUploading) {
      interval = setInterval(() => {
        setVideoFrame(prev => {
          const next = prev + 1;
          
          // Sincronized Speech Transcript & AI Logs based on Video Frame (Simulation Fallback)
          if (next === 10) {
            setTranscript("Iniciando a reconstrução 3D da garagem subsolo com base no feed de vídeo...");
            setMultimodalLogs(l => [...l, "[00:02] [DEPTH ANYTHING v2] Resolvendo ambiguidade de escala. Profundidade monocular densa calibrada."]);
          } else if (next === 30) {
            setTranscript("Este é o quadro elétrico principal QE-01. Ele tem um disjuntor geral de 100A, veja.");
            setMultimodalLogs(l => [...l, "[00:06] [YOLOv10-OBB] Quadro de distribuição QE-01 segmentado. OCR confirma barramento geral de 100A."]);
            setSelectedElement('painel');
          } else if (next === 60) {
            setTranscript("Temos espaço disponível no barramento para novos disjuntores de recarga.");
            setMultimodalLogs(l => [...l, "[00:12] [SAM 2 / IA] Analisando reserva do quadro. 8 módulos DIN livres identificados com precisão."]);
          } else if (next === 90) {
            setTranscript("A fiação para os carregadores vai sair do topo do quadro, subir pelo teto...");
            setMultimodalLogs(l => [...l, "[00:18] [BEVFORMER FUSION] Projetando poses de câmera para Bird's Eye View (BEV). Rota calculada no plano de solo."]);
            setSelectedElement('cabos');
          } else if (next === 120) {
            setTranscript("E correr por eletroduto metálico galvanizado de 1 polegada.");
            setMultimodalLogs(l => [...l, "[00:24] [OCCUPANCY NET] Volume livre identificado. Planejador sugere eletroduto de aço galvanizado de 1\" no teto."]);
          } else if (next === 150) {
            setTranscript("Vamos passar pelas vagas 1, 2 e 3, contornando aquela viga de concreto estrutural.");
            setMultimodalLogs(l => [...l, "[00:30] [OCCUPANCY FIELD] Viga estrutural de concreto detectada (sub-voxel 10cm). Trajetória de cabo recalculada."]);
          } else if (next === 180) {
            setTranscript("Aqui serão instalados os 3 carregadores Wallbox Pro de 22kW cada nas vagas pintadas.");
            setMultimodalLogs(l => [...l, "[00:36] [3D GAUSSIAN SPLATTING] Otimizando 1200 Gaussians para vagas. Totens e silhuetas de veículos carregados no modelo."]);
            setSelectedElement('carregadores');
          } else if (next >= 220) {
            setIsVideoPlaying(false);
            setIsScanning(false);
            setScanDone(true);
            showToast("⚡ Mapeamento elétrico por vídeo processado com sucesso pela IA!");
            setTranscript("Mapeamento concluído. O modelo elétrico 3D, a planta baixa 2D e o diagrama unifilar foram totalmente gerados.");
            return 0;
          }

          // Generate dynamic keypoints for SLAM simulation
          const points = [];
          for (let i = 0; i < 25; i++) {
            points.push({
              x: Math.abs(Math.sin(next * 0.05 + i) * 300 + (Math.cos(i) * 50) + 150),
              y: Math.abs(Math.cos(next * 0.03 + i * 2) * 150 + (Math.sin(i) * 40) + 100)
            });
          }
          setSlamFeatures(points);

          // Generate bounding boxes
          const boxes = [];
          if (next >= 25 && next <= 80) {
            boxes.push({ label: 'QUADRO QE-01 [99%]', x: 100 + (next - 25) * 0.5, y: 80, w: 140, h: 180 });
            boxes.push({ label: 'DISJUNTOR GERAL C100 [98%]', x: 150 + (next - 25) * 0.5, y: 130, w: 45, h: 60 });
          }
          if (next >= 85 && next <= 145) {
            boxes.push({ label: 'ROTA TETO [92%]', x: 50, y: 60, w: 500, h: 30 });
          }
          if (next >= 140 && next <= 210) {
            boxes.push({ label: 'VAGA EV 01 [97%]', x: 80, y: 180, w: 120, h: 140 });
            boxes.push({ label: 'VAGA EV 02 [99%]', x: 220, y: 180, w: 120, h: 140 });
            boxes.push({ label: 'VAGA EV 03 [96%]', x: 360, y: 180, w: 120, h: 140 });
          }
          setDetectedObjects(boxes);

          return next;
        });
      }, 60);
    }
    return () => clearInterval(interval);
  }, [isVideoPlaying, isUploading]);

  // Render SLAM HUD Canvas Overlay
  useEffect(() => {
    const canvas = videoCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (isVideoPlaying) {
      // Draw simulated camera image
      ctx.fillStyle = '#070a13';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw background grid lines (cybernetic scan feel)
      ctx.strokeStyle = 'rgba(0, 77, 49, 0.2)';
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 30) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
      }
      for (let i = 0; i < canvas.height; i += 30) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
      }

      // Draw a nice holographic perspective cage in the middle
      ctx.strokeStyle = 'rgba(178, 210, 53, 0.15)';
      ctx.beginPath();
      ctx.moveTo(100, 80); ctx.lineTo(500, 80);
      ctx.lineTo(550, 320); ctx.lineTo(50, 320);
      ctx.closePath();
      ctx.stroke();

      // Draw SLAM tracked features (green dots)
      ctx.fillStyle = '#22c55e';
      slamFeatures.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Faint vector lines
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.15)';
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + Math.sin(videoFrame * 0.2) * 5, p.y + Math.cos(videoFrame * 0.2) * 5);
        ctx.stroke();
      });

      // Draw Object Detection Bounding Boxes (cyan/yellow)
      detectedObjects.forEach(box => {
        ctx.strokeStyle = box.label.includes('VAGA') ? '#eab308' : '#0ea5e9';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(box.x, box.y, box.w, box.h);

        // Box corners
        ctx.fillStyle = box.label.includes('VAGA') ? '#eab308' : '#0ea5e9';
        ctx.fillRect(box.x - 2, box.y - 2, 8, 2);
        ctx.fillRect(box.x - 2, box.y - 2, 2, 8);
        ctx.fillRect(box.x + box.w - 6, box.y - 2, 8, 2);
        ctx.fillRect(box.x + box.w, box.y - 2, 2, 8);
        ctx.fillRect(box.x - 2, box.y + box.h, 8, 2);
        ctx.fillRect(box.x - 2, box.y + box.h - 6, 2, 8);
        ctx.fillRect(box.x + box.w - 6, box.y + box.h, 8, 2);
        ctx.fillRect(box.x + box.w, box.y + box.h - 6, 2, 8);

        // Label box
        ctx.fillRect(box.x - 2, box.y - 18, box.w + 4, 16);
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 9px monospace';
        ctx.fillText(box.label, box.x + 4, box.y - 7);
      });

      // Draw SLAM Target Reticle (Laser pointer look)
      const rX = canvas.width / 2 + Math.sin(videoFrame * 0.1) * 80;
      const rY = canvas.height / 2 + Math.cos(videoFrame * 0.07) * 40;
      ctx.strokeStyle = '#B2D235';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(rX, rY, 15, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(rX, rY, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(rX - 22, rY); ctx.lineTo(rX + 22, rY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(rX, rY - 22); ctx.lineTo(rX, rY + 22); ctx.stroke();

      ctx.fillStyle = '#B2D235';
      ctx.font = '9px monospace';
      ctx.fillText(`SLAM TRACKING POS: [${rX.toFixed(1)}, ${rY.toFixed(1)}]`, rX + 20, rY - 5);
      ctx.fillText(`POSE PRECISION: 99.12%`, rX + 20, rY + 8);
    }
  }, [isVideoPlaying, videoFrame, slamFeatures, detectedObjects, isUploading]);

  // --- Three.js 3D Viewport Implementation ---
  useEffect(() => {
    if (viewMode !== '3d' || !mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x040810);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(28, 18, 28);
    camera.lookAt(0, 2, 0);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.25);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x0ea5e9, 0.7); // Cyan engineering light
    dirLight1.position.set(20, 40, 20);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xB2D235, 0.4); // Lime secondary light
    dirLight2.position.set(-20, 20, -20);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0xffffff, 0.8, 50);
    pointLight.position.set(0, 10, 0);
    scene.add(pointLight);

    // 5. AutoCAD-Style Engineering Grid (Layer: grid)
    let gridHelperMajor: THREE.GridHelper | null = null;
    let gridHelperMinor: THREE.GridHelper | null = null;
    let axesHelper: THREE.AxesHelper | null = null;

    if (activeLayers.grid) {
      // Major Grid: 50m range, 10 divisions (every 5 meters), colored cyan/teal
      gridHelperMajor = new THREE.GridHelper(50, 10, 0x0ea5e9, 0x1e293b);
      gridHelperMajor.position.y = -0.005;
      scene.add(gridHelperMajor);

      // Minor Grid: 50m range, 50 divisions (every 1 meter), colored dark slate/blue
      gridHelperMinor = new THREE.GridHelper(50, 50, 0x0284c7, 0x0f172a);
      gridHelperMinor.position.y = -0.01;
      if (gridHelperMinor.material instanceof THREE.Material) {
        gridHelperMinor.material.transparent = true;
        gridHelperMinor.material.opacity = 0.25;
      }
      scene.add(gridHelperMinor);

      // Coordinates axes helper
      axesHelper = new THREE.AxesHelper(6);
      axesHelper.position.set(-15, 0.05, -15);
      scene.add(axesHelper);
    }

    // 6. BIM Structural Environment Geometry (Layer: walls)
    if (activeLayers.walls) {
      // Subfloor concrete slab (technical texture representation)
      const floorGeo = new THREE.BoxGeometry(40, 0.2, 30);
      const floorMat = new THREE.MeshStandardMaterial({ 
        color: 0x0d111a, 
        roughness: 0.9, 
        metalness: 0.1 
      });
      const floor = new THREE.Mesh(floorGeo, floorMat);
      floor.position.y = -0.1;
      scene.add(floor);

      // Concrete Columns (Pillars) with capitals & structural beams
      const pillarGeo = new THREE.BoxGeometry(1.4, 8, 1.4);
      const pillarMat = new THREE.MeshStandardMaterial({ 
        color: 0x1b2330, 
        roughness: 0.8,
        metalness: 0.2
      });
      
      // Wireframe overlay for structural engineering analysis look (BIM/FEA feel)
      const fEMat = new THREE.MeshBasicMaterial({ 
        color: 0x0ea5e9, 
        wireframe: true, 
        transparent: true, 
        opacity: 0.12 
      });

      const pillars = [
        { x: -10, z: -8 }, { x: -10, z: 8 },
        { x: 5, z: -8 }, { x: 5, z: 8 }
      ];
      
      pillars.forEach(p => {
        // Main structural column
        const pillar = new THREE.Mesh(pillarGeo, pillarMat);
        pillar.position.set(p.x, 4, p.z);
        scene.add(pillar);

        // FEA/BIM Wireframe overlay
        const pillarFE = new THREE.Mesh(pillarGeo, fEMat);
        pillarFE.position.set(p.x, 4, p.z);
        pillarFE.scale.set(1.01, 1.01, 1.01);
        scene.add(pillarFE);

        // Column Capital (Bevel at top of column)
        const capGeo = new THREE.BoxGeometry(2.0, 0.4, 2.0);
        const cap = new THREE.Mesh(capGeo, pillarMat);
        cap.position.set(p.x, 7.8, p.z);
        scene.add(cap);
      });

      // Concrete structural ceiling beams connecting columns
      const beamGeoX1 = new THREE.BoxGeometry(40, 0.8, 1.0);
      const beamX1 = new THREE.Mesh(beamGeoX1, pillarMat);
      beamX1.position.set(0, 7.6, -8);
      scene.add(beamX1);

      const beamX2 = new THREE.Mesh(beamGeoX1, pillarMat);
      beamX2.position.set(0, 7.6, 8);
      scene.add(beamX2);

      const beamGeoZ = new THREE.BoxGeometry(1.0, 0.8, 30);
      const beamZ1 = new THREE.Mesh(beamGeoZ, pillarMat);
      beamZ1.position.set(-10, 7.6, 0);
      scene.add(beamZ1);

      const beamZ2 = new THREE.Mesh(beamGeoZ, pillarMat);
      beamZ2.position.set(5, 7.6, 0);
      scene.add(beamZ2);

      // FEA wireframe overlays for beams
      const beamX1FE = new THREE.Mesh(beamGeoX1, fEMat);
      beamX1FE.position.set(0, 7.6, -8);
      beamX1FE.scale.set(1.01, 1.01, 1.01);
      scene.add(beamX1FE);

      const beamX2FE = new THREE.Mesh(beamGeoX1, fEMat);
      beamX2FE.position.set(0, 7.6, 8);
      beamX2FE.scale.set(1.01, 1.01, 1.01);
      scene.add(beamX2FE);

      // Back Wall
      const wallGeo = new THREE.BoxGeometry(40, 8, 0.4);
      const wallMat = new THREE.MeshStandardMaterial({ color: 0x0b0e14, roughness: 0.95 });
      const wall = new THREE.Mesh(wallGeo, wallMat);
      wall.position.set(0, 4, -15);
      scene.add(wall);
    }

    // 7. High-Detail Technical Electrical Panel (QE-01)
    const panelGroup = new THREE.Group();
    
    // Main enclosure cabinet (Grey steel)
    const panelBodyGeo = new THREE.BoxGeometry(1.8, 2.4, 0.5);
    const panelBodyMat = new THREE.MeshStandardMaterial({ 
      color: 0x3b4b5e, 
      metalness: 0.8, 
      roughness: 0.25 
    });
    const panelBody = new THREE.Mesh(panelBodyGeo, panelBodyMat);
    panelBody.castShadow = true;
    panelGroup.add(panelBody);

    // Beveled door frame overlay
    const doorFrameGeo = new THREE.BoxGeometry(1.6, 2.2, 0.05);
    const doorFrameMat = new THREE.MeshStandardMaterial({ color: 0x2e3b4a, metalness: 0.85, roughness: 0.3 });
    const doorFrame = new THREE.Mesh(doorFrameGeo, doorFrameMat);
    doorFrame.position.set(0, 0, 0.26);
    panelGroup.add(doorFrame);

    // Glowing LCD Digital Grid Analyzer Screen (Cyan)
    const lcdGeo = new THREE.PlaneGeometry(0.7, 0.4);
    const lcdMat = new THREE.MeshBasicMaterial({ 
      color: 0x0ea5e9,
      toneMapped: false
    });
    const lcd = new THREE.Mesh(lcdGeo, lcdMat);
    lcd.position.set(0, 0.5, 0.29);
    panelGroup.add(lcd);

    // Three-phase pilot lights (Red, Yellow, Green)
    const pilotGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.05, 8);
    
    const rPilot = new THREE.Mesh(pilotGeo, new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    rPilot.rotation.x = Math.PI / 2;
    rPilot.position.set(-0.4, 0.8, 0.29);
    panelGroup.add(rPilot);

    const yPilot = new THREE.Mesh(pilotGeo, new THREE.MeshBasicMaterial({ color: 0xeab308 }));
    yPilot.rotation.x = Math.PI / 2;
    yPilot.position.set(-0.2, 0.8, 0.29);
    panelGroup.add(yPilot);

    const gPilot = new THREE.Mesh(pilotGeo, new THREE.MeshBasicMaterial({ color: 0x10b981 }));
    gPilot.rotation.x = Math.PI / 2;
    gPilot.position.set(0, 0.8, 0.29);
    panelGroup.add(gPilot);

    // 3D Red Emergency Breaker Handle
    const breakerBoxGeo = new THREE.BoxGeometry(0.15, 0.3, 0.15);
    const breakerBox = new THREE.Mesh(breakerBoxGeo, new THREE.MeshStandardMaterial({ color: 0x1e293b }));
    breakerBox.position.set(0.4, 0.0, 0.3);
    panelGroup.add(breakerBox);

    const handleGeo = new THREE.BoxGeometry(0.06, 0.2, 0.15);
    const handle = new THREE.Mesh(handleGeo, new THREE.MeshBasicMaterial({ color: 0xd97706 })); // Orange/Red handle
    handle.rotation.z = -Math.PI / 6;
    handle.position.set(0.4, 0.0, 0.4);
    panelGroup.add(handle);

    // Position panel in room
    panelGroup.position.set(-15, 4, -14.65);
    scene.add(panelGroup);

    // 8. High-Fidelity Wallbox Chargers (Layer: chargers)
    const chargersGroup = new THREE.Group();
    chargersGroupRef.current = chargersGroup;
    
    if (activeLayers.chargers) {
      // Pedestal column: Sleek beveled H-beam profile
      const pedestalGeo = new THREE.BoxGeometry(0.2, 3.2, 0.2);
      const pedestalMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.4 });
      
      // Wallbox charger body: Dual-tone technical case
      const boxBackGeo = new THREE.BoxGeometry(0.44, 0.8, 0.25);
      const boxBackMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.4, roughness: 0.5 });
      const boxFrontGeo = new THREE.BoxGeometry(0.4, 0.76, 0.1);
      const boxFrontMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });

      // Torus geometry for the iconic glowing LED charging ring
      const ledRingGeo = new THREE.TorusGeometry(0.1, 0.015, 8, 24);
      const ledRingMat = new THREE.MeshBasicMaterial({ color: 0xB2D235 });

      const zCoords = [-5, 0, 5, 10, 15].slice(0, chargerCount);
      
      zCoords.forEach((z, idx) => {
        const singleChargerGroup = new THREE.Group();
        
        // Technical structural pedestal
        const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
        pedestal.position.y = 1.6;
        pedestal.castShadow = true;
        singleChargerGroup.add(pedestal);

        // Heavy base plate
        const basePlateGeo = new THREE.BoxGeometry(0.6, 0.1, 0.6);
        const basePlate = new THREE.Mesh(basePlateGeo, pedestalMat);
        basePlate.position.y = 0.05;
        singleChargerGroup.add(basePlate);

        // Charger back enclosure
        const backCase = new THREE.Mesh(boxBackGeo, boxBackMat);
        backCase.position.set(0, 2.9, 0);
        backCase.castShadow = true;
        singleChargerGroup.add(backCase);

        // Charger front faceplate
        const frontCase = new THREE.Mesh(boxFrontGeo, boxFrontMat);
        frontCase.position.set(0, 2.9, 0.13);
        singleChargerGroup.add(frontCase);

        // Glowing status LED ring
        const ledRing = new THREE.Mesh(ledRingGeo, ledRingMat);
        ledRing.position.set(0, 3.0, 0.185);
        singleChargerGroup.add(ledRing);

        // Coiled technical 3D cable (Helix curve - highly professional)
        const helixPoints = [];
        const coilCount = 5;
        const totalPoints = 80;
        const radius = 0.12;
        const startY = 2.5;
        const endY = 1.2;
        
        for (let i = 0; i <= totalPoints; i++) {
          const t = (i / totalPoints) * Math.PI * 2 * coilCount;
          const pct = i / totalPoints;
          const x = radius * Math.sin(t);
          const z = radius * Math.cos(t) + 0.12; // offset forward
          const y = startY - pct * (startY - endY);
          helixPoints.push(new THREE.Vector3(x, y, z));
        }

        // Loop plug drop
        helixPoints.push(new THREE.Vector3(0.0, 1.1, 0.18));
        helixPoints.push(new THREE.Vector3(0.15, 1.15, 0.18));
        helixPoints.push(new THREE.Vector3(0.15, 2.3, 0.16)); // plug returning to holster
        
        const cableCurve = new THREE.CatmullRomCurve3(helixPoints);
        const cableGeo = new THREE.TubeGeometry(cableCurve, 60, 0.024, 8, false);
        const cableMat = new THREE.MeshStandardMaterial({ 
          color: 0x111827, 
          roughness: 0.95 
        });
        const cableMesh = new THREE.Mesh(cableGeo, cableMat);
        singleChargerGroup.add(cableMesh);

        // Plug holster on the side
        const holsterGeo = new THREE.BoxGeometry(0.1, 0.25, 0.15);
        const holster = new THREE.Mesh(holsterGeo, pedestalMat);
        holster.position.set(0.18, 2.4, 0.1);
        singleChargerGroup.add(holster);

        // Yellow Parking Space floor border markings
        const spotLineGeo = new THREE.BoxGeometry(5.5, 0.01, 2.8);
        const spotLineMat = new THREE.MeshBasicMaterial({ 
          color: 0xeab308, 
          transparent: true, 
          opacity: 0.12 
        });
        const spotBox = new THREE.Mesh(spotLineGeo, spotLineMat);
        spotBox.position.set(2.75, 0.005, 0);
        singleChargerGroup.add(spotBox);

        // Parking wheel-stopper block in 3D
        const stopperGeo = new THREE.BoxGeometry(0.2, 0.15, 2.2);
        const stopperMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 });
        const stopper = new THREE.Mesh(stopperGeo, stopperMat);
        stopper.position.set(0.8, 0.075, 0);
        singleChargerGroup.add(stopper);

        // 3D Point-Cloud Vehicle Silhouette (Simulated LiDAR sensor detection)
        if (idx < 2) {
          const carPointsGeo = new THREE.BufferGeometry();
          const carPointsList = [];

          // Generate a point cloud profile that actually outlines a sedan car (Tesla shape)
          // Wheels (4 cylinders)
          const wheelOffsets = [
            { cx: 2.0, cz: 0.8 }, { cx: 4.2, cz: 0.8 },
            { cx: 2.0, cz: -0.8 }, { cx: 4.2, cz: -0.8 }
          ];
          wheelOffsets.forEach(w => {
            for (let a = 0; a < Math.PI * 2; a += 0.4) {
              carPointsList.push(
                w.cx + 0.35 * Math.cos(a), 
                0.35 + 0.35 * Math.sin(a), 
                w.cz
              );
              carPointsList.push(
                w.cx + 0.35 * Math.cos(a), 
                0.35 + 0.35 * Math.sin(a), 
                w.cz + (w.cz > 0 ? -0.1 : 0.1)
              );
            }
          });

          // Chassis body frame lines and surfaces (length 4.8m, width 1.8m, height 1.4m)
          for (let cx = 1.2; cx <= 5.2; cx += 0.25) {
            const isHood = cx < 2.0;
            const isCabin = cx >= 2.0 && cx <= 4.0;
            const isTrunk = cx > 4.0;
            
            let cyMax = 0.8;
            if (isHood) cyMax = 0.8;
            else if (isCabin) cyMax = 0.8 + Math.sin((cx - 2.0) / 2.0 * Math.PI) * 0.6; // windshield curve
            else if (isTrunk) cyMax = 0.9 - (cx - 4.0) * 0.2;

            // Generate dots across the cross-sections of the car skin
            for (let cz = -0.9; cz <= 0.9; cz += 0.3) {
              // Add top surface points
              carPointsList.push(cx, cyMax, cz);
              // Add side wall points
              carPointsList.push(cx, cyMax * 0.5, -0.9);
              carPointsList.push(cx, cyMax * 0.5, 0.9);
            }
          }

          const carPositions = new Float32Array(carPointsList);
          carPointsGeo.setAttribute('position', new THREE.BufferAttribute(carPositions, 3));
          
          const carPointsMat = new THREE.PointsMaterial({ 
            color: 0x0ea5e9, 
            size: 0.07, 
            transparent: true, 
            opacity: 0.5 
          });
          const carCloud = new THREE.Points(carPointsGeo, carPointsMat);
          carCloud.position.set(0, 0, 0);
          singleChargerGroup.add(carCloud);
          
          // Add 3D cyan bounding box enclosing the detected vehicle (technical CAD look)
          const boxHelperGeo = new THREE.BoxGeometry(4.6, 1.4, 1.9);
          const boxHelperMat = new THREE.MeshBasicMaterial({ 
            color: 0x0ea5e9, 
            wireframe: true, 
            transparent: true, 
            opacity: 0.25 
          });
          const boundingBoxMesh = new THREE.Mesh(boxHelperGeo, boxHelperMat);
          boundingBoxMesh.position.set(3.2, 0.7, 0);
          singleChargerGroup.add(boundingBoxMesh);
        }

        singleChargerGroup.position.set(10, 0, z);
        chargersGroup.add(singleChargerGroup);
      });
      scene.add(chargersGroup);
    }

    // 9. Galvanized Steel 3D Conduit Network (Layer: conduits)
    const conduitsGroup = new THREE.Group();
    conduitMeshRef.current = conduitsGroup;
    flowParticlesRef.current = [];

    if (activeLayers.conduits) {
      // High-quality galvanized metal conduit material
      const conduitMat = new THREE.MeshStandardMaterial({ 
        color: 0x8ea2b9, 
        metalness: 0.95, 
        roughness: 0.15 
      });
      // T-junction and joint box material
      const jointMat = new THREE.MeshStandardMaterial({ 
        color: 0x475569, 
        metalness: 0.8, 
        roughness: 0.3 
      });

      const conduitThick = 0.05; // ~50mm diameter pipe
      const mainZCoords = [-5, 0, 5, 10, 15].slice(0, chargerCount);

      // Helper function to create a 3D pipe segment
      const createPipe = (p1: THREE.Vector3, p2: THREE.Vector3) => {
        const distance = p1.distanceTo(p2);
        const pipeGeo = new THREE.CylinderGeometry(conduitThick, conduitThick, distance, 12);
        const pipe = new THREE.Mesh(pipeGeo, conduitMat);
        
        // Position at midpoint
        const midpoint = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
        pipe.position.copy(midpoint);
        
        // Rotate pipe to align with direction vector
        const direction = new THREE.Vector3().subVectors(p2, p1).normalize();
        const alignAxis = new THREE.Vector3(0, 1, 0);
        pipe.quaternion.setFromUnitVectors(alignAxis, direction);
        pipe.castShadow = true;
        conduitsGroup.add(pipe);
      };

      // Helper to create a junction box (condubox) at intersections
      const createJunctionBox = (pos: THREE.Vector3) => {
        const boxGeo = new THREE.BoxGeometry(0.18, 0.18, 0.18);
        const jBox = new THREE.Mesh(boxGeo, jointMat);
        jBox.position.copy(pos);
        conduitsGroup.add(jBox);
      };

      if (selectedConduit.includes('Teto')) {
        // --- CEILING ROUTE (Real 3D pipe routing with fittings) ---
        // Coordinates:
        const pQE = new THREE.Vector3(-15, 5.2, -14.4);
        const pCeilQE = new THREE.Vector3(-15, 7.5, -14.4);
        const pCeilBack = new THREE.Vector3(-15, 7.5, -14.0);
        
        // 1. Vertical pipe up from distribution panel
        createPipe(pQE, pCeilQE);
        createJunctionBox(pQE);
        
        // 2. Elbow bend from wall to ceiling
        createPipe(pCeilQE, pCeilBack);
        createJunctionBox(pCeilQE);

        // 3. Main header line running along the back wall to the chargers' column (X: -15 to X: 10 at Y: 7.5)
        const pHeaderEnd = new THREE.Vector3(10, 7.5, -14.0);
        createPipe(pCeilBack, pHeaderEnd);
        createJunctionBox(pCeilBack);

        // 4. Branch conduit drop-downs for each charger slot
        mainZCoords.forEach(z => {
          const pBranchT = new THREE.Vector3(10, 7.5, z);
          const pBranchDrop = new THREE.Vector3(10, 3.3, z);
          
          // Connect from the main header line running along X:10 to the branch T-junction
          const pHeaderInter = new THREE.Vector3(10, 7.5, -14.0);
          // Pipe running along Z axis from back wall to charger Z-coordinate
          createPipe(new THREE.Vector3(10, 7.5, -14.0), pBranchT);
          createJunctionBox(pBranchT);

          // Vertical drop-down to charger top
          createPipe(pBranchT, pBranchDrop);
          createJunctionBox(pBranchDrop);

          // Glowing electric flow indicator sphere
          const flowGeo = new THREE.SphereGeometry(0.08, 8, 8);
          const flowMat = new THREE.MeshBasicMaterial({ 
            color: 0xB2D235,
            toneMapped: false
          });
          const flow = new THREE.Mesh(flowGeo, flowMat);
          flow.position.copy(pBranchT);
          conduitsGroup.add(flow);
          flowParticlesRef.current.push(flow);
        });

      } else {
        // --- FLOOR ROUTE (Subterranean pipe routing with fittings) ---
        const pQE = new THREE.Vector3(-15, 2.8, -14.4);
        const pFloorQE = new THREE.Vector3(-15, 0.15, -14.4);
        const pFloorBack = new THREE.Vector3(-15, 0.15, -14.0);

        // 1. Vertical pipe down to floor
        createPipe(pQE, pFloorQE);
        createJunctionBox(pQE);
        createJunctionBox(pFloorQE);

        // 2. Connector to main wall trench
        createPipe(pFloorQE, pFloorBack);

        // 3. Main subterranean corridor along back wall
        const pHeaderEnd = new THREE.Vector3(10, 0.15, -14.0);
        createPipe(pFloorBack, pHeaderEnd);

        // 4. Branch riser pipes up to the charger base
        mainZCoords.forEach(z => {
          const pBranchT = new THREE.Vector3(10, 0.15, z);
          const pBranchRise = new THREE.Vector3(10, 0.8, z);

          // Sub-floor run to the pedestal location
          createPipe(new THREE.Vector3(10, 0.15, -14.0), pBranchT);
          createJunctionBox(pBranchT);

          // Riser up to pedestal entry
          createPipe(pBranchT, pBranchRise);
          createJunctionBox(pBranchRise);

          // Glowing electric flow indicator sphere
          const flowGeo = new THREE.SphereGeometry(0.08, 8, 8);
          const flowMat = new THREE.MeshBasicMaterial({ 
            color: 0x0ea5e9,
            toneMapped: false
          });
          const flow = new THREE.Mesh(flowGeo, flowMat);
          flow.position.copy(pBranchT);
          conduitsGroup.add(flow);
          flowParticlesRef.current.push(flow);
        });
      }

      scene.add(conduitsGroup);
    }

    // 10. Camera Trajectory Walkthrough Line (Layer: trajectory)
    if (activeLayers.trajectory) {
      const trajPoints: THREE.Vector3[] = [];
      // S-curve walking path simulating a walkthrough tour
      for (let i = 0; i <= 30; i++) {
        const tVal = i / 30;
        const x = -15 + tVal * 25;
        const z = -12 + Math.sin(tVal * Math.PI * 2) * 4.5;
        const y = 3 + Math.sin(tVal * Math.PI * 4) * 0.3; // camera shake simulation
        trajPoints.push(new THREE.Vector3(x, y, z));
      }
      
      const trajGeo = new THREE.BufferGeometry().setFromPoints(trajPoints);
      const trajMat = new THREE.LineDashedMaterial({
        color: 0x10b981,
        dashSize: 0.8,
        gapSize: 0.4,
      });
      const trajLine = new THREE.Line(trajGeo, trajMat);
      trajLine.computeLineDistances();
      scene.add(trajLine);
      trajectoryLineRef.current = trajLine;

      // LiDAR scanner visual frustum cone representing active scan (Green laser wireframe)
      const frustumGeo = new THREE.ConeGeometry(2.2, 5.0, 4, 1, true);
      const frustumMat = new THREE.MeshBasicMaterial({ 
        color: 0x10b981, 
        wireframe: true, 
        transparent: true, 
        opacity: 0.15 
      });
      
      [8, 20].forEach(idx => {
        const frust = new THREE.Mesh(frustumGeo, frustumMat);
        frust.position.copy(trajPoints[idx]);
        // Point cone towards chargers
        frust.rotation.x = Math.PI / 2;
        frust.lookAt(10, 2, 0);
        scene.add(frust);
      });
    }

    // 11. Height-Gradient LiDAR Point Cloud (Layer: LiDAR)
    // Renders a high-density, realistic point cloud colored by Z/Y elevation (standard LiDAR output)
    const pointsGeo = new THREE.BufferGeometry();
    const pCount = 2800; // denser point cloud
    const pPositions = new Float32Array(pCount * 3);
    const pColors = new Float32Array(pCount * 3);
    
    // Color palette representing LiDAR height scale: 
    // Low (Floor) = Deep Blue/Indigo -> Mid = Teal/Green -> High (Ceiling) = Orange/Red
    const getColorForHeight = (yVal: number) => {
      const normY = Math.min(1, Math.max(0, yVal / 8)); // scale 0 to 8m height
      const color = new THREE.Color();
      if (normY < 0.3) {
        // Interpolate Blue to Teal
        color.setHSL(0.6 - (normY / 0.3) * 0.15, 0.8, 0.4);
      } else if (normY < 0.7) {
        // Interpolate Teal to Green-Yellow
        color.setHSL(0.45 - ((normY - 0.3) / 0.4) * 0.25, 0.9, 0.45);
      } else {
        // Interpolate Yellow to Orange-Red
        color.setHSL(0.2 - ((normY - 0.7) / 0.3) * 0.2, 1.0, 0.5);
      }
      return color;
    };

    for (let i = 0; i < pCount; i++) {
      const wallPick = Math.random();
      let px = 0, py = 0, pz = 0;

      if (wallPick < 0.35) {
        // Ceiling points
        px = (Math.random() - 0.5) * 42;
        py = 7.8 + (Math.random() - 0.5) * 0.15;
        pz = (Math.random() - 0.5) * 32;
      } else if (wallPick < 0.7) {
        // Back wall points
        px = (Math.random() - 0.5) * 42;
        py = Math.random() * 8;
        pz = -14.9 + (Math.random() - 0.5) * 0.1;
      } else {
        // Structural pillars & surrounding scan noise
        const pillarIndex = Math.floor(Math.random() * 4);
        const pillarCoords = [
          { x: -10, z: -8 }, { x: -10, z: 8 },
          { x: 5, z: -8 }, { x: 5, z: 8 }
        ][pillarIndex];

        // Wrap points around column outline
        const angle = Math.random() * Math.PI * 2;
        const radius = 0.7 + Math.random() * 0.05;
        px = pillarCoords.x + radius * Math.cos(angle);
        py = Math.random() * 8;
        pz = pillarCoords.z + radius * Math.sin(angle);
      }

      pPositions[i * 3] = px;
      pPositions[i * 3 + 1] = py;
      pPositions[i * 3 + 2] = pz;

      // Height-based color coding
      const c = getColorForHeight(py);
      pColors[i * 3] = c.r;
      pColors[i * 3 + 1] = c.g;
      pColors[i * 3 + 2] = c.b;
    }

    pointsGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    pointsGeo.setAttribute('color', new THREE.BufferAttribute(pColors, 3));

    const pointsMat = new THREE.PointsMaterial({
      size: 0.07,
      vertexColors: true,
      transparent: true,
      opacity: 0.45
    });

    const pointCloud = new THREE.Points(pointsGeo, pointsMat);
    scene.add(pointCloud);
    pointCloudRef.current = pointCloud;

    // --- Custom Camera Mouse Orbit Controls (Safe from SSR & Next.js bundle crashes) ---
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let theta = Math.PI / 4; // horizontal angle
    let phi = Math.PI / 5;   // vertical angle
    let radius = 42;        // camera distance

    const updateCameraPosition = () => {
      if (!cameraRef.current) return;
      cameraRef.current.position.x = radius * Math.sin(theta) * Math.cos(phi);
      cameraRef.current.position.y = Math.max(2, radius * Math.sin(phi));
      cameraRef.current.position.z = radius * Math.cos(theta) * Math.cos(phi);
      cameraRef.current.lookAt(0, 2.5, 0);
    };

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !cameraRef.current) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      theta -= deltaX * 0.006;
      phi = Math.max(0.05, Math.min(Math.PI / 2 - 0.05, phi + deltaY * 0.006)); // Clamp vertical rotation

      updateCameraPosition();
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      radius = Math.max(10, Math.min(90, radius + e.deltaY * 0.04));
      updateCameraPosition();
    };

    // Attach event listeners to the canvas container
    const domElement = mountRef.current;
    domElement.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    domElement.addEventListener('wheel', handleWheel, { passive: false });

    // Initial positioning
    updateCameraPosition();

    // 13. Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Pulsing effect for point cloud
      if (pointCloudRef.current) {
        // Make the point cloud shimmer slightly
        (pointCloudRef.current.material as any).opacity = 0.4 + Math.sin(elapsedTime * 3) * 0.1;
      }

      // Animate flowing electricity along conduits
      if (flowParticlesRef.current.length > 0) {
        flowParticlesRef.current.forEach((particle, idx) => {
          // Parametric flow based on time
          const speed = 4.5;
          const routeOffset = idx * 1.5;
          const cycle = (elapsedTime * speed + routeOffset) % 18;
          
          if (selectedConduit.includes('Teto')) {
            // Ceiling path: QE panel up -> along back wall -> down to charger
            if (cycle < 3) {
              // Vertical up from QE: -15, 4+cycle, -14.3
              particle.position.set(-15, 4 + cycle * 1.16, -14.3);
            } else if (cycle < 12) {
              // Horizontal along back wall: -15 -> 10
              const t = (cycle - 3) / 9;
              const zVal = chargersGroup.children[idx]?.position.z ?? 0;
              // Map towards Z of the respective charger
              particle.position.set(-15 + t * 25, 7.5, -14.3 + t * (zVal - (-14.3)));
            } else {
              // Drop down to charger: Y: 7.5 -> Y: 3.6
              const t = (cycle - 12) / 6;
              const zVal = chargersGroup.children[idx]?.position.z ?? 0;
              particle.position.set(10, 7.5 - t * 3.9, zVal);
            }
          } else {
            // Floor path: QE panel down -> along back wall floor -> up to charger
            if (cycle < 3) {
              // Vertical down from QE
              particle.position.set(-15, 4 - cycle * 1.3, -14.3);
            } else if (cycle < 12) {
              // Horizontal along back wall floor
              const t = (cycle - 3) / 9;
              const zVal = chargersGroup.children[idx]?.position.z ?? 0;
              particle.position.set(-15 + t * 25, 0.1, -14.3 + t * (zVal - (-14.3)));
            } else {
              // Drop up from floor
              const t = (cycle - 12) / 6;
              const zVal = chargersGroup.children[idx]?.position.z ?? 0;
              particle.position.set(10, 0.1 + t * 2.7, zVal);
            }
          }
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    // Clean up
    return () => {
      cancelAnimationFrame(animationFrameId);
      domElement.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      domElement.removeEventListener('wheel', handleWheel);
      
      if (rendererRef.current && domElement.contains(rendererRef.current.domElement)) {
        domElement.removeChild(rendererRef.current.domElement);
      }
      
      // Dispose geometries & materials
      scene.traverse((object: any) => {
        if (!object.isMesh) return;
        object.geometry.dispose();
        if (object.material.isMaterial) {
          object.material.dispose();
        } else {
          for (const material of object.material) material.dispose();
        }
      });
    };
  }, [viewMode, chargerCount, selectedConduit, activeLayers]);

  // Handle AutoCAD-style canvas mouse tracking
  const handleCadMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cadCanvasRef.current) return;
    const rect = cadCanvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert pixels to virtual CAD meters (Scale: 15px = 1m)
    const meterX = ((x - 80) / 15).toFixed(2);
    const meterY = ((300 - y) / 15).toFixed(2);

    setCadMousePos({ x: parseFloat(meterX), y: parseFloat(meterY) });
  };

  // --- Real Backend Video/YouTube Upload Integration ---
  const uploadAndProcessVideo = async (input: File | string) => {
    setIsScanning(true);
    setScanDone(false);
    setIsUploading(true);
    setIsVideoPlaying(true);
    setVideoFrame(0);
    
    const isYoutube = typeof input === 'string';
    const logSource = isYoutube ? "link do YouTube" : `arquivo local "${(input as File).name}"`;
    
    setTranscript(isYoutube ? "Conectando ao YouTube e importando faixa de áudio e vídeo..." : "Conectando ao servidor em Python e enviando arquivo de vídeo...");
    setMultimodalLogs([
      "[SISTEMA] Inicializando pipeline de automação local...",
      `[SISTEMA] Enviando ${logSource} para o servidor Flask (porta 5000)...`,
      "[SISTEMA] Aguardando processamento físico e cálculos elétricos NBR 5410..."
    ]);

    const formData = new FormData();
    if (isYoutube) {
      formData.append('youtube_url', input as string);
    } else {
      formData.append('video', input as File);
    }
    
    formData.append('charger_count', chargerCount.toString());
    formData.append('charger_power', chargerPower.toString());
    formData.append('smart_charging_limit', smartChargingLimit.toString());
    formData.append('cable_bitola', cableBitola.toString());
    formData.append('conduit_type', selectedConduit);

    try {
      // POST Request for real python backend processing
      const response = await fetch('http://localhost:5000/api/process-video', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Falha de resposta no servidor local.');
      }

      const result = await response.json();
      
      if (result.success) {
        // 1. Update React states with real data returned by ezdxf/Flask backend
        setCableLength(result.cableLength);
        setChargerCount(result.chargerCount);
        setCableBitola(result.cableBitola);
        setVoltageDrop(result.voltageDrop);
        setSelectedConduit(result.conduitType);
        setDxfDownloadUrl(result.dxfUrl);

        // 2. Synchronize transcription and multimodal logs
        setTranscript(result.transcript);
        setMultimodalLogs(result.multimodalLogs);
        
        showToast(isYoutube ? '⚡ Projeto elétrico gerado a partir do YouTube com sucesso!' : '⚡ Mapeamento elétrico processado com sucesso pelo Back-end!');
        
        // Brief timeout to finalize the visual scan transition
        setTimeout(() => {
          setIsUploading(false);
          setIsVideoPlaying(false);
          setIsScanning(false);
          setScanDone(true);
          
          setCliHistory(prev => [
            ...prev,
            `\n[SISTEMA]: Conectado ao back-end local em Python.`,
            `[SISTEMA]: Arquivo AutoCAD DXF real gerado por ezdxf: ${result.dxfUrl.split('/').pop()}`,
            `[SISTEMA]: Comprimento da fiação: ${result.cableLength}m | Bitola: ${result.cableBitola}mm² | Queda de Tensão: ${result.voltageDrop}%`
          ]);
        }, 1200);

      } else {
        throw new Error(result.error || 'Erro desconhecido');
      }
    } catch (err: any) {
      console.error(err);
      showToast('⚠️ Back-end offline. Iniciando simulação de contingência no navegador.');
      
      setMultimodalLogs(prev => [
        ...prev,
        "[AVISO] Não foi possível conectar ao servidor Python na porta 5000.",
        "[AVISO] Certifique-se de executar o comando 'py app.py' em 'proposal-pro'!",
        "[SISTEMA] Ativando processamento heurístico local de contingência..."
      ]);

      // Fallback: run simulated scan on frontend so the user experience stays smooth
      setTimeout(() => {
        setIsUploading(false);
        // Generates mockup data if backend is offline
        setDxfDownloadUrl(null);
      }, 1000);
    }
  };

  // Trigger file dialog
  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
  };

  // Handle manual file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadAndProcessVideo(files[0]);
    }
  };

  // Handle YouTube URL submit
  const handleYoutubeProcess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeUrl.trim()) {
      showToast('⚠️ Digite um link do YouTube válido.');
      return;
    }
    uploadAndProcessVideo(youtubeUrl.trim());
  };

  // Handle "Simulate Walking Tour Upload" button
  const handleSimulateTourUpload = () => {
    // Create a mock video file to upload to the real python API
    const mockBlob = new Blob(['mock_video_bytes'], { type: 'video/mp4' });
    const mockFile = new File([mockBlob], 'vistoria_tecnica_garagem_3d.mp4', { type: 'video/mp4' });
    uploadAndProcessVideo(mockFile);
  };

  const handleApplyAIPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim()) return;

    setIsApplyingPrompt(true);
    const userPrompt = promptInput.trim().toLowerCase();
    setPromptHistory(prev => [...prev, promptInput]);
    setPromptInput('');

    // Simulate AI reasoning and layout updating based on user prompts
    setTimeout(() => {
      setIsApplyingPrompt(false);
      
      if (userPrompt.includes('adicionar') || userPrompt.includes('mais') || userPrompt.includes('carregador')) {
        setChargerCount(prev => Math.min(5, prev + 1));
        setCableLength(prev => prev + 8);
        showToast('🤖 IA: Adicionado novo carregador elétrico ao projeto. Infraestrutura recalculada.');
        setCliHistory(prev => [...prev, '\n[IA]: Adicionado novo ponto de recarga veicular (Stall).']);
      } else if (userPrompt.includes('piso') || userPrompt.includes('desviar') || userPrompt.includes('chão')) {
        setSelectedConduit('Eletroduto Corrugado Reforçado PEAD (Piso)');
        setCableLength(prev => Math.max(15, prev - 5));
        showToast('🤖 IA: Rota de eletrodutos alterada para o piso. Planta 3D atualizada.');
        setCliHistory(prev => [...prev, '\n[IA]: Rota de cabos remanejada para o subsolo (Piso).']);
      } else if (userPrompt.includes('cabo') || userPrompt.includes('bitola') || userPrompt.includes('gross')) {
        setCableBitola(16);
        showToast('🤖 IA: Seção nominal dos condutores aumentada para 16mm².');
        setCliHistory(prev => [...prev, '\n[IA]: Seção de cabos alterada para 16mm² para reduzir queda de tensão.']);
      } else if (userPrompt.includes('teto') || userPrompt.includes('aereo')) {
        setSelectedConduit('Eletroduto Metálico Galvanizado 1" (Teto)');
        setCableLength(prev => Math.min(60, prev + 5));
        showToast('🤖 IA: Rota alterada para o teto.');
      } else {
        showToast('🤖 IA: Ajuste de design elétrico processado e aplicado ao modelo.');
      }
    }, 1500);
  };

  const handleExport = (format: string) => {
    if (format.includes('AutoCAD') && dxfDownloadUrl) {
      // Download the real DXF file generated by Python!
      showToast('📦 Baixando arquivo AutoCAD DXF real gerado pelo back-end...');
      window.open(dxfDownloadUrl, '_blank');
      setCliHistory(prev => [...prev, `\n[SISTEMA]: Baixado desenho AutoCAD físico: ${dxfDownloadUrl.split('/').pop()}`]);
    } else {
      showToast(`📦 Compilando e exportando planta como ${format}...`);
      setTimeout(() => {
        showToast(`✅ Download do arquivo ${format} iniciado!`);
        setCliHistory(prev => [...prev, `\n[SISTEMA]: Exportado projeto elétrico completo no formato ${format}.`]);
      }, 1500);
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Sidebar */}
      <AppSidebar />

      {/* Main Container */}
      <main className="flex-1 flex flex-col ml-64 min-h-screen">
        {/* Header */}
        <header className="h-16 bg-background/80 backdrop-blur-md border-b border-border px-8 flex items-center justify-between sticky top-0 z-10 transition-colors duration-300">
          <div className="flex items-center gap-2">
            <Compass className="text-[#004D31] dark:text-[#B2D235] animate-pulse" size={20} />
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">Mapeamento Elétrico 3D IA</h1>
              <p className="text-xs text-gray-400">Escaneamento por vídeo e processamento SLAM/SfM Multimodal</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-[#B2D235]/15 text-[#004D31] dark:text-[#B2D235] border border-[#B2D235]/30">
              <Sparkles size={10} /> IA MULTIMODAL ATIVA
            </span>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-8 space-y-6 flex-1">
          
          {/* Hidden File Input for Video Upload */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="video/*" 
            className="hidden" 
          />

          {!scanDone && !isScanning ? (
            /* --- STATE 1: UPLOAD AND CONFIGURATION --- */
            <div className="grid grid-cols-3 gap-6">
              
              {/* Left & Mid: Uploading Area */}
              <div className="col-span-2 space-y-6">
                <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                  
                  {/* Selector Tabs: Video Tour vs Photos */}
                  <div className="flex border-b border-border pb-3 mb-5 justify-between items-center">
                    <h2 className="text-sm font-black uppercase tracking-wider text-gray-850 dark:text-white">
                      1. Carregar Dados de Vistoria do Local
                    </h2>
                    <div className="flex gap-1.5 bg-gray-100 dark:bg-slate-900 p-1 rounded-xl border border-border">
                      <button 
                        onClick={() => setActiveTab('video')}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[10px] font-black tracking-wider uppercase transition-all ${
                          activeTab === 'video' ? 'bg-[#004D31] text-white shadow-sm' : 'text-gray-500 hover:text-gray-850'
                        }`}
                      >
                        <Video size={11} /> Vistoria por Vídeo
                      </button>
                      <button 
                        onClick={() => setActiveTab('photos')}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[10px] font-black tracking-wider uppercase transition-all ${
                          activeTab === 'photos' ? 'bg-[#004D31] text-white shadow-sm' : 'text-gray-500 hover:text-gray-850'
                        }`}
                      >
                        <Upload size={11} /> Fotos Convencionais
                      </button>
                    </div>
                  </div>

                  {activeTab === 'video' ? (
                    /* VIDEO TOUR UPLOAD INTEGRATION WITH YOUTUBE LINK */
                    <div className="space-y-6">
                      
                      {/* YouTube Link Paste Container */}
                      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-900 space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Opção A: Mapear via Link do YouTube (Mais Rápido)</label>
                        <form onSubmit={handleYoutubeProcess} className="flex gap-2">
                          <input 
                            type="text"
                            placeholder="Cole a URL do vídeo do YouTube de vistoria (Ex: https://www.youtube.com/watch?v=...)"
                            value={youtubeUrl}
                            onChange={(e) => setYoutubeUrl(e.target.value)}
                            className="flex-1 px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#B2D235]/40 text-white placeholder-slate-700 font-semibold"
                          />
                          <button 
                            type="submit"
                            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap"
                          >
                            <Play size={11} fill="white" /> Analisar Link
                          </button>
                        </form>
                      </div>

                      {/* Divider */}
                      <div className="flex items-center justify-center gap-4 py-1">
                        <div className="flex-1 h-[1px] bg-border/40" />
                        <span className="text-[9px] font-bold text-gray-400 font-mono">OU</span>
                        <div className="flex-1 h-[1px] bg-border/40" />
                      </div>

                      {/* File Drag & Drop upload zone */}
                      <div 
                        onClick={handleTriggerUpload}
                        className="border-2 border-dashed border-[#004D31]/30 dark:border-[#B2D235]/30 rounded-2xl p-8 text-center cursor-pointer hover:bg-gray-50/50 dark:hover:bg-[#B2D235]/5 transition-all group relative overflow-hidden"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-[#004D31]/5 dark:bg-[#B2D235]/5 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                          <Video className="text-[#004D31] dark:text-[#B2D235]" size={24} />
                        </div>
                        <p className="text-xs font-bold text-gray-850 dark:text-gray-200">
                          Opção B: Selecionar arquivo de vídeo local do local
                        </p>
                        <p className="text-[10px] text-gray-450 mt-1 max-w-sm mx-auto leading-relaxed">
                          Arraste o arquivo ou clique para procurar no computador.
                        </p>
                        
                        {/* Simulation Button inside upload box */}
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSimulateTourUpload();
                          }}
                          className="mt-4 inline-flex items-center gap-1.5 bg-[#B2D235]/20 border border-[#B2D235]/50 hover:bg-[#B2D235]/30 px-3.5 py-1.5 rounded-xl text-[9px] font-black text-gray-850 dark:text-[#B2D235] transition-all uppercase"
                        >
                          <Zap size={10} className="animate-pulse" /> Executar com Vídeo Demo no Back-end
                        </button>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-900 flex items-start gap-3">
                        <Volume2 className="text-[#B2D235] shrink-0 mt-0.5" size={16} />
                        <div className="text-[11px] leading-relaxed text-gray-400 font-mono">
                          <span className="text-[#B2D235] font-bold">Exemplo de Fala Reconhecida:</span><br />
                          "Aqui temos o quadro de distribuição QE-01... disjuntor principal trifásico de 100 amperes. Vamos passar a tubulação pelo teto das vagas 1, 2 e 3 até a fixação dos carregadores..."
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* PHOTO UPLOAD SIMULATOR */
                    <div className="space-y-5">
                      <div className="border-2 border-dashed border-gray-200 dark:border-slate-850 rounded-2xl p-8 text-center cursor-pointer hover:bg-gray-50/50 dark:hover:bg-slate-900/10 transition-all">
                        <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-slate-900 flex items-center justify-center mx-auto mb-3">
                          <Upload className="text-gray-400" size={22} />
                        </div>
                        <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
                          Arraste ou clique para enviar fotos estáticas
                        </p>
                        <p className="text-[10px] text-gray-450 mt-1">
                          Fotografe o quadro principal, a garagem e o trajeto físico dos cabos.
                        </p>
                      </div>

                      {/* List of Uploaded Photos */}
                      <div className="space-y-3">
                        <h3 className="text-xs font-black text-gray-450 uppercase tracking-wider">Fotos Carregadas ({uploadedPhotos.length})</h3>
                        <div className="grid grid-cols-2 gap-3">
                          {uploadedPhotos.map(photo => (
                            <div key={photo.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-gray-50/50 dark:bg-slate-950">
                              <img src={photo.previewUrl} alt={photo.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-bold text-gray-800 dark:text-gray-200 truncate">{photo.name}</p>
                                <p className="text-[10px] text-gray-450 mt-0.5">{photo.size} · {
                                  photo.type === 'quadro' ? '⚡ Quadro Elétrico' : photo.type === 'garagem' ? '🚗 Garagem' : '🔗 Infra/Trajeto'
                                }</p>
                              </div>
                              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* FAQ / Guidance card */}
                <div className="bg-[#B2D235]/5 border border-dashed border-[#B2D235]/30 rounded-2xl p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#B2D235]/15 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="text-[#B2D235]" size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider">Mapeador de IA Multimodal Profissional</h4>
                    <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                      Nossos algoritmos processam o fluxo de vídeo e o áudio falado simultaneamente. O canal visual aplica **SLAM** e **Structure from Motion** para reconstruir as dimensões do ambiente em 3D. O canal de áudio extrai as especificações técnicas da narração. O resultado é consolidado em uma planta baixa AutoCAD compatível e em uma simulação interativa tridimensional real.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Sidebar: Configuration and Scan Trigger */}
              <div className="space-y-6">
                <div className="bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col h-full justify-between">
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-wider text-gray-800 dark:text-white mb-3">
                      2. Parâmetros de Engenharia
                    </h2>
                    <p className="text-xs text-gray-400 mb-5 leading-relaxed">
                      Defina as preferências elétricas para o cálculo normativo de viabilidade da NBR 5410.
                    </p>

                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1.5">Potência por Carregador</label>
                        <select 
                          value={chargerPower}
                          onChange={(e) => setChargerPower(parseFloat(e.target.value))}
                          className="w-full bg-gray-50 dark:bg-slate-950 border border-border rounded-xl px-3 py-2.5 text-xs focus:outline-none text-gray-855 dark:text-gray-200 font-semibold"
                        >
                          <option value={7.4}>7.4 kW AC (Monofásico)</option>
                          <option value={22}>22 kW AC (Trifásico 380V)</option>
                          <option value={50}>50 kW DC (Rápida Comercial)</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1.5">Gestão de Demanda (Smart Charging)</label>
                        <div className="flex gap-2">
                          <select 
                            value={smartChargingLimit}
                            onChange={(e) => setSmartChargingLimit(parseInt(e.target.value))}
                            className="flex-1 bg-gray-50 dark:bg-slate-950 border border-border rounded-xl px-3 py-2.5 text-xs focus:outline-none text-gray-855 dark:text-gray-200 font-semibold"
                          >
                            <option value={32}>Limite 32 A</option>
                            <option value={63}>Limite 63 A (Recomendado)</option>
                            <option value={100}>Limite 100 A</option>
                            <option value={200}>Sem Limite (Direto)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1.5">Conformidade e Segurança</label>
                        <div className="flex items-center gap-2 p-3 rounded-xl border border-border bg-gray-550/50 dark:bg-slate-950 text-[10px] font-mono text-gray-400">
                          <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
                          <span>Padrão NBR 5410 / NBR 17019</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-border">
                    <button 
                      onClick={handleTriggerUpload}
                      className="w-full flex items-center justify-center gap-2 bg-[#004D31] hover:bg-[#003C26] text-white py-3.5 rounded-2xl font-black text-xs shadow-lg shadow-[#004D31]/20 tracking-wider uppercase transition-all"
                    >
                      <Upload size={14} />
                      Enviar Vídeo de Vistoria
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : isScanning ? (
            /* --- STATE 2: MULTIMODAL SCANNING LOADER --- */
            <div className="grid grid-cols-3 gap-6">
              
              {/* Left & Mid: Video Playback & Overlays */}
              <div className="col-span-2 space-y-6">
                <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm flex flex-col">
                  
                  {/* Video Viewport Header */}
                  <div className="bg-slate-950 border-b border-border px-5 py-3 flex items-center justify-between font-mono text-[10px] text-gray-400">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                      <span className="font-bold text-white uppercase">
                        {isUploading ? "BACK-END PIPELINE: PROCESSANDO LINK..." : "CAMERA INGESTION & SLAM TRACKER"}
                      </span>
                    </div>
                    <span>FRAME: {videoFrame} / 220 | ERR: 0.12px</span>
                  </div>

                  {/* Video Screen / Canvas overlay */}
                  <div className="bg-[#040711] h-[380px] relative flex items-center justify-center overflow-hidden">
                    <canvas 
                      ref={videoCanvasRef} 
                      width={600} 
                      height={380} 
                      className="w-full h-full object-cover"
                    />

                    {/* Cyberspace scan effect */}
                    <div className="absolute inset-0 pointer-events-none border border-[#B2D235]/20 animate-pulse" />
                    
                    {/* Floating HUD info */}
                    <div className="absolute top-4 right-4 bg-black/80 border border-slate-800 rounded-xl p-3 font-mono text-[9px] text-emerald-400 space-y-1">
                      <p>&gt; SLAM: INITIALIZED</p>
                      <p>&gt; CAMERA VET: [{Math.sin(videoFrame * 0.1).toFixed(2)}, {Math.cos(videoFrame * 0.1).toFixed(2)}, 1.0]</p>
                      <p>&gt; VOX SPEECH: DETECTED</p>
                    </div>
                  </div>

                  {/* Synchronized speech transcription panel */}
                  <div className="p-5 bg-slate-950 border-t border-border flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#B2D235]/15 flex items-center justify-center text-[#B2D235] shrink-0 animate-pulse">
                      <Volume2 size={20} />
                    </div>
                    <div className="flex-1">
                      <span className="font-mono text-[8px] text-gray-500 block uppercase tracking-widest">TRANSCRIÇÃO DE VOZ DO ENGENHEIRO (TEMPO REAL)</span>
                      <p className="text-xs text-white font-medium italic mt-1 leading-relaxed">
                        "{transcript}"
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: AI Correlation Logs & Multimodal HUD */}
              <div className="space-y-6">
                <div className="bg-card border border-border rounded-3xl p-5 shadow-sm h-full flex flex-col justify-between">
                  <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-wider text-gray-880 dark:text-white pb-3 border-b border-border flex items-center gap-2">
                      <Cpu size={14} className="text-[#B2D235]" />
                      Análise Multimodal IA
                    </h3>

                    {/* Progress indicator */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-mono text-gray-400">
                        <span>Processamento 3D SLAM</span>
                        <span className="text-[#B2D235] font-bold">{Math.round((videoFrame / 220) * 100)}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 dark:bg-slate-900 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#B2D235] transition-all duration-100"
                          style={{ width: `${(videoFrame / 220) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Multimodal logic correlation terminal */}
                    <div className="bg-slate-950 rounded-2xl p-4 text-left font-mono text-[9px] text-emerald-400 h-64 overflow-y-auto space-y-2 border border-slate-900">
                      {multimodalLogs.map((log, idx) => (
                        <motion.p 
                          key={idx}
                          initial={{ opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="leading-relaxed"
                        >
                          {log}
                        </motion.p>
                      ))}
                      <span className="inline-block w-1.5 h-3 bg-emerald-400 animate-pulse ml-0.5" />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <button 
                      onClick={() => {
                        setIsUploading(false);
                        setIsVideoPlaying(false);
                        setIsScanning(false);
                        setScanDone(true);
                      }}
                      className="w-full py-2.5 rounded-xl border border-dashed border-red-500/30 hover:bg-red-500/5 text-[10px] font-bold text-red-500 transition-all uppercase tracking-wider"
                    >
                      Pular Processamento & Visualizar CAD
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* --- STATE 3: INTERACTIVE 3D CAD & BLUEPRINT GENERATOR --- */
            <div className="grid grid-cols-3 gap-6">
              
              {/* Left and Mid: The Interactive CAD Viewer / Canvas Area */}
              <div className="col-span-2 space-y-6">
                <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm flex flex-col">
                  
                  {/* Viewer Header */}
                  <div className="bg-gray-50 dark:bg-slate-950 px-5 py-3.5 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#B2D235] animate-pulse" />
                      <h3 className="text-xs font-black uppercase tracking-wider text-gray-850 dark:text-white">
                        Visualizador de Projeto 3D IA
                      </h3>
                    </div>
                    
                    {/* View Mode Toggles */}
                    <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-border p-1 rounded-xl">
                      <button 
                        onClick={() => setViewMode('3d')}
                        className={`px-3.5 py-1.5 rounded-lg text-[10px] font-black tracking-wider uppercase transition-all ${
                          viewMode === '3d' ? 'bg-[#004D31] text-white shadow-sm' : 'text-gray-500 hover:text-gray-850'
                        }`}
                      >
                        Modelo 3D (Three.js)
                      </button>
                      <button 
                        onClick={() => setViewMode('2d')}
                        className={`px-3.5 py-1.5 rounded-lg text-[10px] font-black tracking-wider uppercase transition-all ${
                          viewMode === '2d' ? 'bg-[#004D31] text-white shadow-sm' : 'text-gray-500 hover:text-gray-850'
                        }`}
                      >
                        Planta Baixa 2D (CAD)
                      </button>
                      <button 
                        onClick={() => setViewMode('unifilar')}
                        className={`px-3.5 py-1.5 rounded-lg text-[10px] font-black tracking-wider uppercase transition-all ${
                          viewMode === 'unifilar' ? 'bg-[#004D31] text-white shadow-sm' : 'text-gray-500 hover:text-gray-850'
                        }`}
                      >
                        Esquema Unifilar
                      </button>
                    </div>
                  </div>

                  {/* The Viewport Container */}
                  <div className="h-[430px] relative bg-slate-950 border-b border-border overflow-hidden select-none">
                    
                    {viewMode === '3d' ? (
                      /* --- VIEW 1: THREE.JS 3D SCHEMATIC --- */
                      <div 
                        ref={mountRef} 
                        className="w-full h-full cursor-grab active:cursor-grabbing relative"
                      >
                        {/* 3D Floating Controls Legend Overlay */}
                        <div className="absolute top-4 right-4 bg-black/85 border border-slate-800 rounded-xl p-3 font-mono text-[9px] text-gray-400 space-y-1 pointer-events-none">
                          <p className="text-white font-bold uppercase border-b border-slate-800 pb-1 mb-1">Navegação 3D</p>
                          <p>Arrastar    : Orbitar câmera</p>
                          <p>Scroll Mouse: Aproximar Zoom</p>
                          <p className="pt-1 text-[#B2D235]">Estágio: Nuvem de pontos LiDAR + Reconstrução</p>
                        </div>
                      </div>
                    ) : viewMode === '2d' ? (
                      /* --- VIEW 2: 2D AUTOCAD BLUEPRINT --- */
                      <div 
                        ref={cadCanvasRef}
                        onMouseMove={handleCadMouseMove}
                        className="w-full h-full relative flex items-center justify-center cursor-none bg-[#03060c] overflow-hidden"
                      >
                        {/* AutoCAD Grid */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,#16233b_1px,transparent_1px)] bg-[size:15px_15px] opacity-70" />

                        {/* AutoCAD Blueprint Vector Design */}
                        <svg className="w-5/6 h-5/6 relative z-10" viewBox="0 0 600 350" fill="none">
                          {/* CAD Patterns and Definitions */}
                          <defs>
                            {/* Professional Concrete Hatch Pattern for Structural Columns */}
                            <pattern id="concrete-hatch" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45 0 0)">
                              <line x1="0" y1="0" x2="0" y2="12" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" />
                              {/* Triangular aggregates */}
                              <path d="M 1,2 L 3,1 L 2,3 Z M 6,8 L 7,6 L 8,9 Z" fill="rgba(255,255,255,0.12)" />
                              {/* Sand particles */}
                              <circle cx="9" cy="2" r="0.5" fill="rgba(255,255,255,0.15)" />
                              <circle cx="3" cy="9" r="0.5" fill="rgba(255,255,255,0.15)" />
                            </pattern>
                          </defs>

                          {/* Architectural Double-Line Wall Boundaries */}
                          {activeLayers.walls && (
                            <g>
                              {/* Outer Wall Line (Thick, Slate-grey) */}
                              <rect x="50" y="30" width="500" height="280" fill="none" stroke="#475569" strokeWidth="2" strokeLinejoin="miter" />
                              {/* Inner Wall Line (Thin, Offset representing wall thickness) */}
                              <rect x="54" y="34" width="492" height="272" fill="none" stroke="#1e293b" strokeWidth="0.8" strokeLinejoin="miter" />

                              {/* Concrete Pillars (Columns) with hatch pattern and outline */}
                              {[
                                { x: 180, y: 110 },
                                { x: 180, y: 220 },
                                { x: 380, y: 110 },
                                { x: 380, y: 220 }
                              ].map((p, idx) => (
                                <g key={idx}>
                                  {/* Pillar Outline */}
                                  <rect x={p.x} y={p.y} width="16" height="16" fill="url(#concrete-hatch)" stroke="#64748b" strokeWidth="1" />
                                  {/* Pillar cross hair center mark */}
                                  <line x1={p.x - 4} y1={p.y + 8} x2={p.x + 20} y2={p.y + 8} stroke="rgba(148, 163, 184, 0.15)" strokeWidth="0.5" strokeDasharray="2 2" />
                                  <line x1={p.x + 8} y1={p.y - 4} x2={p.x + 8} y2={p.y + 20} stroke="rgba(148, 163, 184, 0.15)" strokeWidth="0.5" strokeDasharray="2 2" />
                                </g>
                              ))}
                            </g>
                          )}

                          {/* Structural Grid Axes (Standard Engineering Blueprint requirement) */}
                          {activeLayers.grid && (
                            <g stroke="rgba(148, 163, 184, 0.2)" strokeWidth="0.5" className="font-mono text-[6px]">
                              {/* Horizontal Axes lines and bubbles */}
                              {[
                                { label: 'A', x: 80 },
                                { label: 'B', x: 242 },
                                { label: 'C', x: 352 },
                                { label: 'D', x: 462 }
                              ].map((axis, idx) => (
                                <g key={idx}>
                                  <line x1={axis.x} y1="20" x2={axis.x} y2="320" strokeDasharray="4 2 1 2" />
                                  <circle cx={axis.x} cy="15" r="5" fill="#0b0f19" stroke="#475569" strokeWidth="0.8" />
                                  <text x={axis.x - 1.8} y="17" fill="#94a3b8" fontWeight="bold">{axis.label}</text>
                                </g>
                              ))}
                              
                              {/* Vertical Axes lines and bubbles */}
                              {[
                                { label: '1', y: 90 },
                                { label: '2', y: 215 }
                              ].map((axis, idx) => (
                                <g key={idx}>
                                  <line x1="35" y1={axis.y} x2="565" y2={axis.y} strokeDasharray="4 2 1 2" />
                                  <circle cx="30" cy={axis.y} r="5" fill="#0b0f19" stroke="#475569" strokeWidth="0.8" />
                                  <text x="28.2" y={axis.y + 2} fill="#94a3b8" fontWeight="bold">{axis.label}</text>
                                </g>
                              ))}
                            </g>
                          )}
                          
                          {/* 2D Parking Stalls and EV Markings */}
                          {activeLayers.chargers && (
                            <g>
                              {/* Stalls outlines and wheel-stoppers */}
                              {[220, 275, 330, 385, 440].slice(0, chargerCount).map((xVal, idx) => (
                                <g key={idx}>
                                  {/* Yellow dashed parking lines */}
                                  <rect x={xVal} y="220" width="45" height="82" fill="none" stroke="#eab308" strokeWidth="0.8" strokeDasharray="3 2" />
                                  
                                  {/* 3D-like Wheel Stopper Block */}
                                  <rect x={xVal + 6} y="228" width="33" height="4" fill="#334155" stroke="#475569" strokeWidth="0.5" />
                                  
                                  {/* EV Floor Painted Icon */}
                                  <circle cx={xVal + 22.5} cy="265" r="6" fill="none" stroke="rgba(178, 210, 53, 0.15)" strokeWidth="0.8" />
                                  <text x={xVal + 17.5} y="267" fill="rgba(178, 210, 53, 0.3)" fontSize="5" fontWeight="black" fontFamily="sans-serif">EV</text>
                                  
                                  {/* Detailed Wallbox Charger Symbol (Circle with plug emblem) */}
                                  <g 
                                    className="cursor-pointer" 
                                    onClick={() => setSelectedElement('carregadores')}
                                    transform={`translate(${xVal + 22.5}, 220)`}
                                  >
                                    {/* Charger station base socket */}
                                    <rect x="-6" y="-3" width="12" height="6" rx="1" fill="#1e293b" stroke="#64748b" strokeWidth="0.8" />
                                    {/* Glowing LED status dot */}
                                    <circle cx="0" cy="0" r="2.5" fill="#004D31" stroke="#B2D235" strokeWidth="1" />
                                    {/* Small lightning bolt plug symbol */}
                                    <path d="M -1,-1 L 1,-2 L 0,0 L 2,0 L 0,2 Z" fill="#B2D235" />
                                  </g>
                                  <text x={xVal + 8} y="212" fill="#94a3b8" fontSize="5" fontFamily="monospace">W-EV 0{idx+1}</text>
                                </g>
                              ))}
                            </g>
                          )}

                          {/* 2D Conduit and Cable Route */}
                          {activeLayers.conduits && (
                            <g strokeLinecap="round" strokeLinejoin="round">
                              {/* The Main conduit pipe path (Blue cyan for teto, dashed for floor) */}
                              <path 
                                d="M 80,90 L 410,90 L 410,220 M 352,90 L 352,220 M 297,90 L 297,220 M 242,90 L 242,220 M 462,90 L 462,220"
                                fill="none" 
                                stroke={selectedElement === 'cabos' ? '#B2D235' : (selectedConduit.includes('Teto') ? '#0ea5e9' : '#f97316')} 
                                strokeWidth="2.2" 
                                strokeDasharray={selectedConduit.includes('Piso') ? "4 2" : ""}
                                className="cursor-pointer"
                                onClick={() => setSelectedElement('cabos')}
                              />
                              
                              {/* Circular Junction Boxes (Conduboxes) at T-intersections (Teto) */}
                              {selectedConduit.includes('Teto') && [242, 297, 352, 410, 462].slice(0, chargerCount).map((cx, idx) => (
                                <g key={idx}>
                                  {/* T-Junction Box */}
                                  <rect x={cx - 3} y="87" width="6" height="6" fill="#1e293b" stroke="#0ea5e9" strokeWidth="0.8" />
                                  <circle cx={cx} cy="90" r="1.2" fill="#B2D235" />
                                </g>
                              ))}
                            </g>
                          )}

                          {/* 2D Electrical Panel (QE-01) with standard CAD symbol */}
                          <g onClick={() => setSelectedElement('painel')} className="cursor-pointer">
                            {/* Panel box */}
                            <rect x="65" y="70" width="30" height="40" fill="rgba(15, 23, 42, 0.95)" stroke={selectedElement === 'painel' ? '#B2D235' : '#475569'} strokeWidth="1.5" />
                            {/* Standard electrical cross hatch partition */}
                            <path d="M 65,70 L 95,110 M 65,110 L 95,70" stroke="rgba(148, 163, 184, 0.25)" strokeWidth="0.8" />
                            {/* Warning high voltage lightning bolt */}
                            <path d="M 80,78 L 84,84 L 79,84 L 81,90 L 76,84 L 81,84 Z" fill="#eab308" />
                            <text x="70" y="103" fill="#ffffff" fontSize="7" fontWeight="bold" fontFamily="monospace">QE-01</text>
                          </g>

                          {/* Professional Dimension Lines (Cotas - Layer: dimensions) */}
                          {activeLayers.dimensions && (
                            <g stroke="#78716c" strokeWidth="0.8" className="font-mono text-[6.5px]">
                              {/* Main panel wall offset with architectural ticks */}
                              <line x1="50" y1="90" x2="65" y2="90" />
                              <line x1="50" y1="87" x2="50" y2="93" />
                              <line x1="65" y1="87" x2="65" y2="93" />
                              {/* Architectural 45-deg ticks */}
                              <line x1="48" y1="92" x2="52" y2="88" strokeWidth="1" />
                              <line x1="63" y1="92" x2="67" y2="88" strokeWidth="1" />
                              <text x="52" y="83" fill="#a8a29e">1.00 m</text>

                              {/* Path Length main dimension line */}
                              <line x1="80" y1="50" x2="410" y2="50" />
                              {/* Extension lines */}
                              <line x1="80" y1="46" x2="80" y2="90" strokeDasharray="2 2" strokeWidth="0.5" />
                              <line x1="410" y1="46" x2="410" y2="90" strokeDasharray="2 2" strokeWidth="0.5" />
                              {/* Architectural ticks */}
                              <line x1="78" y1="52" x2="82" y2="48" strokeWidth="1" />
                              <line x1="408" y1="52" x2="412" y2="48" strokeWidth="1" />
                              <text x="210" y="44" fill="#f5f5f4" fontWeight="bold">L_ROTA = {cableLength}.00 m</text>

                              {/* Spot width dimension */}
                              <line x1="220" y1="312" x2="265" y2="312" />
                              <line x1="220" y1="305" x2="220" y2="320" strokeWidth="0.5" />
                              <line x1="265" y1="305" x2="265" y2="320" strokeWidth="0.5" />
                              <line x1="218" y1="314" x2="222" y2="310" strokeWidth="1" />
                              <line x1="263" y1="314" x2="267" y2="310" strokeWidth="1" />
                              <text x="232" y="321" fill="#a8a29e">3.00 m</text>
                            </g>
                          )}

                          {/* Technical Legend Box & Stamp (Selo de Engenharia) */}
                          <g transform="translate(390, 240)" className="font-mono text-[5.5px]">
                            {/* Border */}
                            <rect x="0" y="0" width="150" height="60" fill="rgba(15, 23, 42, 0.95)" stroke="#475569" strokeWidth="1.2" />
                            {/* Lines */}
                            <line x1="0" y1="20" x2="150" y2="20" stroke="#334155" strokeWidth="0.8" />
                            <line x1="0" y1="40" x2="150" y2="40" stroke="#334155" strokeWidth="0.8" />
                            <line x1="85" y1="20" x2="85" y2="60" stroke="#334155" strokeWidth="0.8" />
                            
                            {/* Selo Text Details */}
                            <text x="6" y="8" fill="#B2D235" fontSize="6.5" fontWeight="black" fontFamily="sans-serif">INFRAESTRUTURA DE RECARGA EV</text>
                            <text x="6" y="16" fill="#94a3b8" fontSize="4.5">NORMAS REQUISITO: ABNT NBR 5410 / NBR 17019</text>
                            
                            <text x="6" y="28" fill="#64748b">ESCALA: <tspan fill="#ffffff">1:100 (METROS)</tspan></text>
                            <text x="6" y="36" fill="#64748b">DATA: <tspan fill="#ffffff">2026-06-26</tspan></text>
                            
                            <text x="91" y="28" fill="#64748b">RESPONSÁVEL:</text>
                            <text x="91" y="36" fill="#ffffff" fontWeight="bold">ENG. KEPLER IA</text>
                            
                            <text x="6" y="48" fill="#64748b">DIAGRAMA PLANTA BAIXA:</text>
                            <text x="6" y="56" fill="#10b981" fontWeight="bold" fontSize="6">APROVADO PARA EXECUÇÃO</text>
                            
                            <text x="91" y="48" fill="#64748b">CREA DO PROJETO:</text>
                            <text x="91" y="56" fill="#ffffff">CREA-SP 2026-11</text>
                          </g>
                        </svg>

                        {/* Full-Screen AutoCAD Crosshair cursor lines */}
                        <div 
                          className="absolute pointer-events-none z-30 w-[1px] h-full bg-white/25" 
                          style={{ left: `${(cadMousePos.x * 15) + 80}px` }}
                        />
                        <div 
                          className="absolute pointer-events-none z-30 h-[1px] w-full bg-white/25" 
                          style={{ top: `${300 - (cadMousePos.y * 15)}px` }}
                        />

                        {/* Real-time AutoCAD Coordinates HUD overlay */}
                        <div 
                          className="absolute pointer-events-none z-40 bg-slate-900/95 border border-slate-800 text-[8px] font-mono text-emerald-400 px-2 py-1 rounded-sm flex gap-2"
                          style={{ 
                            left: `${Math.min(rectWidth() - 140, (cadMousePos.x * 15) + 95)}px`, 
                            top: `${Math.min(rectHeight() - 30, (300 - (cadMousePos.y * 15)) + 15)}px` 
                          }}
                        >
                          <span>X: {cadMousePos.x.toFixed(2)}m</span>
                          <span>Y: {cadMousePos.y.toFixed(2)}m</span>
                          <span>Z: 0.00m</span>
                        </div>
                      </div>
                    ) : (
                      /* --- VIEW 3: TECHNICAL SINGLE LINE DIAGRAM --- */
                      <div className="w-full h-full relative flex items-center justify-center bg-[#05070f]">
                        <svg className="w-5/6 h-5/6" viewBox="0 0 600 350" fill="none">
                          {/* Standard Grid background */}
                          <defs>
                            <pattern id="grid-unifilar" width="20" height="20" patternUnits="userSpaceOnUse">
                              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(148, 163, 184, 0.03)" strokeWidth="0.5" />
                            </pattern>
                          </defs>
                          <rect width="600" height="350" fill="url(#grid-unifilar)" />

                          {/* Copper Main Busbar (Barramento de Cobre Trifásico L1-L2-L3-N) */}
                          <g stroke="#f59e0b" strokeWidth="3" strokeLinecap="square">
                            <line x1="80" y1="140" x2="520" y2="140" />
                          </g>
                          <text x="80" y="125" fill="#f59e0b" fontSize="8" fontWeight="black" fontFamily="monospace">BARRAMENTO DE DISTRIBUIÇÃO PRINCIPAL QE-01 (380V/220V AC, 3F+N+PE)</text>

                          {/* Neutral & Ground busbar representations */}
                          <line x1="80" y1="150" x2="520" y2="150" stroke="#0ea5e9" strokeWidth="1" />
                          <text x="525" y="152" fill="#0ea5e9" fontSize="6" fontFamily="monospace">BARRAMENTO NEUTRO (N)</text>

                          <line x1="80" y1="160" x2="520" y2="160" stroke="#10b981" strokeWidth="1" strokeDasharray="3 2" />
                          <text x="525" y="162" fill="#10b981" fontSize="6" fontFamily="monospace">BARRAMENTO TERRA (PE)</text>

                          {/* Main Feeder Connection from Grid (QE Entry) */}
                          <g>
                            {/* Main Feeder Line */}
                            <path d="M 140,140 L 140,65 Q 140,50 110,50 L 80,50" fill="none" stroke="#ef4444" strokeWidth="2.2" />
                            
                            {/* Main MCCB Breaker (Disjuntor Geral 100A Caixa Moldada) */}
                            <rect x="75" y="40" width="22" height="20" fill="#1e293b" stroke="#ef4444" strokeWidth="1.5" />
                            {/* Switch symbol handle inside */}
                            <line x1="80" y1="50" x2="92" y2="44" stroke="#ef4444" strokeWidth="1.2" />
                            <text x="79" y="52" fill="#ffffff" fontSize="6" fontWeight="bold" fontFamily="monospace">100A</text>
                            <text x="60" y="28" fill="#94a3b8" fontSize="6.5" fontWeight="bold" fontFamily="monospace">DISJUNTOR GERAL (MCCB)</text>

                            {/* Surge Protection Device (DPS Classe II) */}
                            <path d="M 170,140 L 170,95" stroke="#ef4444" strokeWidth="1" />
                            <rect x="160" y="75" width="20" height="20" fill="#1e293b" stroke="#ef4444" strokeWidth="1" />
                            <path d="M 160,95 L 180,75" stroke="#ef4444" strokeWidth="0.8" />
                            <text x="163" y="87" fill="#ffffff" fontSize="6" fontFamily="monospace">DPS</text>
                            {/* Grounding tail of DPS */}
                            <path d="M 170,95 L 170,105 M 165,105 L 175,105 M 167,108 L 173,108 M 169,111 L 171,111" stroke="#10b981" strokeWidth="0.8" />
                            <text x="183" y="104" fill="#10b981" fontSize="5" fontFamily="monospace">TERRA TN-S</text>
                          </g>

                          {/* Branch Circuits for EV Chargers (Dynamic render based on charger count) */}
                          {[190, 270, 350, 430, 510].slice(0, chargerCount).map((xVal, idx) => (
                            <g key={idx}>
                              {/* Phase feeder connection drops */}
                              <path d={`M ${xVal},140 L ${xVal},200`} fill="none" stroke="#0ea5e9" strokeWidth="1.5" />
                              
                              {/* Standard IEC Circuit Breaker symbol (Disjuntor Termomagnético 40A curva C) */}
                              <g transform={`translate(${xVal}, 175)`}>
                                {/* Breaker base switch */}
                                <line x1="0" y1="-10" x2="0" y2="-4" stroke="#0ea5e9" strokeWidth="1.5" />
                                <line x1="0" y1="4" x2="0" y2="10" stroke="#0ea5e9" strokeWidth="1.5" />
                                <line x1="0" y1="-4" x2="-6" y2="4" stroke="#0ea5e9" strokeWidth="1.5" />
                                {/* Thermal/Magnetic hooks */}
                                <path d="M -6,4 L -8,4 A 2,2 0 0,1 -10,2" fill="none" stroke="#0ea5e9" strokeWidth="1" />
                                <rect x="3" y="-6" width="16" height="12" rx="1" fill="#0f172a" stroke="#0ea5e9" strokeWidth="0.8" />
                                <text x="6" y="2" fill="#B2D235" fontSize="6.5" fontWeight="bold" fontFamily="monospace">40A</text>
                                <text x="-25" y="0" fill="#64748b" fontSize="5.5" fontFamily="monospace">DJ-0{idx+1}</text>
                              </g>
                              
                              {/* Standard IEC Residual Current Device (DR 30mA Tipo A - Mandatory for EV) */}
                              <g transform={`translate(${xVal}, 212)`}>
                                {/* DR transformer coil circle */}
                                <circle cx="0" cy="0" r="6" fill="rgba(15, 23, 42, 0.95)" stroke="#10b981" strokeWidth="1.2" />
                                <path d="M -6,0 Q 0,-3 6,0" fill="none" stroke="#10b981" strokeWidth="0.8" />
                                <text x="9" y="3" fill="#10b981" fontSize="5.5" fontWeight="black" fontFamily="monospace">DR Tipo A</text>
                              </g>

                              {/* Branch Wiring Annotation (Conductor type & sizing) */}
                              <line x1={xVal - 4} y1="234" x2={xVal + 4} y2="228" stroke="#94a3b8" strokeWidth="0.8" />
                              <text x={xVal + 6} y="234" fill="#94a3b8" fontSize="5" fontFamily="monospace">5x10mm² Cu</text>

                              {/* Charger Terminal Box Symbol */}
                              <g transform={`translate(${xVal}, 265)`}>
                                <rect x="-24" y="-12" width="48" height="34" rx="2" fill="rgba(0, 77, 49, 0.1)" stroke="#B2D235" strokeWidth="1.2" />
                                <text x="-20" y="0" fill="#ffffff" fontSize="6.5" fontWeight="bold" fontFamily="sans-serif">ESTAÇÃO-0{idx+1}</text>
                                <text x="-20" y="10" fill="#94a3b8" fontSize="5.5" fontFamily="monospace">{chargerPower}kW 380V</text>
                                <text x="-20" y="18" fill="#64748b" fontSize="4.5" fontFamily="monospace">Cos Phi 0.92</text>
                                
                                {/* Local Ground connection PE symbol at charger */}
                                <path d="M 16,10 L 16,16 M 12,16 L 20,16 M 14,19 L 18,19 M 15,22 L 17,22" stroke="#10b981" strokeWidth="0.8" />
                              </g>
                            </g>
                          ))}
                        </svg>
                      </div>
                    )}

                    {/* Scanning feedback banner */}
                    <div className="absolute top-4 left-4 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl flex items-center gap-2 text-[9px] text-emerald-400 font-bold">
                      <CheckCircle2 size={12} className="text-emerald-400" />
                      NBR 5410 VALIDADO · PRECISÃO SLAM 99.12%
                    </div>
                  </div>

                  {/* AutoCAD Command Line CLI Bar */}
                  <div className="bg-[#03060c] border-t border-border p-3 flex flex-col gap-2 font-mono">
                    <div className="h-36 overflow-y-auto bg-black/70 border border-slate-900 rounded-xl p-3 text-[10px] text-slate-300 space-y-1 select-text">
                      {cliHistory.map((line, idx) => (
                        <div key={idx} className="whitespace-pre-line leading-relaxed">
                          {line.startsWith('\n>') ? (
                            <span className="text-[#B2D235]">{line}</span>
                          ) : line.startsWith('ERRO') ? (
                            <span className="text-red-400">{line}</span>
                          ) : line.startsWith('SUCESSO') ? (
                            <span className="text-emerald-400">{line}</span>
                          ) : (
                            <span>{line}</span>
                          )}
                        </div>
                      ))}
                      <div ref={cliEndRef} />
                    </div>
                    
                    <form onSubmit={handleCliSubmit} className="flex gap-2">
                      <span className="text-[#B2D235] self-center text-xs font-bold">COMMAND:</span>
                      <input 
                        type="text"
                        placeholder="Digite comandos de engenharia (ex: 'ADD 5', 'ROUTE floor', 'CABLE 16', 'HELP')..."
                        value={cliInput}
                        onChange={(e) => setCliInput(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg bg-black border border-slate-800 text-[11px] focus:outline-none focus:ring-1 focus:ring-[#B2D235]/40 text-white placeholder-slate-700 font-bold"
                      />
                      <button 
                        type="submit"
                        className="px-4 py-2 rounded-lg bg-[#004D31] hover:bg-[#003C26] text-white text-[10px] font-black tracking-wider uppercase transition-all flex items-center gap-1.5"
                      >
                        <CornerDownLeft size={10} /> Executar
                      </button>
                    </form>
                  </div>
                </div>
              </div>

              {/* Right Sidebar: Dynamic CAD Inspector & Sizing Panel */}
              <div className="space-y-6">
                
                {/* Element Inspector details */}
                <div className="bg-card border border-border rounded-3xl p-5 shadow-sm space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <h3 className="text-xs font-black uppercase tracking-wider text-gray-855 dark:text-white flex items-center gap-2">
                      <Cpu size={14} className="text-[#004D31] dark:text-[#B2D235]" />
                      Inspetor Técnico CAD
                    </h3>
                    <span className="text-[8px] font-mono bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded-full text-slate-500 uppercase font-bold">Propriedades</span>
                  </div>

                  {selectedElement === null ? (
                    <div className="py-10 text-center text-gray-400 space-y-2.5">
                      <Info size={24} className="mx-auto text-gray-350 opacity-60" />
                      <p className="text-xs font-bold">Nenhum elemento selecionado</p>
                      <p className="text-[10px] text-gray-455 leading-relaxed max-w-[200px] mx-auto">
                        Clique em qualquer componente no visualizador 3D ou 2D (Carregadores, Quadro ou Eletrodutos) para abrir as especificações técnicas de engenharia.
                      </p>
                    </div>
                  ) : selectedElement === 'painel' ? (
                    <div className="space-y-4">
                      <div className="bg-[#004D31]/5 p-3.5 rounded-2xl border border-[#004D31]/10">
                        <p className="text-[9px] font-black text-gray-400 uppercase">Elemento Ativo</p>
                        <h4 className="text-xs font-black text-gray-855 dark:text-white mt-0.5">Quadro Principal (QE-01)</h4>
                      </div>
                      
                      <div className="space-y-3">
                        {[
                          { label: 'Disjuntor Geral Existente', value: '100A Trifásico', status: 'info' },
                          { label: 'Carga Excedente Disponível', value: '78A (~51kW)', status: 'success' },
                          { label: 'Espaço no Barramento', value: 'Sim, 8 módulos DIN livres', status: 'success' },
                          { label: 'Aterramento Próprio', value: 'Existente (Malha ativa)', status: 'success' },
                          { label: 'Disjuntor do Circuito', value: `${chargerCount}x 40A curva C (Recomendado)`, status: 'warning' }
                        ].map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-[11px] border-b border-border/50 pb-2.5 last:border-0 last:pb-0">
                            <span className="text-gray-455 font-medium">{item.label}</span>
                            <span className="font-bold text-gray-800 dark:text-gray-250 text-right">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : selectedElement === 'cabos' ? (
                    <div className="space-y-4">
                      <div className="bg-[#0ea5e9]/5 p-3.5 rounded-2xl border border-[#0ea5e9]/10">
                        <p className="text-[9px] font-black text-gray-400 uppercase">Elemento Ativo</p>
                        <h4 className="text-xs font-black text-gray-855 dark:text-white mt-0.5">Cablagem e Condutos</h4>
                      </div>
                      
                      <div className="space-y-3">
                        {[
                          { label: 'Distância da Infra (Física)', value: `${cableLength} metros`, status: 'info' },
                          { label: 'Bitola Indicada (NBR 5410)', value: `${cableBitola} mm² Cobre`, status: 'success' },
                          { label: 'Queda de Tensão Estimada', value: `${voltageDrop}% (Excelente)`, status: 'success' },
                          { label: 'Tipo de Conduto', value: selectedConduit.split('(')[0].trim(), status: 'info' },
                          { label: 'Fator de Agrupamento', value: '0.70 (3 condutores agrupados)', status: 'warning' }
                        ].map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-[11px] border-b border-border/50 pb-2.5 last:border-0 last:pb-0">
                            <span className="text-gray-455 font-medium">{item.label}</span>
                            <span className="font-bold text-gray-800 dark:text-gray-250 text-right">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-[#B2D235]/5 p-3.5 rounded-2xl border border-[#B2D235]/10">
                        <p className="text-[9px] font-black text-gray-400 uppercase">Elemento Ativo</p>
                        <h4 className="text-xs font-black text-gray-855 dark:text-white mt-0.5">Pontos de Recarga ({chargerCount} un)</h4>
                      </div>
                      
                      <div className="space-y-3">
                        {[
                          { label: 'Modelo Selecionado', value: `EcoCarga Pro ${chargerPower}kW`, status: 'info' },
                          { label: 'Potência Total Requerida', value: `${chargerPower * chargerCount} kW`, status: 'info' },
                          { label: 'Tensão de Trabalho', value: '380V Trifásico', status: 'info' },
                          { label: 'Protocolo de Comunicação', value: 'OCPP 1.6J / Wi-Fi', status: 'success' },
                          { label: 'Gestão de Corrente Ativa', value: `Limite Dinâmico de ${smartChargingLimit}A`, status: 'success' }
                        ].map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-[11px] border-b border-border/50 pb-2.5 last:border-0 last:pb-0">
                            <span className="text-gray-455 font-medium">{item.label}</span>
                            <span className="font-bold text-gray-800 dark:text-gray-250 text-right">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Layer Control Panel */}
                <div className="bg-card border border-border rounded-3xl p-5 shadow-sm space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-855 dark:text-white pb-2 border-b border-border flex items-center gap-1.5">
                    <Layers size={13} className="text-gray-400" />
                    Gerenciador de Camadas (Layers)
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                    {Object.entries(activeLayers).map(([key, val]) => (
                      <button 
                        key={key}
                        onClick={() => setActiveLayers(prev => ({ ...prev, [key]: !val }))}
                        className={`px-2.5 py-1.5 rounded-lg border font-bold uppercase tracking-wider transition-all flex justify-between items-center ${
                          val 
                            ? 'bg-[#004D31]/10 text-[#004D31] dark:text-[#B2D235] border-[#B2D235]/40' 
                            : 'bg-transparent text-gray-450 border-border hover:border-gray-400'
                        }`}
                      >
                        <span>{key}</span>
                        <span className={`w-1.5 h-1.5 rounded-full ${val ? 'bg-[#B2D235] animate-pulse' : 'bg-gray-400'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Export / Technical actions panel */}
                <div className="bg-card border border-border rounded-3xl p-5 shadow-sm space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-880 dark:text-white pb-2 border-b border-border">
                    Exportações Técnicas CAD/BIM
                  </h3>
                  
                  <div className="space-y-2">
                    <button 
                      onClick={() => handleExport('DWG (AutoCAD)')}
                      className="w-full flex items-center justify-between p-3 rounded-xl border border-border bg-gray-50/50 hover:bg-gray-100 dark:hover:bg-slate-900/40 transition-all text-xs font-bold text-gray-700 dark:text-gray-300 group"
                    >
                      <span className="flex items-center gap-2">
                        <FileText size={14} className="text-blue-500" />
                        {dxfDownloadUrl ? "Baixar AutoCAD DXF Real" : "Exportar AutoCAD (DWG/DXF)"}
                      </span>
                      <Download size={12} className="opacity-60 group-hover:translate-y-0.5 transition-transform" />
                    </button>

                    <button 
                      onClick={() => handleExport('BIM / glTF')}
                      className="w-full flex items-center justify-between p-3 rounded-xl border border-border bg-gray-50/50 hover:bg-gray-100 dark:hover:bg-slate-900/40 transition-all text-xs font-bold text-gray-700 dark:text-gray-300 group"
                    >
                      <span className="flex items-center gap-2">
                        <Layers size={14} className="text-purple-500" />
                        Exportar Revit / BIM (glTF)
                      </span>
                      <Download size={12} className="opacity-60 group-hover:translate-y-0.5 transition-transform" />
                    </button>

                    <button 
                      onClick={() => handleExport('PDF Técnico')}
                      className="w-full flex items-center justify-between p-3 rounded-xl border border-border bg-gray-50/50 hover:bg-gray-100 dark:hover:bg-slate-900/40 transition-all text-xs font-bold text-gray-700 dark:text-gray-300 group"
                    >
                      <span className="flex items-center gap-2">
                        <FileSpreadsheet size={14} className="text-emerald-500" />
                        Gerar Memorial Técnico (PDF)
                      </span>
                      <Download size={12} className="opacity-60 group-hover:translate-y-0.5 transition-transform" />
                    </button>
                  </div>

                  <div className="pt-2">
                    <button 
                      onClick={() => {
                        showToast('📄 Memorial Técnico e Planta 3D vinculados à proposta comercial!');
                        setCliHistory(prev => [...prev, '\n[SISTEMA]: Vinculado memorial descritivo e desenhos técnicos à proposta activa.']);
                      }}
                      className="w-full py-3.5 rounded-xl bg-[#004D31] hover:bg-[#003B26] text-white text-xs font-black shadow-md shadow-[#004D31]/15 transition-all uppercase tracking-wider flex items-center justify-center gap-1.5"
                    >
                      <Zap size={13} className="text-[#B2D235]" />
                      Anexar à Proposta Ativa
                    </button>
                  </div>
                </div>

                {/* Reset button */}
                <button 
                  onClick={() => {
                    setScanDone(false);
                    setIsScanning(false);
                    setDxfDownloadUrl(null);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-border hover:border-[#004D31]/40 text-[10px] font-black text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-all"
                >
                  <RefreshCw size={10} />
                  Refazer Escaneamento do Local
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* --- Toast System --- */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9, x: '-50%' }}
            animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
            exit={{ opacity: 0, y: 20, scale: 0.9, x: '-50%' }}
            className="fixed bottom-6 left-1/2 z-50 flex items-center gap-3 bg-gray-950 text-white px-5 py-3.5 rounded-2xl shadow-2xl text-xs font-bold border border-slate-900"
          >
            <span className="text-sm">🤖</span>
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // Helper functions to get CAD canvas sizes safely
  function rectWidth() {
    return cadCanvasRef.current ? cadCanvasRef.current.clientWidth : 600;
  }

  function rectHeight() {
    return cadCanvasRef.current ? cadCanvasRef.current.clientHeight : 400;
  }
}
