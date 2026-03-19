"use client";

import { useMemo, useState } from "react";
import ControlPanel from "../components/ControlPanel";
import GPUScene from "../components/GPUScene";

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
  const [showCoreUtilization, setShowCoreUtilization] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const [taskRate, setTaskRate] = useState(0.35);
  const [workComplexity, setWorkComplexity] = useState(0.55);
  const [memoryIntensity, setMemoryIntensity] = useState(0.45);
  const [divergence, setDivergence] = useState(0.3);
  const [autoRotate, setAutoRotate] = useState(false);
  const [activeThreads, setActiveThreads] = useState(0);
  const [taskStats, setTaskStats] = useState({ queued: 0, dispatched: 0, executing: 0, completed: 0 });
  const [smUtilization, setSmUtilization] = useState([0, 0, 0, 0, 0, 0]);
  const [coreUtilization, setCoreUtilization] = useState(Array(6).fill(null).map(() => Array(6).fill(0)));
  const [activeCoreMap, setActiveCoreMap] = useState(Array(6).fill(null).map(() => Array(6).fill(false)));
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
  const [quickControlsMinimized, setQuickControlsMinimized] = useState(false);

  const topic = useMemo(() => TOPIC_INFO[selectedTopic] ?? TOPIC_INFO.gpuArchitecture, [selectedTopic]);

  const simulation = useMemo(
    () => ({
      running,
      highlightSM,
      showScheduling,
      showParallel,
      showCoreUtilization,
      coreUtilization,
      activeCoreMap,
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
      onCoreUtilizationChange: setCoreUtilization,
      onActiveCoreMapChange: setActiveCoreMap,
      onPerformanceChange: setPerformance
    }),
    [
      running,
      highlightSM,
      showScheduling,
      showParallel,
      showCoreUtilization,
      coreUtilization,
      activeCoreMap,
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
            <div className="relative min-w-0 w-full">
              <GPUScene
                simulation={simulation}
                onSelectTopic={setSelectedTopic}
                resetToken={resetToken}
                layoutToken={sidebarVisible}
              />

              <div className="pointer-events-none absolute left-3 top-3 z-20 w-[min(92%,360px)]">
                <div className="pointer-events-auto rounded-lg border border-cyan-400/45 bg-slate-900/78 p-3 shadow-panel backdrop-blur-sm">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-200/90">Quick Controls</p>
                    <button
                      type="button"
                      className="control-btn px-2 py-1 text-[10px]"
                      onClick={() => setQuickControlsMinimized((v) => !v)}
                    >
                      {quickControlsMinimized ? "Expand" : "Minimize"}
                    </button>
                  </div>

                  {!quickControlsMinimized ? (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          className="control-btn control-btn-primary"
                          onClick={() => {
                            setRunning(true);
                            setSelectedTopic("parallelProcessing");
                          }}
                        >
                          Start
                        </button>
                        <button className="control-btn" onClick={() => setRunning(false)}>Pause</button>
                        <button
                          className="control-btn"
                          onClick={() => {
                            setRunning(false);
                            setResetToken((v) => v + 1);
                            setActiveThreads(0);
                            setSmUtilization([0, 0, 0, 0, 0, 0]);
                            setCoreUtilization(Array(6).fill(null).map(() => Array(6).fill(0)));
                            setActiveCoreMap(Array(6).fill(null).map(() => Array(6).fill(false)));
                            setSelectedTopic("gpuArchitecture");
                          }}
                        >
                          Reset
                        </button>
                        <button
                          className="control-btn"
                          onClick={() => {
                            setBurstToken((v) => v + 1);
                            setRunning(true);
                            setSelectedTopic("cpu");
                          }}
                        >
                          Inject Burst
                        </button>
                      </div>

                      <label className="mt-2 block text-[11px] text-slate-200">
                        Policy
                        <select
                          className="control-select"
                          value={schedulingPolicy}
                          onChange={(e) => {
                            setSchedulingPolicy(e.target.value);
                            setSelectedTopic("threadScheduling");
                          }}
                        >
                          <option value="fcfs">FCFS</option>
                          <option value="roundRobin">Round Robin</option>
                          <option value="random">Random</option>
                          <option value="loadAware">Load Aware</option>
                        </select>
                      </label>

                      <div className="mt-3 rounded-md border border-slate-700/75 bg-slate-800/70 p-2 text-[11px] text-slate-200">
                        <h4 className="mb-1 text-[11px] font-semibold text-cyan-200">Live Performance</h4>
                        <p>Occupancy: <span className="text-emerald-300">{performance.occupancy}%</span></p>
                        <p>Throughput: <span className="text-emerald-300">{performance.throughput.toFixed(2)} tasks/s</span></p>
                        <p>Avg Latency: <span className="text-cyan-300">{performance.avgLatency.toFixed(2)}s</span></p>
                        <p>Scheduler Load: <span className="text-cyan-300">{performance.schedulerLoad}%</span></p>
                        <p>SM Capacity: <span className="text-cyan-300">{performance.smCapacity} active blocks/SM</span></p>
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            </div>

            <ControlPanel
              running={running}
              showParallel={showParallel}
              showCoreUtilization={showCoreUtilization}
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
                setSmUtilization([0, 0, 0, 0, 0, 0]);
                setCoreUtilization(Array(6).fill(null).map(() => Array(6).fill(0)));
                setActiveCoreMap(Array(6).fill(null).map(() => Array(6).fill(false)));
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
              onToggleCoreUtilization={() => {
                setShowCoreUtilization((v) => !v);
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
            </div>

            <div className="panel-card mb-4 text-xs text-slate-200">
              <h4 className="mb-2 text-sm font-semibold text-cyan-200">Workload Profile</h4>
              <p>Compute Complexity: <span className="text-emerald-300">{Math.round(workComplexity * 100)}%</span></p>
              <p>Memory Intensity: <span className="text-emerald-300">{Math.round(memoryIntensity * 100)}%</span></p>
              <p>Warp Divergence: <span className="text-emerald-300">{Math.round(divergence * 100)}%</span></p>
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

            {showCoreUtilization ? (
              <div className="mt-5 border-t border-slate-700/60 pt-4">
                <h4 className="mb-3 text-sm font-semibold text-cyan-200">Core Utilization</h4>
                <p className="mb-2 text-[10px] tracking-wide text-slate-400">Levels: 0 20 40 60 80 100</p>
                <div className="space-y-3 text-xs text-slate-300">
                  {coreUtilization.map((smCores, smIdx) => (
                    <div key={`core-util-sm-${smIdx}`}>
                      <p className="mb-1 text-slate-200">SM {smIdx + 1}</p>
                      <div className="grid grid-cols-3 gap-1.5">
                        {smCores.map((value, coreIdx) => (
                          <div
                            key={`core-util-${smIdx}-${coreIdx}`}
                            className="rounded border border-slate-700/70 bg-slate-800/55 px-1.5 py-1"
                          >
                            <div className="mb-1 flex items-center justify-between">
                              <span className="text-[10px] text-slate-400">C{coreIdx + 1}</span>
                              {activeCoreMap[smIdx]?.[coreIdx] ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-300">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                  Working
                                </span>
                              ) : null}
                            </div>
                            <div className="h-2 overflow-hidden rounded bg-slate-900/80">
                              <div
                                className="h-full transition-all duration-150"
                                style={{
                                  width: `${value}%`,
                                  background: "linear-gradient(90deg, #1f7a44 0%, #2fd36a 100%)"
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-6 space-y-2 text-sm text-slate-300">
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

          </aside>
          ) : null}
        </section>
      </div>
    </main>
  );
}
