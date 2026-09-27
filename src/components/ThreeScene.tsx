import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Room } from '../types';
import { ThreeFallback } from './ThreeFallback';

export const MATERIAL_LIBRARY: Record<string, { name: string; color: string; roughness: number; metalness: number; wallColor?: string }> = {
  beton: {
    name: 'Brüt Beton',
    color: '#8e8e93',
    roughness: 0.8,
    metalness: 0.1,
    wallColor: '#27272a'
  },
  ahsap: {
    name: 'Meşe Parke',
    color: '#a1662f',
    roughness: 0.5,
    metalness: 0.05,
    wallColor: '#3f3f46'
  },
  mermer: {
    name: 'Beyaz Mermer',
    color: '#f1f5f9',
    roughness: 0.15,
    metalness: 0.2,
    wallColor: '#334155'
  },
  fayans: {
    name: 'Siyah Seramik',
    color: '#27272a',
    roughness: 0.25,
    metalness: 0.15,
    wallColor: '#18181b'
  },
  granit: {
    name: 'Gri Granit',
    color: '#64748b',
    roughness: 0.4,
    metalness: 0.3,
    wallColor: '#1e293b'
  },
  default: {
    name: 'Standart Duvar',
    color: '#6366f1',
    roughness: 0.5,
    metalness: 0.1,
    wallColor: '#27272a'
  }
};

interface ThreeViewProps {
  rooms: Room[];
  selectedRoomId: string | null;
  onSelectRoom: (id: string | null) => void;
  wallHeight?: number;
}

