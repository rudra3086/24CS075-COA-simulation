"use client";

import { useMemo } from "react";
import * as THREE from "three";

function FlowTube({ start, end, active, color, intensity }) {
  const data = useMemo(() => {
    const a = new THREE.Vector3(...start);
    const b = new THREE.Vector3(...end);
    const dir = b.clone().sub(a);
    const len = dir.length();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    const mid = a.clone().add(b).multiplyScalar(0.5);
    return { len, q, mid };
  }, [start, end]);

  return (
    <mesh position={data.mid.toArray()} quaternion={data.q}>
      <cylinderGeometry args={[0.035, 0.035, Math.max(0.25, data.len), 12]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={active ? intensity : 0.15}
        transparent
        opacity={active ? 0.92 : 0.2}
      />
    </mesh>
  );
}

function Packet({ start, end, t, visible, color }) {
  const pos = useMemo(() => {
    const a = new THREE.Vector3(...start);
    const b = new THREE.Vector3(...end);
    return a.lerp(b, t).toArray();
  }, [start, end, t]);

  if (!visible) return null;

  return (
    <mesh position={pos}>
      <sphereGeometry args={[0.07, 10, 10]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.25} />
    </mesh>
  );
}

export default function DataFlowLines({ stepIndex, phase }) {
  const schedulerToTensor = stepIndex === 0;
  const sharedToTensor = stepIndex === 1;
  const mmaActive = stepIndex === 2 || stepIndex === 3;
  const writeback = stepIndex === 4;

  return (
    <group>
      <FlowTube start={[-3.2, 0.7, 0]} end={[-1.25, 0.75, 0]} active={schedulerToTensor} color="#7dd3fc" intensity={1.2} />
      <FlowTube start={[0, 2.3, 0]} end={[-0.65, 1.15, 0]} active={sharedToTensor} color="#86efac" intensity={1.2} />
      <FlowTube start={[0, 2.3, 0]} end={[0.65, 1.15, 0]} active={sharedToTensor} color="#34d399" intensity={1.2} />
      <FlowTube start={[-0.25, 0.86, 0]} end={[1.4, 0.86, 0]} active={mmaActive} color="#fbbf24" intensity={1.35} />
      <FlowTube start={[1.45, 0.86, 0]} end={[0.25, 2.2, 0]} active={writeback} color="#fcd34d" intensity={1.45} />
      <FlowTube start={[1.45, 0.86, 0]} end={[4.2, 0.8, 0]} active={writeback} color="#fef08a" intensity={1.1} />

      <Packet start={[-3.2, 0.7, 0]} end={[-1.25, 0.75, 0]} t={phase} visible={schedulerToTensor} color="#bae6fd" />
      <Packet start={[0, 2.3, 0]} end={[-0.65, 1.15, 0]} t={phase} visible={sharedToTensor} color="#bbf7d0" />
      <Packet start={[0, 2.3, 0]} end={[0.65, 1.15, 0]} t={phase} visible={sharedToTensor} color="#a7f3d0" />
      <Packet start={[-0.25, 0.86, 0]} end={[1.4, 0.86, 0]} t={phase} visible={mmaActive} color="#fde68a" />
      <Packet start={[1.45, 0.86, 0]} end={[0.25, 2.2, 0]} t={phase} visible={writeback} color="#fef3c7" />
    </group>
  );
}
