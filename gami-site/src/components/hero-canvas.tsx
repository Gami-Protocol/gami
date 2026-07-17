'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Points, PointMaterial } from '@react-three/drei';
import { useMemo, useRef } from 'react';
import type { Points as ThreePoints } from 'three';
import * as THREE from 'three';

function NodeField() {
  const ref = useRef<ThreePoints>(null);
  const positions = useMemo(() => {
    const count = 900;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 14;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 8;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    return arr;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.04;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.05;
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#8A63FF"
        size={0.035}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

function GlowOrb({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <Float speed={1.4} rotationIntensity={0.2} floatIntensity={1.2}>
      <mesh position={position}>
        <sphereGeometry args={[0.55, 32, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.22} />
      </mesh>
    </Float>
  );
}

export function HeroCanvas() {
  return (
    <div className="absolute inset-0 opacity-80">
      <Canvas camera={{ position: [0, 0, 6], fov: 55 }} dpr={[1, 1.5]}>
        <ambientLight intensity={0.4} />
        <NodeField />
        <GlowOrb position={[-2.2, 0.8, -1]} color="#6C3BFF" />
        <GlowOrb position={[2.4, -0.6, -1.5]} color="#3FA9FF" />
      </Canvas>
    </div>
  );
}
