import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { City, Building, Post } from '../types';
import { COLORS } from '../utils/cityBuilder';

interface CityCanvasProps {
  city: City | null;
  onHover: (building: Building | null) => void;
  onReadPost: (post: Post) => void;
  isReading: boolean;
}

function Player({ isReading }: { isReading: boolean }) {
  const avatarRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const walkCycle = useRef(0);
  const [moveState, setMoveState] = useState({ forward: false, backward: false, left: false, right: false });
  const direction = useRef(new THREE.Vector3());
  // Initialize facing +Z (towards the city)
  const euler = useRef(new THREE.Euler(0, Math.PI, 0, 'YXZ'));

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyW' || e.code === 'ArrowUp') setMoveState(m => ({ ...m, forward: true }));
      if (e.code === 'KeyS' || e.code === 'ArrowDown') setMoveState(m => ({ ...m, backward: true }));
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') setMoveState(m => ({ ...m, left: true }));
      if (e.code === 'KeyD' || e.code === 'ArrowRight') setMoveState(m => ({ ...m, right: true }));
      if (e.code === 'Space') window.dispatchEvent(new CustomEvent('player-action'));
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'KeyW' || e.code === 'ArrowUp') setMoveState(m => ({ ...m, forward: false }));
      if (e.code === 'KeyS' || e.code === 'ArrowDown') setMoveState(m => ({ ...m, backward: false }));
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') setMoveState(m => ({ ...m, left: false }));
      if (e.code === 'KeyD' || e.code === 'ArrowRight') setMoveState(m => ({ ...m, right: false }));
    };

    const onMouseMove = (event: MouseEvent) => {
      if (document.pointerLockElement === document.body && !isReading) {
         euler.current.y -= event.movementX * 0.002;
         euler.current.x -= event.movementY * 0.002;
         euler.current.x = Math.max(-Math.PI/4, Math.min(Math.PI/4, euler.current.x));
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('mousemove', onMouseMove);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('mousemove', onMouseMove);
    };
  }, [isReading]);

  useFrame((state, delta) => {
    if (!avatarRef.current || isReading) return;

    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), euler.current.y);
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), euler.current.y);

    direction.current.set(0,0,0);
    if (moveState.forward) direction.current.add(forward);
    if (moveState.backward) direction.current.sub(forward);
    if (moveState.left) direction.current.sub(right);
    if (moveState.right) direction.current.add(right);
    direction.current.normalize();

    const speed = 40 * delta;
    if (direction.current.lengthSq() > 0) {
       avatarRef.current.position.addScaledVector(direction.current, speed);
       const targetAngle = Math.atan2(direction.current.x, direction.current.z);
       avatarRef.current.rotation.y = targetAngle;
       
       // Animate legs
       walkCycle.current += delta * 15;
       if (leftLegRef.current && rightLegRef.current) {
         leftLegRef.current.rotation.x = Math.sin(walkCycle.current) * 0.6;
         rightLegRef.current.rotation.x = Math.sin(walkCycle.current + Math.PI) * 0.6;
       }
    } else {
       // Reset legs to standing
       walkCycle.current = 0;
       if (leftLegRef.current && rightLegRef.current) {
         leftLegRef.current.rotation.x = 0;
         rightLegRef.current.rotation.x = 0;
       }
    }

    const offset = new THREE.Vector3(0, 6, 15);
    offset.applyEuler(euler.current);
    state.camera.position.copy(avatarRef.current.position).add(offset);
    state.camera.lookAt(avatarRef.current.position.clone().add(new THREE.Vector3(0, 4, 0)));
  });

  return (
    <group ref={avatarRef} position={[0, 0, -25]}>
      <mesh position={[0, 3, 0]} castShadow>
        <boxGeometry args={[1.5, 2.5, 1]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.8} />
      </mesh>
      
      {/* Left Leg wrapped in a group at the hip to rotate from the top */}
      <group ref={leftLegRef} position={[-0.4, 1.75, 0]}>
        <mesh position={[0, -0.75, 0]} castShadow>
          <boxGeometry args={[0.6, 2, 0.6]} />
          <meshStandardMaterial color="#1E3A8A" roughness={0.9} />
        </mesh>
      </group>

      {/* Right Leg wrapped in a group at the hip to rotate from the top */}
      <group ref={rightLegRef} position={[0.4, 1.75, 0]}>
        <mesh position={[0, -0.75, 0]} castShadow>
          <boxGeometry args={[0.6, 2, 0.6]} />
          <meshStandardMaterial color="#1E3A8A" roughness={0.9} />
        </mesh>
      </group>

      <mesh position={[0, 4.75, 0]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#5C3A21" roughness={0.6} />
      </mesh>
    </group>
  );
}

