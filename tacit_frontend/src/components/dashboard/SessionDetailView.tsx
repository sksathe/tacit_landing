"use client";

import { useState, useEffect } from "react";
import { GeneratedAssets } from "./GeneratedAssets";
import { AutomationOptions } from "./AutomationOptions";

interface SessionDetailViewProps {
  session: {
    agentName: string;
    sessionName: string;
    sessionId: string;
  };
  onBack: () => void;
  onOpenConfigDrawer: (type: string, title: string, icon: string) => void;
}

export function SessionDetailView({ session, onBack, onOpenConfigDrawer }: SessionDetailViewProps) {
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
      <div className="flex items-center gap-2 mb-8 text-[0.9rem] text-[#a0a0a0]">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onBack();
          }}
          className="text-[#a0a0a0] no-underline transition-colors hover:text-[#10b981]"
        >
          Home
        </a>
        <span className="text-[rgba(16,185,129,0.4)]">|</span>
        <span className="text-[#a0a0a0]">Automate Past Session</span>
        <span className="text-[rgba(16,185,129,0.4)]">|</span>
        <span className="text-[#10b981] font-semibold">{session.agentName}</span>
      </div>

      <div className="bg-[rgba(42,42,42,0.5)] border-2 border-[rgba(16,185,129,0.3)] rounded-[20px] p-12 mb-12">
        <div className="flex justify-between items-start mb-8 pb-8 border-b border-[rgba(16,185,129,0.2)]">
          <div>
            <h2 className="text-[2rem] font-extrabold text-white mb-2">{session.sessionName}</h2>
            <p className="text-[#a0a0a0] text-[0.9rem] font-mono">Session ID: {session.sessionId}</p>
          </div>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-8 mb-10">
          <div className="flex flex-col gap-2">
            <div className="text-[0.85rem] font-bold text-[rgba(16,185,129,0.8)] uppercase tracking-wide">
              Agent Name
            </div>
            <div className="text-[1.1rem] text-white font-medium">{session.agentName} (Rachael)</div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="text-[0.85rem] font-bold text-[rgba(16,185,129,0.8)] uppercase tracking-wide">
              Topic
            </div>
            <div className="text-[1.1rem] text-white font-medium">Financial Compliance & Reporting</div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="text-[0.85rem] font-bold text-[rgba(16,185,129,0.8)] uppercase tracking-wide">
              Invited Parties
            </div>
            <div className="text-[1.1rem] text-white font-medium">
              john.doe@company.com, sarah.smith@company.com
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="text-[0.85rem] font-bold text-[rgba(16,185,129,0.8)] uppercase tracking-wide">
              Date & Time
            </div>
            <div className="text-[1.1rem] text-white font-medium">December 15, 2024 at 2:30 PM EST</div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="text-[0.85rem] font-bold text-[rgba(16,185,129,0.8)] uppercase tracking-wide">
              Duration
            </div>
            <div className="text-[1.1rem] text-white font-medium">45 minutes</div>
          </div>
        </div>

        <div className="bg-[rgba(0,0,0,0.3)] rounded-2xl p-10 text-center">
          <button
            onClick={togglePlayPause}
            className="w-[120px] h-[120px] rounded-full bg-gradient-to-br from-[#10b981] to-[#059669] border-none text-white text-5xl cursor-pointer mx-auto mb-6 flex items-center justify-center transition-all shadow-[0_10px_30px_rgba(16,185,129,0.4)] hover:scale-105 hover:shadow-[0_15px_40px_rgba(16,185,129,0.6)]"
          >
            {isPlaying ? "⏸" : "▶"}
          </button>
          <div className="flex items-center gap-6 max-w-[600px] mx-auto">
            <span className="text-[#a0a0a0] text-[0.9rem] font-mono">15:42</span>
            <div
              onClick={handleSeek}
              className="flex-1 h-2 bg-[rgba(16,185,129,0.2)] rounded cursor-pointer overflow-hidden"
            >
              <div
                className="h-full bg-[#10b981] transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[#a0a0a0] text-[0.9rem] font-mono">45:00</span>
          </div>
        </div>
      </div>

      <GeneratedAssets assets={assets} />
      <AutomationOptions onOpenConfigDrawer={onOpenConfigDrawer} />
    </>
  );
}

