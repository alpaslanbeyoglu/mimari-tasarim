import React, { useState, useRef, useEffect } from 'react';
import { 
  Square, 
  Scaling, 
  Trash2, 
  Sparkles, 
  Upload, 
  Layers, 
  Grid, 
  Plus, 
  Eye, 
  EyeOff, 
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react';
import { Room } from '../types';

interface Canvas2DProps {
  rooms: Room[];
  setRooms: React.Dispatch<React.SetStateAction<Room[]>>;
  selectedRoomId: string | null;
  setSelectedRoomId: (id: string | null) => void;
  gridSize?: number; // pixels per meter
  aiScanning?: boolean;
  onSimulateScan?: () => void;
  hideSidebar?: boolean; // When sidebar is handled externally
}

type ResizeHandleType = 'nw' | 'ne' | 'se' | 'sw' | 'n' | 'e' | 's' | 'w';

interface ResizingState {
  roomId: string;
  handle: ResizeHandleType;
  startX: number;
  startY: number;
  initialRoom: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export default function Canvas2D({ 
  rooms, 
  setRooms, 
  selectedRoomId, 
  setSelectedRoomId,
  gridSize = 35,
  aiScanning = false,
  onSimulateScan,
  hideSidebar = false
}: Canvas2DProps) {
  const [activeTool, setActiveTool] = useState<'select' | 'eraser'>('select');
  const [newRoomName, setNewRoomName] = useState('Salon');
  const [newRoomWidth, setNewRoomWidth] = useState(4.5); // meters
  const [newRoomHeight, setNewRoomHeight] = useState(3.5); // meters
  const [newRoomColor, setNewRoomColor] = useState('#4f46e5');
  
  // Grid & Visual Settings
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(1);
  
  // Background Image Upload
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [bgOpacity, setBgOpacity] = useState(0.4);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Scanning Simulation Steps
  const [aiScanStep, setAiScanStep] = useState(0);
  const scanSteps = [
    "Kat planı taranıyor & pikseller çözümleniyor...",
    "Gemini 2.5 Vision modeli ile oda sınırları tespit ediliyor...",
    "Duvar hatları, kapı ve pencere açıklıkları hesaplanıyor...",
    "2B/3B koordinat matrisi oluşturuluyor ve plana aktarılıyor!"
  ];

  // Dragging & Resizing State
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizingState, setResizingState] = useState<ResizingState | null>(null);
  const canvasRef = useRef<SVGSVGElement>(null);

  // Default color presets for quick room additions
  const colorPresets = [
    { name: 'Salon', color: '#4f46e5', width: 5.0, height: 4.0 },
    { name: 'Yatak Odası', color: '#312e81', width: 4.0, height: 3.5 },
    { name: 'Mutfak', color: '#059669', width: 3.2, height: 3.2 },
    { name: 'Banyo', color: '#0891b2', width: 2.4, height: 2.2 },
    { name: 'Giriş & Koridor', color: '#6366f1', width: 2.2, height: 4.0 },
    { name: 'Balkon / Teras', color: '#d97706', width: 3.5, height: 1.8 },
  ];

  const handlePresetSelect = (preset: typeof colorPresets[0]) => {
    setNewRoomName(preset.name);
    setNewRoomColor(preset.color);
    setNewRoomWidth(preset.width);
    setNewRoomHeight(preset.height);
  };

  // Add room handler
  const handleAddRoom = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const widthMeters = Math.max(0.5, newRoomWidth);
    const heightMeters = Math.max(0.5, newRoomHeight);

    const widthPx = Math.round(widthMeters * gridSize);
    const heightPx = Math.round(heightMeters * gridSize);
    
    // Position room with a slight offset based on count to avoid stacking directly on top
    const baseOffset = (rooms.length % 5) * 20;
    const x = Math.max(20, 120 + baseOffset);
    const y = Math.max(20, 100 + baseOffset);

    const newRoom: Room = {
      id: `room-${Date.now()}`,
      name: newRoomName || 'Oda',
      x: Math.round(x / 10) * 10,
      y: Math.round(y / 10) * 10,
      width: widthPx,
      height: heightPx,
      color: newRoomColor,
      material: 'beton'
    };

    setRooms(prev => [...prev, newRoom]);
    setSelectedRoomId(newRoom.id);
    setActiveTool('select');
  };

  // Dragging handler
  const handleMouseDownRoom = (e: React.MouseEvent<SVGRectElement>, room: Room) => {
    if (activeTool === 'eraser') {
      setRooms(prev => prev.filter(r => r.id !== room.id));
      if (selectedRoomId === room.id) setSelectedRoomId(null);
      return;
    }
    
    e.stopPropagation();
    setSelectedRoomId(room.id);
    setIsDragging(true);

    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const mouseX = (e.clientX - rect.left) / zoom;
      const mouseY = (e.clientY - rect.top) / zoom;
      setDragOffset({
        x: mouseX - room.x,
        y: mouseY - room.y
      });
    }
  };

  // Start Resizing from any corner or edge handle
  const handleHandleMouseDown = (
    e: React.MouseEvent,
    room: Room,
    handle: ResizeHandleType
  ) => {
    e.stopPropagation();
    e.preventDefault();

    setSelectedRoomId(room.id);
    setResizingState({
      roomId: room.id,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      initialRoom: {
        x: room.x,
        y: room.y,
        width: room.width,
        height: room.height
      }
    });
  };

  // Global mousemove & mouseup listeners for drag & resize
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      // 1. Resizing
      if (resizingState) {
        const dx = (e.clientX - resizingState.startX) / zoom;
        const dy = (e.clientY - resizingState.startY) / zoom;
        const { x: initX, y: initY, width: initW, height: initH } = resizingState.initialRoom;
        const minSize = 25; // approx ~0.7m minimum

        let newX = initX;
        let newY = initY;
        let newW = initW;
        let newH = initH;

        switch (resizingState.handle) {
          case 'se': {
            newW = Math.max(minSize, Math.round((initW + dx) / 10) * 10);
            newH = Math.max(minSize, Math.round((initH + dy) / 10) * 10);
            break;
          }
          case 'sw': {
            const rawW = initW - dx;
            newW = Math.max(minSize, Math.round(rawW / 10) * 10);
            newX = Math.max(0, initX + (initW - newW));
            newH = Math.max(minSize, Math.round((initH + dy) / 10) * 10);
            break;
          }
          case 'ne': {
            newW = Math.max(minSize, Math.round((initW + dx) / 10) * 10);
            const rawH = initH - dy;
            newH = Math.max(minSize, Math.round(rawH / 10) * 10);
            newY = Math.max(0, initY + (initH - newH));
            break;
          }
          case 'nw': {
            const rawW = initW - dx;
            const rawH = initH - dy;
            newW = Math.max(minSize, Math.round(rawW / 10) * 10);
            newH = Math.max(minSize, Math.round(rawH / 10) * 10);
            newX = Math.max(0, initX + (initW - newW));
            newY = Math.max(0, initY + (initH - newH));
            break;
          }
          case 'n': {
            const rawH = initH - dy;
            newH = Math.max(minSize, Math.round(rawH / 10) * 10);
            newY = Math.max(0, initY + (initH - newH));
            break;
          }
          case 's': {
            newH = Math.max(minSize, Math.round((initH + dy) / 10) * 10);
            break;
          }
          case 'e': {
            newW = Math.max(minSize, Math.round((initW + dx) / 10) * 10);
            break;
          }
          case 'w': {
            const rawW = initW - dx;
            newW = Math.max(minSize, Math.round(rawW / 10) * 10);
            newX = Math.max(0, initX + (initW - newW));
            break;
          }
        }

        setRooms(prev => prev.map(r => {
          if (r.id === resizingState.roomId) {
            return {
              ...r,
              x: Math.max(0, newX),
              y: Math.max(0, newY),
              width: newW,
              height: newH
            };
          }
          return r;
        }));
        return;
      }

      // 2. Room Dragging
      if (isDragging && selectedRoomId && activeTool === 'select') {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const mouseX = (e.clientX - rect.left) / zoom;
          const mouseY = (e.clientY - rect.top) / zoom;
          
          let newX = mouseX - dragOffset.x;
          let newY = mouseY - dragOffset.y;
          
          newX = Math.round(newX / 10) * 10;
          newY = Math.round(newY / 10) * 10;
          newX = Math.max(0, newX);
          newY = Math.max(0, newY);

          setRooms(prev => prev.map(r => {
            if (r.id === selectedRoomId) {
              return { ...r, x: newX, y: newY };
            }
            return r;
          }));
        }
      }
    };

    const handleGlobalMouseUp = () => {
      if (resizingState) setResizingState(null);
      if (isDragging) setIsDragging(false);
    };

    if (isDragging || resizingState) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, resizingState, selectedRoomId, activeTool, dragOffset, zoom, setRooms]);

  // AI Scan Step Animation
  useEffect(() => {
    if (!aiScanning) {
      setAiScanStep(0);
      return;
    }
    if (aiScanStep < scanSteps.length - 1) {
      const timer = setTimeout(() => {
        setAiScanStep(prev => prev + 1);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [aiScanning, aiScanStep, scanSteps.length]);

  // Image Upload handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setBgImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const selectedRoom = rooms.find(r => r.id === selectedRoomId) || null;

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full w-full min-h-0">
      {/* Optional Left Control Sidebar (if not hidden) */}
      {!hideSidebar && (
        <div className="w-full lg:w-72 flex flex-col gap-3 shrink-0 overflow-y-auto pr-1">
          {/* Tool selector */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-lg p-3.5 space-y-2">
            <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              Tuval Kontrolleri
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setActiveTool('select')}
                className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md border transition-all cursor-pointer ${
                  activeTool === 'select'
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-950/40'
                    : 'bg-zinc-800 hover:bg-zinc-750 text-zinc-300 border-zinc-700'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Seç / Boyutlandır</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTool('eraser')}
                className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md border transition-all cursor-pointer ${
                  activeTool === 'eraser'
                    ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-950/40'
                    : 'bg-zinc-800 hover:bg-zinc-750 text-zinc-300 border-zinc-700'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Oda Sil</span>
              </button>
            </div>
          </div>

          {/* Quick Room Presets & Add Form */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-lg p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Yeni Oda Ekle
              </h3>
              <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded font-mono">
                2D CAD
              </span>
            </div>

            {/* Presets */}
            <div>
              <label className="text-[9px] text-zinc-500 uppercase tracking-wider block mb-1">
                Hızlı Şablonlar
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handlePresetSelect(preset)}
                    className={`px-2 py-1 text-[10px] rounded border text-left flex items-center gap-1.5 transition-all cursor-pointer ${
                      newRoomName === preset.name 
                        ? 'bg-zinc-800 border-indigo-500 text-white font-semibold' 
                        : 'bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <span 
                      className="w-2 h-2 rounded-full shrink-0" 
                      style={{ backgroundColor: preset.color }}
                    ></span>
                    <span className="truncate">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleAddRoom} className="space-y-2.5 pt-1">
              <div>
                <label className="text-[10px] text-zinc-400 block mb-1">Oda İsmi</label>
                <input 
                  type="text" 
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="w-full bg-[#0c0c0e] border border-zinc-800 focus:border-indigo-500 rounded px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none"
                  placeholder="Örn: Çalışma Odası"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1">Genişlik (m)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    min="0.5"
                    max="25"
                    value={newRoomWidth}
                    onChange={(e) => setNewRoomWidth(parseFloat(e.target.value) || 1)}
                    className="w-full bg-[#0c0c0e] border border-zinc-800 focus:border-indigo-500 rounded px-2.5 py-1.5 text-xs text-zinc-100 font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1">Derinlik (m)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    min="0.5"
                    max="25"
                    value={newRoomHeight}
                    onChange={(e) => setNewRoomHeight(parseFloat(e.target.value) || 1)}
                    className="w-full bg-[#0c0c0e] border border-zinc-800 focus:border-indigo-500 rounded px-2.5 py-1.5 text-xs text-zinc-100 font-mono focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-1.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-md shadow-md shadow-indigo-950/30 transition-all cursor-pointer mt-2"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Odayı Plana Ekle</span>
              </button>
            </form>
          </div>

          {/* Reference Blueprint Upload */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-lg p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Kılavuz Kat Planı
              </h3>
              {bgImage && (
                <button 
                  onClick={() => setBgImage(null)}
                  className="text-[9px] text-red-400 hover:underline cursor-pointer"
                >
                  Kaldır
                </button>
              )}
            </div>

            {!bgImage ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border border-dashed border-zinc-800 hover:border-indigo-500/50 rounded p-3 text-center cursor-pointer hover:bg-zinc-950/40 transition-all group"
              >
                <Upload className="w-5 h-5 text-zinc-500 group-hover:text-indigo-400 mx-auto mb-1 transition-colors" />
                <span className="text-[10px] text-zinc-400 block font-medium">PNG / JPG Plan Yükle</span>
                <span className="text-[8px] text-zinc-600 block">Arka plan kılavuz katmanı olarak yerleşir</span>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex justify-between text-[9px] text-zinc-500 font-mono">
                  <span>Kılavuz Opaklığı:</span>
                  <span>{Math.round(bgOpacity * 100)}%</span>
                </div>
                <input 
                  type="range" 
                  min="0.1" 
                  max="0.9" 
                  step="0.05"
                  value={bgOpacity}
                  onChange={(e) => setBgOpacity(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 bg-zinc-800 rounded h-1 cursor-pointer"
                />
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
          </div>
        </div>
      )}

      {/* Main Interactive SVG Workspace */}
      <div className="flex-1 flex flex-col min-h-[400px] bg-[#0c0c0e] border border-zinc-800 rounded-lg overflow-hidden relative shadow-inner">
        {/* Workspace Top Toolbar */}
        <div className="flex items-center justify-between px-3 py-2 bg-[#0c0c0e]/95 border-b border-zinc-800 shrink-0 z-10">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              2B Planör Tuvali
            </span>
            <div className="h-3.5 w-px bg-zinc-800"></div>
            <span className="text-[10px] font-mono text-zinc-500">
              {rooms.length} Oda • {selectedRoom ? selectedRoom.name : 'Seçim yok'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
                showGrid ? 'bg-indigo-950/60 text-indigo-400 border border-indigo-500/30' : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Izgarayı Aç / Kapat"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setZoom(prev => Math.min(1.8, prev + 0.1))}
              className="p-1.5 rounded text-xs text-zinc-400 hover:text-white bg-zinc-850 hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Yakınlaş"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setZoom(prev => Math.max(0.6, prev - 0.1))}
              className="p-1.5 rounded text-xs text-zinc-400 hover:text-white bg-zinc-850 hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Uzaklaş"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setZoom(1)}
              className="p-1.5 rounded text-[10px] font-mono text-zinc-400 hover:text-white bg-zinc-850 hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Görünümü Sıfırla (%100)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* SVG Drawing Surface */}
        <div className="flex-1 relative overflow-hidden bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:20px_20px]">
          {/* Reference Image Layer */}
          {bgImage && (
            <div 
              className="absolute inset-0 pointer-events-none flex items-center justify-center p-6 transition-opacity"
              style={{ opacity: bgOpacity }}
            >
              <img 
                src={bgImage} 
                alt="Guide" 
                className="w-full h-full object-contain pointer-events-none" 
              />
            </div>
          )}

          <svg
            ref={canvasRef}
            className="w-full h-full relative z-10 cursor-crosshair select-none"
            onMouseDown={(e) => {
              if (e.target === canvasRef.current) {
                setSelectedRoomId(null);
              }
            }}
          >
            {/* Grid Definition */}
            {showGrid && (
              <defs>
                <pattern id="grid-pattern" width={gridSize} height={gridSize} patternUnits="userSpaceOnUse">
                  <path d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`} fill="none" stroke="rgba(63, 63, 70, 0.25)" strokeWidth="1" />
                  <path d={`M ${gridSize * 5} 0 L 0 0 0 ${gridSize * 5}`} fill="none" stroke="rgba(99, 102, 241, 0.25)" strokeWidth="1.2" />
                </pattern>
              </defs>
            )}

            {showGrid && (
              <rect width="100%" height="100%" fill="url(#grid-pattern)" pointerEvents="none" />
            )}

            <g transform={`scale(${zoom})`}>
              {/* Rooms Render */}
              {rooms.map((room) => {
                const isSelected = room.id === selectedRoomId;
                const wM = (room.width / gridSize).toFixed(1);
                const hM = (room.height / gridSize).toFixed(1);

                return (
                  <g key={room.id} className="select-none">
                    {/* Outer Wall Thickness */}
                    <rect
                      x={room.x - 3}
                      y={room.y - 3}
                      width={room.width + 6}
                      height={room.height + 6}
                      rx={2}
                      fill="none"
                      stroke="#27272a"
                      strokeWidth="3"
                      pointerEvents="none"
                    />

                    {/* Room Floor Rectangle */}
                    <rect
                      x={room.x}
                      y={room.y}
                      width={room.width}
                      height={room.height}
                      fill={room.color}
                      fillOpacity={isSelected ? 0.4 : 0.2}
                      stroke={isSelected ? '#818cf8' : room.color}
                      strokeWidth={isSelected ? 2 : 1}
                      className="transition-colors cursor-move"
                      onMouseDown={(e) => handleMouseDownRoom(e, room)}
                    />

                    {/* Door Arc Representation */}
                    {room.width > 50 && room.height > 50 && (
                      <path
                        d={`M ${room.x} ${room.y + Math.min(30, room.height - 5)} A 20 20 0 0 1 ${room.x + 20} ${room.y + Math.min(30, room.height - 5) + 20}`}
                        fill="none"
                        stroke="#f43f5e"
                        strokeWidth="1.5"
                        strokeDasharray="2,2"
                        pointerEvents="none"
                      />
                    )}

                    {/* Room Name Label */}
                    <text
                      x={room.x + room.width / 2}
                      y={room.y + room.height / 2 - 3}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="11"
                      fontWeight="bold"
                      className="pointer-events-none drop-shadow font-sans"
                    >
                      {room.name}
                    </text>

                    {/* Dimension Label */}
                    <text
                      x={room.x + room.width / 2}
                      y={room.y + room.height / 2 + 13}
                      textAnchor="middle"
                      fill="#a1a1aa"
                      fontSize="10"
                      fontWeight="500"
                      className="pointer-events-none font-mono"
                    >
                      {wM}m × {hM}m
                    </text>

                    {/* Selection Outline & Resizing Handles */}
                    {isSelected && (
                      <g>
                        {/* Dashed Selection Boundary */}
                        <rect
                          x={room.x}
                          y={room.y}
                          width={room.width}
                          height={room.height}
                          fill="none"
                          stroke="#6366f1"
                          strokeWidth="1.5"
                          strokeDasharray="4 3"
                          pointerEvents="none"
                        />

                        {/* Top-Left Corner (NW) */}
                        <g 
                          className="cursor-nwse-resize"
                          onMouseDown={(e) => handleHandleMouseDown(e, room, 'nw')}
                        >
                          <circle cx={room.x} cy={room.y} r="12" fill="transparent" />
                          <rect
                            x={room.x - 5}
                            y={room.y - 5}
                            width="10"
                            height="10"
                            rx="2"
                            fill={resizingState?.handle === 'nw' ? '#818cf8' : '#ffffff'}
                            stroke="#4f46e5"
                            strokeWidth="2"
                            className="hover:scale-125 transition-transform"
                          />
                        </g>

                        {/* Top-Right Corner (NE) */}
                        <g 
                          className="cursor-nesw-resize"
                          onMouseDown={(e) => handleHandleMouseDown(e, room, 'ne')}
                        >
                          <circle cx={room.x + room.width} cy={room.y} r="12" fill="transparent" />
                          <rect
                            x={room.x + room.width - 5}
                            y={room.y - 5}
                            width="10"
                            height="10"
                            rx="2"
                            fill={resizingState?.handle === 'ne' ? '#818cf8' : '#ffffff'}
                            stroke="#4f46e5"
                            strokeWidth="2"
                            className="hover:scale-125 transition-transform"
                          />
                        </g>

                        {/* Bottom-Right Corner (SE) */}
                        <g 
                          className="cursor-nwse-resize"
                          onMouseDown={(e) => handleHandleMouseDown(e, room, 'se')}
                        >
                          <circle cx={room.x + room.width} cy={room.y + room.height} r="12" fill="transparent" />
                          <rect
                            x={room.x + room.width - 5}
                            y={room.y + room.height - 5}
                            width="10"
                            height="10"
                            rx="2"
                            fill={resizingState?.handle === 'se' ? '#818cf8' : '#ffffff'}
                            stroke="#4f46e5"
                            strokeWidth="2"
                            className="hover:scale-125 transition-transform"
                          />
                        </g>

                        {/* Bottom-Left Corner (SW) */}
                        <g 
                          className="cursor-nesw-resize"
                          onMouseDown={(e) => handleHandleMouseDown(e, room, 'sw')}
                        >
                          <circle cx={room.x} cy={room.y + room.height} r="12" fill="transparent" />
                          <rect
                            x={room.x - 5}
                            y={room.y + room.height - 5}
                            width="10"
                            height="10"
                            rx="2"
                            fill={resizingState?.handle === 'sw' ? '#818cf8' : '#ffffff'}
                            stroke="#4f46e5"
                            strokeWidth="2"
                            className="hover:scale-125 transition-transform"
                          />
                        </g>

                        {/* Top Midpoint Handle (N) */}
                        {room.width > 40 && (
                          <g 
                            className="cursor-ns-resize"
                            onMouseDown={(e) => handleHandleMouseDown(e, room, 'n')}
                          >
                            <rect x={room.x + room.width / 2 - 12} y={room.y - 6} width="24" height="12" fill="transparent" />
                            <rect
                              x={room.x + room.width / 2 - 8}
                              y={room.y - 3}
                              width="16"
                              height="6"
                              rx="3"
                              fill={resizingState?.handle === 'n' ? '#818cf8' : '#ffffff'}
                              stroke="#4f46e5"
                              strokeWidth="1.5"
                            />
                          </g>
                        )}

                        {/* Bottom Midpoint Handle (S) */}
                        {room.width > 40 && (
                          <g 
                            className="cursor-ns-resize"
                            onMouseDown={(e) => handleHandleMouseDown(e, room, 's')}
                          >
                            <rect x={room.x + room.width / 2 - 12} y={room.y + room.height - 6} width="24" height="12" fill="transparent" />
                            <rect
                              x={room.x + room.width / 2 - 8}
                              y={room.y + room.height - 3}
                              width="16"
                              height="6"
                              rx="3"
                              fill={resizingState?.handle === 's' ? '#818cf8' : '#ffffff'}
                              stroke="#4f46e5"
                              strokeWidth="1.5"
                            />
                          </g>
                        )}

                        {/* Left Midpoint Handle (W) */}
                        {room.height > 40 && (
                          <g 
                            className="cursor-ew-resize"
                            onMouseDown={(e) => handleHandleMouseDown(e, room, 'w')}
                          >
                            <rect x={room.x - 6} y={room.y + room.height / 2 - 12} width="12" height="24" fill="transparent" />
                            <rect
                              x={room.x - 3}
                              y={room.y + room.height / 2 - 8}
                              width="6"
                              height="16"
                              rx="3"
                              fill={resizingState?.handle === 'w' ? '#818cf8' : '#ffffff'}
                              stroke="#4f46e5"
                              strokeWidth="1.5"
                            />
                          </g>
                        )}

                        {/* Right Midpoint Handle (E) */}
                        {room.height > 40 && (
                          <g 
                            className="cursor-ew-resize"
                            onMouseDown={(e) => handleHandleMouseDown(e, room, 'e')}
                          >
                            <rect x={room.x + room.width - 6} y={room.y + room.height / 2 - 12} width="12" height="24" fill="transparent" />
                            <rect
                              x={room.x + room.width - 3}
                              y={room.y + room.height / 2 - 8}
                              width="6"
                              height="16"
                              rx="3"
                              fill={resizingState?.handle === 'e' ? '#818cf8' : '#ffffff'}
                              stroke="#4f46e5"
                              strokeWidth="1.5"
                            />
                          </g>
                        )}

                        {/* Live Resizing Dimension Badge */}
                        {resizingState?.roomId === room.id && (
                          <g transform={`translate(${room.x + room.width / 2}, ${Math.max(20, room.y - 24)})`}>
                            <rect
                              x="-55"
                              y="-10"
                              width="110"
                              height="20"
                              rx="4"
                              fill="#09090b"
                              stroke="#6366f1"
                              strokeWidth="1.5"
                            />
                            <text
                              x="0"
                              y="4"
                              textAnchor="middle"
                              fill="#818cf8"
                              fontSize="10"
                              fontWeight="bold"
                              className="font-mono pointer-events-none"
                            >
                              {wM}m × {hM}m
                            </text>
                          </g>
                        )}
                      </g>
                    )}
                  </g>
                );
              })}
            </g>

            {/* Empty State */}
            {rooms.length === 0 && !aiScanning && (
              <g transform="translate(40, 60)" className="opacity-40">
                <foreignObject width="100%" height="250">
                  <div className="flex flex-col items-center justify-center h-full text-zinc-500 text-center px-4">
                    <Square className="w-10 h-10 text-zinc-600 mb-2" />
                    <p className="text-sm font-semibold text-zinc-300">Kat Planı Alanı Boş</p>
                    <p className="text-xs max-w-xs mt-1 text-zinc-500">
                      Yeni bir oda ekleyin veya AI analizi ile otomatik plan oluşturun.
                    </p>
                  </div>
                </foreignObject>
              </g>
            )}
          </svg>

          {/* AI Scanning Modal Overlay */}
          {aiScanning && (
            <div className="absolute inset-0 bg-zinc-950/85 z-20 flex flex-col items-center justify-center p-6">
              <div className="max-w-sm w-full bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-2xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 animate-spin" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-100">AI Kat Planı Çözümleniyor</h4>
                    <p className="text-[10px] text-zinc-500">Gemini 2.5 Vision Analizi</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {scanSteps.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        idx < aiScanStep ? 'bg-indigo-500' : idx === aiScanStep ? 'bg-indigo-400 animate-ping' : 'bg-zinc-800'
                      }`}></span>
                      <span className={`text-[11px] ${
                        idx <= aiScanStep ? 'text-indigo-300 font-medium' : 'text-zinc-600'
                      }`}>
                        {step}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="w-full bg-zinc-800 rounded-full h-1 overflow-hidden">
                  <div 
                    className="bg-indigo-500 h-1 rounded-full transition-all duration-300"
                    style={{ width: `${((aiScanStep + 1) / scanSteps.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Footnote Info */}
          <div className="absolute bottom-2 left-3 bg-zinc-900/90 border border-zinc-800 px-2.5 py-1 rounded text-[9px] font-mono text-zinc-400 flex items-center gap-2 z-10 select-none">
            <span>Ölçek: 1m = {gridSize}px</span>
            <span className="text-zinc-600">•</span>
            <span>Köşelerden tutup sürükleyerek boyutlandırın</span>
          </div>
        </div>
      </div>
    </div>
  );
}
