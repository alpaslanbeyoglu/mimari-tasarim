import React, { useState, useRef } from 'react';
import { 
  Sparkles, 
  Download, 
  ExternalLink,
  Layers,
  Camera,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { Room } from './types';
import Canvas2D from './components/Canvas2D';
import { Scene3D, MATERIAL_LIBRARY } from './components/ThreeScene';
import { Canvas } from '@react-three/fiber';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ThreeFallback } from './components/ThreeFallback';

export default function App() {
  const [rooms, setRooms] = useState<Room[]>([
    { id: '1', name: 'Giriş & Koridor', x: 190, y: 150, width: 80, height: 120, color: '#6366f1', material: 'beton' },
    { id: '2', name: 'Geniş Salon', x: 270, y: 70, width: 180, height: 200, color: '#4f46e5', material: 'ahsap' },
    { id: '3', name: 'Mutfak', x: 70, y: 70, width: 120, height: 120, color: '#a5b4fc', material: 'fayans' },
    { id: '4', name: 'Yatak Odası', x: 70, y: 190, width: 120, height: 130, color: '#312e81', material: 'ahsap' },
  ]);

  const [selectedRoomId, setSelectedRoomId] = useState<string | null>('2');
  const [exporting, setExporting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleExportPlan = () => {
    if (exporting) return;
    setExporting(true);
    
    // Simulate high quality render download
    setTimeout(() => {
      if (canvasRef.current) {
        const url = canvasRef.current.toDataURL('image/png', 1.0);
        const link = document.createElement('a');
        link.download = 'archai_render_4k.png';
        link.href = url;
        link.click();
      } else {
        alert("Render verisi okunamadı.");
      }
      setExporting(false);
    }, 1500);
  };

  const handleSimulateScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setRooms([
        { id: '5', name: 'AI Salon', x: 100, y: 100, width: 250, height: 180, color: '#4f46e5', material: 'beton' },
        { id: '6', name: 'AI Yatak Odası', x: 100, y: 280, width: 150, height: 120, color: '#312e81', material: 'ahsap' },
        { id: '7', name: 'AI Banyo', x: 250, y: 280, width: 100, height: 120, color: '#a5b4fc', material: 'mermer' }
      ]);
      setSelectedRoomId('5');
    }, 3000);
  };

  const handleMaterialSelect = (materialKey: string) => {
    if (!selectedRoomId) return;
    setRooms(rooms.map(r => 
      r.id === selectedRoomId ? { ...r, material: materialKey } : r
    ));
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-300 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-300 overflow-hidden h-screen">
      
      {/* HEADER BAR */}
      <header className="border-b border-zinc-800 bg-[#0c0c0e]/95 backdrop-blur-md shrink-0 z-50">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-indigo-600 shadow-lg shadow-indigo-950/20 flex items-center justify-center text-white font-extrabold text-sm">
              A
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold text-zinc-100 leading-tight">
                  ArchAI Studio
                </h1>
                <span className="text-[9px] bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/20 px-1.5 py-0.5 rounded uppercase tracking-wider">
                  Pro
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
                Sophisticated Visualizer Engine
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
             <a href="https://ai.studio/build" target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1">
               <ExternalLink className="w-3.5 h-3.5" /> AI Studio Build
             </a>
          </div>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <main className="flex-1 flex min-h-0">
        
        {/* LEFT PANEL: 2D & AI Scan */}
        <aside className="w-80 border-r border-zinc-800 bg-[#0c0c0e] flex flex-col shrink-0">
          <div className="p-4 border-b border-zinc-800 shrink-0">
            <h2 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2 mb-3">
              <Upload className="w-4 h-4 text-indigo-400" /> Plan Yükle & Tara
            </h2>
            <div className="border-2 border-dashed border-zinc-800 hover:border-indigo-500/50 rounded-lg p-6 flex flex-col items-center justify-center text-center bg-zinc-900/30 transition-colors cursor-pointer group mb-3">
              <ImageIcon className="w-8 h-8 text-zinc-600 group-hover:text-indigo-400 transition-colors mb-2" />
              <p className="text-xs text-zinc-400 font-medium">Kat Planı (PNG/JPG/PDF)</p>
              <p className="text-[10px] text-zinc-600 mt-1">Sürükle bırak veya seç</p>
            </div>
            
            <button 
              onClick={handleSimulateScan}
              disabled={isScanning}
              className={`w-full py-2.5 rounded text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                isScanning 
                  ? 'bg-indigo-900/50 text-indigo-300 cursor-not-allowed border border-indigo-500/30' 
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20'
              }`}
            >
              <Sparkles className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
              {isScanning ? 'NVIDIA NIM İşliyor...' : 'AI ile Kat Planını Çözümle'}
            </button>
          </div>
          
          <div className="flex-1 min-h-0 flex flex-col relative bg-[#09090b]">
             <div className="p-3 border-b border-zinc-800 shrink-0 flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-zinc-500" /> 2D Görünüm
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">Top-Down</span>
             </div>
             <div className="flex-1 relative overflow-hidden">
                <Canvas2D 
                  rooms={rooms}
                  setRooms={setRooms}
                  selectedRoomId={selectedRoomId}
                  setSelectedRoomId={setSelectedRoomId}
                  gridSize={25}
                  aiScanning={isScanning}
                />
             </div>
          </div>
        </aside>

        {/* MIDDLE PANEL: 3D Scene */}
        <section className="flex-1 relative bg-[#0c0c0e] flex flex-col min-w-0">
          <div className="absolute top-4 left-4 z-10 bg-zinc-900/80 backdrop-blur border border-zinc-800 px-3 py-1.5 rounded text-xs text-zinc-300 font-medium flex items-center gap-2 shadow-xl">
             <Camera className="w-4 h-4 text-indigo-400" /> 3D İzometrik Render Sahnesi
          </div>
          
          <div className="flex-1 relative w-full h-full cursor-grab active:cursor-grabbing">
             <ErrorBoundary fallback={
               <ThreeFallback 
                 rooms={rooms} 
                 selectedRoomId={selectedRoomId} 
                 onSelectRoom={setSelectedRoomId} 
               />
             }>
               <Canvas gl={{ preserveDrawingBuffer: true }} ref={canvasRef} shadows dpr={[1, 2]}>
                 <Scene3D 
                   rooms={rooms} 
                   selectedRoomId={selectedRoomId} 
                   onSelectRoom={setSelectedRoomId} 
                 />
               </Canvas>
             </ErrorBoundary>
          </div>
        </section>

        {/* RIGHT PANEL: Material Library */}
        <aside className="w-72 border-l border-zinc-800 bg-[#0c0c0e] flex flex-col shrink-0">
          <div className="p-4 border-b border-zinc-800 shrink-0">
            <h2 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
              4K PBR Malzeme Kütüphanesi
            </h2>
            <p className="text-[10px] text-zinc-500">Seçili yüzeye fiziksel tabanlı doku ata</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
            {selectedRoomId ? (
              <div className="space-y-3">
                <div className="text-[10px] font-mono text-indigo-400 mb-2 border border-indigo-900/50 bg-indigo-950/20 px-2 py-1.5 rounded">
                  Hedef Oda: {rooms.find(r => r.id === selectedRoomId)?.name || 'Seçili Oda'}
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(MATERIAL_LIBRARY).filter(([k]) => k !== 'default').map(([key, mat]) => {
                    const isSelected = rooms.find(r => r.id === selectedRoomId)?.material === key;
                    return (
                      <button
                        key={key}
                        onClick={() => handleMaterialSelect(key)}
                        className={`flex flex-col rounded border overflow-hidden transition-all text-left ${
                          isSelected 
                            ? 'border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.15)] bg-indigo-950/30' 
                            : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-600 hover:bg-zinc-800'
                        }`}
                      >
                        <div 
                          className="h-16 w-full relative" 
                          style={{ backgroundColor: mat.color }}
                        >
                          {/* Simulated texture/roughness overlay */}
                          <div className="absolute inset-0 opacity-20" style={{
                            backgroundImage: `radial-gradient(circle at 2px 2px, #fff 1px, transparent 0)`,
                            backgroundSize: '8px 8px'
                          }}></div>
                          {isSelected && (
                            <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.8)]"></div>
                          )}
                        </div>
                        <div className="p-2">
                          <h3 className="text-[10px] font-semibold text-zinc-200 truncate">{mat.name}</h3>
                          <p className="text-[9px] text-zinc-500 mt-0.5">PBR Material</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-zinc-500 px-4">
                <Layers className="w-8 h-8 mb-3 opacity-20" />
                <p className="text-xs">Malzeme atamak için 2D veya 3D sahneden bir oda seçin.</p>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t border-zinc-800 bg-[#09090b] shrink-0">
             <button
               onClick={handleExportPlan}
               disabled={exporting}
               className={`w-full py-2.5 rounded text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                 exporting
                   ? 'bg-zinc-800 text-zinc-400 cursor-not-allowed border border-zinc-700'
                   : 'bg-zinc-100 hover:bg-white text-black border border-transparent shadow-lg shadow-zinc-200/10'
               }`}
             >
               <Download className={`w-4 h-4 ${exporting ? 'animate-bounce' : ''}`} />
               {exporting ? 'Render Alınıyor...' : 'High-Quality Snapshot (PNG)'}
             </button>
             <p className="text-[9px] text-zinc-600 text-center mt-3 font-mono">
               Resolution: 4K (3840x2160)
             </p>
          </div>
        </aside>

      </main>
    </div>
  );
}

