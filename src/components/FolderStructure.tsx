import React, { useState } from 'react';
import { Folder, FolderOpen, FileText, ChevronRight, ChevronDown, Check, Copy } from 'lucide-react';
import { FolderNode } from '../types';

const projectStructure: FolderNode = {
  name: "architectural-visualizer-project",
  type: "folder",
  description: "Mimari Kat Planı ve 3D Görselleştirme Projesi Ana Dizini",
  children: [
    {
      name: "frontend-nextjs",
      type: "folder",
      description: "Next.js 14+ (App Router) tabanlı modern ve duyarlı web arayüzü",
      children: [
        {
          name: "src",
          type: "folder",
          description: "Kaynak kodlar dizini",
          children: [
            {
              name: "app",
              type: "folder",
              description: "App Router dizini (Sayfa rotaları ve düzenleri)",
              children: [
                {
                  name: "layout.tsx",
                  type: "file",
                  description: "Global düzen, font yüklemeleri, metadata ve sarmalayıcılar (providers)",
                  contentCode: `import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Mimari Görselleştirici",
  description: "Yapay Zeka Destekli Kat Planı ve 3D Modelleme",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={\`\${inter.className} bg-slate-950 text-slate-100\`}>
        {children}
      </body>
    </html>
  );
}`
                },
                {
                  name: "page.tsx",
                  type: "file",
                  description: "Ana sayfa bileşeni. Araç çubukları, 2B Tuval ve 3B önizlemeyi birleştiren ana düzen",
                  contentCode: `"use client";

import React, { useState } from "react";
import SidebarToolbar from "@/components/SidebarToolbar";
import FloorPlanCanvas from "@/components/FloorPlanCanvas";
import Preview3DPanel from "@/components/Preview3DPanel";

export default function Home() {
  const [rooms, setRooms] = useState([]);
  const [materials, setMaterials] = useState("beton");

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-slate-900 text-white">
      <SidebarToolbar onAddRoom={(r) => setRooms([...rooms, r])} />
      <FloorPlanCanvas rooms={rooms} />
      <Preview3DPanel rooms={rooms} selectedMaterial={materials} />
    </main>
  );
}`
                }
              ]
            },
            {
              name: "components",
              type: "folder",
              description: "Yeniden kullanılabilir bağımsız UI bileşenleri",
              children: [
                {
                  name: "FloorPlanCanvas.tsx",
                  type: "file",
                  description: "HTML5 Canvas veya SVG tabanlı 2B kat planı çizim ve düzenleme alanı",
                },
                {
                  name: "Preview3DPanel.tsx",
                  type: "file",
                  description: "Three.js veya React Three Fiber tabanlı gerçek zamanlı 3B ekstrüzyon ve görselleştirme alanı",
                },
                {
                  name: "MaterialSelector.tsx",
                  type: "file",
                  description: "Zemin ve duvar malzemelerinin (ahşap, mermer vs.) seçildiği kontrol paneli",
                }
              ]
            },
            {
              name: "services",
              type: "folder",
              description: "FastAPI backend bağlantısını yöneten API servisleri",
              children: [
                {
                  name: "api.ts",
                  type: "file",
                  description: "Kat planı yükleme, AI çözümleme tetikleme ve 3D export endpoint istekleri",
                  contentCode: `const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function uploadFloorPlanImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  
  const response = await fetch(\`\${API_URL}/api/v1/floorplan/analyze\`, {
    method: "POST",
    body: formData,
  });
  return response.json();
}`
                }
              ]
            }
          ]
        },
        {
          name: "package.json",
          type: "file",
          description: "Next.js, Tailwind CSS, Lucide React ve Three.js bağımlılık tanımları",
        },
        {
          name: "tailwind.config.js",
          type: "file",
          description: "Koyu mod (Dark mode) ve mimari tema renk konfigürasyonları",
        }
      ]
    },
    {
      name: "backend-fastapi",
      type: "folder",
      description: "Python ve FastAPI tabanlı yüksek performanslı AI ve Geometrisi İşleme Arka Ofisi",
      children: [
        {
          name: "app",
          type: "folder",
          description: "Uygulama ana modülü",
          children: [
            {
              name: "api",
              type: "folder",
              description: "API Yönlendiricileri ve Endpoint Tanımları",
              children: [
                {
                  name: "endpoints",
                  type: "folder",
                  description: "Fonksiyonel servis endpointleri",
                  children: [
                    {
                      name: "floorplan.py",
                      type: "file",
                      description: "Kat planı görseli yükleme, ölçeklendirme ve koordinat çıkartma servisleri",
                      contentCode: `from fastapi import APIRouter, UploadFile, File
from app.services.ai_analyzer import analyze_floorplan_image

router = APIRouter()

@router.post("/analyze")
async def analyze_uploaded_plan(file: UploadFile = File(...)):
    # 1. Görseli oku
    contents = await file.read()
    # 2. Gemini Multimodal API'ye gönderip oda/duvar koordinatlarını çıkar
    detected_data = analyze_floorplan_image(contents)
    return {"status": "success", "data": detected_data}`
                    },
                    {
                      name: "render.py",
                      type: "file",
                      description: "3B model dosyaları (.gltf, .obj) üretme ve export etme işlemleri",
                    }
                  ]
                }
              ]
            },
            {
              name: "services",
              type: "folder",
              description: "AI Entegrasyonu ve Geometri Üretim Algoritmaları",
              children: [
                {
                  name: "ai_analyzer.py",
                  type: "file",
                  description: "Google Gemini 2.5 Flash / Pro API'si kullanarak görselden yapı tespiti (Oda sınırları, duvarlar, kapılar)",
                  contentCode: `import os
from google import genai
from google.genai import types

def analyze_floorplan_image(image_bytes: bytes):
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    
    prompt = """
    Bu kat planı görselini analiz et. Görseldeki tüm odaları, 
    duvar çizgilerini, kapı ve pencerelerin yerlerini tespit et.
    Her oda için köşe koordinatlarını (X ve Y değerleri 0-100 arasında normalize edilmiş) 
    JSON formatında döndür. Örnek:
    {
      "rooms": [{"name": "Salon", "x": 10, "y": 10, "width": 40, "height": 30}]
    }
    """
    
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=[
            types.Part.from_bytes(data=image_bytes, mime_type="image/png"),
            prompt
        ]
    )
    return response.text`
                },
                {
                  name: "three_d_generator.py",
                  type: "file",
                  description: "Çıkarılan 2B koordinatları duvar kalınlığı ve yükseklik ekleyerek glTF/OBJ formatına dönüştürme",
                }
              ]
            },
            {
              name: "core",
              type: "folder",
              description: "Sistem yapılandırması ve güvenlik ayarları",
              children: [
                {
                  name: "config.py",
                  type: "file",
                  description: "Pydantic tabanlı çevre değişkenleri ve API Key doğrulamaları",
                }
              ]
            }
          ]
        },
        {
          name: "main.py",
          type: "file",
          description: "FastAPI uygulamasının giriş kapısı. CORS izinleri ve API yönlendirmelerinin bağlandığı yer",
          contentCode: `from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import floorplan

app = FastAPI(title="AI Mimari Arka Ofis API", version="1.0")

# CORS yapılandırması - Next.js frontend erişimi için
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Geliştirme ortamında her yere izin verir
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(floorplan.router, prefix="/api/v1/floorplan", tags=["Floor Plan"])

@app.get("/")
def read_root():
    return {"message": "AI Mimari Görselleştirme API'si Aktif!"}`
        },
        {
          name: "requirements.txt",
          type: "file",
          description: "fastapi, uvicorn, google-genai, pillow, numpy bağımlılık listesi",
        },
        {
          name: "Dockerfile",
          type: "file",
          description: "Hızlı dağıtım ve Cloud Run üzerinde kolay barındırma için Docker dosyası",
        }
      ]
    }
  ]
};

