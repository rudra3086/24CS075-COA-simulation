import TensorCoreSimulation from "../components/TensorCoreSimulation";

export default function TensorCoreSimulationPage() {
  return (
    <main className="hardware-bg min-h-screen px-4 py-5 text-slate-100 md:px-6">
      <div className="mx-auto max-w-[1400px]">
        <TensorCoreSimulation simulationSpeed={1} />
      </div>
    </main>
  );
}
