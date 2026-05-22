import { useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, Stars, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { EcoSystem, TerrainBlock, CityLayout, FossilNode } from '../types';

interface EcoCanvasProps {
  ecoSystem: EcoSystem | null;
  onReadNode: (node: FossilNode) => void;
  isReading: boolean;
}



function TerrainNode({ block, onReadNode, isReading }: { block: TerrainBlock, onReadNode: (n: FossilNode)=>void, isReading: boolean }) {
  const [hovered, setHovered] = useState(false);
  const { camera } = useThree();

  useFrame(() => {
    if (isReading) return;
    const dist = camera.position.distanceTo(new THREE.Vector3(block.x, block.h, block.z));
    const isNear = dist < 60;
    if (isNear !== hovered) setHovered(isNear);
  });

  return (
    <group position={[block.x, block.h/2, block.z]}>
      {block.node.type === 'tree' ? (
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[block.w/2, block.w/2, block.h, 32]} />
            <meshStandardMaterial color={block.color} roughness={0.9} emissive={block.isVolcanic ? "#FF4500" : "#000000"} emissiveIntensity={block.isVolcanic ? 0.8 : 0} />
          </mesh>
      ) : (
          <group onClick={(e) => {
              e.stopPropagation();
              if (!isReading && block.node.type === 'blob') {
                  onReadNode(block.node);
              }
          }}>
             <mesh castShadow receiveShadow>
               <icosahedronGeometry args={[block.w/2, 0]} />
               <meshStandardMaterial color={block.color} roughness={0.7} emissive={block.isVolcanic ? "#FF4500" : "#000000"} emissiveIntensity={block.isVolcanic ? 0.8 : 0} />
             </mesh>
             <mesh>
               <icosahedronGeometry args={[block.w/2 + 0.2, 0]} />
               <meshBasicMaterial color="#000" wireframe transparent opacity={0.3} />
             </mesh>
          </group>
      )}
      <Html position={[0, block.h/2 + (hovered ? 10 : 5), 0]} center zIndexRange={[100, 0]} distanceFactor={hovered ? 60 : 100}>
        <div style={{
          background: hovered ? 'rgba(255, 69, 0, 0.9)' : 'rgba(0, 0, 0, 0.7)',
          color: '#FFF',
          padding: '6px 10px',
          borderRadius: '6px',
          border: `1px solid ${hovered ? '#FFF' : '#4ECDC4'}`,
          fontFamily: 'monospace',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          transition: 'all 0.2s',
          opacity: block.node.depth === 0 || hovered ? 1 : 0.6
        }}>
          <div style={{ fontWeight: 'bold', fontSize: hovered ? '1.2em' : '1em' }}>
            {block.node.depth === 0 ? `[ROOT] ${block.node.name}` : block.node.name}
          </div>
          {block.node.depth === 0 && <div style={{ fontSize: '0.8em', color: '#FFD700', marginTop: '4px' }}>(Volcanic: Recent)</div>}
          {hovered && block.node.type === 'blob' && <div style={{ fontSize: '0.85em', marginTop: '6px', color: '#FFF' }}>[PRESS E TO READ]</div>}
        </div>
      </Html>
    </group>
  );
}

