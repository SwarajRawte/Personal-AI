import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Float, Sphere, MeshDistortMaterial } from '@react-three/drei';

const NeuralBackground = () => {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden bg-black">
      <Canvas 
          camera={{ position: [0, 0, 5], fov: 75 }} 
          dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.3} />
          <pointLight position={[10, 10, 10]} intensity={0.5} />
          
          <Float speed={1} rotationIntensity={0.2} floatIntensity={0.5}>
            <Sphere args={[1, 64, 64]} scale={1.5}>
              <MeshDistortMaterial
                color="#ca98ff"
                speed={1.5}
                distort={0.25}
                radius={1}
                emissive="#ca98ff"
                emissiveIntensity={0.15}
                roughness={0.4}
                metalness={0.6}
                transparent
                opacity={0.6}
              />
            </Sphere>
          </Float>

          {/* Background Glow */}
          <Sphere args={[5, 32, 32]} scale={10}>
            <meshBasicMaterial color="#360055" side={1} transparent opacity={0.04} />
          </Sphere>
        </Suspense>
      </Canvas>
      {/* Soft overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black pointer-events-none" />
    </div>
  );
};

export default NeuralBackground;
