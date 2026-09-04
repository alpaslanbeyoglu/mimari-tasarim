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
  Undo, 
  Info 
} from 'lucide-react';
import { Room } from '../types';

interface Canvas2DProps {
  rooms: Room[];
  setRooms: React.Dispatch<React.SetStateAction<Room[]>>;
  selectedRoomId: string | null;
  setSelectedRoomId: (id: string | null) => void;
  gridSize: number; // pixels per meter
}

export default function Canvas2D({ 
  rooms, 
  setRooms, 
  selectedRoomId, 
  setSelectedRoomId,
  gridSize = 40 
}: Canvas2DProps) {
  const [activeTool, setActiveTool] = useState<'select' | 'add' | 'wall' | 'eraser'>('select');
  const [newRoomName, setNewRoomName] = useState('Salon');
  const [newRoomWidth, setNewRoomWidth] = useState(4.5); // meters
  const [newRoomHeight, setNewRoomHeight] = useState(3.5); // meters
  const [newRoomColor, setNewRoomColor] = useState('#10b981'); // Emerald
  
  // Grid settings
  const [showGrid, setShowGrid] = useState(true);
  
  // Background Image Upload
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [bgOpacity, setBgOpacity] = useState(0.4);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Scanning Simulation State
  const [aiScanning, setAiScanning] = useState(false);
  const [aiScanStep, setAiScanStep] = useState(0);
  const scanSteps = [
    "AI Analizi Başlatılıyor...",
    "Yüklenen kat planı görseli Gemini 2.5 modeline gönderiliyor...",
    "Dış ve iç duvar hatları piksellerden ayrıştırılıyor...",
    "Oda sınırları ve fonksiyonel alanlar etiketleniyor...",
    "Kapı, pencere ve tesisat boşlukları yerleştiriliyor...",
    "3D ekstrüzyon verisi hazırlanıyor ve çizim tamamlandı!"
  ];

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<SVGSVGElement>(null);

  // Default color presets for rooms
  const colorPresets = [
    { name: 'Salon', color: '#10b981', bg: 'rgba(16, 185, 129, 0.2)' },
    { name: 'Yatak Odası', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.2)' },
    { name: 'Mutfak', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.2)' },
    { name: 'Banyo', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.2)' },
    { name: 'Koridor', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.2)' },
    { name: 'Balkon', color: '#14b8a6', bg: 'rgba(20, 184, 166, 0.2)' },
  ];

  const handlePresetSelect = (preset: typeof colorPresets[0]) => {
    setNewRoomName(preset.name);
    setNewRoomColor(preset.color);
  };

  // Add room handler
  const handleAddRoom = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Position room nicely centered on grid
    const widthPx = newRoomWidth * gridSize;
    const heightPx = newRoomHeight * gridSize;
    const canvasWidth = canvasRef.current?.clientWidth || 600;
    const canvasHeight = canvasRef.current?.clientHeight || 450;
    
    const x = Math.round((canvasWidth / 2 - widthPx / 2) / 10) * 10;
    const y = Math.round((canvasHeight / 2 - heightPx / 2) / 10) * 10;

    const newRoom: Room = {
      id: `room-${Date.now()}`,
      name: newRoomName,
      x: x,
      y: y,
      width: widthPx,
      height: heightPx,
      color: newRoomColor,
      material: 'beton'
    };

    setRooms(prev => [...prev, newRoom]);
    setSelectedRoomId(newRoom.id);
    setActiveTool('select');
  };

  // Dragging event handlers for SVGs
  const handleMouseDown = (e: React.MouseEvent<SVGRectElement>, room: Room) => {
    if (activeTool === 'eraser') {
      setRooms(prev => prev.filter(r => r.id !== room.id));
      if (selectedRoomId === room.id) setSelectedRoomId(null);
      return;
    }
    
    if (activeTool !== 'select') return;
    
    setSelectedRoomId(room.id);
    setIsDragging(true);

    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      setDragOffset({
        x: mouseX - room.x,
        y: mouseY - room.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging || !selectedRoomId || activeTool !== 'select') return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Snap to a 10px grid
      let newX = mouseX - dragOffset.x;
      let newY = mouseY - dragOffset.y;
      
      newX = Math.round(newX / 10) * 10;
      newY = Math.round(newY / 10) * 10;

      // Keep inside positive bounds loosely
      newX = Math.max(0, newX);
      newY = Math.max(0, newY);

      setRooms(prev => prev.map(r => {
        if (r.id === selectedRoomId) {
          return { ...r, x: newX, y: newY };
        }
        return r;
      }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Image upload
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

  const loadSampleImage = () => {
    // A beautiful conceptual blueprint outline
    setBgImage("https://images.unsplash.com/photo-1545464693-f17e2af272b2?q=80&w=800&auto=format&fit=crop");
  };

  const clearBgImage = () => {
    setBgImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Trigger simulated AI Scan
  const triggerAIScan = () => {
    setAiScanning(true);
    setAiScanStep(0);
  };

  // AI scan step timer
  useEffect(() => {
    if (!aiScanning) return;

    if (aiScanStep < scanSteps.length - 1) {
      const timer = setTimeout(() => {
        setAiScanStep(prev => prev + 1);
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      // Complete scanning and populate gorgeous plan
      const timer = setTimeout(() => {
        const aiRooms: Room[] = [
          { id: 'ai-1', name: 'Salon', x: 60, y: 50, width: 220, height: 180, color: '#10b981', material: 'ahsap' },
          { id: 'ai-2', name: 'Mutfak', x: 290, y: 50, width: 140, height: 110, color: '#f59e0b', material: 'fayans' },
          { id: 'ai-3', name: 'Yatak Odası', x: 60, y: 240, width: 150, height: 130, color: '#3b82f6', material: 'ahsap' },
          { id: 'ai-4', name: 'Banyo', x: 220, y: 240, width: 90, height: 130, color: '#ec4899', material: 'mermer' },
          { id: 'ai-5', name: 'Koridor', x: 320, y: 170, width: 110, height: 200, color: '#8b5cf6', material: 'beton' },
        ];
        setRooms(aiRooms);
        setAiScanning(false);
        setSelectedRoomId('ai-1');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [aiScanning, aiScanStep]);

  // Handle selected room dimensional changes
  const updateSelectedRoomDimension = (field: 'width' | 'height' | 'name', value: any) => {
    if (!selectedRoomId) return;
    setRooms(prev => prev.map(r => {
      if (r.id === selectedRoomId) {
        if (field === 'width') {
          return { ...r, width: parseFloat(value) * gridSize };
        } else if (field === 'height') {
          return { ...r, height: parseFloat(value) * gridSize };
        } else {
          return { ...r, name: value };
        }
      }
      return r;
    }));
  };

  const getSelectedRoom = () => {
    return rooms.find(r => r.id === selectedRoomId) || null;
  };

  const selectedRoom = getSelectedRoom();

  return (
    <div className="flex flex-col xl:flex-row gap-4 h-full">
      {/* LEFT COMPONENT - Editor Controls */}
      <div className="w-full xl:w-80 flex flex-col gap-4 shrink-0">
        {/* Tool selector */}
        <div className="bg-zinc-900 border border-zinc-800 rounded p-4">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
            Çizim Araçları
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setActiveTool('select')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded border transition-all cursor-pointer ${
                activeTool === 'select'
                  ? 'bg-indigo-900/30 text-indigo-400 border-indigo-500/30'
                  : 'bg-zinc-850 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
              }`}
            >
              <Layers className="w-4 h-4 shrink-0" />
              <span>Oda Seç / Taşı</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTool('eraser')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded border transition-all cursor-pointer ${
                activeTool === 'eraser'
                  ? 'bg-red-950/40 text-red-400 border-red-500/30'
                  : 'bg-zinc-850 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
              }`}
            >
              <Trash2 className="w-4 h-4 shrink-0" />
              <span>Oda Sil</span>
            </button>
          </div>
        </div>

        {/* Manual Dimension Entry & Room Creation Form */}
        <div className="bg-zinc-900 border border-zinc-800 rounded p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Manuel Oda Ölçüsü Gir
            </h3>
            <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
              2B Tuval
            </span>
          </div>

          <form onSubmit={handleAddRoom} className="space-y-3.5">
            {/* Quick Presets */}
            <div>
              <label className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1.5 font-semibold">
                Hızlı Oda Şablonları
              </label>
              <div className="flex flex-wrap gap-1.5">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handlePresetSelect(preset)}
                    style={{ borderColor: preset.color + '30' }}
                    className={`px-2 py-1 text-[11px] rounded border bg-zinc-850/40 hover:bg-zinc-800 transition-all cursor-pointer ${
                      newRoomName === preset.name ? 'text-zinc-100 font-semibold bg-zinc-800 border-indigo-500/50' : 'text-zinc-400'
                    }`}
                  >
                    <span 
                      className="inline-block w-1.5 h-1.5 rounded-full mr-1" 
                      style={{ backgroundColor: preset.color }}
                    ></span>
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-400 block mb-1">Oda Adı</label>
              <input 
                type="text" 
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                className="w-full bg-[#0c0c0e] border border-zinc-800 focus:border-indigo-500 rounded px-3 py-2 text-xs text-zinc-100 focus:outline-none transition-all font-medium"
                placeholder="Örn: Oturma Odası"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-zinc-400 block mb-1">Genişlik (X - Metre)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    step="0.1"
                    min="1"
                    max="20"
                    value={newRoomWidth}
                    onChange={(e) => setNewRoomWidth(parseFloat(e.target.value) || 1)}
                    className="w-full bg-[#0c0c0e] border border-zinc-800 focus:border-indigo-500 rounded pl-3 pr-8 py-2 text-xs text-zinc-100 focus:outline-none transition-all font-mono"
                  />
                  <span className="absolute right-3 top-2.5 text-zinc-500 text-[10px] font-mono font-medium">m</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-400 block mb-1">Derinlik (Y - Metre)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    step="0.1"
                    min="1"
                    max="20"
                    value={newRoomHeight}
                    onChange={(e) => setNewRoomHeight(parseFloat(e.target.value) || 1)}
                    className="w-full bg-[#0c0c0e] border border-zinc-800 focus:border-indigo-500 rounded pl-3 pr-8 py-2 text-xs text-zinc-100 focus:outline-none transition-all font-mono"
                  />
                  <span className="absolute right-3 top-2.5 text-zinc-500 text-[10px] font-mono font-medium">m</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Plana Yeni Oda Ekle</span>
            </button>
          </form>
        </div>

        {/* Selected Room Details / Real-time Adjustment */}
        {selectedRoom && (
          <div className="bg-zinc-900 border border-zinc-800 rounded p-4 animate-fadeIn">
            <div className="flex items-center justify-between mb-3 border-b border-zinc-800 pb-2">
              <span className="text-xs font-semibold text-zinc-300">Seçili Oda Ayarları</span>
              <button 
                onClick={() => {
                  setRooms(prev => prev.filter(r => r.id !== selectedRoomId));
                  setSelectedRoomId(null);
                }}
                className="text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                title="Odayı sil"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider block mb-1">Oda İsmi</label>
                <input 
                  type="text" 
                  value={selectedRoom.name}
                  onChange={(e) => updateSelectedRoomDimension('name', e.target.value)}
                  className="w-full bg-[#0c0c0e] border border-zinc-800 focus:border-indigo-500 rounded px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider block mb-1">Genişlik (m)</label>
                  <input 
                    type="number" 
                    step="0.05"
                    value={Math.round((selectedRoom.width / gridSize) * 100) / 100}
                    onChange={(e) => updateSelectedRoomDimension('width', e.target.value)}
                    className="w-full bg-[#0c0c0e] border border-zinc-800 focus:border-indigo-500 rounded px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider block mb-1">Derinlik (m)</label>
                  <input 
                    type="number" 
                    step="0.05"
                    value={Math.round((selectedRoom.height / gridSize) * 100) / 100}
                    onChange={(e) => updateSelectedRoomDimension('height', e.target.value)}
                    className="w-full bg-[#0c0c0e] border border-zinc-800 focus:border-indigo-500 rounded px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none transition-all font-mono"
                  />
                </div>
              </div>
              <div className="p-2 bg-[#0c0c0e]/60 border border-zinc-800 rounded text-[10px] text-zinc-400 flex items-center gap-1.5 leading-snug">
                <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>Kat planında odayı sürükleyerek konumlandırabilirsiniz.</span>
              </div>
            </div>
          </div>
        )}

        {/* Blueprint Guide image upload / trace */}
        <div className="bg-zinc-900 border border-zinc-800 rounded p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Referans Kat Planı Yükle
            </h3>
            {bgImage && (
              <button 
                onClick={clearBgImage}
                className="text-[10px] text-red-400 hover:underline cursor-pointer"
              >
                Temizle
              </button>
            )}
          </div>

          <div className="space-y-3">
            {!bgImage ? (
              <div className="space-y-2">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border border-dashed border-zinc-800 hover:border-indigo-500/50 rounded p-4 text-center cursor-pointer hover:bg-zinc-950/30 transition-all group"
                >
                  <Upload className="w-6 h-6 text-zinc-500 group-hover:text-indigo-400 mx-auto mb-2 transition-colors" />
                  <span className="text-[11px] text-zinc-400 block font-medium">PNG veya JPG Görseli Seç</span>
                  <span className="text-[9px] text-zinc-600 block mt-1">Üzerinden çizim veya AI tespiti için</span>
                </div>
                
                <button
                  type="button"
                  onClick={loadSampleImage}
                  className="w-full py-1.5 text-[11px] bg-zinc-850/40 hover:bg-zinc-800 text-zinc-300 rounded border border-zinc-800 transition-colors cursor-pointer"
                >
                  Örnek Kat Görseli Yükle
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="relative aspect-video rounded overflow-hidden border border-zinc-800 bg-zinc-950">
                  <img 
                    src={bgImage} 
                    alt="Floor plan guide" 
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/80 rounded text-[9px] text-zinc-400 border border-zinc-800">
                    Kılavuz Katman
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-zinc-500 mb-1 font-mono">
                    <span>Katman Opaklığı:</span>
                    <span>{Math.round(bgOpacity * 100)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.05"
                    value={bgOpacity}
                    onChange={(e) => setBgOpacity(parseFloat(e.target.value))}
                    className="w-full accent-indigo-500 bg-zinc-800 rounded h-1 cursor-pointer"
                  />
                </div>
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
      </div>

      {/* MIDDLE COMPONENT - Interactive 2D Canvas */}
      <div className="flex-1 flex flex-col min-h-[500px] bg-[#0c0c0e] border border-zinc-800 rounded overflow-hidden relative">
        {/* Canvas Toolbar Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[#0c0c0e] border-b border-zinc-800 z-10">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
              <span className="text-xs font-semibold tracking-wider text-zinc-200">2B ETKİLEŞİMLİ PLANÖR</span>
            </div>
            
            <div className="h-4 w-px bg-zinc-800"></div>

            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                showGrid ? 'bg-indigo-900/30 text-indigo-400 border border-indigo-500/20' : 'text-zinc-400 hover:text-white'
              }`}
              title="Izgarayı göster/gizle"
            >
              <Grid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Izgara</span>
            </button>
          </div>

          {/* AI Trigger button */}
          <div className="flex items-center gap-2">
            {rooms.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setRooms([]);
                  setSelectedRoomId(null);
                }}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-zinc-400 hover:text-red-400 rounded transition-colors cursor-pointer"
              >
                Temizle
              </button>
            )}

            <button
              type="button"
              onClick={triggerAIScan}
              disabled={aiScanning}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded border transition-all cursor-pointer ${
                aiScanning 
                  ? 'bg-zinc-800 text-zinc-500 border-zinc-700 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500/30 active:scale-95'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0 animate-pulse" />
              <span>AI ile Kat Planını Çözümle</span>
            </button>
          </div>
        </div>

        {/* Outer SVG Container */}
        <div className="flex-1 relative overflow-hidden bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:20px_20px]">
          {/* File Upload Trace layer */}
          {bgImage && (
            <div 
              className="absolute inset-0 pointer-events-none flex items-center justify-center transition-all p-8"
              style={{ opacity: bgOpacity }}
            >
              <img 
                src={bgImage} 
                alt="Tracing guide" 
                className="w-full h-full object-contain pointer-events-none"
                referrerPolicy="no-referrer"
              />
            </div>
          )}

          {/* Svg Plan Workspace */}
          <svg
            ref={canvasRef}
            className="w-full h-full cursor-crosshair relative z-10"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Grid Lines helper */}
            {showGrid && (
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(39, 39, 42, 0.3)" strokeWidth="1" />
                  <path d="M 200 0 L 0 0 0 200" fill="none" stroke="rgba(63, 63, 70, 0.45)" strokeWidth="1.5" />
                </pattern>
              </defs>
            )}
            
            {showGrid && (
              <rect width="100%" height="100%" fill="url(#grid)" pointerEvents="none" />
            )}

            {/* Room Boxes Render */}
            {rooms.map((room) => {
              const isSelected = room.id === selectedRoomId;
              const wMeters = Math.round((room.width / gridSize) * 100) / 100;
              const hMeters = Math.round((room.height / gridSize) * 100) / 100;

              return (
                <g key={room.id} className="select-none">
                  {/* Outer Wall Border */}
                  <rect
                    x={room.x - 3}
                    y={room.y - 3}
                    width={room.width + 6}
                    height={room.height + 6}
                    rx={2}
                    fill="none"
                    stroke="#27272a"
                    strokeWidth="3"
                    opacity={0.9}
                    pointerEvents="none"
                  />

                  {/* Room Area Rectangle */}
                  <rect
                    x={room.x}
                    y={room.y}
                    width={room.width}
                    height={room.height}
                    rx={0}
                    fill={room.color}
                    fillOpacity={isSelected ? 0.35 : 0.15}
                    stroke={isSelected ? '#6366f1' : room.color}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                    className="transition-all duration-150 cursor-move"
                    onMouseDown={(e) => handleMouseDown(e, room)}
                  />

                  {/* Simple Simulated Openings - Doors on left edge, Windows on top */}
                  {room.width > 60 && (
                    // Window Line top
                    <line 
                      x1={room.x + room.width / 2 - 20}
                      y1={room.y}
                      x2={room.x + room.width / 2 + 20}
                      y2={room.y}
                      stroke="#818cf8"
                      strokeWidth="4"
                      pointerEvents="none"
                    />
                  )}

                  {room.height > 60 && (
                    // Door Arc bottom-left
                    <path
                      d={`M ${room.x} ${room.y + room.height - 20} A 20 20 0 0 1 ${room.x + 20} ${room.y + room.height}`}
                      fill="none"
                      stroke="#f43f5e"
                      strokeWidth="2"
                      strokeDasharray="2,2"
                      pointerEvents="none"
                    />
                  )}

                  {/* Room Name / Title Text */}
                  <text
                    x={room.x + room.width / 2}
                    y={room.y + room.height / 2 - 4}
                    textAnchor="middle"
                    fill="#fafafa"
                    fontSize="11"
                    fontWeight="bold"
                    className="pointer-events-none drop-shadow-md font-sans"
                  >
                    {room.name}
                  </text>

                  {/* Dimension Text */}
                  <text
                    x={room.x + room.width / 2}
                    y={room.y + room.height / 2 + 12}
                    textAnchor="middle"
                    fill="#a1a1aa"
                    fontSize="10"
                    fontWeight="normal"
                    className="pointer-events-none font-mono"
                  >
                    {wMeters}m x {hMeters}m
                  </text>

                  {/* Selection Glow / Handles */}
                  {isSelected && (
                    <>
                      <circle cx={room.x} cy={room.y} r="4" fill="#6366f1" />
                      <circle cx={room.x + room.width} cy={room.y} r="4" fill="#6366f1" />
                      <circle cx={room.x} cy={room.y + room.height} r="4" fill="#6366f1" />
                      <circle cx={room.x + room.width} cy={room.y + room.height} r="4" fill="#6366f1" />
                    </>
                  )}
                </g>
              );
            })}

            {/* Empty Canvas Indicator */}
            {rooms.length === 0 && !aiScanning && (
              <g transform="translate(100, 100)" className="opacity-40">
                <foreignObject width="100%" height="200" className="text-center">
                  <div className="flex flex-col items-center justify-center h-full text-zinc-500 px-4">
                    <Square className="w-12 h-12 text-zinc-600 mb-2 stroke-[1.5]" />
                    <p className="text-sm font-medium">Kat Planı Alanı Boş</p>
                    <p className="text-xs max-w-sm mt-1 leading-relaxed">
                      Sol panelden manuel ölçüler girip <b>"Plana Yeni Oda Ekle"</b> butonuna basarak ilk odanızı çizin, ya da <b>"AI ile Kat Planını Çözümle"</b> düğmesine tıklayın.
                    </p>
                  </div>
                </foreignObject>
              </g>
            )}
          </svg>

          {/* Dynamic AI Scanning Animation Screen */}
          {aiScanning && (
            <div className="absolute inset-0 bg-zinc-950/90 z-20 flex flex-col items-center justify-center p-6 animate-fadeIn">
              <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded p-6 shadow-2xl relative overflow-hidden">
                {/* Visual Scanning beam */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent animate-pulse" style={{ animationDuration: '1s' }}></div>

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Sparkles className="w-5 h-5 animate-spin" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-100">Gemini Pro AI Çözümlüyor</h4>
                    <p className="text-[10px] text-zinc-500">Çoklu Modlu (Multimodal) Görüntü Analizi</p>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  {scanSteps.map((step, idx) => {
                    let textClass = "text-xs text-zinc-500";
                    let dotColor = "bg-zinc-850";
                    
                    if (idx < aiScanStep) {
                      textClass = "text-xs text-indigo-400 font-medium line-through opacity-60";
                      dotColor = "bg-indigo-500";
                    } else if (idx === aiScanStep) {
                      textClass = "text-xs text-indigo-300 font-bold animate-pulse";
                      dotColor = "bg-indigo-500 ring-2 ring-indigo-500/20";
                    }

                    return (
                      <div key={idx} className="flex items-center gap-2.5">
                        <span className={`w-2 h-2 rounded-full ${dotColor} shrink-0 transition-colors duration-300`}></span>
                        <span className={`${textClass} transition-colors duration-300`}>{step}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Progress bar */}
                <div className="w-full bg-zinc-800 rounded h-1 overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-1 rounded transition-all duration-500" 
                    style={{ width: `${((aiScanStep + 1) / scanSteps.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {/* Status Scale legend bar */}
          <div className="absolute bottom-3 left-4 bg-zinc-900/90 border border-zinc-800 backdrop-blur px-3 py-1.5 rounded text-[10px] font-mono text-zinc-400 flex items-center gap-3 z-10 select-none">
            <div className="flex items-center gap-1">
              <span className="inline-block w-4 h-0.5 bg-zinc-400"></span>
              <span>1 Metre = {gridSize} Piksel</span>
            </div>
            <div className="h-2 w-px bg-zinc-800"></div>
            <span>Toplam Oda: {rooms.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
