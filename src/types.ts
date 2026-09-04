export interface Room {
  id: string;
  name: string;
  x: number; // grid units or pixels
  y: number;
  width: number;
  height: number;
  color: string;
  material: string; // id of material
}

export interface Wall {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface Opening {
  id: string;
  type: 'door' | 'window';
  x: number;
  y: number;
  rotation: number; // degrees
}

export interface Material {
  id: string;
  name: string;
  color: string;
  textureClass: string;
  description: string;
}

export interface FolderNode {
  name: string;
  type: 'file' | 'folder';
  children?: FolderNode[];
  description: string;
  contentCode?: string;
}
