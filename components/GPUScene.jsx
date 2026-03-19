"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Html, OrbitControls } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import CPUModule from "./CPUModule";
import GPUModule, { SM_LOCAL_LAYOUT } from "./GPUModule";
import Scheduler from "./Scheduler";

const GPU_POSITION = [2, 0, 0];
const CPU_POSITION = [-8, 0, 0];
const CPU_EMIT_POINT = [-7.3, 1.1, 0];
const SCHEDULER_POS = [2, 2.5, -2.7];

function SceneContent({ simulation, onSelectTopic, resetToken }) {
  const smRefs = useRef([]);
  const smActivityRef = useRef(new Array(SM_LOCAL_LAYOUT.length).fill(0));
  const [threads, setThreads] = useState([]);
  const [hoverText, setHoverText] = useState("");
  const spawnTimerRef = useRef(0);
  const threadIdRef = useRef(0);
  const elapsedRef = useRef(0);
  const roundRobinRef = useRef(0);
  const lastReportedCountRef = useRef(-1);
  const completedCountRef = useRef(0);
  const latencySumRef = useRef(0);
  const completedInWindowRef = useRef(0);
  const throughputRef = useRef(0);
  const throughputWindowRef = useRef(0);
  const lastReportedTaskStatsRef = useRef("");
  const lastReportedUtilRef = useRef("");
  const lastReportedPerfRef = useRef("");
  const pendingBurstRef = useRef(0);
  const lastBurstTokenRef = useRef(-1);

  const smTargets = useMemo(
    () =>
      SM_LOCAL_LAYOUT.map(([x, y, z]) => [
        x + GPU_POSITION[0],
        y + GPU_POSITION[1],
        z + GPU_POSITION[2]
      ]),
    []
  );

  useEffect(() => {
    setThreads([]);
    spawnTimerRef.current = 0;
    threadIdRef.current = 0;
    elapsedRef.current = 0;
    roundRobinRef.current = 0;
    completedCountRef.current = 0;
    latencySumRef.current = 0;
    completedInWindowRef.current = 0;
    throughputRef.current = 0;
    throughputWindowRef.current = 0;
    lastReportedTaskStatsRef.current = "";
    lastReportedUtilRef.current = "";
    lastReportedPerfRef.current = "";
    pendingBurstRef.current = 0;
  }, [resetToken]);

  useEffect(() => {
    if (typeof simulation.burstToken !== "number") return;
    if (simulation.burstToken === lastBurstTokenRef.current) return;
    lastBurstTokenRef.current = simulation.burstToken;
    pendingBurstRef.current += 12;
  }, [simulation.burstToken]);

  const registerSMRef = (index, mesh) => {
    if (mesh) smRefs.current[index] = mesh;
  };

  const capacityPerSM = Math.max(
    2,
    Math.round(
      (simulation.showParallel ? 8 : 5)
      * (1 - simulation.memoryIntensity * 0.38)
      * (1 - simulation.divergence * 0.28)
      * (simulation.tensorCoresEnabled ? 1.2 : 1)
    )
  );

  const selectSmWithCapacity = (policy, smLoad, capacity) => {
    const available = [];
    for (let i = 0; i < smLoad.length; i += 1) {
      if (smLoad[i] < capacity) available.push(i);
    }
    if (available.length === 0) return -1;

    if (policy === "random") {
      return available[Math.floor(Math.random() * available.length)];
    }

    if (policy === "roundRobin") {
      for (let offset = 0; offset < smLoad.length; offset += 1) {
        const idx = (roundRobinRef.current + offset) % smLoad.length;
        if (smLoad[idx] < capacity) {
          roundRobinRef.current = (idx + 1) % smLoad.length;
          return idx;
        }
      }
      return -1;
    }

    if (policy === "loadAware") {
      let best = available[0];
      for (let i = 1; i < available.length; i += 1) {
        const idx = available[i];
        if (smLoad[idx] < smLoad[best]) best = idx;
      }
      return best;
    }

    return available[0];
  };

  const createThread = (start, via) => {
    const complexity = THREE.MathUtils.clamp(simulation.complexity + (Math.random() - 0.5) * 0.22, 0.1, 1);
    const memory = THREE.MathUtils.clamp(simulation.memoryIntensity + (Math.random() - 0.5) * 0.2, 0.1, 1);
    const divergence = THREE.MathUtils.clamp(simulation.divergence + (Math.random() - 0.5) * 0.24, 0, 1);
    const baseExec = 1.0 + complexity * 2.1 + memory * 1.3 + divergence * 1.2;
    const tensorAcceleration = simulation.tensorCoresEnabled
      ? 1 + complexity * 0.85 * (1 - divergence * 0.55)
      : 1;
    const requiredExec = (simulation.showParallel ? baseExec : baseExec * 1.45) / tensorAcceleration;

    return {
      id: threadIdRef.current,
      phase: "toScheduler",
      from: start,
      via,
      target: via,
      smIndex: -1,
      progress: 0,
      position: start,
      alpha: 0.98,
      scale: 1,
      age: 0,
      execTime: 0,
      queuedFor: 0,
      createdAt: elapsedRef.current,
      dispatchAt: null,
      requiredExec,
      complexity,
      memory,
      divergence
    };
  };

  // React Three Fiber useFrame runs on requestAnimationFrame.
  useFrame((_, delta) => {
    const scaledDelta = delta * simulation.simulationSpeed;
    elapsedRef.current += scaledDelta;
    const t = elapsedRef.current;

    smRefs.current.forEach((smMesh, idx) => {
      if (!smMesh) return;
      const material = smMesh.material;
      if (simulation.highlightSM) {
        const activity = smActivityRef.current[idx] ?? 0;
        material.emissiveIntensity = 0.8 + activity * 1.2;
        smMesh.position.y = SM_LOCAL_LAYOUT[idx][1] + activity * 0.08;
      } else {
        material.emissiveIntensity = 0.9;
        smMesh.position.y = SM_LOCAL_LAYOUT[idx][1];
      }
    });

    setThreads((previous) => {
      const next = [];

      for (let i = 0; i < previous.length; i += 1) {
        const th = previous[i];
        const updated = { ...th, age: th.age + scaledDelta };

        if (updated.phase === "toScheduler") {
          const speed = 0.95;
          updated.progress = Math.min(1, updated.progress + scaledDelta * speed);
          updated.position = [
            THREE.MathUtils.lerp(updated.from[0], updated.via[0], updated.progress),
            THREE.MathUtils.lerp(updated.from[1], updated.via[1], updated.progress),
            THREE.MathUtils.lerp(updated.from[2], updated.via[2], updated.progress)
          ];

          if (updated.progress >= 1) {
            updated.phase = "queued";
            updated.progress = 0;
          }
        } else if (updated.phase === "queued") {
          updated.queuedFor += scaledDelta;
          updated.position = [
            updated.via[0] + Math.sin(updated.id * 0.7 + t * 1.4) * 0.25,
            updated.via[1] + 0.05 + Math.sin(updated.id * 0.3 + t * 2.1) * 0.08,
            updated.via[2] + Math.cos(updated.id * 0.5 + t * 1.2) * 0.2
          ];
        } else if (updated.phase === "toSM") {
          updated.progress = Math.min(1, updated.progress + scaledDelta * 1.25);
          updated.position = [
            THREE.MathUtils.lerp(updated.via[0], updated.target[0], updated.progress),
            THREE.MathUtils.lerp(updated.via[1], updated.target[1] + 0.6, updated.progress),
            THREE.MathUtils.lerp(updated.via[2], updated.target[2], updated.progress)
          ];

          if (updated.progress >= 1) {
            updated.phase = "execute";
            updated.progress = 0;
            updated.execTime = 0;
          }
        } else if (updated.phase === "execute") {
          updated.execTime += scaledDelta;
          const speedBoost = simulation.showParallel ? 1.4 : 0.72;
          const amp = 0.12 + (1 - updated.divergence) * 0.18;
          const w = t * (5.5 * speedBoost) + updated.id;

          updated.position = [
            updated.target[0] + Math.cos(w) * amp,
            updated.target[1] + 0.7 + Math.sin(w * 1.3) * amp * 0.7,
            updated.target[2] + Math.sin(w * 0.95) * amp
          ];

          if (updated.execTime > updated.requiredExec) {
            updated.phase = "complete";
            completedCountRef.current += 1;
            completedInWindowRef.current += 1;
            latencySumRef.current += Math.max(0, elapsedRef.current - updated.createdAt);
          }
        } else if (updated.phase === "complete") {
          updated.alpha = Math.max(0, updated.alpha - scaledDelta * 1.6);
          updated.scale = Math.max(0.08, updated.scale - scaledDelta * 0.22);
        }

        if (!(updated.phase === "complete" && updated.alpha <= 0.02)) {
          next.push(updated);
        }
      }

      if (simulation.running) {
        const interval = Math.max(0.08, simulation.taskRate);
        spawnTimerRef.current -= scaledDelta;
        if (spawnTimerRef.current <= 0 && next.length < 90) {
          const zOffset = (Math.random() - 0.5) * 2.2;
          const start = [CPU_EMIT_POINT[0], CPU_EMIT_POINT[1], zOffset];
          const via = [SCHEDULER_POS[0], SCHEDULER_POS[1] + 0.2, SCHEDULER_POS[2]];

          next.push(createThread(start, via));

          threadIdRef.current += 1;
          spawnTimerRef.current = interval;
        }
      }

      // Manual bursts from UI button or CPU click.
      while (pendingBurstRef.current > 0 && next.length < 95) {
        const zOffset = (Math.random() - 0.5) * 2.4;
        const start = [CPU_EMIT_POINT[0], CPU_EMIT_POINT[1], zOffset];
        const via = [SCHEDULER_POS[0], SCHEDULER_POS[1] + 0.2, SCHEDULER_POS[2]];

        next.push(createThread(start, via));
        threadIdRef.current += 1;
        pendingBurstRef.current -= 1;
      }

      const smLoad = new Array(smTargets.length).fill(0);
      const queuedIndices = [];
      for (let i = 0; i < next.length; i += 1) {
        const th = next[i];
        if (th.phase === "queued") queuedIndices.push(i);
        if (th.phase === "execute" || th.phase === "toSM") {
          if (th.smIndex >= 0) smLoad[th.smIndex] += 1;
        }
      }

      // Keep a normalized per-SM activity map for meaningful SM highlighting.
      smActivityRef.current = smLoad.map((count) => Math.min(1, count / Math.max(1, capacityPerSM)));

      queuedIndices.sort((a, b) => next[a].createdAt - next[b].createdAt);
      if (simulation.schedulingPolicy === "random") {
        queuedIndices.sort(() => Math.random() - 0.5);
      }

      const schedulerDispatchBudget = Math.max(1, Math.round((simulation.showScheduling ? 5 : 3) * simulation.simulationSpeed));
      let dispatchedNow = 0;
      for (let i = 0; i < queuedIndices.length; i += 1) {
        if (dispatchedNow >= schedulerDispatchBudget) break;
        const idx = queuedIndices[i];
        const candidate = next[idx];
        if (!candidate || candidate.phase !== "queued") continue;

        const smIdx = selectSmWithCapacity(simulation.schedulingPolicy, smLoad, capacityPerSM);
        if (smIdx === -1) break;

        candidate.phase = "toSM";
        candidate.progress = 0;
        candidate.smIndex = smIdx;
        candidate.target = smTargets[smIdx];
        candidate.dispatchAt = elapsedRef.current;
        smLoad[smIdx] += 1;
        dispatchedNow += 1;
      }

      throughputWindowRef.current += scaledDelta;
      if (throughputWindowRef.current >= 1) {
        throughputRef.current = completedInWindowRef.current / throughputWindowRef.current;
        completedInWindowRef.current = 0;
        throughputWindowRef.current = 0;
      }

      if (simulation.onStatsChange && next.length !== lastReportedCountRef.current) {
        lastReportedCountRef.current = next.length;
        simulation.onStatsChange(next.length);
      }

      if (simulation.onTaskStatsChange || simulation.onSmUtilizationChange) {
        const smCounts = new Array(smTargets.length).fill(0);
        let queued = 0;
        let dispatched = 0;
        let executing = 0;

        for (let i = 0; i < next.length; i += 1) {
          const th = next[i];
          if (th.phase === "toScheduler" || th.phase === "queued") queued += 1;
          if (th.phase === "toSM") dispatched += 1;
          if (th.phase === "execute") executing += 1;
          if ((th.phase === "toSM" || th.phase === "execute") && th.smIndex >= 0) {
            smCounts[th.smIndex] += 1;
          }
        }

        const stats = {
          queued,
          dispatched,
          executing,
          completed: completedCountRef.current
        };
        const statsSig = `${stats.queued}|${stats.dispatched}|${stats.executing}|${stats.completed}`;
        if (simulation.onTaskStatsChange && statsSig !== lastReportedTaskStatsRef.current) {
          lastReportedTaskStatsRef.current = statsSig;
          simulation.onTaskStatsChange(stats);
        }

        const util = smCounts.map((count) => Math.min(100, Math.round((count / capacityPerSM) * 100)));
        const utilSig = util.join("|");
        if (simulation.onSmUtilizationChange && utilSig !== lastReportedUtilRef.current) {
          lastReportedUtilRef.current = utilSig;
          simulation.onSmUtilizationChange(util);
        }

        const avgLatency = completedCountRef.current > 0
          ? latencySumRef.current / completedCountRef.current
          : 0;
        const occupancy = Math.min(100, Math.round((executing / (smTargets.length * capacityPerSM)) * 100));
        const schedulerLoad = Math.min(100, Math.round((queued / (queued + executing + dispatched + 1)) * 100));

        let bottleneck = "Balanced";
        if (!simulation.running && queued + executing + dispatched === 0) {
          bottleneck = "Idle";
        } else if (schedulerLoad > 55 && queued > executing) {
          bottleneck = "Scheduler Limited";
        } else if (occupancy > 88 && simulation.memoryIntensity > 0.58) {
          bottleneck = "Memory Bound";
        } else if (occupancy < 45 && simulation.running) {
          bottleneck = "Underutilized";
        }

        const perf = {
          throughput: throughputRef.current,
          avgLatency,
          occupancy,
          schedulerLoad,
          bottleneck,
          smCapacity: capacityPerSM
        };
        const perfSig = `${perf.throughput.toFixed(2)}|${perf.avgLatency.toFixed(2)}|${perf.occupancy}|${perf.schedulerLoad}|${perf.bottleneck}|${perf.smCapacity}`;
        if (simulation.onPerformanceChange && perfSig !== lastReportedPerfRef.current) {
          lastReportedPerfRef.current = perfSig;
          simulation.onPerformanceChange(perf);
        }
      }

      return next;
    });
  });

  return (
    <>
      <color attach="background" args={["#17314a"]} />
      <fog attach="fog" args={["#17314a", 36, 82]} />

      <ambientLight intensity={0.72} color="#b7d6f2" />
      <hemisphereLight intensity={0.82} color="#d8ecff" groundColor="#112235" />
      <directionalLight
        position={[9, 13, 8]}
        intensity={1.75}
        color="#d5ebff"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <spotLight position={[-10, 9, 10]} intensity={1.4} angle={0.5} penumbra={0.4} color="#8cecff" distance={44} />
      <pointLight position={[-8, 4, 3]} intensity={1.1} color="#7affba" distance={28} />
      <pointLight position={[7, 5, 8]} intensity={0.95} color="#ffd38a" distance={28} />

      <gridHelper args={[60, 46, "#1d3f66", "#142842"]} position={[0, -5.5, 0]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5.48, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#18314b" roughness={0.96} metalness={0.08} />
      </mesh>
      <ContactShadows position={[0, -5.35, 0]} opacity={0.32} scale={28} blur={2.6} far={18} />

      <CPUModule
        position={CPU_POSITION}
        onSelect={onSelectTopic}
        onHover={setHoverText}
        onBurst={(amount) => {
          pendingBurstRef.current += amount;
          onSelectTopic("cpu");
        }}
      />
      <GPUModule
        position={GPU_POSITION}
        highlightSM={simulation.highlightSM}
        tensorCoresEnabled={simulation.tensorCoresEnabled}
        registerSMRef={registerSMRef}
        onSelect={onSelectTopic}
        onHover={setHoverText}
      />

      <Scheduler
        schedulerPosition={SCHEDULER_POS}
        cpuToGpuStart={[-6.0, 1.6, 0]}
        cpuToGpuEnd={[0.2, 1.6, 0]}
        smTargets={smTargets}
        showScheduling={simulation.showScheduling}
        onSelect={onSelectTopic}
        onHover={setHoverText}
      />

      {threads.map((th) => (
        (() => {
          const phaseColor =
            th.phase === "toScheduler" ? "#7dd3fc" :
            th.phase === "queued" ? "#38bdf8" :
            th.phase === "toSM" ? "#f59e0b" :
            th.phase === "execute" ? "#58ffa0" :
            "#94a3b8";

          return (
        <mesh
          key={th.id}
          position={th.position}
          scale={[th.scale, th.scale, th.scale]}
          onClick={(e) => {
            e.stopPropagation();
            onSelectTopic("parallelProcessing");
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            const smLabel = th.smIndex >= 0 ? `SM ${th.smIndex + 1}` : "Scheduler Queue";
            setHoverText(
              `Thread ${th.id} | ${th.phase} | ${smLabel} | C:${Math.round(th.complexity * 100)} M:${Math.round(th.memory * 100)} D:${Math.round(th.divergence * 100)}`
            );
          }}
          onPointerOut={() => setHoverText("")}
        >
          <sphereGeometry args={[0.13, 10, 10]} />
          <meshStandardMaterial
            color={phaseColor}
            emissive={phaseColor}
            emissiveIntensity={1.15}
            roughness={0.2}
            metalness={0.1}
            transparent
            opacity={th.alpha}
          />
        </mesh>
          );
        })()
      ))}

      <Html position={[-8, 2.5, 0]} center distanceFactor={10}>
        <span className="world-label">CPU</span>
      </Html>
      <Html position={[2, 2.8, 3.4]} center distanceFactor={10}>
        <span className="world-label">GPU</span>
      </Html>
      <Html position={[2, 3.6, -2.8]} center distanceFactor={10}>
        <span className="world-label">Scheduler</span>
      </Html>
      <Html position={[0, 3.8, 0]} center distanceFactor={11}>
        <span className="world-label">Streaming Multiprocessors</span>
      </Html>
      <Html position={[0, 2.2, 2.7]} center distanceFactor={11}>
        <span className="world-label">Thread Blocks</span>
      </Html>

      {hoverText ? (
        <Html position={[1.9, 5.4, 0]} center distanceFactor={16}>
          <span className="world-label world-label-hover">{hoverText}</span>
        </Html>
      ) : null}

      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        minDistance={11}
        maxDistance={40}
        target={[1.8, 0.2, 0]}
        autoRotate={simulation.autoRotate}
        autoRotateSpeed={simulation.autoRotate ? 0.8 : 0}
      />
    </>
  );
}

export default function GPUScene({ simulation, onSelectTopic, resetToken }) {
  const containerRef = useRef(null);
  const [viewportHeight, setViewportHeight] = useState(460);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === "undefined") return;

    const updateFromWidth = (width) => {
      const nextHeight = Math.max(420, Math.min(700, Math.round(width * 0.56)));
      setViewportHeight((prev) => (prev === nextHeight ? prev : nextHeight));
    };

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      updateFromWidth(entry.contentRect.width);
    });

    observer.observe(container);
    updateFromWidth(container.clientWidth);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full min-w-0 overflow-hidden rounded-xl border border-cyan-500/40 bg-slate-800/60 shadow-panel"
      style={{ height: `${viewportHeight}px` }}
    >
      <Canvas
        shadows
        camera={{ position: [0, 8, 23], fov: 52 }}
        gl={{ antialias: true }}
        style={{ width: "100%", height: "100%" }}
        resize={{ debounce: { resize: 0, scroll: 0 } }}
      >
        <SceneContent simulation={simulation} onSelectTopic={onSelectTopic} resetToken={resetToken} />
      </Canvas>
    </div>
  );
}