function CityBuilding({ b, onHover, onReadPost, isReading }: { b: Building, onHover: (b: Building|null)=>void, onReadPost: (p: Post)=>void, isReading: boolean }) {
  const [hovered, setHovered] = useState(false);
  const { camera } = useThree();

  const isOP = b.isOP;
  const opScale = isOP ? 1.5 : 1;
  const width = b.h * opScale;
  const depth = b.w * opScale;
  const height = b.floors * 12;
  const yPos = height / 2;

  useFrame(() => {
    if (isReading) return;
    const dist = camera.position.distanceTo(new THREE.Vector3(b.x, 0, b.y));
    const isNear = dist < (Math.max(width, depth) + 40);
    
    if (isNear !== hovered) {
      setHovered(isNear);
      if (isNear) {
        onHover(b);
      } else if (hovered) {
        onHover(null);
      }
    }
  });

  useEffect(() => {
    const handleAction = () => {
      if (hovered && b.post && !isReading) {
        onReadPost(b.post);
      }
    };
    window.addEventListener('player-action', handleAction);
    return () => window.removeEventListener('player-action', handleAction);
  }, [hovered, b, isReading, onReadPost]);

  const isLeft = b.x < 0;

  return (
    <group position={[b.x, 0, b.y]}>
      <mesh position={[0, 4, 0]} castShadow receiveShadow>
        <boxGeometry args={[width + 1, 8, depth + 1]} />
        <meshStandardMaterial color="#C1B0A0" roughness={0.95} />
      </mesh>

      <mesh position={[0, yPos + 4, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height - 8, depth]} />
        <meshStandardMaterial color={b.color} roughness={0.9} />
      </mesh>
      
      <mesh position={[0, height, 0]} castShadow receiveShadow>
         <boxGeometry args={[width + 1.5, 2, depth + 1.5]} />
         <meshStandardMaterial color="#9A8B71" roughness={0.9} />
      </mesh>
      
      <group position={[isLeft ? width/2 + 0.1 : -width/2 - 0.1, yPos, 0]} rotation={[0, isLeft ? Math.PI/2 : -Math.PI/2, 0]}>
        {Array.from({ length: Math.floor(height / 10) - 1 }).map((_, r) => 
           Array.from({ length: Math.floor(depth / 8) }).map((_, c) => (
             <mesh key={`${r}-${c}`} position={[(c - Math.floor(depth/8)/2) * 8 + 4, (r - Math.floor(height/10)/2) * 10 + 10, 0]}>
               <planeGeometry args={[4, 6]} />
               <meshStandardMaterial color="#2B3642" roughness={0.2} metalness={0.7} />
             </mesh>
           ))
        )}
      </group>
      
      <mesh position={[isLeft ? width/2 + 2.5 : -width/2 - 2.5, 8, 0]} rotation={[0, 0, isLeft ? -0.15 : 0.15]} castShadow>
         <boxGeometry args={[5, 0.5, depth - 2]} />
         <meshStandardMaterial color={b.color === COLORS.depth1 ? COLORS.depth2 : COLORS.depth1} roughness={0.8} />
      </mesh>

      <mesh position={[isLeft ? width/2 + 0.6 : -width/2 - 0.6, 4, 0]} rotation={[0, isLeft ? Math.PI/2 : -Math.PI/2, 0]}>
         <planeGeometry args={[6, 8]} />
         <meshStandardMaterial color="#3A2E25" roughness={0.9} />
      </mesh>

      {hovered && (
        <Text position={[isLeft ? width/2 + 5 : -width/2 - 5, height / 2 + 5, 0]} rotation={[0, isLeft ? Math.PI/2 : -Math.PI/2, 0]} fontSize={2.5} color="#FFF" outlineWidth={0.2} outlineColor="#000">
          [SPACE TO READ]
        </Text>
      )}
    </group>
  );
}

