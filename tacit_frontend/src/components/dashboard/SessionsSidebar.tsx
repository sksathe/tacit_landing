"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface SessionsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSessionClick: (agentName: string, sessionName: string, sessionId: string) => void;
}

export function SessionsSidebar({ isOpen, onClose, onSessionClick }: SessionsSidebarProps) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    agentA: false,
    agentB: false,
    allAutomations: false,
    drafts: false,
  });

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  return (
    <div
      className={`fixed left-0 top-0 w-[280px] h-screen bg-panel border-r border-primary/30 transform transition-transform duration-300 z-[999] pt-20 pb-8 overflow-y-auto backdrop-blur-[10px] ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <button
        onClick={onClose}
        className="absolute top-6 right-6 w-[50px] h-[50px] rounded-xl bg-primary/15 border-2 border-primary/30 text-primary text-[1.8rem] font-normal flex items-center justify-center cursor-pointer transition-all hover:bg-primary/25 hover:border-primary hover:shadow-[var(--shadow-primary)] z-[1000] leading-none"
      >
        <X className="w-6 h-6 stroke-[2] text-primary" />
      </button>

      <div className="mb-8">
        <div className="text-[0.75rem] font-bold text-primary/60 uppercase tracking-[1.5px] px-6 mb-4">
          Past Sessions
        </div>

        <div className="mb-2">
          <div
            onClick={() => toggleGroup("agentA")}
            className={`flex items-center gap-3 px-6 py-3.5 text-foreground cursor-pointer transition-all border-l-[3px] ${
              expandedGroups.agentA
                ? "bg-primary/10 text-primary border-l-primary/50"
                : "border-l-transparent hover:bg-primary/10 hover:border-l-primary/50"
            }`}
          >
            <span className="text-[1.2rem] w-6 flex items-center justify-center">👩</span>
            <span className="flex-1 font-semibold text-[0.95rem]">Agent A</span>
            <span className={`text-[0.75rem] transition-transform duration-300 ${expandedGroups.agentA ? "rotate-90" : ""}`}>▶</span>
          </div>
          {expandedGroups.agentA && (
            <div className="flex flex-col bg-black/20">
              <div
                onClick={() => onSessionClick("Agent A", "Session 1 - Finance", "SID-2024-001")}
                className="flex items-center gap-3 px-6 py-3 pl-12 text-muted-foreground cursor-pointer transition-all border-l-[3px] border-l-transparent hover:bg-primary/10 hover:text-foreground hover:border-l-primary/50 text-[0.9rem]"
              >
                Session 1 - Finance
              </div>
              <div
                onClick={() => onSessionClick("Agent A", "Session 2 - Operations", "SID-2024-002")}
                className="flex items-center gap-3 px-6 py-3 pl-12 text-muted-foreground cursor-pointer transition-all border-l-[3px] border-l-transparent hover:bg-primary/10 hover:text-foreground hover:border-l-primary/50 text-[0.9rem]"
              >
                Session 2 - Operations
              </div>
              <div
                onClick={() => onSessionClick("Agent A", "Session 3 - Compliance", "SID-2024-003")}
                className="flex items-center gap-3 px-6 py-3 pl-12 text-muted-foreground cursor-pointer transition-all border-l-[3px] border-l-transparent hover:bg-primary/10 hover:text-foreground hover:border-l-primary/50 text-[0.9rem]"
              >
                Session 3 - Compliance
              </div>
            </div>
          )}
        </div>

        <div className="mb-2">
          <div
            onClick={() => toggleGroup("agentB")}
            className={`flex items-center gap-3 px-6 py-3.5 text-foreground cursor-pointer transition-all border-l-[3px] ${
              expandedGroups.agentB
                ? "bg-primary/10 text-primary border-l-primary/50"
                : "border-l-transparent hover:bg-primary/10 hover:border-l-primary/50"
            }`}
          >
            <span className="text-[1.2rem] w-6 flex items-center justify-center">👨</span>
            <span className="flex-1 font-semibold text-[0.95rem]">Agent B</span>
            <span className={`text-[0.75rem] transition-transform duration-300 ${expandedGroups.agentB ? "rotate-90" : ""}`}>▶</span>
          </div>
          {expandedGroups.agentB && (
            <div className="flex flex-col bg-black/20">
              <div
                onClick={() => onSessionClick("Agent B", "Session 1 - Data Analysis", "SID-2024-004")}
                className="flex items-center gap-3 px-6 py-3 pl-12 text-muted-foreground cursor-pointer transition-all border-l-[3px] border-l-transparent hover:bg-primary/10 hover:text-foreground hover:border-l-primary/50 text-[0.9rem]"
              >
                Session 1 - Data Analysis
              </div>
              <div
                onClick={() => onSessionClick("Agent B", "Session 2 - Strategy", "SID-2024-005")}
                className="flex items-center gap-3 px-6 py-3 pl-12 text-muted-foreground cursor-pointer transition-all border-l-[3px] border-l-transparent hover:bg-primary/10 hover:text-foreground hover:border-l-primary/50 text-[0.9rem]"
              >
                Session 2 - Strategy
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mb-8">
        <div className="text-[0.75rem] font-bold text-primary/60 uppercase tracking-[1.5px] px-6 mb-4">
          Automations
        </div>

        <div className="mb-2">
          <div
            onClick={() => toggleGroup("allAutomations")}
            className={`flex items-center gap-3 px-6 py-3.5 text-foreground cursor-pointer transition-all border-l-[3px] ${
              expandedGroups.allAutomations
                ? "bg-primary/10 text-primary border-l-primary/50"
                : "border-l-transparent hover:bg-primary/10 hover:border-l-primary/50"
            }`}
          >
            <span className="text-[1.2rem] w-6 flex items-center justify-center">⚡</span>
            <span className="flex-1 font-semibold text-[0.95rem]">All Automations</span>
            <span className={`text-[0.75rem] transition-transform duration-300 ${expandedGroups.allAutomations ? "rotate-90" : ""}`}>▶</span>
          </div>
          {expandedGroups.allAutomations && (
            <div className="flex flex-col bg-black/20">
              <div className="flex items-center gap-3 px-6 py-3 pl-12 text-muted-foreground cursor-pointer transition-all border-l-[3px] border-l-transparent hover:bg-primary/10 hover:text-foreground hover:border-l-primary/50 text-[0.9rem]">
                Workflow 1
              </div>
              <div className="flex items-center gap-3 px-6 py-3 pl-12 text-muted-foreground cursor-pointer transition-all border-l-[3px] border-l-transparent hover:bg-primary/10 hover:text-foreground hover:border-l-primary/50 text-[0.9rem]">
                Workflow 2
              </div>
              <div className="flex items-center gap-3 px-6 py-3 pl-12 text-muted-foreground cursor-pointer transition-all border-l-[3px] border-l-transparent hover:bg-primary/10 hover:text-foreground hover:border-l-primary/50 text-[0.9rem]">
                Workflow 3
              </div>
            </div>
          )}
        </div>

        <div className="mb-2">
          <div
            onClick={() => toggleGroup("drafts")}
            className={`flex items-center gap-3 px-6 py-3.5 text-foreground cursor-pointer transition-all border-l-[3px] ${
              expandedGroups.drafts
                ? "bg-primary/10 text-primary border-l-primary/50"
                : "border-l-transparent hover:bg-primary/10 hover:border-l-primary/50"
            }`}
          >
            <span className="text-[1.2rem] w-6 flex items-center justify-center">📝</span>
            <span className="flex-1 font-semibold text-[0.95rem]">Drafts</span>
            <span className={`text-[0.75rem] transition-transform duration-300 ${expandedGroups.drafts ? "rotate-90" : ""}`}>▶</span>
          </div>
          {expandedGroups.drafts && (
            <div className="flex flex-col bg-black/20">
              <div className="flex items-center gap-3 px-6 py-3 pl-12 text-muted-foreground cursor-pointer transition-all border-l-[3px] border-l-transparent hover:bg-primary/10 hover:text-foreground hover:border-l-primary/50 text-[0.9rem]">
                Draft Automation 1
              </div>
              <div className="flex items-center gap-3 px-6 py-3 pl-12 text-muted-foreground cursor-pointer transition-all border-l-[3px] border-l-transparent hover:bg-primary/10 hover:text-foreground hover:border-l-primary/50 text-[0.9rem]">
                Draft Automation 2
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


