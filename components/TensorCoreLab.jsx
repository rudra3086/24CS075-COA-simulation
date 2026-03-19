"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

const STEPS = [
  {
    id: 0,
    title: "Step 1: Tile Fetch",
    detail: "Tensor Cores fetch matrix fragments from shared/register memory and align them into fixed-size MMA tiles."
  },
  {
    id: 1,
    title: "Step 2: Matrix Multiply",
    detail: "Tile A and Tile B are multiplied with matrix-multiply-accumulate pipelines in parallel across tensor arrays."
  },
  {
    id: 2,
    title: "Step 3: Accumulate",
    detail: "Partial products accumulate in C fragments using fused operations, minimizing memory traffic and latency."
  },
  {
    id: 3,
    title: "Step 4: Write Back",
    detail: "Output tile is committed back to memory and next matrix fragments are scheduled for the following tensor operation."
  }
];

function FlowLink({ start, end, color, intensity = 1, active = true }) {
  const { midpoint, quaternion, length } = useMemo(() => {
    const a = new THREE.Vector3(...start);
    const b = new THREE.Vector3(...end);
    const delta = b.clone().sub(a);
    const q = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      delta.clone().normalize()
    );
    return {
      midpoint: a.clone().add(b).multiplyScalar(0.5).toArray(),
      quaternion: q,
      length: delta.length()
    };
  }, [start, end]);

  return (
    <mesh position={midpoint} quaternion={quaternion}>
      <cylinderGeometry args={[0.05, 0.05, Math.max(0.2, length), 12]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={active ? 0.8 * intensity : 0.2}
        transparent
        opacity={active ? 0.8 : 0.25}
      />
    </mesh>
  );
}

function TensorPacket({ pathStart, pathEnd, t, color, visible }) {
  const pos = useMemo(() => {
    const a = new THREE.Vector3(...pathStart);
    const b = new THREE.Vector3(...pathEnd);
    return a.lerp(b, t).toArray();
  }, [pathStart, pathEnd, t]);

  if (!visible) return null;

  return (
    <mesh position={pos}>
      <sphereGeometry args={[0.09, 12, 12]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.4} />
    </mesh>
  );
}

