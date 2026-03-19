"use client";

export default function ControlPanel({
  running,
  showParallel,
  tensorCoresEnabled,
  simulationSpeed,
  taskRate,
  workComplexity,
  memoryIntensity,
  divergence,
  autoRotate,
  activeThreads,
  taskStats,
  performance,
  schedulingPolicy,
  onStart,
  onPause,
  onReset,
  onToggleSmHighlight,
  onToggleScheduling,
  onToggleParallel,
  onToggleTensorCores,
  onSpeedChange,
  onTaskRateChange,
  onWorkComplexityChange,
  onMemoryIntensityChange,
  onDivergenceChange,
  onToggleAutoRotate,
  onPolicyChange,
  onSpawnBurst
}) {
  const statusTone = running ? "text-emerald-300" : "text-amber-300";

  return (
    <div className="panel-shell">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-wide text-cyan-200">Simulation Controls</h2>
        <span className={`rounded-full border border-slate-600/70 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${statusTone}`}>
          {running ? "Running" : "Paused"}
        </span>
      </div>

      <div className="panel-card">
        <p className="control-section-title">Primary Actions</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <button className="control-btn control-btn-primary" onClick={onStart}>Start</button>
          <button className="control-btn" onClick={onPause}>Pause</button>
          <button className="control-btn" onClick={onReset}>Reset</button>
          <button className="control-btn" onClick={onSpawnBurst}>Inject Burst</button>
        </div>
      </div>

      <div className="panel-card mt-3">
        <p className="control-section-title">Visual Toggles</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <button className="control-btn" onClick={onToggleSmHighlight}>SM Highlight</button>
          <button className="control-btn" onClick={onToggleScheduling}>Scheduling View</button>
          <button className="control-btn" onClick={onToggleParallel}>
            Parallel: {showParallel ? "On" : "Off"}
          </button>
          <button className="control-btn" onClick={onToggleTensorCores}>
            Tensor Cores: {tensorCoresEnabled ? "On" : "Off"}
          </button>
          <button className="control-btn" onClick={onToggleAutoRotate}>
            Auto-Rotate: {autoRotate ? "On" : "Off"}
          </button>
        </div>
      </div>

      <div className="panel-card mt-3">
        <p className="control-section-title">Scheduling</p>
        <label className="text-xs text-slate-200">
          Policy
          <select
            className="control-select"
            value={schedulingPolicy}
            onChange={(e) => onPolicyChange(e.target.value)}
          >
            <option value="fcfs">FCFS</option>
            <option value="roundRobin">Round Robin</option>
            <option value="random">Random</option>
            <option value="loadAware">Load Aware</option>
          </select>
        </label>
      </div>

      <div className="panel-card mt-3">
        <p className="control-section-title">Runtime Parameters</p>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-xs text-slate-200">
            Simulation Speed: <span className="text-cyan-300">{simulationSpeed.toFixed(1)}x</span>
            <input
              className="control-slider"
              type="range"
              min="0.4"
              max="2.4"
              step="0.1"
              value={simulationSpeed}
              onChange={(e) => onSpeedChange(Number(e.target.value))}
            />
          </label>

          <label className="text-xs text-slate-200">
            Task Injection Rate: <span className="text-cyan-300">{taskRate.toFixed(2)}s</span>
            <input
              className="control-slider"
              type="range"
              min="0.12"
              max="0.9"
              step="0.01"
              value={taskRate}
              onChange={(e) => onTaskRateChange(Number(e.target.value))}
            />
          </label>

          <label className="text-xs text-slate-200">
            Compute Complexity: <span className="text-cyan-300">{Math.round(workComplexity * 100)}%</span>
            <input
              className="control-slider"
              type="range"
              min="0.1"
              max="1"
              step="0.01"
              value={workComplexity}
              onChange={(e) => onWorkComplexityChange(Number(e.target.value))}
            />
          </label>

          <label className="text-xs text-slate-200">
            Memory Intensity: <span className="text-cyan-300">{Math.round(memoryIntensity * 100)}%</span>
            <input
              className="control-slider"
              type="range"
              min="0.1"
              max="1"
              step="0.01"
              value={memoryIntensity}
              onChange={(e) => onMemoryIntensityChange(Number(e.target.value))}
            />
          </label>

          <label className="text-xs text-slate-200">
            Warp Divergence: <span className="text-cyan-300">{Math.round(divergence * 100)}%</span>
            <input
              className="control-slider"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={divergence}
              onChange={(e) => onDivergenceChange(Number(e.target.value))}
            />
          </label>
        </div>
      </div>

      <div className="panel-card mt-3">
        <p className="control-section-title">Live Metrics</p>
        <div className="metric-grid">
          <div className="metric-pill"><span>Status</span><strong>{running ? "Running" : "Paused"}</strong></div>
          <div className="metric-pill"><span>Active</span><strong>{activeThreads}</strong></div>
          <div className="metric-pill"><span>Queued</span><strong>{taskStats.queued}</strong></div>
          <div className="metric-pill"><span>Dispatched</span><strong>{taskStats.dispatched}</strong></div>
          <div className="metric-pill"><span>Executing</span><strong>{taskStats.executing}</strong></div>
          <div className="metric-pill"><span>Completed</span><strong>{taskStats.completed}</strong></div>
          <div className="metric-pill"><span>Occupancy</span><strong>{performance.occupancy}%</strong></div>
          <div className="metric-pill"><span>Throughput</span><strong>{performance.throughput.toFixed(2)}/s</strong></div>
          <div className="metric-pill"><span>Latency</span><strong>{performance.avgLatency.toFixed(2)}s</strong></div>
          <div className="metric-pill"><span>Scheduler</span><strong>{performance.schedulerLoad}%</strong></div>
        </div>
      </div>
    </div>
  );
}
