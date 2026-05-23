import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Stars, Sparkles, PerspectiveCamera, Environment } from '@react-three/drei';
import * as THREE from 'three';

const AnimatedShape = ({ position, color, shape }) => {
  const meshRef = useRef();

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.2;
      meshRef.current.rotation.y += delta * 0.3;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={1.5} floatIntensity={2} position={position}>
      <mesh ref={meshRef}>
        {shape === 'box' && <boxGeometry args={[1, 1, 1]} />}
        {shape === 'octahedron' && <octahedronGeometry args={[1.2, 0]} />}
        {shape === 'torus' && <torusGeometry args={[0.8, 0.3, 16, 100]} />}
        <meshStandardMaterial 
          color={color} 
          wireframe={true} 
          emissive={color} 
          emissiveIntensity={0.5} 
          transparent={true} 
          opacity={0.7} 
        />
      </mesh>
    </Float>
  );
};

const ThreeBackground = () => {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1, background: '#0a0a0f' }}>
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={50} />
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#6366f1" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ec4899" />
        
        {/* Environment and particles */}
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <Sparkles count={200} scale={12} size={2} speed={0.4} opacity={0.4} color="#8b5cf6" />
        
        {/* Floating Abstract Shapes */}
        <AnimatedShape position={[-5, 2, -5]} color="#6366f1" shape="torus" />
        <AnimatedShape position={[6, -3, -8]} color="#ec4899" shape="octahedron" />
        <AnimatedShape position={[-4, -4, -6]} color="#14b8a6" shape="box" />
        <AnimatedShape position={[4, 4, -4]} color="#f59e0b" shape="torus" />
        
        <Environment preset="city" />
      </Canvas>
    </div>
  );
};

export default ThreeBackground;