function TensorLabScene({ stepIndex, simulationSpeed, tensorCoresEnabled, pulseTime }) {
  const tileARef = useRef(null);
  const tileBRef = useRef(null);
  const tensorShellRef = useRef(null);
  const tileCRef = useRef(null);
  const coreClusterRef = useRef(null);

  useFrame((_, delta) => {
    const rate = delta * Math.max(0.5, simulationSpeed);
    const wobble = Math.sin(pulseTime * 2.2) * 0.035;

    if (tileARef.current) {
      tileARef.current.rotation.y += rate * 0.26;
      const targetX = stepIndex >= 1 ? -0.8 : -2.8;
      tileARef.current.position.x += (targetX - tileARef.current.position.x) * 0.08;
      tileARef.current.position.y = 0.55 + wobble;
    }

    if (tileBRef.current) {
      tileBRef.current.rotation.y -= rate * 0.24;
      const targetX = stepIndex >= 1 ? 0.8 : 2.8;
      tileBRef.current.position.x += (targetX - tileBRef.current.position.x) * 0.08;
      tileBRef.current.position.y = 0.55 - wobble;
    }

    if (tensorShellRef.current) {
      const boost = tensorCoresEnabled ? 1.4 : 0.9;
      tensorShellRef.current.rotation.y += rate * 0.46 * boost;
      tensorShellRef.current.rotation.x = Math.sin(pulseTime * 0.7) * 0.06;
    }

    if (coreClusterRef.current) {
      coreClusterRef.current.rotation.y -= rate * 0.34;
    }

    if (tileCRef.current) {
      const targetX = stepIndex >= 3 ? 2.95 : 1.45;
      const targetScale = stepIndex >= 2 ? 1 : 0.4;
      tileCRef.current.position.x += (targetX - tileCRef.current.position.x) * 0.08;
      tileCRef.current.position.y = 0.55 + Math.sin(pulseTime * 1.5) * 0.02;
      tileCRef.current.scale.x += (targetScale - tileCRef.current.scale.x) * 0.08;
      tileCRef.current.scale.y += (targetScale - tileCRef.current.scale.y) * 0.08;
      tileCRef.current.scale.z += (targetScale - tileCRef.current.scale.z) * 0.08;
    }
  });

  const glowA = stepIndex <= 1 ? 1.15 : 0.5;
  const glowB = stepIndex <= 1 ? 1.15 : 0.5;
  const glowTensor = stepIndex >= 1 && stepIndex <= 2 ? (tensorCoresEnabled ? 1.8 : 0.9) : 0.45;
  const glowC = stepIndex >= 2 ? 1.3 : 0.28;
  const packetPhase = (pulseTime * Math.max(0.6, simulationSpeed)) % 1;

  return (
    <>
      <color attach="background" args={["#152b42"]} />
      <fog attach="fog" args={["#152b42", 10, 26]} />
      <ambientLight intensity={0.78} color="#cfe7ff" />
      <hemisphereLight intensity={0.55} color="#d8ecff" groundColor="#0d1f31" />
      <directionalLight position={[6, 9, 5]} intensity={1.65} color="#e7f3ff" />
      <pointLight position={[-3, 3, 1.5]} intensity={0.95} color="#78b8ff" />
      <pointLight position={[3.2, 3, 0.8]} intensity={1.05} color="#89ffd8" />

      <mesh position={[0, -1.6, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#13283e" roughness={0.9} metalness={0.08} />
      </mesh>

      <mesh position={[0, -1.25, 0]}>
        <boxGeometry args={[9, 0.3, 4.7]} />
        <meshStandardMaterial color="#1d334b" metalness={0.35} roughness={0.52} />
      </mesh>

      <FlowLink start={[-2.1, 0.55, 0]} end={[-0.7, 0.55, 0]} color="#5cb0ff" active={stepIndex >= 0 && stepIndex <= 1} />
      <FlowLink start={[2.1, 0.55, 0]} end={[0.7, 0.55, 0]} color="#72ffd0" active={stepIndex >= 0 && stepIndex <= 1} />
      <FlowLink start={[0.85, 0.52, 0]} end={[2.35, 0.55, 0]} color="#ffd16d" active={stepIndex >= 2} intensity={1.2} />

      <TensorPacket pathStart={[-2.1, 0.55, 0]} pathEnd={[-0.7, 0.55, 0]} t={packetPhase} color="#7ec3ff" visible={stepIndex <= 1} />
      <TensorPacket pathStart={[2.1, 0.55, 0]} pathEnd={[0.7, 0.55, 0]} t={packetPhase} color="#9affd8" visible={stepIndex <= 1} />
      <TensorPacket pathStart={[0.85, 0.52, 0]} pathEnd={[2.35, 0.55, 0]} t={packetPhase} color="#ffd977" visible={stepIndex >= 2} />

      <group ref={tileARef} position={[-2.8, 0.55, 0]}>
        <mesh castShadow>
          <boxGeometry args={[1.4, 1.4, 0.2]} />
          <meshStandardMaterial color="#55aef8" emissive="#1e6ebe" emissiveIntensity={glowA} />
        </mesh>
        <mesh position={[0, 0, 0.11]}>
          <planeGeometry args={[1.25, 1.25]} />
          <meshStandardMaterial color="#9fd4ff" metalness={0.18} roughness={0.35} />
        </mesh>
      </group>

      <group ref={tileBRef} position={[2.8, 0.55, 0]}>
        <mesh castShadow>
          <boxGeometry args={[1.4, 1.4, 0.2]} />
          <meshStandardMaterial color="#6dffc6" emissive="#208b66" emissiveIntensity={glowB} />
        </mesh>
        <mesh position={[0, 0, 0.11]}>
          <planeGeometry args={[1.25, 1.25]} />
          <meshStandardMaterial color="#baffdf" metalness={0.12} roughness={0.32} />
        </mesh>
      </group>

      <group ref={tensorShellRef} position={[0, 0.5, 0]}>
        <mesh castShadow>
          <boxGeometry args={[1.8, 1.1, 1.8]} />
          <meshStandardMaterial color="#4e3a74" emissive="#cf46ff" emissiveIntensity={glowTensor} metalness={0.3} roughness={0.36} />
        </mesh>

        <group ref={coreClusterRef}>
          {[-0.42, 0, 0.42].map((x) =>
            [-0.42, 0, 0.42].map((z) => (
              <mesh key={`core-${x}-${z}`} position={[x, 0.02, z]}>
                <boxGeometry args={[0.28, 0.22, 0.28]} />
                <meshStandardMaterial
                  color={tensorCoresEnabled ? "#f4b2ff" : "#7f6da5"}
                  emissive={tensorCoresEnabled ? "#ff4af0" : "#3f3160"}
                  emissiveIntensity={tensorCoresEnabled ? 1.1 : 0.35}
                />
              </mesh>
            ))
          )}
        </group>
      </group>

      <group ref={tileCRef} position={[1.45, 0.55, 0]} scale={[0.4, 0.4, 0.4]}>
        <mesh castShadow>
          <boxGeometry args={[1.4, 1.4, 0.2]} />
          <meshStandardMaterial color="#ffd16d" emissive="#d38b1b" emissiveIntensity={glowC} />
        </mesh>
        <mesh position={[0, 0, 0.11]}>
          <planeGeometry args={[1.25, 1.25]} />
          <meshStandardMaterial color="#ffe8a8" metalness={0.15} roughness={0.33} />
        </mesh>
      </group>

      <Html position={[-2.8, 1.72, 0]} center distanceFactor={12}>
        <span className="world-label">Input Tile A</span>
      </Html>
      <Html position={[2.8, 1.72, 0]} center distanceFactor={12}>
        <span className="world-label">Input Tile B</span>
      </Html>
      <Html position={[0, 1.72, 0]} center distanceFactor={12}>
        <span className="world-label">Tensor Core Array</span>
      </Html>
      <Html position={[2.95, 1.72, 0]} center distanceFactor={12}>
        <span className="world-label">Output Tile C</span>
      </Html>

      <OrbitControls enableDamping dampingFactor={0.08} minDistance={6} maxDistance={14} target={[0.25, 0.3, 0]} />
    </>
  );
}

export default function TensorCoreLab({ simulationSpeed, tensorCoresEnabled }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [pulseTime, setPulseTime] = useState(0);

  const currentStep = useMemo(() => STEPS[stepIndex], [stepIndex]);

  useEffect(() => {
    if (!autoPlay) return undefined;

    const interval = window.setInterval(() => {
      setStepIndex((v) => (v + 1) % STEPS.length);
    }, 2300);

    return () => {
      window.clearInterval(interval);
    };
  }, [autoPlay]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setPulseTime((v) => v + 0.03 * Math.max(0.7, simulationSpeed));
    }, 16);

    return () => {
      window.clearInterval(interval);
    };
  }, [simulationSpeed]);

  return (
    <div className="w-full min-w-0 overflow-hidden rounded-xl border border-cyan-500/40 bg-slate-800/60 shadow-panel">
      <div className="border-b border-slate-700/70 px-3 py-2 text-xs text-slate-200 md:px-4">
        <span className="font-semibold text-cyan-300">Tensor Core Lab</span>
        <span className="ml-2 text-slate-300">{currentStep.title}</span>
        <span className="ml-3 rounded-md border border-slate-600/70 px-2 py-0.5 text-[10px] uppercase tracking-wide text-emerald-300">
          {tensorCoresEnabled ? "Tensor Path Active" : "Tensor Path Idle"}
        </span>
      </div>

      <div className="h-[420px] w-full md:h-[470px]">
        <Canvas shadows camera={{ position: [0, 4.6, 9.6], fov: 48 }} gl={{ antialias: true }}>
          <TensorLabScene
            stepIndex={stepIndex}
            simulationSpeed={simulationSpeed}
            tensorCoresEnabled={tensorCoresEnabled}
            pulseTime={pulseTime}
          />
        </Canvas>
      </div>

      <div className="grid gap-3 border-t border-slate-700/70 p-3 md:grid-cols-[minmax(0,1fr)_220px] md:p-4">
        <div>
          <h3 className="text-sm font-semibold text-emerald-300">{currentStep.title}</h3>
          <p className="mt-1 text-xs leading-6 text-slate-200">{currentStep.detail}</p>

          <div className="mt-3 flex gap-2">
            <button
              className="control-btn"
              onClick={() => setStepIndex((v) => (v === 0 ? STEPS.length - 1 : v - 1))}
            >
              Previous Step
            </button>
            <button
              className="control-btn"
              onClick={() => setStepIndex((v) => (v === STEPS.length - 1 ? 0 : v + 1))}
            >
              Next Step
            </button>
            <button className="control-btn" onClick={() => setAutoPlay((v) => !v)}>
              Auto Play: {autoPlay ? "On" : "Off"}
            </button>
          </div>
        </div>

        <div className="rounded-md border border-slate-700/80 bg-slate-900/70 p-2.5 text-xs text-slate-300">
          {STEPS.map((step, idx) => (
            <button
              key={step.id}
              type="button"
              className={`block w-full rounded px-2 py-1 text-left ${idx === stepIndex ? "bg-slate-700/60 text-cyan-300" : "text-slate-300"}`}
              onClick={() => setStepIndex(idx)}
            >
              {idx + 1}. {step.title.replace("Step " + (idx + 1) + ": ", "")}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