export default function CityCanvas({ city, onHover, onReadPost, isReading }: CityCanvasProps) {
  useEffect(() => {
    const onLockChange = () => {
      const isLocked = document.pointerLockElement === document.body;
      const overlay = document.getElementById('pointer-lock-overlay');
      if (overlay) overlay.style.display = isLocked ? 'none' : 'flex';
    };
    document.addEventListener('pointerlockchange', onLockChange);
    return () => document.removeEventListener('pointerlockchange', onLockChange);
  }, []);

  if (!city) return null;

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: '#E08E36' }}>
      <Canvas shadows camera={{ position: [0, 8, -25], fov: 75 }}>
        <color attach="background" args={['#E08E36']} />
        <fog attach="fog" args={['#E08E36', 50, 400]} />
        
        <ambientLight intensity={0.6} color="#FFD1A4" />
        <directionalLight 
           position={[150, 200, 50]} 
           intensity={2} 
           color="#FFAA55" 
           castShadow 
           shadow-mapSize-width={2048} 
           shadow-mapSize-height={2048}
           shadow-camera-far={500}
           shadow-camera-left={-100}
           shadow-camera-right={100}
           shadow-camera-top={100}
           shadow-camera-bottom={-100}
        />

        <Player isReading={isReading} />

        {/* Road (Asphalt) */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 1000]} receiveShadow>
          <planeGeometry args={[60, 3000]} />
          <meshStandardMaterial color={COLORS.ground} roughness={1} />
        </mesh>
        
        {/* Road center line */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.2, 1000]}>
          <planeGeometry args={[1, 3000]} />
          <meshBasicMaterial color={COLORS.streetLine} opacity={0.5} transparent />
        </mesh>

        {/* Sidewalks */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-40, 0.5, 1000]} receiveShadow>
          <planeGeometry args={[20, 3000]} />
          <meshStandardMaterial color={COLORS.street} roughness={1} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[40, 0.5, 1000]} receiveShadow>
          <planeGeometry args={[20, 3000]} />
          <meshStandardMaterial color={COLORS.street} roughness={1} />
        </mesh>

        {/* Render Buildings */}
        {city.buildings.map((b, i) => (
          <CityBuilding key={`building-${i}`} b={b} onHover={onHover} onReadPost={onReadPost} isReading={isReading} />
        ))}
      </Canvas>

      {!isReading && (
        <div id="pointer-lock-overlay" style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.5)', zIndex: 5, color: '#FFF', cursor: 'pointer',
          flexDirection: 'column', fontFamily: 'Syne, sans-serif'
        }} onClick={() => {
          document.body.requestPointerLock();
        }}>
          <h2 style={{ color: '#FFAA55', marginBottom: 16, textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>CLICK TO EXPLORE</h2>
          <p style={{fontWeight: 'bold', textShadow: '0 1px 2px rgba(0,0,0,0.8)'}}>WASD to walk &nbsp;·&nbsp; Mouse to look &nbsp;·&nbsp; SPACE to read posts</p>
        </div>
      )}
    </div>
  );
}
