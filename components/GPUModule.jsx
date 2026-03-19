"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

const SM_LOCAL_LAYOUT = [
  [-2.9, 1.2, -1.6],
  [0, 1.2, -1.6],
  [2.9, 1.2, -1.6],
  [-2.9, 1.2, 1.3],
  [0, 1.2, 1.3],
  [2.9, 1.2, 1.3]
];

export { SM_LOCAL_LAYOUT };

function CoreCell({ position }) {
  return (
    <mesh castShadow receiveShadow position={position}>
      <boxGeometry args={[0.22, 0.1, 0.22]} />
      <meshStandardMaterial color="#95b8ff" emissive="#1c3e70" emissiveIntensity={0.65} />
    </mesh>
  );
}

function Fan({ position, speed = 1 }) {
  const bladesRef = useRef(null);

  useFrame((_, delta) => {
    if (!bladesRef.current) return;
    bladesRef.current.rotation.y += delta * (4.5 + speed * 2.4);
  });

  return (
    <group position={position}>
      <mesh castShadow receiveShadow rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.14, 1.14, 0.3, 36]} />
        <meshStandardMaterial color="#111827" metalness={0.5} roughness={0.52} />
      </mesh>

      <group ref={bladesRef}>
        {[0, 1, 2, 3, 4, 5, 6].map((blade) => (
          <mesh
            key={`fan-blade-${blade}`}
            castShadow
            receiveShadow
            rotation={[0, (blade / 7) * Math.PI * 2, 0]}
            position={[0, 0.04, 0]}
          >
            <boxGeometry args={[0.22, 0.04, 1.02]} />
            <meshStandardMaterial color="#364152" metalness={0.72} roughness={0.32} />
          </mesh>
        ))}
      </group>

      <mesh castShadow receiveShadow rotation={[Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.35, 18]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.88} roughness={0.24} />
      </mesh>
    </group>
  );
}

