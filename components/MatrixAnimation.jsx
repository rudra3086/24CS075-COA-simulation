"use client";

import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

function MatrixGrid({ position, color, emissive, pulse, show }) {
  const cells = useMemo(() => {
    const list = [];
    for (let r = 0; r < 4; r += 1) {
      for (let c = 0; c < 4; c += 1) {
        list.push({
          x: (c - 1.5) * 0.21,
          y: (1.5 - r) * 0.21
        });
      }
    }
    return list;
  }, []);

  if (!show) return null;

  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[1.08, 1.08, 0.06]} />
        <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.35 + pulse * 0.45} metalness={0.2} roughness={0.45} />
      </mesh>
      {cells.map((cell, idx) => (
        <mesh key={`matrix-cell-${idx}`} position={[cell.x, cell.y, 0.045]}>
          <boxGeometry args={[0.16, 0.16, 0.03]} />
          <meshStandardMaterial color="#e2f8ff" emissive={emissive} emissiveIntensity={0.1 + pulse * 0.65} />
        </mesh>
      ))}
    </group>
  );
}

function FloatingOps({ visible, speed }) {
  const refs = useRef([]);
  const points = useMemo(
    () =>
      Array.from({ length: 24 }, (_, idx) => ({
        angle: (idx / 24) * Math.PI * 2,
        radius: 0.45 + (idx % 3) * 0.18,
        offset: idx * 0.2
      })),
    []
  );

  useFrame((state) => {
    if (!visible) return;

    refs.current.forEach((node, idx) => {
      if (!node) return;
      const point = points[idx];
      const t = state.clock.elapsedTime * Math.max(0.7, speed) + point.offset;
      node.position.set(Math.cos(point.angle + t) * point.radius, 0.6 + Math.sin(t * 1.8) * 0.24, Math.sin(point.angle + t) * point.radius);
      node.scale.setScalar(0.65 + 0.35 * Math.abs(Math.sin(t * 2.2)));
    });
  });

  if (!visible) return null;

  return (
    <group>
      {points.map((_, idx) => (
        <mesh key={`op-${idx}`} ref={(node) => { refs.current[idx] = node; }}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial color="#fef08a" emissive="#facc15" emissiveIntensity={1.35} />
        </mesh>
      ))}
    </group>
  );
}

export default function MatrixAnimation({ stepIndex, phase, showLabels, speed }) {
  const step2orLater = stepIndex >= 1;
  const step3orLater = stepIndex >= 2;

  const matrixAY = THREE.MathUtils.lerp(2.2, 0.86, step2orLater ? phase : 0);
  const matrixBY = THREE.MathUtils.lerp(2.2, 0.86, step2orLater ? phase : 0);
  const matrixAX = THREE.MathUtils.lerp(-0.35, -0.8, step2orLater ? phase : 0);
  const matrixBX = THREE.MathUtils.lerp(0.35, 0.8, step2orLater ? phase : 0);
  const writebackY = THREE.MathUtils.lerp(0.86, 2.2, stepIndex === 4 ? phase : 0);

  const pulse = step3orLater ? 0.6 + 0.4 * Math.sin(phase * Math.PI * 2) : 0.2;

  return (
    <group>
      <MatrixGrid position={[matrixAX, matrixAY, 0]} color="#22d3ee" emissive="#0891b2" pulse={pulse} show={stepIndex >= 1 && stepIndex <= 3} />
      <MatrixGrid position={[matrixBX, matrixBY, 0]} color="#34d399" emissive="#059669" pulse={pulse} show={stepIndex >= 1 && stepIndex <= 3} />
      <MatrixGrid position={[1.45, stepIndex === 4 ? writebackY : 0.86, 0]} color="#fbbf24" emissive="#d97706" pulse={pulse} show={stepIndex >= 2} />

      <FloatingOps visible={stepIndex === 2 || stepIndex === 3} speed={speed} />

      {showLabels && stepIndex >= 2 ? (
        <Html position={[0.18, 1.85, 0]} center distanceFactor={12}>
          <span className="world-label world-label--equation">MMA: C = A x B + C</span>
        </Html>
      ) : null}
    </group>
  );
}
