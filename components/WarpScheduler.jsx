"use client";

import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

const THREAD_COUNT = 32;
const TMP = new THREE.Object3D();

export default function WarpScheduler({ stepIndex, phase, showLabels, speed }) {
  const instancedRef = useRef(null);

  useFrame((state) => {
    if (!instancedRef.current) return;

    const t = stepIndex === 0 ? phase : stepIndex > 0 ? 1 : 0;

    for (let i = 0; i < THREAD_COUNT; i += 1) {
      const row = Math.floor(i / 8);
      const col = i % 8;

      const baseX = -4.9 + col * 0.16;
      const baseY = 0.05 + row * 0.15;
      const baseZ = (row % 2) * 0.12;

      const targetX = -1.45 + col * 0.015;
      const targetY = 0.28 + row * 0.018;
      const targetZ = -0.18 + (i % 4) * 0.12;

      const wobble = Math.sin(state.clock.elapsedTime * 2.2 + i * 0.45) * 0.03;

      TMP.position.set(
        THREE.MathUtils.lerp(baseX, targetX, t),
        THREE.MathUtils.lerp(baseY, targetY, t) + wobble,
        THREE.MathUtils.lerp(baseZ, targetZ, t)
      );
      TMP.scale.setScalar(0.06 + 0.012 * Math.sin(state.clock.elapsedTime * Math.max(0.9, speed) + i));
      TMP.updateMatrix();
      instancedRef.current.setMatrixAt(i, TMP.matrix);
    }

    instancedRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group position={[-4.2, 0.4, 0]}>
      <mesh castShadow>
        <boxGeometry args={[2, 1.1, 1.4]} />
        <meshStandardMaterial color="#133454" metalness={0.35} roughness={0.45} emissive="#0e7490" emissiveIntensity={0.35} />
      </mesh>

      <instancedMesh ref={instancedRef} args={[undefined, undefined, THREAD_COUNT]}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshStandardMaterial color="#7dd3fc" emissive="#67e8f9" emissiveIntensity={1.1} />
      </instancedMesh>

      {showLabels ? (
        <Html position={[0, 1.05, 0]} center distanceFactor={13}>
          <span className="world-label world-label--scheduler">Warp Scheduler (32-thread warp)</span>
        </Html>
      ) : null}
    </group>
  );
}