export default function FolderStructure() {
  const [selectedNode, setSelectedNode] = useState<FolderNode | null>(projectStructure);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    "architectural-visualizer-project": true,
    "frontend-nextjs": true,
    "frontend-nextjs/src": true,
    "backend-fastapi": true,
  });
  const [copied, setCopied] = useState(false);

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  const copyStructureToClipboard = () => {
    const text = generateTextTree(projectStructure, "");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateTextTree = (node: FolderNode, indent: string): string => {
    let result = `${indent}${node.type === 'folder' ? '📁' : '📄'} ${node.name} - ${node.description}\n`;
    if (node.children) {
      node.children.forEach(child => {
        result += generateTextTree(child, indent + "  ");
      });
    }
    return result;
  };

  const renderTree = (node: FolderNode, currentPath: string = "") => {
    const path = currentPath ? `${currentPath}/${node.name}` : node.name;
    const isFolder = node.type === 'folder';
    const isExpanded = expandedFolders[path];

    return (
      <div key={path} className="ml-4 select-none">
        <div 
          onClick={() => {
            if (isFolder) toggleFolder(path);
            setSelectedNode(node);
          }}
          className={`flex items-center gap-2 py-1 px-2 rounded cursor-pointer text-xs transition-colors ${
            selectedNode?.name === node.name 
              ? 'bg-indigo-950/40 text-indigo-300 border-l-2 border-indigo-500 font-medium' 
              : 'hover:bg-zinc-800/50 text-zinc-300'
          }`}
        >
          {isFolder ? (
            <>
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-zinc-500" /> : <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />}
              {isExpanded ? <FolderOpen className="w-4 h-4 text-indigo-400 shrink-0" /> : <Folder className="w-4 h-4 text-indigo-300/80 shrink-0" />}
            </>
          ) : (
            <>
              <span className="w-3.5"></span>
              <FileText className="w-4 h-4 text-zinc-400 shrink-0" />
            </>
          )}
          <span className="font-mono truncate">{node.name}</span>
        </div>
        
        {isFolder && isExpanded && node.children && (
          <div className="border-l border-zinc-850 ml-2">
            {node.children.map(child => renderTree(child, path))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#0c0c0e] border border-zinc-800 rounded overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0c0c0e]/95 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
          <span className="text-xs font-semibold tracking-wider uppercase text-zinc-200 font-sans">
            Önerilen Dosya Yapısı (Next.js & FastAPI)
          </span>
        </div>
        <button 
          type="button"
          onClick={copyStructureToClipboard}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-zinc-800 hover:bg-zinc-755 text-zinc-300 hover:text-white rounded transition-all cursor-pointer"
          title="Tüm yapıyı metin olarak kopyala"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-indigo-400 font-sans">Kopyalandı</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span className="font-sans">Yapıyı Kopyala</span>
            </>
          )}
        </button>
      </div>

      {/* Main split */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden min-h-0">
        {/* Tree List */}
        <div className="w-full lg:w-1/2 p-3 overflow-y-auto border-b lg:border-b-0 lg:border-r border-zinc-800 bg-[#0c0c0e]/30 scrollbar-thin">
          <p className="text-[10px] text-zinc-500 mb-3 px-2 italic uppercase tracking-wider font-sans">
            Dosyalara tıklayarak detaylı açıklamayı ve başlangıç kodunu inceleyin:
          </p>
          {renderTree(projectStructure)}
        </div>

        {/* Selected Node Details */}
        <div className="w-full lg:w-1/2 p-4 bg-[#09090b]/40 overflow-y-auto flex flex-col justify-between min-h-0 border-t lg:border-t-0 border-zinc-800">
          {selectedNode ? (
            <div className="space-y-4 flex flex-col h-full justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {selectedNode.type === 'folder' ? (
                    <Folder className="w-5 h-5 text-indigo-300" />
                  ) : (
                    <FileText className="w-5 h-5 text-zinc-400" />
                  )}
                  <h4 className="text-sm font-semibold font-mono text-indigo-400">{selectedNode.name}</h4>
                </div>
                <p className="text-xs text-zinc-300 bg-zinc-900/80 p-3 rounded border border-zinc-800 leading-relaxed shadow-sm font-sans">
                  {selectedNode.description}
                </p>
              </div>

              {selectedNode.contentCode ? (
                <div className="flex-1 mt-4 min-h-0 flex flex-col font-sans">
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 px-2 py-1 bg-zinc-900 border-t border-x border-zinc-800 rounded-t font-mono">
                    <span>BAŞLANGIÇ ŞABLONU</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedNode.contentCode || '');
                        alert("Kod şablonu kopyalandı!");
                      }}
                      className="hover:text-zinc-100 transition-colors cursor-pointer"
                    >
                      Kopyala
                    </button>
                  </div>
                  <pre className="p-3 bg-[#0c0c0e] border border-zinc-800 rounded-b overflow-x-auto text-[10px] font-mono text-indigo-300/90 leading-normal max-h-52 lg:max-h-none flex-1">
                    <code>{selectedNode.contentCode}</code>
                  </pre>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-zinc-500 flex-1 flex flex-col items-center justify-center font-sans">
                  <span className="italic">Bu dosya/klasör için detaylı kod şablonu arka planda otomatik yapılandırılmıştır. Projeyi oluştururken bu dosyayı mimarinizin parçası haline getirebilirsiniz.</span>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-zinc-500 italic font-sans">
              Ayrıntıları görmek için soldaki klasör ağacından bir öğe seçin.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
