import React, { useState } from 'react';
import { 
  Compass, 
  Layers, 
  Box, 
  FolderGit, 
  Sparkles, 
  HelpCircle, 
  Download, 
  Share2, 
  Info,
  ChevronRight,
  GitBranch,
  ExternalLink
} from 'lucide-react';
import { Room } from './types';
import Canvas2D from './components/Canvas2D';
import Preview3D from './components/Preview3D';
import FolderStructure from './components/FolderStructure';

export default function App() {
  const [activeTab, setActiveTab] = useState<'workspace' | 'structure'>('workspace');
  
  // Shared rooms state
  const [rooms, setRooms] = useState<Room[]>([
    { id: '1', name: 'Giriş & Koridor', x: 190, y: 150, width: 80, height: 120, color: '#6366f1', material: 'beton' },
    { id: '2', name: 'Geniş Salon', x: 270, y: 70, width: 180, height: 200, color: '#4f46e5', material: 'ahsap' },
    { id: '3', name: 'Mutfak', x: 70, y: 70, width: 120, height: 120, color: '#a5b4fc', material: 'fayans' },
    { id: '4', name: 'Yatak Odası', x: 70, y: 190, width: 120, height: 130, color: '#312e81', material: 'ahsap' },
  ]);

  const [selectedRoomId, setSelectedRoomId] = useState<string | null>('2');
  const [exporting, setExporting] = useState(false);

  const handleExportPlan = () => {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      alert("Kat planı verileri (.JSON ve CAD koordinatları) başarıyla oluşturuldu ve indirilmeye hazır!");
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-300 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-300">
      
      {/* GLOBAL GLOW EFFECT */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-zinc-500/5 rounded-full blur-[150px] pointer-events-none"></div>

      {/* HEADER BAR */}
      <header className="border-b border-zinc-800 bg-[#0c0c0e]/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo & Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-indigo-600 shadow-lg shadow-indigo-950/20 flex items-center justify-center text-white font-extrabold text-lg">
              A
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold text-zinc-100 leading-tight">
                  ArchAI Designer
                </h1>
                <span className="text-[9px] bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/20 px-1.5 py-0.5 rounded uppercase tracking-wider">
                  Active
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
                Project: Modern Villa_v2.dwg
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 p-1 rounded">
            <button
              onClick={() => setActiveTab('workspace')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded transition-all ${
                activeTab === 'workspace'
                  ? 'bg-indigo-900/30 text-indigo-400 border border-indigo-500/30'
                  : 'text-zinc-400 hover:text-white border border-transparent'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Mimari Çalışma Alanı</span>
            </button>

            <button
              onClick={() => setActiveTab('structure')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded transition-all ${
                activeTab === 'structure'
                  ? 'bg-indigo-900/30 text-indigo-400 border border-indigo-500/30'
                  : 'text-zinc-400 hover:text-white border border-transparent'
              }`}
            >
              <FolderGit className="w-3.5 h-3.5" />
              <span>Önerilen Proje Dosya Yapısı</span>
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPlan}
              disabled={exporting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded border border-zinc-800 text-xs font-medium transition-all"
            >
              <Download className={`w-3.5 h-3.5 ${exporting ? 'animate-bounce' : ''}`} />
              <span>{exporting ? 'Dışa Aktarılıyor...' : 'Export'}</span>
            </button>
            <button
              onClick={() => setActiveTab('workspace')}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-medium transition-colors"
            >
              Render 3D
            </button>
          </div>

        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 flex flex-col gap-4 min-h-0">
        
        {/* Dynamic Warning/Feature Bar */}
        <div className="bg-zinc-900/60 border border-zinc-850 rounded-lg px-4 py-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5 leading-relaxed">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5 md:mt-0" />
            <p className="text-zinc-400">
              <b>Yapay Zeka Destekli Mimari Geliştirici:</b> Bu uygulama, Next.js frontend ve FastAPI backend kullanan gerçek bir projenin prototipidir. Dosya yapısını incelemek için üst menüden <b>"Önerilen Proje Dosya Yapısı"</b> sekmesine geçebilirsiniz.
            </p>
          </div>
          <button 
            onClick={() => setActiveTab('structure')}
            className="text-indigo-400 hover:text-indigo-300 font-bold shrink-0 flex items-center gap-1 group"
          >
            <span>Dosya Ağacını Gör</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* WORKSPACE VIEW TAB */}
        {activeTab === 'workspace' && (
          <div className="flex-1 flex flex-col gap-4 min-h-0">
            {/* Top Workspace Splitting */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 items-stretch">
              
              {/* Left Column (Forms, Uploads, Options) & Middle Canvas */}
              <div className="lg:col-span-8">
                <Canvas2D 
                  rooms={rooms}
                  setRooms={setRooms}
                  selectedRoomId={selectedRoomId}
                  setSelectedRoomId={setSelectedRoomId}
                  gridSize={40}
                />
              </div>

              {/* Right Column (3D Visualizer & Materials selector) */}
              <div className="lg:col-span-4">
                <Preview3D 
                  rooms={rooms}
                  selectedRoomId={selectedRoomId}
                  setRooms={setRooms}
                />
              </div>

            </div>
          </div>
        )}

        {/* STRUCTURE TREE VIEW TAB */}
        {activeTab === 'structure' && (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="mb-4 space-y-2">
              <h2 className="text-base font-extrabold text-zinc-100 flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-indigo-400" />
                Next.js & FastAPI (Python) Proje Şablon Mimarisi
              </h2>
              <p className="text-xs text-zinc-400 max-w-4xl leading-relaxed">
                Yapay zeka ile yüklenen bir kat planını işlemek, duvar koordinatlarını çıkartıp 3D model dosyaları üretmek için tasarlanmış modern full-stack projenizin dosya ve klasör dizilimi aşağıda listelenmiştir. Next.js ile yüksek performanslı client-side çizim yaparken, FastAPI (Python) ve Google Gemini SDK kullanarak görsel analizleri sunucu tarafında güvenle yapabilirsiniz.
              </p>
            </div>
            
            <div className="flex-1 min-h-[550px]">
              <FolderStructure />
            </div>
          </div>
        )}

      </main>

      {/* FOOTER BAR */}
      <footer className="border-t border-zinc-800 bg-[#0c0c0e]/60 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-500">
          <div className="flex items-center gap-2">
            <span>© 2026 AI Mimari Tasarım Laboratuvarı</span>
            <span>•</span>
            <span className="text-zinc-400 font-medium">Next.js & FastAPI Architecture</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              Aktif Çalışma Alanı
            </span>
            <span>|</span>
            <a 
              href="https://ai.studio/build" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-zinc-300 transition-colors flex items-center gap-0.5"
            >
              AI Studio Build <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}
