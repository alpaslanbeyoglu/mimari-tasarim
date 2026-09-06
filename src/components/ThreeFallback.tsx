import React from 'react';
import { Room } from '../types';
import { MATERIAL_LIBRARY } from './ThreeScene';
import { Compass, Info, RefreshCw } from 'lucide-react';

interface ThreeFallbackProps {
  rooms: Room[];
  selectedRoomId: string | null;
  onSelectRoom: (id: string | null) => void;
}

export const ThreeFallback: React.FC<ThreeFallbackProps> = ({ rooms, selectedRoomId, onSelectRoom }) => {
  return (
    <div className="absolute inset-0 bg-[#0c0c0e] flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden">
      {/* Dynamic Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f23_1px,transparent_1px),linear-gradient(to_bottom,#1f1f23_1px,transparent_1px)] bg-[size:30px_30px] opacity-20 pointer-events-none"></div>
      
      {/* Animated Glowing Radial Center */}
      <div className="absolute w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      {/* 3D Simulated Isometric CSS Box Scene */}
      <div className="relative w-full h-[320px] flex items-center justify-center perspective-[1000px] mb-4">
        <div 
          className="relative w-[300px] h-[300px] transition-transform duration-1000"
          style={{ 
            transform: 'rotateX(55deg) rotateZ(-45deg)',
            transformStyle: 'preserve-3d'
          }}
        >
          {/* Floor grid */}
          <div className="absolute inset-0 border border-zinc-800 bg-zinc-950/20 rounded-md"></div>

          {/* Rooms as 3D Extruded boxes */}
          {rooms.map((room) => {
            const isSelected = room.id === selectedRoomId;
            const mat = MATERIAL_LIBRARY[room.material as keyof typeof MATERIAL_LIBRARY] || MATERIAL_LIBRARY.default;
            
            // Map original x, y (0 to 500) to our isometric boundary (0 to 300)
            const factor = 300 / 500;
            const rx = room.x * factor;
            const ry = room.y * factor;
            const rw = room.width * factor;
            const rh = room.height * factor;
            const h = 25; // height of the walls

            return (
              <div
                key={room.id}
                onClick={() => onSelectRoom(room.id)}
                className="absolute transition-all duration-300 cursor-pointer"
                style={{
                  left: `${rx}px`,
                  top: `${ry}px`,
                  width: `${rw}px`,
                  height: `${rh}px`,
                  transformStyle: 'preserve-3d',
                  transform: 'translateZ(0px)',
                }}
              >
                {/* Floor face */}
                <div 
                  className="absolute inset-0 transition-all duration-300 border"
                  style={{
                    backgroundColor: mat.color,
                    borderColor: isSelected ? '#6366f1' : 'rgba(39, 39, 42, 0.4)',
                    boxShadow: isSelected ? '0 0 15px rgba(99,102,241,0.3)' : 'none',
                    opacity: isSelected ? 0.95 : 0.75,
                    transform: 'translateZ(1px)',
                  }}
                >
                  <div className="flex flex-col items-center justify-center h-full text-[8px] text-white font-bold opacity-80 select-none">
                    <span>{room.name}</span>
                  </div>
                </div>

                {/* Left Wall face */}
                <div 
                  className="absolute left-0 top-0 origin-left bg-zinc-900 border-l border-zinc-800"
                  style={{
                    width: `${h}px`,
                    height: '100%',
                    transform: 'rotateY(-90deg)',
                    opacity: 0.85
                  }}
                ></div>

                {/* Bottom Wall face */}
                <div 
                  className="absolute left-0 bottom-0 origin-bottom bg-zinc-950 border-b border-zinc-800"
                  style={{
                    width: '100%',
                    height: `${h}px`,
                    transform: 'rotateX(90deg)',
                    opacity: 0.9
                  }}
                ></div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Warning Alert Content */}
      <div className="relative max-w-sm bg-zinc-900/90 border border-zinc-850 p-4 rounded text-left z-10 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
            <Compass className="w-4 h-4 animate-spin" style={{ animationDuration: '8s' }} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-zinc-100">Simüle 3B Mod İzleniyor</h4>
            <p className="text-[10px] text-zinc-400 leading-relaxed mt-1">
              Tarayıcınızda veya bu iframe kapsamında WebGL donanım hızlandırması kısıtlanmış olabilir. Sizin için kusursuz çalışan bir <b>HTML5 CSS-3D Fallback</b> motoru devreye alındı.
            </p>
          </div>
        </div>
        
        <div className="mt-3.5 pt-3 border-t border-zinc-800 flex items-center justify-between">
          <span className="text-[9px] text-zinc-500 font-mono">
            Status: CSS-3D Emulated
          </span>
          <button 
            type="button"
            onClick={() => window.location.reload()}
            className="flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 font-bold transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" /> Yeniden Dene
          </button>
        </div>
      </div>
    </div>
  );
};
