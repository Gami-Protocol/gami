'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere } from '@react-three/drei';
import { useRef } from 'react';
import type { Mesh } from 'three';

function Orb() {
  const ref = useRef<Mesh>(null);
  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.25;
    ref.current.rotation.x += delta * 0.08;
  });

  return (
    <Float speed={1.4} rotationIntensity={0.4} floatIntensity={1.2}>
      <Sphere ref={ref} args={[1.25, 64, 64]} scale={1.35}>
        <MeshDistortMaterial
          color="#6C3BFF"
          attach="material"
          distort={0.35}
          speed={1.6}
          roughness={0.15}
          metalness={0.55}
        />
      </Sphere>
      <Sphere args={[1.7, 32, 32]}>
        <meshBasicMaterial color="#3B82F6" transparent opacity={0.08} wireframe />
      </Sphere>
    </Float>
  );
}

export function HeroScene() {
  return (
    <div className="absolute inset-0 -z-10 opacity-80">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={0.55} />
        <directionalLight position={[4, 3, 2]} intensity={1.4} color="#ffffff" />
        <pointLight position={[-3, -2, -2]} intensity={1.2} color="#3B82F6" />
        <Orb />
      </Canvas>
    </div>
  );
}
