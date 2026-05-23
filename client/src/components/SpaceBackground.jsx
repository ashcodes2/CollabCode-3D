import React, { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float, useTexture } from '@react-three/drei';
import * as THREE from 'three';

function RealisticEarth() {
  const earthRef = useRef(null);
  
  // Load high-res texture from unpkg (CORS-friendly)
  const colorMap = useTexture('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg');

  useFrame((state, delta) => {
    if (earthRef.current) {
      earthRef.current.rotation.y += delta * 0.05; // Slow, realistic rotation
    }
  });

  return (
    <group ref={earthRef}>
      {/* High-res Textured Earth */}
      <mesh>
        <sphereGeometry args={[2.8, 64, 64]} />
        <meshStandardMaterial 
          map={colorMap}
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>
      {/* Atmospheric Glow */}
      <mesh scale={1.015}>
        <sphereGeometry args={[2.8, 64, 64]} />
        <meshBasicMaterial 
          color="#3b82f6" 
          transparent={true} 
          opacity={0.15} 
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

function OrbitingPlanet({ radius, speed, size, color, offset }) {
  const groupRef = useRef(null);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime() * speed + offset;
    
    // Orbit logic
    groupRef.current.position.x = Math.cos(t) * radius;
    groupRef.current.position.z = Math.sin(t) * radius;
    
    // Antigravity vertical bobbing
    groupRef.current.position.y = Math.sin(t * 2) * 0.6;
    
    // Self rotation
    groupRef.current.rotation.y += delta;
  });

  return (
    <group ref={groupRef}>
      <Float speed={2} rotationIntensity={2} floatIntensity={1}>
        <mesh>
          <sphereGeometry args={[size, 32, 32]} />
          <meshStandardMaterial 
            color={color} 
            emissive={color}
            emissiveIntensity={0.6}
            roughness={0.3} 
          />
        </mesh>
      </Float>
    </group>
  );
}

function FloatingStars() {
  const starsRef = useRef(null);

  useFrame((state, delta) => {
    if (starsRef.current) {
      starsRef.current.rotation.y -= delta * 0.02;
      starsRef.current.rotation.x -= delta * 0.01;
    }
  });

  return (
    <group ref={starsRef}>
      <Stars radius={100} depth={50} count={4000} factor={4} saturation={0} fade speed={1.5} />
    </group>
  );
}

function CameraRig() {
  useFrame((state) => {
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, state.pointer.x * 2, 0.05);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, 6 + state.pointer.y * 2, 0.05);
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function SpaceBackground() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: -1,
      background: 'linear-gradient(135deg, #020617, #09090b, #0f172a)', // Deep space gradient
      pointerEvents: 'none' // Ensures mouse clicks pass through to the IDE
    }}>
      <Canvas camera={{ position: [0, 6, 16], fov: 45 }} dpr={[1, 2]}>
        {/* Cinematic Lighting */}
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#ffffff" />
        <directionalLight position={[-10, -10, -5]} intensity={2} color="#6366f1" />
        <pointLight position={[0, -10, 5]} intensity={1} color="#ec4899" />
        
        {/* Mouse Tracking Parallax */}
        <CameraRig />
        
        {/* Environment */}
        <FloatingStars />
        
        {/* Central Planet (Now Photorealistic) */}
        <Suspense fallback={null}>
          <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.8}>
            <RealisticEarth />
          </Float>
        </Suspense>

        {/* Orbiting Planets */}
        <OrbitingPlanet radius={5} speed={0.4} size={0.35} color="#ec4899" offset={0} />
        <OrbitingPlanet radius={8} speed={0.25} size={0.5} color="#10b981" offset={Math.PI} />
        <OrbitingPlanet radius={11} speed={0.15} size={0.4} color="#f59e0b" offset={Math.PI / 2} />
      </Canvas>
    </div>
  );
}
