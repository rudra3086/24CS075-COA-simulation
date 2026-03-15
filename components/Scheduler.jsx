"use client";

import { useMemo } from "react";
import * as THREE from "three";

function ArrowLink({ start, end, color = "#ff4d5f", opacity = 0.75 }) {
  const { midpoint, direction, length, quaternion } = useMemo(() => {
    const a = new THREE.Vector3(...start);
    const b = new THREE.Vector3(...end);
    const delta = b.clone().sub(a);
    const directionVec = delta.clone().normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const q = new THREE.Quaternion().setFromUnitVectors(up, directionVec);
    return {
      midpoint: a.clone().add(b).multiplyScalar(0.5),
      direction: directionVec,
      length: delta.length(),
      quaternion: q
    };
  }, [start, end]);

  const headPos = [
    end[0] - direction.x * 0.3,
    end[1] - direction.y * 0.3,
    end[2] - direction.z * 0.3
  ];

  return (
    <>
      <mesh position={midpoint.toArray()} quaternion={quaternion}>
        <cylinderGeometry args={[0.04, 0.04, Math.max(0.05, length - 0.32), 8]} />
        <meshStandardMaterial color={color} transparent opacity={opacity} emissive={color} emissiveIntensity={0.35} />
      </mesh>
      <mesh position={headPos} quaternion={quaternion}>
        <coneGeometry args={[0.11, 0.28, 10]} />
        <meshStandardMaterial color={color} transparent opacity={opacity} emissive={color} emissiveIntensity={0.4} />
      </mesh>
    </>
  );
}

export default function Scheduler({
  schedulerPosition,
  cpuToGpuStart,
  cpuToGpuEnd,
  smTargets,
  showScheduling,
  onSelect,
  onHover
}) {
  return (
    <group>
      <mesh
        position={schedulerPosition}
        onClick={(e) => {
          e.stopPropagation();
          onSelect("threadScheduling");
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          if (onHover) onHover("Scheduler: dispatches thread blocks to available SMs");
        }}
        onPointerOut={() => {
          if (onHover) onHover("");
        }}
      >
        <boxGeometry args={[2.6, 0.72, 1.3]} />
        <meshStandardMaterial color="#8c1f2b" emissive="#3f0a12" emissiveIntensity={0.85} metalness={0.3} roughness={0.45} />
      </mesh>

      <ArrowLink start={cpuToGpuStart} end={cpuToGpuEnd} color="#ff6767" opacity={0.75} />
      {smTargets.map((target, idx) => (
        <ArrowLink
          key={`arrow-${idx}`}
          start={schedulerPosition}
          end={[target[0], target[1] + 0.55, target[2]]}
          color={showScheduling ? "#ff9f50" : "#ff4d5f"}
          opacity={showScheduling ? 1 : 0.45}
        />
      ))}
    </group>
  );
}
