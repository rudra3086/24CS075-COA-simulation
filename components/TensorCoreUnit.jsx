"use client";

import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

const TMP_OBJ = new THREE.Object3D();

export default function TensorCoreUnit({ stepIndex, showLabels, speed }) {
  const coreRef = useRef(null);
  const ringRef = useRef(null);

  const layouts = useMemo(
    () => [
      [
        [-0.45, 0, -0.45],
        [0.45, 0, -0.45],
        [-0.45, 0, 0.45],
        [0.45, 0, 0.45]
      ],
      [
        [-1, 0, -1],
        [0, 0, -1],
        [1, 0, -1],
        [-1, 0, 0],
        [0, 0, 0],
        [1, 0, 0],
        [-1, 0, 1],
        [0, 0, 1],
        [1, 0, 1]
      ]
    ],
    []
  );

  const isParallelStep = stepIndex >= 3;
  const activeLayout = isParallelStep ? layouts[1] : layouts[0];

  useEffect(() => {
    if (!coreRef.current) return;

    activeLayout.forEach((pos, index) => {
      TMP_OBJ.position.set(pos[0], pos[1], pos[2]);
      TMP_OBJ.scale.setScalar(isParallelStep ? 0.3 : 0.42);
      TMP_OBJ.updateMatrix();
      coreRef.current.setMatrixAt(index, TMP_OBJ.matrix);
    });

    for (let i = activeLayout.length; i < 9; i += 1) {
      TMP_OBJ.position.set(1000, 1000, 1000);
      TMP_OBJ.scale.setScalar(0);
      TMP_OBJ.updateMatrix();
      coreRef.current.setMatrixAt(i, TMP_OBJ.matrix);
    }

    coreRef.current.instanceMatrix.needsUpdate = true;
  }, [activeLayout, isParallelStep]);

  useFrame((state, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.y += delta * 0.45 * Math.max(0.6, speed);
      ringRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.6) * 0.16;
    }
  });

  const glow = stepIndex >= 2 ? 1.6 : stepIndex >= 1 ? 1.1 : 0.45;

  return (
    <group position={[0, 0.5, 0]}>
      <mesh castShadow>
        <boxGeometry args={[3.4, 1.2, 3.4]} />
        <meshStandardMaterial color="#2f1f4b" metalness={0.5} roughness={0.35} emissive="#b34dff" emissiveIntensity={0.35} />
      </mesh>

      <group ref={ringRef}>
        <mesh position={[0, 0.7, 0]}>
          <torusGeometry args={[1.45, 0.04, 16, 80]} />
          <meshStandardMaterial color="#7dd3fc" emissive="#22d3ee" emissiveIntensity={0.8} />
        </mesh>
        <mesh position={[0, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.2, 0.03, 16, 80]} />
          <meshStandardMaterial color="#c084fc" emissive="#d946ef" emissiveIntensity={0.75} />
        </mesh>
      </group>

      <instancedMesh ref={coreRef} args={[undefined, undefined, 9]} position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.26, 6]} />
        <meshStandardMaterial
          color="#f5d0fe"
          emissive="#f0abfc"
          emissiveIntensity={glow}
          metalness={0.4}
          roughness={0.22}
        />
      </instancedMesh>

      {showLabels ? (
        <Html position={[0, 1.7, 0]} center distanceFactor={13}>
          <span className="world-label world-label--tensor">Tensor Core Units</span>
        </Html>
      ) : null}
    </group>
  );
}
