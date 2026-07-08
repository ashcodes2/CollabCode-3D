import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

// ── Neural-network style particle nodes ───────────────────────────────────────
function ParticleField({ count = 80 }) {
  const meshRef  = useRef(null);
  const linesRef = useRef(null);

  const { positions, linePositions } = useMemo(() => {
    // Scatter points in a sphere volume — Math.random() is safe inside useMemo
    // because the result is computed once per `count` change, not on every render.
    const pts = [];
    for (let i = 0; i < count; i++) {
      const r     = 12 + Math.random() * 8;           // eslint-disable-line react-hooks/purity
      const theta = Math.random() * Math.PI * 2;       // eslint-disable-line react-hooks/purity
      const phi   = Math.acos(2 * Math.random() - 1);  // eslint-disable-line react-hooks/purity
      pts.push(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi),
      );
    }

    // Connect nearby pairs as line segments
    const linePts = [];
    for (let i = 0; i < pts.length; i += 3) {
      for (let j = i + 3; j < pts.length; j += 3) {
        const dx = pts[i]   - pts[j];
        const dy = pts[i+1] - pts[j+1];
        const dz = pts[i+2] - pts[j+2];
        const d  = Math.sqrt(dx*dx + dy*dy + dz*dz);
        if (d < 6) {
          linePts.push(pts[i], pts[i+1], pts[i+2]);
          linePts.push(pts[j], pts[j+1], pts[j+2]);
        }
      }
    }

    return {
      positions:     new Float32Array(pts),
      linePositions: new Float32Array(linePts),
    };
  }, [count]);

  useFrame((_, delta) => {
    if (meshRef.current)  meshRef.current.rotation.y  += delta * 0.04;
    if (linesRef.current) linesRef.current.rotation.y += delta * 0.04;
  });

  return (
    <>
      {/* Nodes */}
      <points ref={meshRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.06}
          color="#8b5cf6"
          transparent opacity={0.7}
          sizeAttenuation
        />
      </points>

      {/* Connection lines */}
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          color="#3b82f6"
          transparent opacity={0.08}
        />
      </lineSegments>
    </>
  );
}

// ── Glowing torus ring ────────────────────────────────────────────────────────
function GlowRing({ radius = 6, tube = 0.03, color, speed = 0.15 }) {
  const ref = useRef(null);
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.x += delta * speed;
      ref.current.rotation.z += delta * speed * 0.7;
    }
  });
  return (
    <mesh ref={ref}>
      <torusGeometry args={[radius, tube, 8, 120]} />
      <meshBasicMaterial color={color} transparent opacity={0.25} />
    </mesh>
  );
}

// ── Floating code cube wireframes ─────────────────────────────────────────────
function WireframeCube({ position, size, color, speed }) {
  const ref = useRef(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime() * speed;
    ref.current.rotation.x = t * 0.4;
    ref.current.rotation.y = t * 0.6;
    ref.current.rotation.z = t * 0.2;
  });
  return (
    <Float speed={1.5} floatIntensity={0.8} rotationIntensity={0.3} position={position}>
      <mesh ref={ref}>
        <boxGeometry args={[size, size, size]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={0.35} />
      </mesh>
    </Float>
  );
}

// ── Camera follows mouse ──────────────────────────────────────────────────────
function CameraRig() {
  useFrame(({ camera, pointer }) => {
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, pointer.x * 1.5, 0.04);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, 4 + pointer.y * 1.5, 0.04);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

// ── Main SpaceBackground ──────────────────────────────────────────────────────
export default function SpaceBackground() {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      zIndex: -1,
      background: 'radial-gradient(ellipse at 20% 50%, #0a0520 0%, #020209 50%, #000510 100%)',
      pointerEvents: 'none',
    }}>
      <Canvas
        camera={{ position: [0, 4, 18], fov: 42 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: false }}
      >
        {/* ── Lighting ── */}
        <ambientLight intensity={0.3} />
        <pointLight position={[8, 8, 8]}   intensity={1.2} color="#3b82f6" />
        <pointLight position={[-8,-8,-8]}   intensity={0.8} color="#8b5cf6" />
        <pointLight position={[0, 0, 12]}   intensity={0.6} color="#06b6d4" />

        {/* ── Mouse parallax ── */}
        <CameraRig />

        {/* ── Star field ── */}
        <Stars radius={80} depth={60} count={3000} factor={3.5} saturation={0} fade speed={1} />

        {/* ── Neural particle network ── */}
        <ParticleField count={70} />

        {/* ── Sparkle accent ── */}
        <Sparkles count={120} scale={20} size={1.5} speed={0.3} opacity={0.35} color="#6366f1" />

        {/* ── Orbital rings ── */}
        <GlowRing radius={7}  tube={0.025} color="#3b82f6" speed={0.12} />
        <GlowRing radius={10} tube={0.018} color="#8b5cf6" speed={0.08} />
        <GlowRing radius={14} tube={0.012} color="#06b6d4" speed={0.05} />

        {/* ── Floating wireframe cubes ── */}
        <WireframeCube position={[-7,  2, -4]} size={1.2} color="#6366f1" speed={0.4} />
        <WireframeCube position={[ 7, -3, -6]} size={0.9} color="#06b6d4" speed={0.3} />
        <WireframeCube position={[-4, -4, -8]} size={1.5} color="#8b5cf6" speed={0.25} />
        <WireframeCube position={[ 5,  5, -3]} size={0.7} color="#f59e0b" speed={0.55} />

        {/* ── Central glowing core ── */}
        <Float speed={2} floatIntensity={0.5}>
          <mesh>
            <icosahedronGeometry args={[1.2, 1]} />
            <meshBasicMaterial color="#1d1b4b" wireframe transparent opacity={0.4} />
          </mesh>
          <mesh scale={1.08}>
            <icosahedronGeometry args={[1.2, 1]} />
            <meshBasicMaterial color="#6366f1" transparent opacity={0.08} />
          </mesh>
        </Float>
      </Canvas>
    </div>
  );
}
