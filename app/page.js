"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import ControlPanel from "../components/ControlPanel";
import GPUScene from "../components/GPUScene";

const TensorCoreSimulation = dynamic(() => import("../components/TensorCoreSimulation"), {
  ssr: false,
  loading: () => <div className="panel-shell text-sm text-slate-300">Loading Tensor Core Simulation...</div>
});

const TOPIC_INFO = {
  gpuArchitecture: {
    title: "GPU Architecture",
    body: "A GPU is optimized for throughput. It contains many Streaming Multiprocessors so large numbers of threads can run concurrently for highly parallel workloads."
  },
  streamingMultiprocessor: {
    title: "Streaming Multiprocessors (SMs)",
    body: "Each SM is a compute cluster with many lightweight cores and shared resources. Thread blocks are assigned to SMs, where they execute in groups."
  },
  parallelProcessing: {
    title: "Parallel Processing",
    body: "Parallel processing divides work into many threads. Multiple SMs execute these threads at the same time, reducing total processing time."
  },
  threadBlocks: {
    title: "Thread Blocks",
    body: "Thread blocks are batches of threads scheduled together. The scheduler sends blocks to available SMs, balancing load and maximizing occupancy."
  },
  threadScheduling: {
    title: "Thread Scheduling",
    body: "The scheduler maps thread blocks to SMs. As blocks complete, new blocks are dispatched. This continuous assignment keeps GPU hardware busy."
  },
  tensorCores: {
    title: "Advancement: Tensor Cores",
    body: "Tensor Cores accelerate matrix-heavy operations by executing mixed-precision fused multiply-add pipelines. They boost deep learning and linear algebra throughput per clock when workloads are compute-dense and parallel."
  },
  cpu: {
    title: "CPU Role",
    body: "The CPU launches kernels and submits tasks to the GPU. Data and execution commands flow from CPU to GPU for massively parallel execution."
  }
};

