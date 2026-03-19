"use client";

import { Canvas } from "@react-three/fiber";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import TensorCoreScene from "./TensorCoreScene";

const STEPS = [
  {
    title: "Step 1: Warp Dispatch",
    shortTitle: "Dispatch",
    detail: "Warp Scheduler sends one warp (32 threads) to Tensor Core Units for matrix operations.",
    keyTakeaway: "One warp enters the Tensor Core pipeline."
  },
  {
    title: "Step 2: Load Matrix Tiles",
    shortTitle: "Load",
    detail: "Matrix A and Matrix B tiles are fetched from Shared Memory into Tensor Core registers.",
    keyTakeaway: "Data movement prepares tiles for compute."
  },
  {
    title: "Step 3: MMA Compute",
    shortTitle: "MMA",
    detail: "Tensor Cores execute fused multiply-accumulate: C = A x B + C.",
    keyTakeaway: "Math is done in specialized tensor hardware."
  },
  {
    title: "Step 4: Parallel Tile Execution",
    shortTitle: "Parallel",
    detail: "Multiple Tensor Core units process different matrix tiles at the same time.",
    keyTakeaway: "Parallel tiles increase throughput across the SM."
  },
  {
    title: "Step 5: Writeback",
    shortTitle: "Writeback",
    detail: "Result tiles are stored back to Shared Memory and then moved to the Global Memory Bus.",
    keyTakeaway: "Computed output leaves Tensor Core registers."
  }
];

const STEP_DURATION_SECONDS = 3;

const STEP_FOCUS = [
  {
    watch: "Warp dispatch path",
    nodes: ["Warp Scheduler", "Tensor Core Units"],
    color: "scheduler"
  },
  {
    watch: "Memory-to-core movement",
    nodes: ["Shared Memory", "Tensor Core Units"],
    color: "memory"
  },
  {
    watch: "MMA compute engine",
    nodes: ["Tensor Core Units", "MMA Equation"],
    color: "tensor"
  },
  {
    watch: "Parallel tile execution",
    nodes: ["Tensor Core Units", "CUDA Core Array"],
    color: "compute"
  },
  {
    watch: "Writeback to bus",
    nodes: ["Shared Memory", "Global Memory Bus"],
    color: "bus"
  }
];

