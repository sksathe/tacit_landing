interface DashboardViewProps {
  onStartSession: () => void;
  onScheduleSession: () => void;
  onAutomateSessions: () => void;
}

export function DashboardView({ onStartSession, onScheduleSession, onAutomateSessions }: DashboardViewProps) {
  return (
    <>
      <div className="text-center mb-20 relative">
        <h1 className="text-[3.5rem] font-extrabold mb-4 bg-gradient-primary bg-clip-text text-transparent">
          Welcome to Tacit Studio
        </h1>
        <p className="text-muted-foreground text-[1.3rem] max-w-[800px] mx-auto">
          Transform your tacit expertise into new knowledge assets. Choose an action below to get started.
        </p>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(500px,1fr))] gap-12 max-w-[1400px] mx-auto">
        {/* Card 1: Start Tacit Session */}
        <div
          onClick={onStartSession}
          className="bg-card/50 border-2 border-primary/30 rounded-3xl p-16 transition-all duration-300 cursor-pointer relative overflow-hidden min-h-[450px] flex flex-col justify-between hover:border-primary hover:shadow-elegant hover:-translate-y-2"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 z-0" />
          <div className="relative z-10">
            <span className="inline-block bg-primary/15 border border-primary/30 text-primary px-5 py-2 rounded-full text-[0.85rem] font-semibold mb-6 tracking-wide">
              Capture Tacit Data
            </span>
            <div className="text-6xl mb-8 block">🎙️</div>
            <h2 className="text-5xl font-extrabold mb-6 text-foreground leading-tight">
              Start<br />Tacit Session
            </h2>
            <p className="text-muted-foreground text-[1.1rem] mb-10 leading-relaxed">
              Begin a new knowledge capture session with an AI agent. Start now or schedule for later.
            </p>
          </div>
          <div className="relative z-10 flex flex-row gap-4 justify-center" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={onStartSession}
              className="px-6 py-3.5 rounded-lg text-[0.95rem] font-semibold cursor-pointer transition-all border-none bg-primary text-primary-foreground shadow-elegant hover:bg-primary-glow hover:shadow-glow hover:-translate-y-0.5 flex-shrink-0 whitespace-nowrap"
            >
              Start Now
            </button>
            <button
              onClick={onScheduleSession}
              className="px-6 py-3.5 rounded-lg text-[0.95rem] font-semibold cursor-pointer transition-all bg-transparent border-2 border-primary/40 text-primary hover:border-primary hover:bg-primary/10 flex-shrink-0 whitespace-nowrap"
            >
              Schedule Session
            </button>
          </div>
        </div>

        {/* Card 2: Automate Knowledge Assets */}
        <div
          onClick={onAutomateSessions}
          className="bg-card/50 border-2 border-primary/30 rounded-3xl p-16 transition-all duration-300 cursor-pointer relative overflow-hidden min-h-[450px] flex flex-col justify-between hover:border-primary hover:shadow-elegant hover:-translate-y-2"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 z-0" />
          <div className="relative z-10">
            <span className="inline-block bg-primary/15 border border-primary/30 text-primary px-5 py-2 rounded-full text-[0.85rem] font-semibold mb-6 tracking-wide">
              Leverage Captured Data
            </span>
            <div className="text-6xl mb-8 block">⚡</div>
            <h2 className="text-5xl font-extrabold mb-6 text-foreground leading-tight">
              Automate<br />Knowledge Assets
            </h2>
            <p className="text-muted-foreground text-[1.1rem] mb-10 leading-relaxed">
              Turn your past sessions into structured knowledge. Run existing automations or build a new workflow.
            </p>
          </div>
          <div className="relative z-10 flex flex-row gap-4 justify-center" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={onAutomateSessions}
              className="px-6 py-3.5 rounded-lg text-[0.95rem] font-semibold cursor-pointer transition-all border-none bg-primary text-primary-foreground shadow-elegant hover:bg-primary-glow hover:shadow-glow hover:-translate-y-0.5 flex-shrink-0 whitespace-nowrap"
            >
              Automate Past Sessions
            </button>
            <button
              onClick={onAutomateSessions}
              className="px-6 py-3.5 rounded-lg text-[0.95rem] font-semibold cursor-pointer transition-all bg-transparent border-2 border-primary/40 text-primary hover:border-primary hover:bg-primary/10 flex-shrink-0 whitespace-nowrap"
            >
              Build New Automations
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