export default function Page() {
  const [running, setRunning] = useState(false);
  const [highlightSM, setHighlightSM] = useState(false);
  const [showScheduling, setShowScheduling] = useState(false);
  const [showParallel, setShowParallel] = useState(true);
  const [tensorCoresEnabled, setTensorCoresEnabled] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const [taskRate, setTaskRate] = useState(0.35);
  const [workComplexity, setWorkComplexity] = useState(0.55);
  const [memoryIntensity, setMemoryIntensity] = useState(0.45);
  const [divergence, setDivergence] = useState(0.3);
  const [autoRotate, setAutoRotate] = useState(false);
  const [activeThreads, setActiveThreads] = useState(0);
  const [taskStats, setTaskStats] = useState({ queued: 0, dispatched: 0, executing: 0, completed: 0 });
  const [smUtilization, setSmUtilization] = useState([0, 0, 0, 0, 0, 0]);
  const [performance, setPerformance] = useState({
    throughput: 0,
    avgLatency: 0,
    occupancy: 0,
    schedulerLoad: 0,
    bottleneck: "Balanced",
    smCapacity: 8
  });
  const [schedulingPolicy, setSchedulingPolicy] = useState("roundRobin");
  const [burstToken, setBurstToken] = useState(0);
  const [selectedTopic, setSelectedTopic] = useState("gpuArchitecture");
  const [resetToken, setResetToken] = useState(0);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [simulationTab, setSimulationTab] = useState("architecture");

  const topic = useMemo(() => TOPIC_INFO[selectedTopic] ?? TOPIC_INFO.gpuArchitecture, [selectedTopic]);

  const simulation = useMemo(
    () => ({
      running,
      highlightSM,
      showScheduling,
      showParallel,
      tensorCoresEnabled,
      simulationSpeed,
      taskRate,
      complexity: workComplexity,
      memoryIntensity,
      divergence,
      autoRotate,
      schedulingPolicy,
      burstToken,
      onStatsChange: setActiveThreads,
      onTaskStatsChange: setTaskStats,
      onSmUtilizationChange: setSmUtilization,
      onPerformanceChange: setPerformance
    }),
    [
      running,
      highlightSM,
      showScheduling,
      showParallel,
      tensorCoresEnabled,
      simulationSpeed,
      taskRate,
      workComplexity,
      memoryIntensity,
      divergence,
      autoRotate,
      schedulingPolicy,
      burstToken
    ]
  );

  return (
    <main className="hardware-bg min-h-screen px-4 py-4 text-slate-100 md:px-6 md:py-6">
      <div className="mx-auto max-w-[1500px]">
        <header className="header-shell mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300/90">Classroom Simulator</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-wide text-cyan-100 md:text-3xl">
            GPU Architecture for Parallel Processing
          </h1>
          <p className="mt-2 max-w-5xl text-sm leading-6 text-slate-300 md:text-base">
            Interactive Next.js + Three.js classroom simulator showing CPU task offloading, scheduler behavior,
            Streaming Multiprocessors, and parallel thread execution on a GPU chip.
          </p>
        </header>

        <div className="mb-3 flex justify-end">
          <button
            type="button"
            className="control-btn"
            onClick={() => setSidebarVisible((v) => !v)}
          >
            {sidebarVisible ? "Hide Sidebar" : "Show Sidebar"}
          </button>
        </div>

        <section
          className={`items-start gap-4 ${sidebarVisible ? "flex flex-col xl:flex-row" : "grid grid-cols-1"}`}
        >
          <div className="grid min-w-0 flex-1 gap-4">
            <div className="panel-shell p-2">
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  className={`control-btn ${simulationTab === "architecture" ? "control-btn-primary" : ""}`}
                  onClick={() => {
                    setSimulationTab("architecture");
                    setSelectedTopic("gpuArchitecture");
                  }}
                >
                  Architecture Simulation
                </button>
                <button
                  type="button"
                  className={`control-btn ${simulationTab === "tensorLab" ? "control-btn-primary" : ""}`}
                  onClick={() => {
                    setSimulationTab("tensorLab");
                    setSelectedTopic("tensorCores");
                  }}
                >
                  Tensor Core Simulation
                </button>
              </div>
            </div>

            {simulationTab === "architecture" ? (
              <GPUScene simulation={simulation} onSelectTopic={setSelectedTopic} resetToken={resetToken} />
            ) : (
              <TensorCoreSimulation simulationSpeed={simulationSpeed} />
            )}
            <ControlPanel
              running={running}
              showParallel={showParallel}
              tensorCoresEnabled={tensorCoresEnabled}
              simulationSpeed={simulationSpeed}
              taskRate={taskRate}
              workComplexity={workComplexity}
              memoryIntensity={memoryIntensity}
              divergence={divergence}
              autoRotate={autoRotate}
              activeThreads={activeThreads}
              taskStats={taskStats}
              performance={performance}
              schedulingPolicy={schedulingPolicy}
              onStart={() => {
                setRunning(true);
                setSelectedTopic("parallelProcessing");
              }}
              onPause={() => setRunning(false)}
              onReset={() => {
                setRunning(false);
                setResetToken((v) => v + 1);
                setActiveThreads(0);
                setSelectedTopic("gpuArchitecture");
              }}
              onToggleSmHighlight={() => {
                setHighlightSM((v) => !v);
                setSelectedTopic("streamingMultiprocessor");
              }}
              onToggleScheduling={() => {
                setShowScheduling((v) => !v);
                setSelectedTopic("threadScheduling");
              }}
              onToggleParallel={() => {
                setShowParallel((v) => !v);
                setSelectedTopic("parallelProcessing");
              }}
              onToggleTensorCores={() => {
                setTensorCoresEnabled((v) => !v);
                setSelectedTopic("tensorCores");
              }}
              onSpeedChange={(value) => setSimulationSpeed(value)}
              onTaskRateChange={(value) => setTaskRate(value)}
              onWorkComplexityChange={(value) => setWorkComplexity(value)}
              onMemoryIntensityChange={(value) => setMemoryIntensity(value)}
              onDivergenceChange={(value) => setDivergence(value)}
              onToggleAutoRotate={() => setAutoRotate((v) => !v)}
              onPolicyChange={(value) => {
                setSchedulingPolicy(value);
                setSelectedTopic("threadScheduling");
              }}
              onSpawnBurst={() => {
                setBurstToken((v) => v + 1);
                setRunning(true);
                setSelectedTopic("cpu");
              }}
            />
          </div>

          {sidebarVisible ? (
          <aside className="panel-shell w-full min-w-0 h-fit xl:w-[340px] xl:shrink-0 xl:self-start xl:sticky xl:top-4 xl:max-h-[calc(100vh-2rem)] xl:overflow-y-auto">
            <h2 className="mb-3 text-xl font-semibold text-cyan-200">Educational Sidebar</h2>
            <h3 className="mb-2 text-lg font-semibold text-emerald-300">{topic.title}</h3>
            <p className="mb-4 text-sm leading-6 text-slate-200">{topic.body}</p>

            <div className="panel-card mb-4 text-sm text-slate-200">
              <p>
                Scheduling Policy: <span className="font-semibold text-cyan-300">{schedulingPolicy}</span>
              </p>
              <p className="mt-1">
                Bottleneck: <span className="font-semibold text-amber-300">{performance.bottleneck}</span>
              </p>
              <p className="mt-1">
                Tensor Cores: <span className={tensorCoresEnabled ? "font-semibold text-emerald-300" : "font-semibold text-slate-300"}>{tensorCoresEnabled ? "Enabled" : "Disabled"}</span>
              </p>
            </div>

            <div className="panel-card mb-4 text-xs text-slate-200">
              <h4 className="mb-2 text-sm font-semibold text-cyan-200">Live Performance</h4>
              <p>Occupancy: <span className="text-emerald-300">{performance.occupancy}%</span></p>
              <p>Throughput: <span className="text-emerald-300">{performance.throughput.toFixed(2)} tasks/s</span></p>
              <p>Avg Latency: <span className="text-cyan-300">{performance.avgLatency.toFixed(2)}s</span></p>
              <p>Scheduler Load: <span className="text-cyan-300">{performance.schedulerLoad}%</span></p>
              <p>SM Capacity: <span className="text-cyan-300">{performance.smCapacity} active blocks/SM</span></p>
            </div>

            <div className="panel-card mb-4 text-xs text-slate-200">
              <h4 className="mb-2 text-sm font-semibold text-cyan-200">Workload Profile</h4>
              <p>Compute Complexity: <span className="text-emerald-300">{Math.round(workComplexity * 100)}%</span></p>
              <p>Memory Intensity: <span className="text-emerald-300">{Math.round(memoryIntensity * 100)}%</span></p>
              <p>Warp Divergence: <span className="text-emerald-300">{Math.round(divergence * 100)}%</span></p>
            </div>

            <div className="space-y-2 text-sm text-slate-300">
              <p className="panel-card px-3 py-2">Click CPU to view task offloading details.</p>
              <p className="panel-card px-3 py-2">Click GPU/SM blocks to learn architecture and SM responsibilities.</p>
              <p className="panel-card px-3 py-2">Click threads to focus on parallel processing behavior.</p>
              <p className="panel-card px-3 py-2">Click scheduler/arrows to understand thread scheduling.</p>
            </div>

            <div className="mt-5 border-t border-slate-700/60 pt-4">
              <h4 className="mb-2 text-sm font-semibold text-cyan-200">Color Legend</h4>
              <ul className="space-y-2 text-sm text-slate-300">
                <li><span className="legend-dot bg-cpu" /> CPU</li>
                <li><span className="legend-dot bg-gpu" /> GPU Chip</li>
                <li><span className="legend-dot bg-sm" /> Streaming Multiprocessor</li>
                <li><span className="legend-dot bg-thread" /> Thread</li>
                <li><span className="legend-dot bg-scheduler" /> Scheduler Arrows</li>
              </ul>
            </div>

            <div className="mt-5 border-t border-slate-700/60 pt-4">
              <h4 className="mb-3 text-sm font-semibold text-cyan-200">SM Utilization</h4>
              <div className="space-y-2 text-xs text-slate-300">
                {smUtilization.map((value, idx) => (
                  <div key={`util-${idx}`}>
                    <div className="mb-1 flex items-center justify-between">
                      <span>SM {idx + 1}</span>
                      <span className="text-slate-200">{value}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded bg-slate-700/70">
                      <div
                        className="h-full transition-all duration-150"
                        style={{
                          width: `${value}%`,
                          background: `hsl(${Math.round((value / 100) * 120)} 85% 52%)`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
          ) : null}
        </section>
      </div>
    </main>
  );
}
