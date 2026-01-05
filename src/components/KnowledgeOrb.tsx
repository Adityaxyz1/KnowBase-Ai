import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

interface OrbMeshProps {
  isActive: boolean;
  isThinking: boolean;
}

function OrbMesh({ isActive, isThinking }: OrbMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const baseColor = useMemo(() => new THREE.Color('#00d4ff'), []);
  const activeColor = useMemo(() => new THREE.Color('#00ff88'), []);
  const thinkingColor = useMemo(() => new THREE.Color('#ff6b00'), []);

  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.getElapsedTime();
      
      // Gentle floating animation
      meshRef.current.position.y = Math.sin(time * 0.5) * 0.1;
      
      // Rotation
      meshRef.current.rotation.y = time * 0.2;
      meshRef.current.rotation.x = Math.sin(time * 0.3) * 0.1;
      
      // Scale pulse when thinking
      if (isThinking) {
        const pulse = 1 + Math.sin(time * 4) * 0.05;
        meshRef.current.scale.setScalar(pulse);
      } else {
        meshRef.current.scale.setScalar(1);
      }
    }
  });

  const targetColor = isThinking ? thinkingColor : isActive ? activeColor : baseColor;

  return (
    <Sphere ref={meshRef} args={[1, 64, 64]}>
      <MeshDistortMaterial
        color={targetColor}
        envMapIntensity={0.4}
        clearcoat={1}
        clearcoatRoughness={0}
        metalness={0.1}
        roughness={0.3}
        distort={isThinking ? 0.4 : 0.2}
        speed={isThinking ? 4 : 2}
        transparent
        opacity={0.9}
      />
    </Sphere>
  );
}

function ParticleRing() {
  const pointsRef = useRef<THREE.Points>(null);
  
  const particleCount = 50;
  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = 1.5;
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 0.2;
      pos[i * 3 + 2] = Math.sin(angle) * radius;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.getElapsedTime() * 0.1;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#00d4ff"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

interface KnowledgeOrbProps {
  isActive?: boolean;
  isThinking?: boolean;
  className?: string;
}

export function KnowledgeOrb({ 
  isActive = false, 
  isThinking = false,
  className = ""
}: KnowledgeOrbProps) {
  return (
    <div className={`three-canvas ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 4], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} color="#00d4ff" />
        <OrbMesh isActive={isActive} isThinking={isThinking} />
        <ParticleRing />
      </Canvas>
    </div>
  );
}
