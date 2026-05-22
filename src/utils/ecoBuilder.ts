import { FossilNode, DependencyCity, EcoSystem, TerrainBlock, CityLayout, PathLink } from '../types';

export const COLORS = {
  volcanic: '#FF4500',   // Orange Red (Magma)
  sedimentary: '#8B4513',// Saddle Brown (Rock)
  fossil: '#A9A9A9',     // Dark Gray
  dir: '#4ECDC4',
  op: '#FFD700'
};

export function buildEcoSystem(rootNode: FossilNode, deps: DependencyCity[]): EcoSystem {
  const terrain: TerrainBlock[] = [];
  const cities: CityLayout[] = [];
  const paths: PathLink[] = [];

  const ROAD_WIDTH = 40;
  
  function placeBranch(
    node: FossilNode, 
    depth: number, 
    startX: number, 
    startZ: number, 
    axis: 'X' | 'Z', 
    directionMultiplier: 1 | -1,
    parentX: number,
    parentZ: number
  ): { endX: number, endZ: number } {
     if (!node.children || node.children.length === 0) return { endX: startX, endZ: startZ };
     
     const sorted = [...node.children].sort((a,b) => {
         if (a.type !== b.type) return a.type === 'tree' ? -1 : 1;
         return (b.size || 0) - (a.size || 0);
     });

     let currentX = startX;
     let currentZ = startZ;
     
     if (axis === 'Z') currentZ += directionMultiplier * (ROAD_WIDTH + 20);
     else currentX += directionMultiplier * (ROAD_WIDTH + 20);
     
     for (let i = 0; i < sorted.length; i++) {
        const child = sorted[i];
        
        let w = 16;
        let d = 16;
        let h = 10;

        if (child.type === 'tree') {
           w = 40; d = 40; h = 2; // Wide platform
        } else {
           w = 12 + Math.min(10, Math.floor((child.size || 0) / 10000));
           d = w;
           h = w;
        }

        const color = child.age === 'volcanic' ? COLORS.volcanic : (child.age === 'sedimentary' ? COLORS.sedimentary : COLORS.fossil);

        let bx = currentX;
        let bz = currentZ;
        
        const sideOffset = (ROAD_WIDTH / 2) + Math.max(w,d)/2;

        if (axis === 'Z') {
           const side = (i % 2 === 0) ? 1 : -1;
           bx = currentX + (sideOffset * side);
           
           terrain.push({
             x: bx, z: bz, w, d, h, color, glowColor: color, 
             isVolcanic: child.age === 'volcanic', node: child
           });

           paths.push({ startX: parentX, startZ: parentZ, endX: bx, endZ: bz });
           
           if (child.children && child.children.length > 0) {
              placeBranch(child, depth + 1, currentX, currentZ, 'X', side as 1|-1, bx, bz);
           }

           currentZ += directionMultiplier * (w + 20);
        } else {
           const side = (i % 2 === 0) ? 1 : -1;
           bz = currentZ + (sideOffset * side);

           terrain.push({
             x: bx, z: bz, w, d, h, color, glowColor: color, 
             isVolcanic: child.age === 'volcanic', node: child
           });

           paths.push({ startX: parentX, startZ: parentZ, endX: bx, endZ: bz });

           if (child.children && child.children.length > 0) {
              placeBranch(child, depth + 1, currentX, currentZ, 'Z', side as 1|-1, bx, bz);
           }

           currentX += directionMultiplier * (w + 20);
        }
     }
     
     return { endX: currentX, endZ: currentZ };
  }

  // Root Node
  terrain.push({
    x: 0, z: 0, w: 40, d: 40, h: 20, color: COLORS.op, glowColor: COLORS.op, 
    isVolcanic: true, node: rootNode
  });

  placeBranch(rootNode, 1, 0, 0, 'Z', 1, 0, 0);

  // Place Dependency Cities in a large ring around the terrain
  const numCities = deps.length;
  const radius = Math.max(300, numCities * 40);
  
  for (let i = 0; i < numCities; i++) {
      const angle = (i / numCities) * Math.PI * 2;
      const cx = Math.cos(angle) * radius;
      const cz = Math.sin(angle) * radius;
      
      const dep = deps[i];
      // Popularity dictates number of buildings and their height
      const numBuildings = Math.max(1, Math.min(10, Math.floor(Math.log10(dep.population))));
      const bldgs = [];
      
      for(let j=0; j<numBuildings; j++) {
          const bw = 10 + Math.random() * 10;
          const bd = 10 + Math.random() * 10;
          const bh = 20 + Math.random() * Math.min(100, Math.log2(dep.population) * 5);
          const bx = cx + (Math.random() - 0.5) * 40;
          const bz = cz + (Math.random() - 0.5) * 40;
          bldgs.push({ x: bx, z: bz, w: bw, d: bd, h: bh });
      }

      cities.push({
          x: cx,
          z: cz,
          radius: 60,
          dependency: dep,
          buildings: bldgs
      });
  }

  return { terrain, paths, cities, rootNode };
}
