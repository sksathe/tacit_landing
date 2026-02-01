"use client";

interface DashboardViewProps {
  onStartSession: () => void;
  onScheduleSession: () => void;
  onAutomateSessions: () => void;
}

export function DashboardView({ onStartSession, onScheduleSession, onAutomateSessions }: DashboardViewProps) {
  return (
    <>
      <div className="text-center mb-20 relative">
        <h1 className="text-[3.5rem] font-extrabold mb-4 bg-gradient-to-br from-white to-[#10b981] bg-clip-text text-transparent">
          Welcome to Tacit Studio
        </h1>
        <p className="text-[#a0a0a0] text-[1.3rem] max-w-[800px] mx-auto">
          Transform your tacit expertise into new knowledge assets. Choose an action below to get started.
        </p>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(500px,1fr))] gap-12 max-w-[1400px] mx-auto">
        {/* Card 1: Start Tacit Session */}
        <div
          onClick={onStartSession}
          className="bg-[rgba(42,42,42,0.5)] border-2 border-[rgba(16,185,129,0.3)] rounded-3xl p-16 transition-all duration-300 cursor-pointer relative overflow-hidden min-h-[450px] flex flex-col justify-between hover:border-[#10b981] hover:shadow-[0_20px_60px_rgba(16,185,129,0.3)] hover:-translate-y-2"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[rgba(16,185,129,0.05)] to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 z-0" />
          <div className="relative z-10">
            <span className="inline-block bg-[rgba(16,185,129,0.15)] border border-[rgba(16,185,129,0.3)] text-[#10b981] px-5 py-2 rounded-full text-[0.85rem] font-semibold mb-6 tracking-wide">
              Capture Tacit Data
            </span>
            <div className="text-6xl mb-8 block">🎙️</div>
            <h2 className="text-5xl font-extrabold mb-6 text-white leading-tight">
              Start<br />Tacit Session
            </h2>
            <p className="text-[#a0a0a0] text-[1.1rem] mb-10 leading-relaxed">
              Begin a new knowledge capture session with an AI agent. Start now or schedule for later.
            </p>
          </div>
          <div className="relative z-10 flex flex-row gap-4 justify-center" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={onStartSession}
              className="px-6 py-3.5 rounded-lg text-[0.95rem] font-semibold cursor-pointer transition-all border-none bg-[#10b981] text-[#0a0a0a] shadow-[0_4px_15px_rgba(16,185,129,0.3)] hover:bg-[#14d89a] hover:shadow-[0_6px_20px_rgba(16,185,129,0.5)] hover:-translate-y-0.5 flex-shrink-0 whitespace-nowrap"
            >
              Start Now
            </button>
            <button
              onClick={onScheduleSession}
              className="px-6 py-3.5 rounded-lg text-[0.95rem] font-semibold cursor-pointer transition-all bg-transparent border-2 border-[rgba(16,185,129,0.4)] text-[#10b981] hover:border-[#10b981] hover:bg-[rgba(16,185,129,0.1)] flex-shrink-0 whitespace-nowrap"
            >
              Schedule Session
            </button>
          </div>
        </div>

        {/* Card 2: Automate Knowledge Assets */}
        <div
          onClick={onAutomateSessions}
          className="bg-[rgba(42,42,42,0.5)] border-2 border-[rgba(16,185,129,0.3)] rounded-3xl p-16 transition-all duration-300 cursor-pointer relative overflow-hidden min-h-[450px] flex flex-col justify-between hover:border-[#10b981] hover:shadow-[0_20px_60px_rgba(16,185,129,0.3)] hover:-translate-y-2"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[rgba(16,185,129,0.05)] to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 z-0" />
          <div className="relative z-10">
            <span className="inline-block bg-[rgba(16,185,129,0.15)] border border-[rgba(16,185,129,0.3)] text-[#10b981] px-5 py-2 rounded-full text-[0.85rem] font-semibold mb-6 tracking-wide">
              Leverage Captured Data
            </span>
            <div className="text-6xl mb-8 block">⚡</div>
            <h2 className="text-5xl font-extrabold mb-6 text-white leading-tight">
              Automate<br />Knowledge Assets
            </h2>
            <p className="text-[#a0a0a0] text-[1.1rem] mb-10 leading-relaxed">
              Turn your past sessions into structured knowledge. Run existing automations or build a new workflow.
            </p>
          </div>
          <div className="relative z-10 flex flex-row gap-4 justify-center" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={onAutomateSessions}
              className="px-6 py-3.5 rounded-lg text-[0.95rem] font-semibold cursor-pointer transition-all border-none bg-[#10b981] text-[#0a0a0a] shadow-[0_4px_15px_rgba(16,185,129,0.3)] hover:bg-[#14d89a] hover:shadow-[0_6px_20px_rgba(16,185,129,0.5)] hover:-translate-y-0.5 flex-shrink-0 whitespace-nowrap"
            >
              Automate Past Sessions
            </button>
            <button
              onClick={onAutomateSessions}
              className="px-6 py-3.5 rounded-lg text-[0.95rem] font-semibold cursor-pointer transition-all bg-transparent border-2 border-[rgba(16,185,129,0.4)] text-[#10b981] hover:border-[#10b981] hover:bg-[rgba(16,185,129,0.1)] flex-shrink-0 whitespace-nowrap"
            >
              Build New Automations
            </button>
          </div>
        </div>
      </div>
    </>
  );
}


