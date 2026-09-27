import React, { useState } from 'react';
import { 
  Sparkles, 
  Download, 
  Layers, 
  Box, 
  Columns, 
  FolderTree, 
  Trash2, 
  Scaling, 
  Check, 
  Palette,
  Info
} from 'lucide-react';
import { Room } from './types';
import Canvas2D from './components/Canvas2D';
import { ThreeView, MATERIAL_LIBRARY } from './components/ThreeScene';
import { ErrorBoundary } from './components/ErrorBoundary';
import FolderStructure from './components/FolderStructure';

type ViewMode = 'split' | '2d' | '3d' | 'structure';

export default function App() {
  const [rooms, setRooms] = useState<Room[]>([
    { id: '1', name: 'Giriş & Koridor', x: 170, y: 130, width: 80, height: 130, color: '#6366f1', material: 'beton' },
    { id: '2', name: 'Geniş Salon', x: 250, y: 60, width: 180, height: 200, color: '#4f46e5', material: 'ahsap' },
    { id: '3', name: 'Mutfak', x: 60, y: 60, width: 110, height: 110, color: '#059669', material: 'fayans' },
    { id: '4', name: 'Yatak Odası', x: 60, y: 180, width: 110, height: 130, color: '#312e81', material: 'ahsap' },
  ]);

  const [selectedRoomId, setSelectedRoomId] = useState<string | null>('2');
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [isScanning, setIsScanning] = useState(false);
  const [exportNotification, setExportNotification] = useState<string | null>(null);

  const handleSimulateScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setRooms([
        { id: '5', name: 'AI Salon', x: 180, y: 60, width: 220, height: 170, color: '#4f46e5', material: 'ahsap' },
        { id: '6', name: 'AI Mutfak', x: 60, y: 60, width: 110, height: 110, color: '#059669', material: 'fayans' },
        { id: '7', name: 'AI Ebeveyn Odası', x: 60, y: 180, width: 140, height: 130, color: '#312e81', material: 'ahsap' },
        { id: '8', name: 'AI Banyo & WC', x: 210, y: 240, width: 90, height: 70, color: '#0891b2', material: 'mermer' }
      ]);
      setSelectedRoomId('5');
    }, 2800);
  };

  const handleMaterialSelect = (materialKey: string) => {
    if (!selectedRoomId) return;
    setRooms(prev => prev.map(r => 
      r.id === selectedRoomId ? { ...r, material: materialKey } : r
    ));
  };

  const handleExportSnapshot = () => {
    setExportNotification("4K Mimari Render hazırlanıyor...");
    setTimeout(() => {
      setExportNotification("Kat planı & 3B görsel başarıyla dışa aktarıldı!");
      setTimeout(() => setExportNotification(null), 3000);
    }, 1000);
  };

  // Selected room details
  const selectedRoom = rooms.find(r => r.id === selectedRoomId) || null;
  const gridSize = 35; // px per meter

  // Calculate total floor area
  const totalAreaM2 = rooms.reduce((acc, r) => {
    const wM = r.width / gridSize;
    const hM = r.height / gridSize;
    return acc + (wM * hM);
  }, 0).toFixed(1);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-300 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-300 overflow-hidden h-screen">
      
      {/* TOP NOTIFICATION TOAST */}
      {exportNotification && (
        <div className="absolute top-16 right-6 z-50 bg-indigo-950/95 border border-indigo-500 text-indigo-200 px-4 py-2.5 rounded-lg shadow-2xl flex items-center gap-2 text-xs backdrop-blur-md animate-bounce">
          <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>{exportNotification}</span>
        </div>
      )}

      {/* HEADER BAR */}
      <header className="border-b border-zinc-800 bg-[#0c0c0e]/95 backdrop-blur-md shrink-0 z-40">
        <div className="px-4 py-2.5 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 shadow-md shadow-indigo-950/50 flex items-center justify-center text-white font-extrabold text-sm">
              A
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-zinc-100 leading-tight tracking-wide">
                  ArchAI Studio
                </h1>
                <span className="text-[9px] bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/20 px-1.5 py-0.5 rounded uppercase tracking-wider">
                  Pro 2D / 3D
                </span>
              </div>
              <p className="text-[9px] text-zinc-500 font-mono">
                Dinamik Boyutlandırma Tutamaçları & Gerçek Zamanlı 3B Ekstrüzyon
              </p>
            </div>
          </div>

          {/* View Switcher Tabs */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 p-0.5 rounded-lg">
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                viewMode === 'split' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Bölünmüş Görünüm</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('2d')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                viewMode === '2d' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>2B Planör</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('3d')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                viewMode === '3d' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>3B Render</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('structure')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                viewMode === 'structure' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <FolderTree className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Proje Mimarisi</span>
            </button>
          </div>

          {/* AI Trigger & Snapshot */}
          <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={handleSimulateScan}
              disabled={isScanning}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                isScanning 
                  ? 'bg-indigo-950 text-indigo-300 border border-indigo-500/40 cursor-wait' 
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-950/40'
              }`}
            >
              <Sparkles className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'AI İşliyor...' : 'AI ile Çözümle'}</span>
            </button>

            <button
              type="button"
              onClick={handleExportSnapshot}
              className="px-3 py-1.5 rounded-md text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center gap-1.5 transition-all cursor-pointer"
              title="Görseli İndir"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Snapshot</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN WORKSPACE LAYOUT */}
      <main className="flex-1 flex min-h-0 overflow-hidden">
        
        {/* LEFT SIDEBAR: Room Inspector & Controls */}
        <aside className="w-72 border-r border-zinc-800 bg-[#0c0c0e] flex flex-col shrink-0 overflow-y-auto">
          {/* Top Info Banner */}
          <div className="p-3.5 border-b border-zinc-800 flex items-center justify-between bg-[#09090b]">
            <div className="text-[10px] font-mono text-zinc-400">
              <span className="text-zinc-500">Toplam Alan:</span> <strong className="text-indigo-300">{totalAreaM2} m²</strong>
            </div>
            <div className="text-[10px] font-mono text-zinc-400">
              <span className="text-zinc-500">Oda:</span> <strong className="text-indigo-300">{rooms.length} adet</strong>
            </div>
          </div>

          {/* Selected Room Inspector */}
          {selectedRoom ? (
            <div className="p-4 border-b border-zinc-800 space-y-3 bg-zinc-950/30">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Scaling className="w-3.5 h-3.5" /> Seçili Oda Ayarları
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setRooms(prev => prev.filter(r => r.id !== selectedRoomId));
                    setSelectedRoomId(null);
                  }}
                  className="text-zinc-500 hover:text-red-400 transition-colors p-1 cursor-pointer"
                  title="Odayı Sil"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">Oda Adı</label>
                <input 
                  type="text" 
                  value={selectedRoom.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setRooms(prev => prev.map(r => r.id === selectedRoom.id ? { ...r, name } : r));
                  }}
                  className="w-full bg-[#0c0c0e] border border-zinc-800 focus:border-indigo-500 rounded px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">Genişlik (m)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={((selectedRoom.width / gridSize)).toFixed(1)}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 1;
                      setRooms(prev => prev.map(r => r.id === selectedRoom.id ? { ...r, width: Math.max(25, val * gridSize) } : r));
                    }}
                    className="w-full bg-[#0c0c0e] border border-zinc-800 focus:border-indigo-500 rounded px-2 py-1 text-xs text-zinc-100 font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">Derinlik (m)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={((selectedRoom.height / gridSize)).toFixed(1)}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 1;
                      setRooms(prev => prev.map(r => r.id === selectedRoom.id ? { ...r, height: Math.max(25, val * gridSize) } : r));
                    }}
                    className="w-full bg-[#0c0c0e] border border-zinc-800 focus:border-indigo-500 rounded px-2 py-1 text-xs text-zinc-100 font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-indigo-950/20 border border-indigo-500/20 rounded-lg text-[10px] text-indigo-300 leading-relaxed flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Dinamik Tutamaçlar:</strong> 2B plandaki odanın 4 köşesindeki (NW, NE, SE, SW) veya kenar orta noktalarındaki tutamaçları fareyle sürükleyerek boyutlandırabilirsiniz.
                </span>
              </div>
            </div>
          ) : (
            <div className="p-4 border-b border-zinc-800 text-center text-zinc-500 text-xs">
              Ölçülerini düzenlemek için plandaki bir odaya tıklayın.
            </div>
          )}

          {/* Room List Navigator */}
          <div className="p-4 flex-1 space-y-2">
            <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
              Plan Odaları ({rooms.length})
            </h3>
            <div className="space-y-1.5">
              {rooms.map(room => {
                const isSelected = room.id === selectedRoomId;
                const area = ((room.width / gridSize) * (room.height / gridSize)).toFixed(1);
                return (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => setSelectedRoomId(room.id)}
                    className={`w-full px-3 py-2 rounded-lg border text-left flex items-center justify-between text-xs transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-indigo-950/40 border-indigo-500 text-indigo-200 font-semibold shadow-sm' 
                        : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: room.color }}></span>
                      <span className="truncate">{room.name}</span>
                    </div>
                    <span className="text-[10px] font-mono opacity-70 shrink-0">{area} m²</span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* CENTRAL VIEW AREA (Split / 2D / 3D / Structure) */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#09090b] relative">
          <ErrorBoundary>
            {viewMode === 'structure' ? (
              <div className="h-full p-4 overflow-hidden">
                <FolderStructure />
              </div>
            ) : viewMode === '2d' ? (
              <div className="h-full p-3">
                <Canvas2D 
                  rooms={rooms}
                  setRooms={setRooms}
                  selectedRoomId={selectedRoomId}
                  setSelectedRoomId={setSelectedRoomId}
                  gridSize={gridSize}
                  aiScanning={isScanning}
                  onSimulateScan={handleSimulateScan}
                  hideSidebar={false}
                />
              </div>
            ) : viewMode === '3d' ? (
              <div className="h-full relative flex flex-col bg-[#0c0c0e]">
                <div className="absolute top-4 left-4 z-20 bg-zinc-900/90 backdrop-blur border border-zinc-800 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-200 flex items-center gap-2 shadow-lg">
                  <Box className="w-3.5 h-3.5 text-indigo-400" />
                  <span>3B Gerçek Zamanlı İzometrik Sahne</span>
                </div>
                <div className="flex-1 w-full h-full">
                  <ThreeView 
                    rooms={rooms} 
                    selectedRoomId={selectedRoomId} 
                    onSelectRoom={setSelectedRoomId} 
                  />
                </div>
              </div>
            ) : (
              /* SPLIT VIEW (2D on left, 3D on right) */
              <div className="h-full flex flex-col xl:flex-row gap-3 p-3 overflow-hidden min-h-0">
                {/* 2D Canvas Half */}
                <div className="flex-1 min-h-[300px] xl:min-h-0 flex flex-col">
                  <Canvas2D 
                    rooms={rooms}
                    setRooms={setRooms}
                    selectedRoomId={selectedRoomId}
                    setSelectedRoomId={setSelectedRoomId}
                    gridSize={gridSize}
                    aiScanning={isScanning}
                    onSimulateScan={handleSimulateScan}
                    hideSidebar={true}
                  />
                </div>

                {/* 3D Scene Half */}
                <div className="flex-1 min-h-[300px] xl:min-h-0 flex flex-col bg-[#0c0c0e] border border-zinc-800 rounded-lg overflow-hidden relative">
                  <div className="absolute top-3 left-3 z-10 bg-zinc-900/90 backdrop-blur border border-zinc-800 px-2.5 py-1 rounded text-[11px] font-semibold text-zinc-300 flex items-center gap-1.5 shadow-md">
                    <Box className="w-3.5 h-3.5 text-indigo-400" />
                    <span>3B Canlı Ekstrüzyon (Orbit & Zoom)</span>
                  </div>
                  
                  <div className="flex-1 w-full h-full">
                    <ThreeView 
                      rooms={rooms} 
                      selectedRoomId={selectedRoomId} 
                      onSelectRoom={setSelectedRoomId} 
                    />
                  </div>
                </div>
              </div>
            )}
          </ErrorBoundary>
        </div>

        {/* RIGHT SIDEBAR: 4K PBR Material Library */}
        <aside className="w-64 border-l border-zinc-800 bg-[#0c0c0e] flex flex-col shrink-0 overflow-y-auto">
          <div className="p-4 border-b border-zinc-800">
            <h2 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-indigo-400" />
              PBR Malzeme Seçimi
            </h2>
            <p className="text-[10px] text-zinc-500 mt-0.5">Seçili odaya mimari doku ata</p>
          </div>

          <div className="p-3 flex-1 space-y-2.5">
            {selectedRoom ? (
              <>
                <div className="text-[10px] font-mono text-indigo-300 bg-indigo-950/30 border border-indigo-500/30 px-2.5 py-1.5 rounded-md">
                  Hedef: {selectedRoom.name}
                </div>

                <div className="grid grid-cols-1 gap-2 pt-1">
                  {Object.entries(MATERIAL_LIBRARY).filter(([k]) => k !== 'default').map(([key, mat]) => {
                    const isSelected = selectedRoom.material === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleMaterialSelect(key)}
                        className={`w-full p-2 rounded-lg border flex items-center gap-3 transition-all text-left cursor-pointer ${
                          isSelected 
                            ? 'border-indigo-500 bg-indigo-950/40 shadow-sm' 
                            : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-850'
                        }`}
                      >
                        <div 
                          className="w-10 h-10 rounded-md shrink-0 border border-black/30 relative overflow-hidden"
                          style={{ backgroundColor: mat.color }}
                        >
                          {isSelected && (
                            <div className="absolute inset-0 bg-indigo-500/20 flex items-center justify-center">
                              <Check className="w-4 h-4 text-white drop-shadow" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-semibold text-zinc-200 truncate">{mat.name}</h4>
                          <p className="text-[9px] text-zinc-500 font-mono">PBR Texture</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-zinc-500 text-xs px-2">
                Doku atamak için plandan bir oda seçin.
              </div>
            )}
          </div>
        </aside>

      </main>
    </div>
  );
}
