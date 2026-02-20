import { useState, useEffect } from "react";
import { GeneratedAssets } from "./GeneratedAssets";
import { AutomationOptions } from "./AutomationOptions";
import type { SessionItem } from "./AutomateSessionsList";

interface SessionDetailViewProps {
  session: {
    agentName: string;
    sessionName: string;
    sessionId: string;
  };
  /** When provided, show "Choose the session to automate" dropdown and allow switching. */
  sessions?: SessionItem[];
  onSessionChange?: (session: SessionItem) => void;
  onBack: () => void;
  /** When provided, show a link/button to go back to the sessions list (same agent). */
  onBackToSessions?: () => void;
  onOpenConfigDrawer: (type: string, title: string, icon: string) => void;
}

export function SessionDetailView({
  session,
  sessions = [],
  onSessionChange,
  onBack,
  onBackToSessions,
  onOpenConfigDrawer,
}: SessionDetailViewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(35);
  const [assets, setAssets] = useState<Array<{ type: string; title: string; icon: string; timestamp: string }>>([]);

  useEffect(() => {
    const handleAssetGenerated = (event: CustomEvent) => {
      const { type, title, icon } = event.detail;
      const now = new Date();
      const timestamp = now.toLocaleString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

      setAssets((prev) => [
        {
          type,
          title,
          icon,
          timestamp,
        },
        ...prev,
      ]);

      // Scroll to assets section after a short delay
      setTimeout(() => {
        const assetsSection = document.getElementById("generated-assets-section");
        if (assetsSection) {
          assetsSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    };

    window.addEventListener("assetGenerated" as any, handleAssetGenerated as EventListener);
    return () => {
      window.removeEventListener("assetGenerated" as any, handleAssetGenerated as EventListener);
    };
  }, []);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const progressBar = e.currentTarget;
    const clickPosition = e.nativeEvent.offsetX;
    const barWidth = progressBar.offsetWidth;
    const percentage = (clickPosition / barWidth) * 100;
    setProgress(percentage);
  };

  return (
    <>
      <div className="flex items-center gap-2 mb-8 text-[0.9rem] text-muted-foreground flex-wrap">
        <button
          type="button"
          onClick={onBack}
          className="text-muted-foreground no-underline transition-colors hover:text-primary bg-transparent border-none cursor-pointer p-0"
        >
          Home
        </button>
        {onBackToSessions && (
          <>
            <span className="text-primary/40">|</span>
            <button
              type="button"
              onClick={onBackToSessions}
              className="text-muted-foreground no-underline transition-colors hover:text-primary bg-transparent border-none cursor-pointer p-0"
            >
              Sessions
            </button>
          </>
        )}
        <span className="text-primary/40">|</span>
        <span className="text-muted-foreground">Automate Past Session</span>
        <span className="text-primary/40">|</span>
        <span className="text-primary font-semibold">{session.agentName}</span>
      </div>

      {sessions.length > 0 && onSessionChange && (
        <div className="mb-6">
          <label htmlFor="session-select" className="block text-[0.85rem] font-bold text-primary/80 uppercase tracking-wide mb-2">
            Choose the session to automate
          </label>
          <select
            id="session-select"
            value={session.sessionId}
            onChange={(e) => {
              const s = sessions.find((s) => s.sessionId === e.target.value);
              if (s) onSessionChange(s);
            }}
            className="w-full max-w-md bg-card border-2 border-primary/30 rounded-xl px-4 py-3 text-foreground text-[0.95rem] focus:outline-none focus:border-primary"
          >
            {sessions.map((s) => (
              <option key={s.sessionId} value={s.sessionId}>
                {s.sessionName}
                {s.startedAt ? ` · ${new Date(s.startedAt).toLocaleDateString()}` : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="bg-card/50 border-2 border-primary/30 rounded-[20px] p-12 mb-12">
        <div className="flex justify-between items-start mb-8 pb-8 border-b border-primary/20">
          <div>
            <h2 className="text-[2rem] font-extrabold text-foreground mb-2">{session.sessionName}</h2>
            <p className="text-muted-foreground text-[0.9rem] font-mono">Session ID: {session.sessionId}</p>
          </div>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-8 mb-10">
          <div className="flex flex-col gap-2">
            <div className="text-[0.85rem] font-bold text-primary/80 uppercase tracking-wide">
              Agent Name
            </div>
            <div className="text-[1.1rem] text-foreground font-medium">{session.agentName}</div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="text-[0.85rem] font-bold text-primary/80 uppercase tracking-wide">
              Topic
            </div>
            <div className="text-[1.1rem] text-foreground font-medium">Financial Compliance & Reporting</div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="text-[0.85rem] font-bold text-primary/80 uppercase tracking-wide">
              Invited Parties
            </div>
            <div className="text-[1.1rem] text-foreground font-medium">
              john.doe@company.com, sarah.smith@company.com
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="text-[0.85rem] font-bold text-primary/80 uppercase tracking-wide">
              Date & Time
            </div>
            <div className="text-[1.1rem] text-foreground font-medium">December 15, 2024 at 2:30 PM EST</div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="text-[0.85rem] font-bold text-primary/80 uppercase tracking-wide">
              Duration
            </div>
            <div className="text-[1.1rem] text-foreground font-medium">45 minutes</div>
          </div>
        </div>

        <div className="bg-black/30 rounded-2xl p-10 text-center">
          <button
            onClick={togglePlayPause}
            className="w-[120px] h-[120px] rounded-full bg-gradient-primary border-none text-primary-foreground text-5xl cursor-pointer mx-auto mb-6 flex items-center justify-center transition-all shadow-elegant hover:scale-105 hover:shadow-glow"
          >
            {isPlaying ? "⏸" : "▶"}
          </button>
          <div className="flex items-center gap-6 max-w-[600px] mx-auto">
            <span className="text-muted-foreground text-[0.9rem] font-mono">15:42</span>
            <div
              onClick={handleSeek}
              className="flex-1 h-2 bg-primary/20 rounded cursor-pointer overflow-hidden"
            >
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-muted-foreground text-[0.9rem] font-mono">45:00</span>
          </div>
        </div>
      </div>

      <GeneratedAssets assets={assets} />
      <AutomationOptions onOpenConfigDrawer={onOpenConfigDrawer} />
    </>
  );
}
