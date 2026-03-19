"use client";

import { Html, OrbitControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import DataFlowLines from "./DataFlowLines";
import MatrixAnimation from "./MatrixAnimation";
import TensorCoreUnit from "./TensorCoreUnit";
import WarpScheduler from "./WarpScheduler";

const TMP = new THREE.Object3D();

function SceneLabel({ position, children, tone = "default", distanceFactor = 14 }) {
  return (
    <Html position={position} center distanceFactor={distanceFactor} transform sprite occlude="blending">
      <span className={`world-label world-label--${tone}`}>{children}</span>
    </Html>
  );
}

function ActiveStagePulse({ stepIndex, phase }) {
  const pulse = 0.72 + 0.42 * Math.sin(phase * Math.PI * 2);

  const focus =
    stepIndex === 0
      ? { position: [-4.2, 0.52, 0], radius: 1.38, color: "#67e8f9" }
      : stepIndex === 1
      ? { position: [0, 2.46, 0], radius: 1.2, color: "#86efac" }
      : stepIndex === 2 || stepIndex === 3
      ? { position: [0, 1.12, 0], radius: 1.95, color: "#f9a8d4" }
      : { position: [4.3, 0.96, 0], radius: 1.15, color: "#fde68a" };

  return (
    <mesh position={focus.position} rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[focus.radius * 0.86, focus.radius, 64]} />
      <meshStandardMaterial
        color={focus.color}
        emissive={focus.color}
        emissiveIntensity={1.1 * pulse}
        transparent
        opacity={0.36 * pulse}
        depthWrite={false}
      />
    </mesh>
  );
}

function CudaCoreArray({ showLabels }) {
  const ref = useRef(null);

  const points = useMemo(() => {
    const list = [];
    for (let row = 0; row < 4; row += 1) {
      for (let col = 0; col < 8; col += 1) {
        list.push({
          x: -2.1 + col * 0.6,
          y: -0.95,
          z: -1 + row * 0.66
        });
      }
    }
    return list;
  }, []);

  useEffect(() => {
    if (!ref.current) return;
    points.forEach((p, idx) => {
      TMP.position.set(p.x, p.y, p.z);
      TMP.scale.setScalar(0.18);
      TMP.updateMatrix();
      ref.current.setMatrixAt(idx, TMP.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  }, [points]);

  return (
    <group>
      <mesh position={[0, -1.08, 0]}>
        <boxGeometry args={[5.2, 0.4, 3.2]} />
        <meshStandardMaterial color="#1f2937" metalness={0.3} roughness={0.6} emissive="#0f172a" emissiveIntensity={0.35} />
      </mesh>

      <instancedMesh ref={ref} args={[undefined, undefined, points.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#60a5fa" emissive="#0284c7" emissiveIntensity={0.35} metalness={0.2} roughness={0.5} />
      </instancedMesh>

      {showLabels ? (
        <SceneLabel position={[0, -0.25, 0]} tone="compute" distanceFactor={14}>
          CUDA Core Array
        </SceneLabel>
      ) : null}
    </group>
  );
}

function SharedMemory({ showLabels }) {
  return (
    <group position={[0, 2.35, 0]}>
      <mesh>
        <boxGeometry args={[2.6, 0.7, 1.2]} />
        <meshStandardMaterial color="#14532d" emissive="#16a34a" emissiveIntensity={0.45} metalness={0.2} roughness={0.4} />
      </mesh>
      {showLabels ? (
        <SceneLabel position={[0, 0.78, 0]} tone="memory" distanceFactor={13}>
          Shared Memory
        </SceneLabel>
      ) : null}
    </group>
  );
}

function GlobalMemoryBus({ showLabels, stepIndex, phase }) {
  const glow = stepIndex === 4 ? 1.15 + 0.4 * Math.sin(phase * Math.PI * 2) : 0.35;

  return (
    <group position={[4.3, 0.8, 0]}>
      <mesh>
        <boxGeometry args={[1.6, 2.8, 1.2]} />
        <meshStandardMaterial color="#3f3f46" emissive="#facc15" emissiveIntensity={glow} metalness={0.35} roughness={0.48} />
      </mesh>
      {showLabels ? (
        <SceneLabel position={[0, 1.9, 0]} tone="bus" distanceFactor={13}>
          Global Memory Bus
        </SceneLabel>
      ) : null}
    </group>
  );
}

export default function TensorCoreScene({ stepIndex, phase, speed, showLabels, playing, autoRotate = false }) {
  const orbitRef = useRef(null);

  useFrame((state) => {
    if (!playing || !autoRotate) return;

    if (stepIndex === 2 || stepIndex === 3) {
      const radius = 9.5;
      const theta = state.clock.elapsedTime * 0.18 * Math.max(0.6, speed);
      state.camera.position.x = Math.cos(theta) * radius;
      state.camera.position.z = Math.sin(theta) * radius;
      state.camera.position.y = 4.8 + Math.sin(theta * 0.5) * 0.35;
      state.camera.lookAt(0, 0.7, 0);
      if (orbitRef.current) {
        orbitRef.current.target.set(0, 0.7, 0);
        orbitRef.current.update();
      }
    }
  });

  return (
    <>
      <color attach="background" args={["#081a31"]} />
      <fog attach="fog" args={["#081a31", 9, 28]} />

      <ambientLight intensity={0.62} color="#dbeafe" />
      <hemisphereLight intensity={0.52} color="#bae6fd" groundColor="#020617" />
      <directionalLight position={[7, 8, 5]} intensity={1.35} color="#ffffff" />
      <pointLight position={[-2, 3, 3]} intensity={1.05} color="#67e8f9" />
      <pointLight position={[2, 2, -3]} intensity={0.92} color="#f9a8d4" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.35, 0]} receiveShadow>
        <planeGeometry args={[28, 28]} />
        <meshStandardMaterial color="#102845" roughness={0.9} metalness={0.08} />
      </mesh>

      <mesh position={[0, -1.24, 0]}>
        <boxGeometry args={[10.6, 0.25, 6.2]} />
        <meshStandardMaterial color="#10192c" metalness={0.34} roughness={0.62} />
      </mesh>

      <ActiveStagePulse stepIndex={stepIndex} phase={phase} />

      <WarpScheduler stepIndex={stepIndex} phase={phase} showLabels={showLabels} speed={speed} />
      <SharedMemory showLabels={showLabels} />
      <TensorCoreUnit stepIndex={stepIndex} showLabels={showLabels} speed={speed} />
      <CudaCoreArray showLabels={showLabels} />
      <GlobalMemoryBus showLabels={showLabels} stepIndex={stepIndex} phase={phase} />
      <DataFlowLines stepIndex={stepIndex} phase={phase} />
      <MatrixAnimation stepIndex={stepIndex} phase={phase} showLabels={showLabels} speed={speed} />

      <OrbitControls
        ref={orbitRef}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={7}
        maxDistance={16}
        minPolarAngle={0.45}
        maxPolarAngle={1.38}
        target={[0, 0.7, 0]}
      />
    </>
  );
}