function Storm({ cx, cz, radius }: { cx: number, cz: number, radius: number }) {
  const lightRef = useRef<THREE.PointLight>(null);
  
  useFrame(() => {
     if (lightRef.current) {
         // Random lightning flashes
         if (Math.random() > 0.98) {
             lightRef.current.intensity = 500 + Math.random() * 1000;
         } else {
             lightRef.current.intensity = Math.max(0, lightRef.current.intensity - 100);
         }
     }
  });

  return (
    <group position={[cx, 100, cz]}>
      <mesh castShadow>
        <boxGeometry args={[radius * 1.5, 20, radius * 1.5]} />
        <meshStandardMaterial color="#222" roughness={1} />
      </mesh>
      <pointLight ref={lightRef} color="#AAAFFF" intensity={0} distance={300} />
      {/* Simulate rain with a semi-transparent falling mesh or just a bounding box for now */}
      <mesh position={[0, -50, 0]}>
          <cylinderGeometry args={[radius, radius, 100, 16]} />
          <meshBasicMaterial color="#AAAFFF" opacity={0.1} transparent side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function DependencyCityNode({ layout }: { layout: CityLayout }) {
  const isStale = layout.dependency.stalenessDays > 180; // 6 months
  const hasStorm = layout.dependency.vulnerabilityCount > 0;
  
  const groundColor = isStale ? "#C2B280" : "#2E8B57"; // Sand/cracked vs Green
  
  return (
    <group>
      {/* City Ground */}
      <mesh position={[layout.x, 1, layout.z]} receiveShadow>
        <cylinderGeometry args={[layout.radius, layout.radius, 2, 32]} />
        <meshStandardMaterial color={groundColor} roughness={1} />
      </mesh>

      {/* City Label */}
      <Html position={[layout.x, 40, layout.z]} center zIndexRange={[100, 0]} distanceFactor={150}>
        <div style={{
          background: hasStorm ? 'rgba(100, 0, 0, 0.8)' : (isStale ? 'rgba(150, 100, 0, 0.8)' : 'rgba(0, 100, 0, 0.8)'),
          color: '#FFF',
          padding: '8px 12px',
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.3)',
          fontFamily: 'Syne, sans-serif',
          textAlign: 'center',
          pointerEvents: 'none',
          boxShadow: '0 8px 16px rgba(0,0,0,0.5)'
        }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '4px' }}>{layout.dependency.name}</div>
          <div style={{ fontSize: '0.9rem', color: '#DDD' }}>v{layout.dependency.currentVersion} • {layout.dependency.population} d/w</div>
          {isStale && <div style={{ fontSize: '0.8rem', color: '#FFD700', marginTop: '4px' }}>⚠️ Severe Drought</div>}
          {hasStorm && <div style={{ fontSize: '0.8rem', color: '#FF4444', marginTop: '4px' }}>⛈️ Security Storms ({layout.dependency.vulnerabilityCount})</div>}
        </div>
      </Html>

      {/* Buildings */}
      {layout.buildings.map((b, i) => (
        <group key={i} position={[b.x, b.h/2 + 2, b.z]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[b.w, b.h, b.d]} />
            <meshStandardMaterial color="#666" roughness={0.8} />
          </mesh>
          <mesh>
            <boxGeometry args={[b.w + 0.2, b.h + 0.2, b.d + 0.2]} />
            <meshBasicMaterial color="#333" wireframe transparent opacity={0.5} />
          </mesh>
        </group>
      ))}

      {/* Weather Effects */}
      {hasStorm && <Storm cx={layout.x} cz={layout.z} radius={layout.radius} />}
    </group>
  );
}

export default function EcoCanvas({ ecoSystem, onReadNode, isReading }: EcoCanvasProps) {
  if (!ecoSystem) return null;

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: '#1A1A24' }}>
      <Canvas shadows camera={{ position: [0, 50, 150], fov: 75, far: 2000 }}>
        <color attach="background" args={['#1A1A24']} />
        <fog attach="fog" args={['#1A1A24', 100, 1500]} />
        
        <ambientLight intensity={0.4} color="#FFF" />
        <directionalLight 
           position={[500, 1000, 500]} 
           intensity={1.2} 
           color="#FFFDE0" 
           castShadow 
           shadow-mapSize-width={4096} 
           shadow-mapSize-height={4096}
           shadow-camera-far={2000}
           shadow-camera-left={-500}
           shadow-camera-right={500}
           shadow-camera-top={500}
           shadow-camera-bottom={-500}
        />

        <OrbitControls makeDefault />

        <Stars radius={200} depth={50} count={10000} factor={6} saturation={0} fade speed={1} />

        {/* Connection Paths */}
        {ecoSystem.paths.map((p, i) => {
           const dx = p.endX - p.startX;
           const dz = p.endZ - p.startZ;
           const length = Math.sqrt(dx*dx + dz*dz);
           const angle = Math.atan2(dz, dx);
           // Draw a glowing root/pipe connecting nodes
           return (
             <mesh key={`path-${i}`} position={[p.startX + dx/2, 1, p.startZ + dz/2]} rotation={[0, -angle, 0]} receiveShadow>
                <cylinderGeometry args={[1.5, 1.5, length, 8]} />
                <meshStandardMaterial color="#4ECDC4" roughness={0.5} transparent opacity={0.6} emissive="#4ECDC4" emissiveIntensity={0.2} />
             </mesh>
           );
        })}

        {/* Terrain Blocks (Files) */}
        {ecoSystem.terrain.map((block, i) => (
          <TerrainNode key={`terrain-${i}`} block={block} onReadNode={onReadNode} isReading={isReading} />
        ))}

        {/* Dependency Cities */}
        {ecoSystem.cities.map((city, i) => (
          <DependencyCityNode key={`city-${i}`} layout={city} />
        ))}
      </Canvas>
    </div>
  );
}