export const ThreeView: React.FC<ThreeViewProps> = ({ 
  rooms, 
  selectedRoomId, 
  onSelectRoom, 
  wallHeight = 70 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [webglError, setWebglError] = useState(false);

  // Store mutable references to Three.js instances
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const roomMeshesGroupRef = useRef<THREE.Group | null>(null);
  const roomMeshMapRef = useRef<Map<THREE.Object3D, string>>(new Map());
  const reqIdRef = useRef<number>(0);

  // Initialize Three.js Scene
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    try {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      const width = container.clientWidth || 600;
      const height = container.clientHeight || 400;

      // 1. Scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color('#0c0c0e');
      sceneRef.current = scene;

      // 2. Camera
      const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 500);
      camera.position.set(-16, 22, 22);
      cameraRef.current = camera;

      // 3. Renderer
      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance'
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      rendererRef.current = renderer;

      // 4. Orbit Controls
      const controls = new OrbitControls(camera, canvas);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.minDistance = 5;
      controls.maxDistance = 60;
      controls.maxPolarAngle = Math.PI / 2 - 0.05;
      controls.target.set(0, 0, 0);
      controlsRef.current = controls;

      // 5. Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
      scene.add(ambientLight);

      const hemiLight = new THREE.HemisphereLight(0xe0e7ff, 0x09090b, 0.45);
      scene.add(hemiLight);

      const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
      dirLight.position.set(15, 25, 15);
      dirLight.castShadow = true;
      dirLight.shadow.mapSize.width = 1024;
      dirLight.shadow.mapSize.height = 1024;
      dirLight.shadow.camera.near = 0.5;
      dirLight.shadow.camera.far = 70;
      dirLight.shadow.camera.left = -20;
      dirLight.shadow.camera.right = 20;
      dirLight.shadow.camera.top = 20;
      dirLight.shadow.camera.bottom = -20;
      dirLight.shadow.bias = -0.0005;
      scene.add(dirLight);

      const fillLight = new THREE.DirectionalLight(0x818cf8, 0.4);
      fillLight.position.set(-15, 12, -10);
      scene.add(fillLight);

      // 6. Architectural Grid
      const gridHelper = new THREE.GridHelper(40, 40, 0x3f3f46, 0x18181b);
      gridHelper.position.y = 0;
      scene.add(gridHelper);

      // 7. Ground shadow plane
      const groundGeo = new THREE.PlaneGeometry(60, 60);
      const groundMat = new THREE.ShadowMaterial({ opacity: 0.35 });
      const groundMesh = new THREE.Mesh(groundGeo, groundMat);
      groundMesh.rotation.x = -Math.PI / 2;
      groundMesh.position.y = -0.01;
      groundMesh.receiveShadow = true;
      scene.add(groundMesh);

      // 8. Room Meshes Group
      const roomGroup = new THREE.Group();
      scene.add(roomGroup);
      roomMeshesGroupRef.current = roomGroup;

      // Animation Loop
      const animate = () => {
        reqIdRef.current = requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };
      animate();

      // Resize Observer
      const resizeObserver = new ResizeObserver(entries => {
        if (!entries[0]) return;
        const newWidth = entries[0].contentRect.width;
        const newHeight = entries[0].contentRect.height;
        if (newWidth > 0 && newHeight > 0) {
          camera.aspect = newWidth / newHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(newWidth, newHeight);
        }
      });
      resizeObserver.observe(container);

      // Raycasting for room click selection in 3D
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();

      const handleClick = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(roomGroup.children, true);

        if (intersects.length > 0) {
          let hitObj: THREE.Object3D | null = intersects[0].object;
          while (hitObj && !roomMeshMapRef.current.has(hitObj)) {
            hitObj = hitObj.parent;
          }
          if (hitObj && roomMeshMapRef.current.has(hitObj)) {
            const hitRoomId = roomMeshMapRef.current.get(hitObj);
            if (hitRoomId) {
              onSelectRoom(hitRoomId);
            }
          }
        }
      };

      canvas.addEventListener('click', handleClick);

      return () => {
        cancelAnimationFrame(reqIdRef.current);
        resizeObserver.disconnect();
        canvas.removeEventListener('click', handleClick);
        controls.dispose();
        renderer.dispose();
      };
    } catch (err) {
      console.warn("WebGL initialization failed, falling back to CSS 3D:", err);
      setWebglError(true);
    }
  }, []);

  // Update Rooms Geometry when `rooms`, `selectedRoomId`, or `wallHeight` changes
  useEffect(() => {
    const roomGroup = roomMeshesGroupRef.current;
    if (!roomGroup) return;

    // Clear old room meshes and materials
    while (roomGroup.children.length > 0) {
      const obj = roomGroup.children[0];
      roomGroup.remove(obj);
      if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose();
    }
    roomMeshMapRef.current.clear();

    const scaleFactor = 0.04; // 1 pixel = 0.04m (scaled for 3D world view)

    rooms.forEach(room => {
      const isSelected = room.id === selectedRoomId;
      const matData = (room.material && MATERIAL_LIBRARY[room.material]) 
                        ? MATERIAL_LIBRARY[room.material] 
                        : MATERIAL_LIBRARY.default;

      // Coordinate mapping
      const cx = (room.x + room.width / 2 - 250) * scaleFactor;
      const cz = (room.y + room.height / 2 - 250) * scaleFactor;
      const w = Math.max(0.4, room.width * scaleFactor);
      const d = Math.max(0.4, room.height * scaleFactor);
      const h = Math.max(0.5, wallHeight * scaleFactor);
      const wallThickness = Math.max(0.08, 4 * scaleFactor);

      const singleRoomGroup = new THREE.Group();
      singleRoomGroup.position.set(cx, 0, cz);

      // Floor
      const floorGeo = new THREE.PlaneGeometry(w, d);
      const floorMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(matData.color),
        roughness: matData.roughness,
        metalness: matData.metalness,
        side: THREE.DoubleSide
      });
      const floorMesh = new THREE.Mesh(floorGeo, floorMat);
      floorMesh.rotation.x = -Math.PI / 2;
      floorMesh.position.y = 0.02;
      floorMesh.receiveShadow = true;
      singleRoomGroup.add(floorMesh);

      // Selection outline
      if (isSelected) {
        const edges = new THREE.EdgesGeometry(floorGeo);
        const lineMat = new THREE.LineBasicMaterial({ color: 0x818cf8, linewidth: 2 });
        const wireframe = new THREE.LineSegments(edges, lineMat);
        wireframe.rotation.x = -Math.PI / 2;
        wireframe.position.y = 0.03;
        singleRoomGroup.add(wireframe);
      }

      // Walls Material
      const wallColor = isSelected ? '#4f46e5' : (matData.wallColor || '#27272a');
      const wallMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(wallColor),
        roughness: 0.8,
        metalness: 0.1
      });

      // Top Wall (Z -)
      const topWallGeo = new THREE.BoxGeometry(w, h, wallThickness);
      const topWall = new THREE.Mesh(topWallGeo, wallMat);
      topWall.position.set(0, h / 2, -d / 2);
      topWall.castShadow = true;
      topWall.receiveShadow = true;
      singleRoomGroup.add(topWall);

      // Bottom Wall (Z +)
      const botWallGeo = new THREE.BoxGeometry(w, h, wallThickness);
      const botWall = new THREE.Mesh(botWallGeo, wallMat);
      botWall.position.set(0, h / 2, d / 2);
      botWall.castShadow = true;
      botWall.receiveShadow = true;
      singleRoomGroup.add(botWall);

      // Left Wall (X -)
      const leftWallGeo = new THREE.BoxGeometry(wallThickness, h, d);
      const leftWall = new THREE.Mesh(leftWallGeo, wallMat);
      leftWall.position.set(-w / 2, h / 2, 0);
      leftWall.castShadow = true;
      leftWall.receiveShadow = true;
      singleRoomGroup.add(leftWall);

      // Right Wall (X +)
      const rightWallGeo = new THREE.BoxGeometry(wallThickness, h, d);
      const rightWall = new THREE.Mesh(rightWallGeo, wallMat);
      rightWall.position.set(w / 2, h / 2, 0);
      rightWall.castShadow = true;
      rightWall.receiveShadow = true;
      singleRoomGroup.add(rightWall);

      roomGroup.add(singleRoomGroup);
      roomMeshMapRef.current.set(singleRoomGroup, room.id);
    });
  }, [rooms, selectedRoomId, wallHeight]);

  if (webglError) {
    return (
      <ThreeFallback 
        rooms={rooms} 
        selectedRoomId={selectedRoomId} 
        onSelectRoom={onSelectRoom} 
      />
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-[#0c0c0e]">
      <canvas ref={canvasRef} className="w-full h-full block cursor-grab active:cursor-grabbing" />
    </div>
  );
};
