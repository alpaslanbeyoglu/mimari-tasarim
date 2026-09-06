import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Environment, ContactShadows, Edges, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { Room } from '../types';

// Materials configuration (simulated PBR)
export const MATERIAL_LIBRARY = {
  beton: {
    name: 'Brüt Beton',
    color: '#8e8e93',
    roughness: 0.8,
    metalness: 0.1,
  },
  ahsap: {
    name: 'Meşe Parke',
    color: '#a1662f',
    roughness: 0.6,
    metalness: 0.05,
  },
  mermer: {
    name: 'Beyaz Mermer',
    color: '#f0f0f0',
    roughness: 0.1,
    metalness: 0.2,
  },
  fayans: {
    name: 'Siyah Seramik',
    color: '#2c2c2e',
    roughness: 0.2,
    metalness: 0.1,
  },
  default: {
    name: 'Varsayılan',
    color: '#6366f1',
    roughness: 0.5,
    metalness: 0.1,
  }
};

interface RoomMeshProps {
  room: Room;
  isSelected: boolean;
  onSelect: () => void;
  wallHeight: number;
  scaleFactor: number;
}

const RoomMesh: React.FC<RoomMeshProps> = ({ room, isSelected, onSelect, wallHeight, scaleFactor }) => {
  const meshRef = useRef<THREE.Group>(null);
  const materialData = (room.material && MATERIAL_LIBRARY[room.material as keyof typeof MATERIAL_LIBRARY]) 
                        ? MATERIAL_LIBRARY[room.material as keyof typeof MATERIAL_LIBRARY] 
                        : MATERIAL_LIBRARY.default;

  // We map 2D coordinates to 3D space
  // Canvas2D top-left is (0,0), Y goes down.
  // In Three.js, we center it. Let's assume a 500x500 grid.
  const cx = (room.x + room.width / 2 - 250) * scaleFactor;
  const cz = (room.y + room.height / 2 - 250) * scaleFactor;
  const w = room.width * scaleFactor;
  const d = room.height * scaleFactor;
  const h = wallHeight * scaleFactor;
  const wallThickness = 4 * scaleFactor;

  const wallMaterial = new THREE.MeshStandardMaterial({ 
    color: '#18181b', // zinc-900
    roughness: 0.9, 
    metalness: 0.0 
  });
  
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: materialData.color,
    roughness: materialData.roughness,
    metalness: materialData.metalness,
  });

  const selectedColor = '#6366f1'; // Indigo 500
  const edgeColor = isSelected ? selectedColor : '#27272a'; // Zinc 800

  return (
    <group position={[cx, 0, cz]} onClick={(e) => { e.stopPropagation(); onSelect(); }}>
      {/* Floor */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <primitive object={floorMaterial} attach="material" />
        {isSelected && (
          <Edges 
            linewidth={2} 
            threshold={15} 
            color={selectedColor} 
          />
        )}
      </mesh>

      {/* Walls (Top, Bottom, Left, Right relative to the 2D plane) */}
      {/* Top Wall (Z -) */}
      <mesh position={[0, h / 2, -d / 2]} castShadow receiveShadow>
        <boxGeometry args={[w, h, wallThickness]} />
        <primitive object={wallMaterial} attach="material" />
        <Edges linewidth={1} threshold={15} color={edgeColor} />
      </mesh>
      
      {/* Bottom Wall (Z +) */}
      <mesh position={[0, h / 2, d / 2]} castShadow receiveShadow>
        <boxGeometry args={[w, h, wallThickness]} />
        <primitive object={wallMaterial} attach="material" />
        <Edges linewidth={1} threshold={15} color={edgeColor} />
      </mesh>
      
      {/* Left Wall (X -) */}
      <mesh position={[-w / 2, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[wallThickness, h, d]} />
        <primitive object={wallMaterial} attach="material" />
        <Edges linewidth={1} threshold={15} color={edgeColor} />
      </mesh>
      
      {/* Right Wall (X +) */}
      <mesh position={[w / 2, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[wallThickness, h, d]} />
        <primitive object={wallMaterial} attach="material" />
        <Edges linewidth={1} threshold={15} color={edgeColor} />
      </mesh>
    </group>
  );
};

interface Scene3DProps {
  rooms: Room[];
  selectedRoomId: string | null;
  onSelectRoom: (id: string | null) => void;
  wallHeight?: number;
}

export const Scene3D: React.FC<Scene3DProps> = ({ rooms, selectedRoomId, onSelectRoom, wallHeight = 100 }) => {
  const scaleFactor = 0.05; // Scale down from pixel coordinates to Three.js units

  return (
    <>
      <color attach="background" args={['#0c0c0e']} />
      <ambientLight intensity={0.4} />
      <directionalLight 
        position={[10, 20, 10]} 
        intensity={1.5} 
        castShadow 
        shadow-mapSize={[2048, 2048]} 
      />
      <Environment preset="city" background={false} />
      
      <PerspectiveCamera makeDefault position={[-15, 20, 20]} fov={45} />
      <OrbitControls 
        makeDefault 
        minPolarAngle={0} 
        maxPolarAngle={Math.PI / 2 - 0.05} 
        enableDamping 
        dampingFactor={0.05}
      />

      <group position={[0, -2, 0]}>
        <Grid 
          infiniteGrid 
          fadeDistance={50} 
          sectionColor="#27272a" // zinc-800
          cellColor="#18181b" // zinc-900
          cellSize={1}
          sectionSize={5}
        />
        <ContactShadows opacity={0.4} scale={50} blur={2} far={10} resolution={256} color="#000000" />
        
        {rooms.map(room => (
          <RoomMesh 
            key={room.id}
            room={room}
            isSelected={selectedRoomId === room.id}
            onSelect={() => onSelectRoom(room.id)}
            wallHeight={wallHeight}
            scaleFactor={scaleFactor}
          />
        ))}
      </group>
    </>
  );
};
