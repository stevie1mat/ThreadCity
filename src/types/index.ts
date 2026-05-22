export type FileAge = 'volcanic' | 'sedimentary' | 'fossil';

export interface FossilNode {
  path: string;
  name: string;
  type: 'tree' | 'blob';
  size?: number;
  extension?: string;
  url?: string;
  depth: number;
  age: FileAge;
  children: FossilNode[];
}

export interface DependencyCity {
  name: string;
  currentVersion: string;
  latestVersion: string;
  population: number;      // weekly downloads
  stalenessDays: number;   // days since latest version or diff
  vulnerabilityCount: number;
  vulnerabilities: any[];  // details if needed
  isDev: boolean;
}

export interface TerrainBlock {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  color: string;
  glowColor?: string;
  isVolcanic: boolean;
  node: FossilNode;
}

export interface CityLayout {
  x: number;
  z: number;
  radius: number;
  dependency: DependencyCity;
  buildings: { x: number; z: number; w: number; d: number; h: number }[];
}

export interface PathLink {
  startX: number;
  startZ: number;
  endX: number;
  endZ: number;
}

export interface EcoSystem {
  terrain: TerrainBlock[];
  paths: PathLink[];
  cities: CityLayout[];
  rootNode: FossilNode;
}