export default function GPUModule({
  position = [2, 0, 0],
  highlightSM,
  tensorCoresEnabled,
  onSelect,
  registerSMRef,
  onHover
}) {
  const memoryModules = [
    [-3.3, 0.68, -2.6],
    [-1.1, 0.68, -2.6],
    [1.1, 0.68, -2.6],
    [3.3, 0.68, -2.6],
    [-3.3, 0.68, 2.6],
    [-1.1, 0.68, 2.6],
    [1.1, 0.68, 2.6],
    [3.3, 0.68, 2.6]
  ];

  const vrmBanks = [
    [-4.6, 0.42, -1.8],
    [-4.6, 0.42, -1.15],
    [-4.6, 0.42, -0.5],
    [-4.6, 0.42, 0.15],
    [-4.6, 0.42, 0.8],
    [-4.6, 0.42, 1.45]
  ];

  const pciePins = [];
  for (let idx = 0; idx < 17; idx += 1) {
    pciePins.push(-2.7 + idx * 0.34);
  }

  const tensorTilePositions = [
    [-0.9, 0.79, -0.58],
    [-0.3, 0.79, -0.58],
    [0.3, 0.79, -0.58],
    [0.9, 0.79, -0.58],
    [-0.9, 0.79, 0.58],
    [-0.3, 0.79, 0.58],
    [0.3, 0.79, 0.58],
    [0.9, 0.79, 0.58]
  ];

  return (
    <group position={position}>
      <mesh
        castShadow
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          onSelect("gpuArchitecture");
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          if (onHover) onHover("GPU Chip: contains multiple SMs for high-throughput parallel execution");
        }}
        onPointerOut={() => {
          if (onHover) onHover("");
        }}
      >
        <boxGeometry args={[13.6, 0.22, 9.8]} />
        <meshStandardMaterial color="#255048" metalness={0.24} roughness={0.72} />
      </mesh>

      <mesh castShadow receiveShadow position={[0, 0.14, 4.8]}>
        <boxGeometry args={[7.8, 0.12, 0.55]} />
        <meshStandardMaterial color="#2d3445" metalness={0.45} roughness={0.5} />
      </mesh>

      {pciePins.map((x, idx) => (
        <mesh key={`pcie-pin-${idx}`} castShadow receiveShadow position={[x, -0.06, 4.98]}>
          <boxGeometry args={[0.18, 0.08, 0.28]} />
          <meshStandardMaterial color="#c7a24e" metalness={0.94} roughness={0.16} />
        </mesh>
      ))}

      <mesh castShadow receiveShadow position={[0.25, 0.92, 0]}>
        <boxGeometry args={[11.8, 0.9, 7.5]} />
        <meshStandardMaterial color="#677286" metalness={0.78} roughness={0.28} />
      </mesh>

      <mesh castShadow receiveShadow position={[0.25, 1.16, 0]}>
        <boxGeometry args={[12.2, 0.2, 7.92]} />
        <meshStandardMaterial color="#313d50" metalness={0.42} roughness={0.4} />
      </mesh>

      <Fan position={[-2.6, 1.28, 0]} speed={highlightSM ? 1.5 : 1} />
      <Fan position={[2.85, 1.28, 0]} speed={highlightSM ? 1.5 : 1} />

      <mesh castShadow receiveShadow position={[0, 0.34, 0]}>
        <boxGeometry args={[4.9, 0.18, 4.3]} />
        <meshStandardMaterial color="#243244" metalness={0.22} roughness={0.72} />
      </mesh>

      <mesh castShadow receiveShadow position={[0, 0.48, 0]}>
        <boxGeometry args={[3.3, 0.24, 2.7]} />
        <meshStandardMaterial color="#d3dae3" metalness={0.88} roughness={0.14} />
      </mesh>

      <mesh castShadow receiveShadow position={[0, 0.66, 0]}>
        <boxGeometry args={[2.1, 0.1, 1.8]} />
        <meshStandardMaterial color="#6de5ff" emissive="#117ca1" emissiveIntensity={0.38} metalness={0.28} roughness={0.24} />
      </mesh>

      {tensorTilePositions.map((tilePos, idx) => (
        <mesh
          key={`tensor-tile-${idx}`}
          castShadow
          receiveShadow
          position={tilePos}
          onClick={(e) => {
            e.stopPropagation();
            onSelect("tensorCores");
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            if (onHover) onHover("Tensor Cores: matrix acceleration units for AI and dense linear algebra");
          }}
          onPointerOut={() => {
            if (onHover) onHover("");
          }}
        >
          <boxGeometry args={[0.24, 0.07, 0.24]} />
          <meshStandardMaterial
            color={tensorCoresEnabled ? "#f5b4ff" : "#5f5f78"}
            emissive={tensorCoresEnabled ? "#d43dff" : "#222537"}
            emissiveIntensity={tensorCoresEnabled ? 1.15 : 0.3}
            metalness={0.35}
            roughness={0.42}
          />
        </mesh>
      ))}

      {memoryModules.map((memoryPos, idx) => (
        <mesh key={`gpu-mem-${idx}`} castShadow receiveShadow position={memoryPos}>
          <boxGeometry args={[1.42, 0.24, 0.84]} />
          <meshStandardMaterial color="#273144" metalness={0.36} roughness={0.58} />
        </mesh>
      ))}

      {vrmBanks.map((vrmPos, idx) => (
        <mesh key={`gpu-vrm-${idx}`} castShadow receiveShadow position={vrmPos}>
          <boxGeometry args={[0.42, 0.18, 0.42]} />
          <meshStandardMaterial color="#364255" metalness={0.28} roughness={0.56} />
        </mesh>
      ))}

      {SM_LOCAL_LAYOUT.map((pos, smIdx) => (
        <mesh
          key={`sm-${smIdx}`}
          castShadow
          receiveShadow
          position={pos}
          ref={(mesh) => registerSMRef(smIdx, mesh)}
          onClick={(e) => {
            e.stopPropagation();
            onSelect("streamingMultiprocessor");
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            if (onHover) onHover(`SM ${smIdx + 1}: executes assigned thread blocks in parallel`);
          }}
          onPointerOut={() => {
            if (onHover) onHover("");
          }}
        >
          <boxGeometry args={[2.05, 0.38, 1.7]} />
          <meshStandardMaterial
            color={highlightSM ? "#74b1ff" : "#3c7bff"}
            emissive={highlightSM ? "#2f8fff" : "#0f2556"}
            emissiveIntensity={highlightSM ? 1.35 : 0.9}
            metalness={0.2}
            roughness={0.52}
          />

          <group position={[0, 0.26, 0]}>
            {[0, 1, 2, 3, 4, 5].map((core) => (
              <CoreCell
                key={`core-${smIdx}-${core}`}
                position={[
                  -0.5 + (core % 3) * 0.5,
                  0,
                  -0.25 + Math.floor(core / 3) * 0.5
                ]}
              />
            ))}
          </group>

          <mesh
            castShadow
            receiveShadow
            position={[0, 0.3, 0]}
            onClick={(e) => {
              e.stopPropagation();
              onSelect("threadBlocks");
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              if (onHover) onHover("Thread Block: a group of threads scheduled together onto an SM");
            }}
            onPointerOut={() => {
              if (onHover) onHover("");
            }}
          >
            <boxGeometry args={[1.12, 0.1, 0.75]} />
            <meshStandardMaterial color="#18362f" emissive="#114839" emissiveIntensity={0.7} />
          </mesh>
        </mesh>
      ))}
    </group>
  );
}
