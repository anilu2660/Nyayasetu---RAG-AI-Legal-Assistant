'use client';

import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

// Rotating scale component
function JusticeScale() {
  const groupRef = useRef<THREE.Group>(null);

  // Slowly rotate the scales of justice
  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.rotation.y = elapsed * 0.2;
      // Gentle rocking of the scales balance beam
      const beam = groupRef.current.getObjectByName('beam');
      if (beam) {
        beam.rotation.z = Math.sin(elapsed * 1.5) * 0.08;
      }
      // Keep plates hanging straight down
      const plateL = groupRef.current.getObjectByName('plateL');
      const plateR = groupRef.current.getObjectByName('plateR');
      if (plateL && plateR) {
        plateL.rotation.z = -Math.sin(elapsed * 1.5) * 0.08;
        plateR.rotation.z = -Math.sin(elapsed * 1.5) * 0.08;
      }
    }
  });

  return (
    <group ref={groupRef} position={[0, -1, 0]}>
      {/* Base / Pedestal */}
      <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.2, 1.4, 0.25, 32]} />
        <meshStandardMaterial color="#c5a880" roughness={0.3} metalness={0.8} />
      </mesh>
      <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.8, 1.0, 0.3, 32]} />
        <meshStandardMaterial color="#c5a880" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Main Pillar */}
      <mesh position={[0, 2.2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.15, 0.22, 3.4, 16]} />
        <meshStandardMaterial color="#c5a880" roughness={0.3} metalness={0.8} />
      </mesh>
      
      {/* Pillar Cap / Crown */}
      <mesh position={[0, 3.95, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#d4af37" roughness={0.2} metalness={0.9} />
      </mesh>

      {/* Balance Beam (Moving parts) */}
      <group name="beam" position={[0, 3.6, 0]}>
        {/* Beam center connector */}
        <mesh castShadow>
          <boxGeometry args={[0.4, 0.4, 0.4]} />
          <meshStandardMaterial color="#d4af37" roughness={0.2} metalness={0.9} />
        </mesh>
        {/* Central horizontal beam */}
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[4.2, 0.12, 0.12]} />
          <meshStandardMaterial color="#c5a880" roughness={0.3} metalness={0.8} />
        </mesh>
        
        {/* Left Side Plate hanging */}
        <group name="plateL" position={[-2.0, -0.2, 0]}>
          {/* Chain strings (represented as cylinder) */}
          <mesh position={[0, -0.6, 0]}>
            <cylinderGeometry args={[0.02, 0.4, 1.2, 4, 1, true]} />
            <meshStandardMaterial color="#b3925d" wireframe opacity={0.6} transparent />
          </mesh>
          {/* Dish plate */}
          <mesh position={[0, -1.2, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.65, 0.55, 0.06, 32]} />
            <meshStandardMaterial color="#d4af37" roughness={0.2} metalness={0.9} />
          </mesh>
        </group>

        {/* Right Side Plate hanging */}
        <group name="plateR" position={[2.0, -0.2, 0]}>
          {/* Chain strings */}
          <mesh position={[0, -0.6, 0]}>
            <cylinderGeometry args={[0.02, 0.4, 1.2, 4, 1, true]} />
            <meshStandardMaterial color="#b3925d" wireframe opacity={0.6} transparent />
          </mesh>
          {/* Dish plate */}
          <mesh position={[0, -1.2, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.65, 0.55, 0.06, 32]} />
            <meshStandardMaterial color="#d4af37" roughness={0.2} metalness={0.9} />
          </mesh>
        </group>
      </group>

      {/* Decorative details */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <torusGeometry args={[0.4, 0.08, 8, 24]} />
        <meshStandardMaterial color="#d4af37" roughness={0.2} metalness={0.9} />
      </mesh>
    </group>
  );
}

export default function ThreeCanvas() {
  const [webGlSupported, setWebGlSupported] = React.useState(true);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const support = !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
      setWebGlSupported(support);
    } catch {
      setWebGlSupported(false);
    }
  }, []);

  if (!webGlSupported) {
    // Beautiful HTML/CSS Fallback in case WebGL is disabled or crashes
    return (
      <div className="w-full h-full flex items-center justify-center relative select-none">
        <div className="absolute w-72 h-72 rounded-full bg-primary/10 blur-3xl animate-pulse" />
        <div className="w-48 h-48 rounded-full border-4 border-dashed border-primary/30 flex items-center justify-center animate-spin" style={{ animationDuration: '30s' }}>
          <div className="w-40 h-40 rounded-full border border-dashed border-accent/20 flex items-center justify-center">
            <span className="text-6xl text-primary drop-shadow-md">⚖️</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full select-none cursor-grab active:cursor-grabbing">
      <Canvas shadows={{ type: THREE.PCFShadowMap }}>
        <PerspectiveCamera makeDefault position={[0, 2, 7]} fov={45} />
        
        {/* Lights */}
        <ambientLight intensity={0.5} />
        <directionalLight 
          position={[5, 10, 5]} 
          intensity={1.2} 
          castShadow 
          shadow-mapSize-width={1024} 
          shadow-mapSize-height={1024} 
        />
        <pointLight position={[-5, 5, -5]} intensity={0.6} color="#6366f1" />
        <pointLight position={[5, 3, 5]} intensity={0.8} color="#d4af37" />

        {/* Dynamic 3D Model */}
        <JusticeScale />

        {/* Camera Control */}
        <OrbitControls 
          enableZoom={false} 
          minPolarAngle={Math.PI / 3} 
          maxPolarAngle={Math.PI / 1.8} 
        />
      </Canvas>
    </div>
  );
}
