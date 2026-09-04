import React, { useState, useRef, useEffect } from 'react';
import { 
  RotateCw, 
  RotateCcw, 
  Sun, 
  Moon, 
  Maximize2, 
  Compass, 
  Layers, 
  Paintbrush, 
  Check, 
  Tv, 
  HelpCircle,
  Lightbulb,
  Sparkles
} from 'lucide-react';
import { Room, Material } from '../types';

interface Preview3DProps {
  rooms: Room[];
  selectedRoomId: string | null;
  setRooms: React.Dispatch<React.SetStateAction<Room[]>>;
}

export default function Preview3D({ rooms, selectedRoomId, setRooms }: Preview3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // 3D Camera/Perspective view state
  const [rotation, setRotation] = useState(45); // angle in degrees
  const [tilt, setTilt] = useState(30); // tilt angle
  const [zoom, setZoom] = useState(0.85); // zoom factor
  const [wallHeight, setWallHeight] = useState(65); // height of extruded walls in pixels
  const [lightingMode, setLightingMode] = useState<'day' | 'sunset' | 'night'>('day');
  
  // Material presets
  const materials: Material[] = [
    { id: 'ahsap', name: 'Ahşap Parke', color: '#854d0e', textureClass: 'wood', description: 'Doğal meşe dokulu sıcak ahşap parke zemin.' },
    { id: 'beton', name: 'Brüt Beton', color: '#64748b', textureClass: 'concrete', description: 'Modern endüstriyel tasarımlar için ham mat beton.' },
    { id: 'mermer', name: 'Beyaz Mermer', color: '#e2e8f0', textureClass: 'marble', description: 'Damarlı şık italyan beyaz carrara mermer.' },
    { id: 'fayans', name: 'Sırlı Fayans', color: '#1e293b', textureClass: 'tile', description: 'Banyo ve mutfak için ızgara derzli seramik kaplama.' },
  ];

  const [activeMaterialId, setActiveMaterialId] = useState('beton');

  // Change room material
  const handleApplyMaterial = (materialId: string) => {
    setActiveMaterialId(materialId);
    if (selectedRoomId) {
      setRooms(prev => prev.map(r => {
        if (r.id === selectedRoomId) {
          return { ...r, material: materialId };
        }
        return r;
      }));
    } else {
      // Apply to all rooms if none is selected
      setRooms(prev => prev.map(r => ({ ...r, material: materialId })));
    }
  };

  // Redraw isometric 3D canvas when rooms or perspective states change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high-DPI canvas resolution
    const width = canvas.parentElement?.clientWidth || 500;
    const height = 450;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas with a nice gradient background based on lighting mode
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    if (lightingMode === 'day') {
      bgGrad.addColorStop(0, '#0f172a'); // deep navy-slate
      bgGrad.addColorStop(1, '#1e293b');
    } else if (lightingMode === 'sunset') {
      bgGrad.addColorStop(0, '#1e1b4b'); // deep purple
      bgGrad.addColorStop(1, '#311042'); // warm amber/plum
    } else {
      bgGrad.addColorStop(0, '#020617'); // obsidian black
      bgGrad.addColorStop(1, '#0f172a');
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Grid center point for projection
    const centerX = width / 2;
    const centerY = height / 2 + 30;

    // Helper functions for 3D projection
    // Convert 2D plan coordinates to isometric projected coordinates
    const project = (x2d: number, y2d: number, z2d: number = 0) => {
      // Translate coordinates to center around canvas origin
      const tx = (x2d - 250) * zoom;
      const ty = (y2d - 200) * zoom;
      
      // Convert degrees to radians
      const radRot = (rotation * Math.PI) / 180;
      const radTilt = (tilt * Math.PI) / 180;

      // 3D rotation matrices
      const rx = tx * Math.cos(radRot) - ty * Math.sin(radRot);
      const ry = tx * Math.sin(radRot) + ty * Math.cos(radRot);
      
      // Vertical translation with tilt perspective
      const px = centerX + rx;
      const py = centerY + ry * Math.sin(radTilt) - z2d * zoom;

      return { x: px, y: py };
    };

    // Draw shadows on floor before solid elements
    rooms.forEach(room => {
      const p1 = project(room.x, room.y);
      const p2 = project(room.x + room.width, room.y);
      const p3 = project(room.x + room.width, room.y + room.height);
      const p4 = project(room.x, room.y + room.height);

      // Draw subtle ground drop shadow
      ctx.beginPath();
      ctx.moveTo(p1.x + 5, p1.y + 12);
      ctx.lineTo(p2.x + 5, p2.y + 12);
      ctx.lineTo(p3.x + 5, p3.y + 12);
      ctx.lineTo(p4.x + 5, p4.y + 12);
      ctx.closePath();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fill();
    });

    // Sort rooms back-to-front so they render with correct depth overlap!
    // Simply sorting by translated center Y coordinate provides nice depth sort
    const sortedRooms = [...rooms].sort((a, b) => {
      const radRot = (rotation * Math.PI) / 180;
      const aySort = a.x * Math.sin(radRot) + a.y * Math.cos(radRot);
      const bySort = b.x * Math.sin(radRot) + b.y * Math.cos(radRot);
      return aySort - bySort;
    });

    sortedRooms.forEach(room => {
      const isSelected = room.id === selectedRoomId;
      
      // Determine textures and colors based on room material
      const matId = room.material || activeMaterialId;
      const currentMat = materials.find(m => m.id === matId) || materials[1];
      
      // Dynamic lighting adjustments
      let floorColor = currentMat.color;
      let wallLeftColor = '#475569';
      let wallRightColor = '#334155';
      let wallInnerColor = '#1e293b';

      if (lightingMode === 'sunset') {
        floorColor = blendColors(floorColor, '#f97316', 0.2); // Warm orange tint
        wallLeftColor = '#581c87';
        wallRightColor = '#4c1d95';
        wallInnerColor = '#2e1065';
      } else if (lightingMode === 'night') {
        floorColor = blendColors(floorColor, '#1e1b4b', 0.4); // Dark blue tint
        wallLeftColor = '#1e293b';
        wallRightColor = '#0f172a';
        wallInnerColor = '#020617';
      }

      // 4 corners of the room floor
      const p1 = project(room.x, room.y);
      const p2 = project(room.x + room.width, room.y);
      const p3 = project(room.x + room.width, room.y + room.height);
      const p4 = project(room.x, room.y + room.height);

      // 4 corners of the extruded room top walls
      const pt1 = project(room.x, room.y, wallHeight);
      const pt2 = project(room.x + room.width, room.y, wallHeight);
      const pt3 = project(room.x + room.width, room.y + room.height, wallHeight);
      const pt4 = project(room.x, room.y + room.height, wallHeight);

      // --- 1. DRAW FLOOR FLOOR POLYGON ---
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.lineTo(p4.x, p4.y);
      ctx.closePath();
      ctx.fillStyle = floorColor;
      ctx.fill();

      // Highlight selected room floor outline
      if (isSelected) {
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      } else {
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // --- 2. DRAW MATERIAL TEXTURE OVERLAYS ---
      if (currentMat.id === 'ahsap') {
        // Draw elegant planks
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.lineWidth = 1;
        for (let offset = 10; offset < room.width; offset += 15) {
          const lp1 = project(room.x + offset, room.y);
          const lp2 = project(room.x + offset, room.y + room.height);
          ctx.beginPath();
          ctx.moveTo(lp1.x, lp1.y);
          ctx.lineTo(lp2.x, lp2.y);
          ctx.stroke();
        }
      } else if (currentMat.id === 'fayans') {
        // Draw tile grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        // Verticals
        for (let ox = 20; ox < room.width; ox += 25) {
          const lp1 = project(room.x + ox, room.y);
          const lp2 = project(room.x + ox, room.y + room.height);
          ctx.beginPath();
          ctx.moveTo(lp1.x, lp1.y);
          ctx.lineTo(lp2.x, lp2.y);
          ctx.stroke();
        }
        // Horizontals
        for (let oy = 20; oy < room.height; oy += 25) {
          const lp1 = project(room.x, room.y + oy);
          const lp2 = project(room.x + room.width, room.y + oy);
          ctx.beginPath();
          ctx.moveTo(lp1.x, lp1.y);
          ctx.lineTo(lp2.x, lp2.y);
          ctx.stroke();
        }
      } else if (currentMat.id === 'mermer') {
        // Marble veins (curves)
        ctx.strokeStyle = 'rgba(0,0,0,0.08)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        const start = project(room.x + room.width * 0.2, room.y);
        const mid1 = project(room.x + room.width * 0.5, room.y + room.height * 0.4);
        const end = project(room.x + room.width * 0.8, room.y + room.height);
        ctx.moveTo(start.x, start.y);
        ctx.quadraticCurveTo(mid1.x, mid1.y, end.x, end.y);
        ctx.stroke();
      }

      // --- 3. DRAW EXTRUDED WALLS (Outer Faces based on perspective angle) ---
      // Left exterior wall (from p1 to p4)
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p4.x, p4.y);
      ctx.lineTo(pt4.x, pt4.y);
      ctx.lineTo(pt1.x, pt1.y);
      ctx.closePath();
      ctx.fillStyle = wallLeftColor;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      ctx.stroke();

      // Front exterior wall (from p4 to p3)
      ctx.beginPath();
      ctx.moveTo(p4.x, p4.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.lineTo(pt3.x, pt3.y);
      ctx.lineTo(pt4.x, pt4.y);
      ctx.closePath();
      ctx.fillStyle = wallRightColor;
      ctx.fill();
      ctx.stroke();

      // Back exterior wall (from p1 to p2)
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(pt2.x, pt2.y);
      ctx.lineTo(pt1.x, pt1.y);
      ctx.closePath();
      ctx.fillStyle = wallInnerColor;
      ctx.fill();
      ctx.stroke();

      // Right back exterior wall (from p2 to p3)
      ctx.beginPath();
      ctx.moveTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.lineTo(pt3.x, pt3.y);
      ctx.lineTo(pt2.x, pt2.y);
      ctx.closePath();
      ctx.fillStyle = wallLeftColor;
      ctx.fill();
      ctx.stroke();

      // --- 4. ACCENT WALL TOPS (Gives a crisp professional structural cut look) ---
      ctx.beginPath();
      ctx.moveTo(pt1.x, pt1.y);
      ctx.lineTo(pt2.x, pt2.y);
      ctx.lineTo(pt3.x, pt3.y);
      ctx.lineTo(pt4.x, pt4.y);
      ctx.closePath();
      ctx.strokeStyle = isSelected ? '#6366f1' : '#71717a';
      ctx.lineWidth = isSelected ? 2.5 : 1.5;
      ctx.stroke();

      // --- 5. RENDER WINDOW / DOOR PLACEHOLDERS IN 3D ---
      if (room.width > 60) {
        // Glass Window on back wall
        const winP1 = project(room.x + room.width / 2 - 15, room.y, wallHeight * 0.4);
        const winP2 = project(room.x + room.width / 2 + 15, room.y, wallHeight * 0.4);
        const winP3 = project(room.x + room.width / 2 + 15, room.y, wallHeight * 0.8);
        const winP4 = project(room.x + room.width / 2 - 15, room.y, wallHeight * 0.8);

        ctx.beginPath();
        ctx.moveTo(winP1.x, winP1.y);
        ctx.lineTo(winP2.x, winP2.y);
        ctx.lineTo(winP3.x, winP3.y);
        ctx.lineTo(winP4.x, winP4.y);
        ctx.closePath();
        ctx.fillStyle = 'rgba(56, 189, 248, 0.6)'; // cyan glass
        ctx.fill();
        ctx.strokeStyle = '#0284c7';
        ctx.stroke();
      }

      if (room.height > 60) {
        // Door cutout on front wall
        const drP1 = project(room.x, room.y + room.height - 25, 0);
        const drP2 = project(room.x, room.y + room.height - 5, 0);
        const drP3 = project(room.x, room.y + room.height - 5, wallHeight * 0.7);
        const drP4 = project(room.x, room.y + room.height - 25, wallHeight * 0.7);

        ctx.beginPath();
        ctx.moveTo(drP1.x, drP1.y);
        ctx.lineTo(drP2.x, drP2.y);
        ctx.lineTo(drP3.x, drP3.y);
        ctx.lineTo(drP4.x, drP4.y);
        ctx.closePath();
        ctx.fillStyle = '#1e293b'; // hollow opening
        ctx.fill();
        ctx.strokeStyle = '#f43f5e'; // door frame
        ctx.stroke();
      }

      // --- 6. FLOATING LABELS ON ROOM TOPS ---
      const labelPos = project(room.x + room.width / 2, room.y + room.height / 2, wallHeight + 15);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      const textWidth = ctx.measureText(room.name).width;
      ctx.beginPath();
      ctx.roundRect(labelPos.x - textWidth / 2 - 6, labelPos.y - 10, textWidth + 12, 16, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(room.name, labelPos.x, labelPos.y + 1);
    });

    // Helper to blend hex colors with overlay color
    function blendColors(hex: string, overlayHex: string, amount: number) {
      let r = parseInt(hex.slice(1, 3), 16);
      let g = parseInt(hex.slice(3, 5), 16);
      let b = parseInt(hex.slice(5, 7), 16);

      let or = parseInt(overlayHex.slice(1, 3), 16);
      let og = parseInt(overlayHex.slice(3, 5), 16);
      let ob = parseInt(overlayHex.slice(5, 7), 16);

      r = Math.round(r * (1 - amount) + or * amount);
      g = Math.round(g * (1 - amount) + og * amount);
      b = Math.round(b * (1 - amount) + ob * amount);

      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

  }, [rooms, rotation, tilt, zoom, wallHeight, lightingMode, activeMaterialId, selectedRoomId]);

  // Handle controls increment/decrement
  const rotateLeft = () => setRotation(prev => (prev - 15) % 360);
  const rotateRight = () => setRotation(prev => (prev + 15) % 360);
  const tiltUp = () => setTilt(prev => Math.min(60, prev + 5));
  const tiltDown = () => setTilt(prev => Math.max(10, prev - 5));
  const zoomIn = () => setZoom(prev => Math.min(1.5, prev + 0.05));
  const zoomOut = () => setZoom(prev => Math.max(0.5, prev - 0.05));

  const selectedRoom = rooms.find(r => r.id === selectedRoomId);

  return (
    <div className="flex flex-col h-full bg-[#0c0c0e] border border-zinc-800 rounded overflow-hidden">
      {/* 3D Viewer Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0c0c0e]/95 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Tv className="w-4 h-4 text-indigo-400 animate-pulse" />
          <span className="text-xs font-semibold tracking-wider uppercase text-zinc-200 font-sans">
            Gerçek Zamanlı 3B İzleyici
          </span>
        </div>
        
        {/* Lighting adjustments */}
        <div className="flex items-center gap-1 bg-[#09090b] p-0.5 rounded border border-zinc-800">
          <button
            type="button"
            onClick={() => setLightingMode('day')}
            className={`p-1 rounded text-xs transition-all cursor-pointer ${
              lightingMode === 'day' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/10' : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title="Gündüz Işığı"
          >
            <Sun className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setLightingMode('sunset')}
            className={`p-1 rounded text-xs transition-all cursor-pointer ${
              lightingMode === 'sunset' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/10' : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title="Günbatımı Işığı"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setLightingMode('night')}
            className={`p-1 rounded text-xs transition-all cursor-pointer ${
              lightingMode === 'night' ? 'bg-indigo-900/30 text-indigo-400 border border-indigo-500/10' : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title="Gece Işığı"
          >
            <Moon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3D Canvas Box */}
      <div className="relative bg-[#0c0c0e] flex-1 overflow-hidden min-h-[300px]">
        <canvas 
          ref={canvasRef} 
          className="w-full h-full block cursor-grab active:cursor-grabbing"
        />

        {/* Floating Rotation Toolbar */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 bg-zinc-900/95 border border-zinc-800 backdrop-blur p-1.5 rounded shadow-lg z-10">
          <div className="flex items-center justify-between gap-2 px-1 text-[9px] text-zinc-500 font-bold tracking-wider uppercase border-b border-zinc-800 pb-1 font-sans">
            <span>Kamera</span>
          </div>

          <div className="grid grid-cols-2 gap-1">
            <button 
              type="button"
              onClick={rotateLeft}
              className="p-1.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 rounded transition-colors cursor-pointer"
              title="Sola Döndür"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button 
              type="button"
              onClick={rotateRight}
              className="p-1.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 rounded transition-colors cursor-pointer"
              title="Sağa Döndür"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-px bg-slate-800 my-0.5"></div>

          <div className="grid grid-cols-2 gap-1">
            <button 
              onClick={tiltUp}
              className="p-1 text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md transition-colors"
              title="Yukarı Eğ"
            >
              Eğ+
            </button>
            <button 
              onClick={tiltDown}
              className="p-1 text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md transition-colors"
              title="Aşağı Eğ"
            >
              Eğ-
            </button>
          </div>

          <div className="h-px bg-slate-800 my-0.5"></div>

          <div className="grid grid-cols-2 gap-1">
            <button 
              onClick={zoomIn}
              className="p-1 text-[10px] font-mono font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md transition-colors"
              title="Yakınlaştır"
            >
              +
            </button>
            <button 
              onClick={zoomOut}
              className="p-1 text-[10px] font-mono font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md transition-colors"
              title="Uzaklaştır"
            >
              -
            </button>
          </div>
        </div>

        {/* Wall height extrusion slider */}
        <div className="absolute bottom-3 right-3 bg-zinc-900/95 border border-zinc-800 p-2.5 rounded text-[10px] text-zinc-400 font-medium space-y-1 w-36 shadow-lg backdrop-blur z-10">
          <div className="flex justify-between font-mono">
            <span>Duvar Boyu:</span>
            <span>{Math.round(wallHeight / 20 * 10) / 10}m</span>
          </div>
          <input 
            type="range" 
            min="20" 
            max="120" 
            step="5"
            value={wallHeight}
            onChange={(e) => setWallHeight(parseInt(e.target.value))}
            className="w-full accent-indigo-500 bg-zinc-800 rounded h-1 cursor-ew-resize"
          />
        </div>

        {/* Empty model indicator */}
        {rooms.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/80 pointer-events-none p-4">
            <div className="text-center text-zinc-500">
              <Compass className="w-10 h-10 mx-auto mb-2 opacity-30 animate-pulse text-indigo-400" />
              <p className="text-xs font-medium">3B Model Yükleniyor...</p>
              <p className="text-[10px] mt-0.5 text-zinc-650 max-w-xs leading-normal">
                2B planör alanına çizim veya şablon yerleştirdiğiniz an kat planınız otomatik olarak 3 boyutlu hale gelecektir.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* MATERIAL SELECTION PANEL */}
      <div className="p-4 bg-[#0c0c0e] border-t border-zinc-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Paintbrush className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Zemin Malzemeleri
            </h3>
          </div>
          <span className="text-[10px] font-mono text-zinc-500">
            {selectedRoom ? `Seçili: ${selectedRoom.name}` : "Tüm Odalar"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {materials.map((mat) => {
            const isAssigned = selectedRoom 
              ? selectedRoom.material === mat.id 
              : activeMaterialId === mat.id;

            return (
              <button
                type="button"
                key={mat.id}
                onClick={() => handleApplyMaterial(mat.id)}
                className={`flex items-start gap-2.5 p-2 rounded border text-left transition-all relative overflow-hidden group cursor-pointer ${
                  isAssigned
                    ? 'bg-indigo-950/30 text-indigo-300 border-indigo-500/30 shadow-md'
                    : 'bg-zinc-900/50 text-zinc-400 border-zinc-800 hover:bg-zinc-900/80 hover:border-zinc-700'
                }`}
              >
                {/* Micro preview box of the color/texture */}
                <span 
                  className="w-7 h-7 rounded shrink-0 border border-zinc-800 shadow-inner flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform"
                  style={{ backgroundColor: mat.color }}
                >
                  {/* Texture stripes or patterns drawn in CSS */}
                  {mat.id === 'ahsap' && (
                    <span className="absolute inset-x-0 top-1/2 h-0.5 bg-black/15"></span>
                  )}
                  {mat.id === 'fayans' && (
                    <span className="absolute inset-0 border border-white/5"></span>
                  )}
                  {mat.id === 'mermer' && (
                    <span className="absolute inset-y-0 left-1/3 w-0.5 bg-black/10 transform rotate-12"></span>
                  )}
                </span>

                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold truncate text-zinc-200">{mat.name}</span>
                    {isAssigned && <Check className="w-3 h-3 text-indigo-400 shrink-0" />}
                  </div>
                  <p className="text-[9px] text-zinc-500 leading-snug truncate group-hover:text-zinc-400 transition-colors">
                    {mat.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
