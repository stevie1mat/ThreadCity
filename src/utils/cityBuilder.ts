import { Post, Building, Street, City } from '../types';

export const COLORS = {
  op: '#A55233',      // Brick Red
  depth1: '#D2B48C',  // Tan
  depth2: '#8B7355',  // Brown
  depth3: '#5A6351',  // Olive Drab
  deep: '#9A8B71',    // Dusty Concrete
  ground: '#4B4237',  // Dirty Asphalt
  street: '#6F6052',  // Grimy Sidewalk
  streetLine: '#A39581' // Faded lines
};

export function hexToRgba(hex: string, a: number): string {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

export function flattenBranch(node: Post, depth: number): Post[] {
  const result: Post[] = [{ ...node, depth: depth + 1 }];
  if (node.children) {
    node.children.forEach(c => result.push(...flattenBranch(c, depth + 1)));
  }
  return result;
}

export function buildCity(tree: Post): City {
  const buildings: Building[] = [];
  const streets: Street[] = [];


  // Calculate max depth for each node recursively
  const calculateDepth = (node: Post): number => {
    if (!node.children || node.children.length === 0) return 1;
    let max = 0;
    for (const r of node.children) {
      max = Math.max(max, calculateDepth(r));
    }
    (node as any)._maxChainDepth = max + 1;
    return max + 1;
  };
  
  calculateDepth(tree);

  // Flatten the tree into a single list
  const flatPosts: {post: Post, depth: number}[] = [];
  
  // Add OP as the first building
  flatPosts.push({post: tree, depth: 0});
  
  const flatten = (node: Post, depth: number) => {
    if (node.children) {
      // Sort children by chain length so tallest are placed first
      const sorted = [...node.children].sort((a,b) => 
         ((b as any)._maxChainDepth || 0) - ((a as any)._maxChainDepth || 0)
      );
      for (const child of sorted) {
        flatPosts.push({post: child, depth});
        flatten(child, depth + 1);
      }
    }
  };
  flatten(tree, 1);

  if (flatPosts.length === 0) return { buildings, streets };

  let leftZ = 0; // Start at Z=0
  let rightZ = 0;

  const ROAD_WIDTH = 60;
  const SIDEWALK_WIDTH = 20;
  
  const palette = [COLORS.op, COLORS.depth1, COLORS.depth2, COLORS.depth3, COLORS.deep];

  for (let i = 0; i < flatPosts.length; i++) {
    const {post, depth} = flatPosts[i];
    
    // Choose side with smaller Z to keep them relatively even
    const side = leftZ <= rightZ ? 'left' : 'right';
    
    // Width along the street
    const w = 16 + Math.min(24, Math.floor(post.likes / 2));
    const h = 20 + Math.min(20, post.replies); // depth of building
    
    const chainDepth = (post as any)._maxChainDepth || 1;
    const engagementBonus = Math.floor((post.likes + post.reposts) / 10);
    const floors = Math.max(1, chainDepth * 2 + engagementBonus);

    // Pick a vibrant color sequentially to guarantee a colorful street
    const color = palette[i % palette.length];

    if (side === 'left') {
      buildings.push({
        x: -(ROAD_WIDTH/2 + SIDEWALK_WIDTH + h/2),
        y: leftZ + w/2,
        w, h, floors, color, glowColor: color, isOP: false, post, depth
      });
      leftZ += w + 2; // small gap
    } else {
      buildings.push({
        x: (ROAD_WIDTH/2 + SIDEWALK_WIDTH + h/2),
        y: rightZ + w/2,
        w, h, floors, color, glowColor: color, isOP: false, post, depth
      });
      rightZ += w + 2;
    }
  }

  // Define the single main street
  const maxZ = Math.max(leftZ, rightZ) + 100;
  streets.push({
    sx: 0, sy: -40, ex: 0, ey: maxZ,
    width: ROAD_WIDTH, color: '#1a1f3c', depth: 1
  });

  return { buildings, streets };
}