export default function TensorCoreSimulation({ simulationSpeed = 1 }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [phase, setPhase] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);
  const [speed, setSpeed] = useState(1);

  const currentStep = useMemo(() => STEPS[stepIndex], [stepIndex]);
  const focus = useMemo(() => STEP_FOCUS[stepIndex], [stepIndex]);
  const progressPercent = useMemo(
    () => (((stepIndex + phase) / STEPS.length) * 100).toFixed(1),
    [stepIndex, phase]
  );

  useEffect(() => {
    if (!playing) return undefined;

    let rafId = 0;
    let lastTime = performance.now();

    const tick = (now) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      const scaled = dt * Math.max(0.2, speed) * Math.max(0.4, simulationSpeed);

      setPhase((prev) => {
        let next = prev + scaled / STEP_DURATION_SECONDS;
        if (next >= 1) {
          const wrapped = next % 1;
          setStepIndex((idx) => (idx + 1) % STEPS.length);
          next = wrapped;
        }
        return next;
      });

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);

    return () => window.cancelAnimationFrame(rafId);
  }, [playing, speed, simulationSpeed]);

  const reset = () => {
    setPlaying(false);
    setPhase(0);
    setStepIndex(0);
    window.setTimeout(() => setPlaying(true), 60);
  };

  const jumpStep = (nextIndex) => {
    setStepIndex(nextIndex);
    setPhase(0);
  };

  return (
    <div className="panel-shell p-3">
      <div className="mb-3 grid gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <h2 className="text-lg font-semibold text-cyan-200">Tensor Core Simulation</h2>
          <p className="mt-1 text-sm leading-6 text-slate-300">
            Step-by-step view of how one matrix instruction flows through Tensor Core hardware.
          </p>

          <div className="tc-legend-grid mt-3">
            <span className="tc-legend-chip tc-legend-chip--scheduler">Warp Scheduler</span>
            <span className="tc-legend-chip tc-legend-chip--memory">Shared Memory</span>
            <span className="tc-legend-chip tc-legend-chip--tensor">Tensor Core Units</span>
            <span className="tc-legend-chip tc-legend-chip--compute">CUDA Core Array</span>
            <span className="tc-legend-chip tc-legend-chip--bus">Global Memory Bus</span>
          </div>
        </div>

        <div className="rounded-lg border border-cyan-700/50 bg-slate-900/80 p-3 text-xs text-slate-200">
          <div className="mb-2 flex items-center justify-between">
            <strong className="text-cyan-300">Quick Guide</strong>
            <span className="rounded border border-slate-600/80 px-2 py-0.5 text-[10px] uppercase tracking-wide text-emerald-300">
              {playing ? "Playing" : "Paused"}
            </span>
          </div>

          <ol className="mb-3 space-y-1.5 text-[11px] leading-5 text-slate-300">
            <li>1. Use Next Step and Prev Step to move through the pipeline.</li>
            <li>2. Keep Labels on while learning each component name.</li>
            <li>3. Increase speed after the flow is clear.</li>
          </ol>

          <div className="grid grid-cols-2 gap-2">
            <button className="control-btn" onClick={() => setPlaying((v) => !v)}>
              {playing ? "Pause" : "Play"}
            </button>
            <button className="control-btn" onClick={reset}>Reset</button>
            <button className="control-btn" onClick={() => jumpStep(stepIndex === 0 ? STEPS.length - 1 : stepIndex - 1)}>
              Prev Step
            </button>
            <button className="control-btn" onClick={() => jumpStep((stepIndex + 1) % STEPS.length)}>
              Next Step
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-cyan-500/35 bg-slate-900/75">
        <div className="tc-focus-strip">
          <div className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Current Stage</div>
          <div className={`mt-0.5 tc-focus-title tc-focus-title--${focus.color}`}>{focus.watch}</div>
          <div className="mt-1 flex flex-wrap gap-2">
            {focus.nodes.map((node) => (
              <span key={node} className={`tc-focus-node tc-focus-node--${focus.color}`}>
                {node}
              </span>
            ))}
          </div>

          <div className="mt-3 grid gap-2 md:grid-cols-5">
            {STEPS.map((step, idx) => {
              const isActive = idx === stepIndex;
              const isDone = idx < stepIndex;

              return (
                <button
                  key={step.title}
                  type="button"
                  className={`rounded-md border px-2 py-2 text-left text-[11px] transition ${
                    isActive
                      ? "border-cyan-400/80 bg-cyan-500/20 text-cyan-100"
                      : isDone
                      ? "border-emerald-500/45 bg-emerald-500/10 text-emerald-200"
                      : "border-slate-700/80 bg-slate-900/80 text-slate-300 hover:border-slate-500/80"
                  }`}
                  onClick={() => jumpStep(idx)}
                >
                  <div className="font-semibold">{step.shortTitle}</div>
                  <div className="mt-0.5 text-[10px] opacity-80">{idx + 1}/5</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-[430px] w-full md:h-[520px]">
          <Canvas shadows gl={{ antialias: true, powerPreference: "high-performance" }} camera={{ position: [9, 5, 7], fov: 48 }}>
            <TensorCoreScene
              stepIndex={stepIndex}
              phase={phase}
              speed={speed * simulationSpeed}
              showLabels={showLabels}
              playing={playing}
              autoRotate={autoRotate}
            />
          </Canvas>
        </div>

        <div className="grid gap-3 border-t border-slate-700/70 p-3 md:grid-cols-[minmax(0,1fr)_280px] md:p-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={`step-${stepIndex}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.24 }}
            >
              <h3 className="text-base font-semibold text-emerald-300">{currentStep.title}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-200">{currentStep.detail}</p>
              <p className="mt-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1.5 text-xs text-emerald-100">
                Key takeaway: {currentStep.keyTakeaway}
              </p>

              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between text-[11px] text-slate-300">
                  <span>Pipeline Progress</span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-800/90">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-emerald-300 to-amber-300"
                    initial={false}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="rounded-md border border-slate-700/70 bg-slate-950/70 p-2 text-xs">
            <div className="mb-2 text-[10px] uppercase tracking-[0.14em] text-slate-400">View Settings</div>

            <label className="mb-2 flex cursor-pointer items-center justify-between rounded border border-slate-700/70 bg-slate-900/70 px-2 py-1.5 text-slate-200">
              Labels
              <input type="checkbox" checked={showLabels} onChange={() => setShowLabels((v) => !v)} />
            </label>

            <label className="mb-2 flex cursor-pointer items-center justify-between rounded border border-slate-700/70 bg-slate-900/70 px-2 py-1.5 text-slate-200">
              Auto Rotate Camera
              <input type="checkbox" checked={autoRotate} onChange={() => setAutoRotate((v) => !v)} />
            </label>

            <label className="block text-slate-200">
              Speed: <span className="text-cyan-300">{speed.toFixed(1)}x</span>
              <input
                type="range"
                className="control-slider"
                min="0.5"
                max="2.5"
                step="0.1"
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
              />
            </label>

            <div className="mt-2 rounded border border-slate-700/80 bg-slate-900/70 px-2 py-1.5 text-[11px] leading-5 text-slate-300">
              Formula shown in compute stage: C = A x B + C
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
