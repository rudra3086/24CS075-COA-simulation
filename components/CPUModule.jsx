"use client";

export default function CPUModule({ position = [-8, 0, 0], onSelect, onHover, onBurst }) {
  const pinOffsets = [];
  for (let x = -1.52; x <= 1.52; x += 0.34) {
    for (let z = -1.52; z <= 1.52; z += 0.34) {
      pinOffsets.push([Number(x.toFixed(2)), Number(z.toFixed(2))]);
    }
  }

  const capacitorOffsets = [
    [-1.2, 0.18, -1.15],
    [-0.72, 0.18, -1.15],
    [-0.24, 0.18, -1.15],
    [0.24, 0.18, -1.15],
    [0.72, 0.18, -1.15],
    [1.2, 0.18, -1.15],
    [-1.2, 0.18, 1.15],
    [-0.72, 0.18, 1.15],
    [-0.24, 0.18, 1.15],
    [0.24, 0.18, 1.15],
    [0.72, 0.18, 1.15],
    [1.2, 0.18, 1.15]
  ];

  return (
    <group position={position}>
      <mesh
        castShadow
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          onSelect("cpu");
          if (onBurst) onBurst(8);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          if (onHover) onHover("CPU: click to inject a burst of new tasks");
        }}
        onPointerOut={() => {
          if (onHover) onHover("");
        }}
      >
        <boxGeometry args={[4.2, 0.22, 4.2]} />
        <meshStandardMaterial color="#2f6a55" metalness={0.25} roughness={0.68} />
      </mesh>

      <mesh castShadow receiveShadow position={[0, 0.28, 0]}>
        <boxGeometry args={[3.28, 0.34, 3.28]} />
        <meshStandardMaterial color="#d8dee8" metalness={0.9} roughness={0.18} />
      </mesh>

      <mesh castShadow receiveShadow position={[0, 0.48, 0]}>
        <boxGeometry args={[1.32, 0.08, 1.32]} />
        <meshStandardMaterial color="#7de6ff" emissive="#0f7ea6" emissiveIntensity={0.45} metalness={0.35} roughness={0.24} />
      </mesh>

      <mesh castShadow receiveShadow position={[0, 0.58, 0]}>
        <boxGeometry args={[2.26, 0.05, 2.26]} />
        <meshStandardMaterial color="#b3bcc8" metalness={0.86} roughness={0.18} />
      </mesh>

      {capacitorOffsets.map((offset, idx) => (
        <mesh key={`cpu-cap-${idx}`} castShadow receiveShadow position={offset}>
          <boxGeometry args={[0.22, 0.12, 0.16]} />
          <meshStandardMaterial color="#131d2b" metalness={0.32} roughness={0.65} />
        </mesh>
      ))}

      {pinOffsets.map(([x, z], idx) => (
        <mesh key={`cpu-pin-${idx}`} position={[x, -0.18, z]} castShadow>
          <cylinderGeometry args={[0.035, 0.035, 0.12, 6]} />
          <meshStandardMaterial color="#d8b45b" metalness={0.95} roughness={0.2} />
        </mesh>
      ))}

      <mesh position={[0, 0.68, 0]}>
        <boxGeometry args={[1.72, 0.01, 1.72]} />
        <meshStandardMaterial color="#f4f7fb" metalness={0.1} roughness={0.8} />
      </mesh>
    </group>
  );
}
