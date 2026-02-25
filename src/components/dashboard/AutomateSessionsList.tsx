import { useState, useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import type { TacitAgent } from "@/data/agents";

export interface SessionItem {
  sessionId: string;
  sessionName: string;
  agentName: string;
  meetingTitle?: string;
  startedAt?: string;
  duration?: string;
}

interface AutomateSessionsListProps {
  agent: TacitAgent;
  onSelectSession: (session: SessionItem) => void;
  onSessionsLoaded?: (sessions: SessionItem[]) => void;
  onBack: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || "";

export function AutomateSessionsList({ agent, onSelectSession, onSessionsLoaded, onBack }: AutomateSessionsListProps) {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchSessions() {
      setLoading(true);
      setError(null);
      try {
        const { data: { session } } = await (await import("@/integrations/supabase/client")).supabase.auth.getSession();
        if (!session) {
          const mock = getMockSessions(agent);
          setSessions(mock);
          onSessionsLoaded?.(mock);
          setLoading(false);
          return;
        }

        const projectsRes = await fetch(`${API_URL}/api/projects`, {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        if (!projectsRes.ok || cancelled) {
          setLoading(false);
          return;
        }
        const projectsData = await projectsRes.json();
        const projects = projectsData?.projects ?? projectsData ?? [];
        const projectId = Array.isArray(projects) && projects.length > 0 ? projects[0].id : null;

        if (!projectId) {
          const mock = getMockSessions(agent);
          setSessions(mock);
          onSessionsLoaded?.(mock);
          setLoading(false);
          return;
        }

        const sessionsRes = await fetch(`${API_URL}/api/sessions/project/${projectId}`, {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        if (!sessionsRes.ok) throw new Error("Failed to load sessions");
        const data = await sessionsRes.json();
        const list = data?.sessions ?? [];
        // Only show sessions for this agent (meeting.agent_name or transcript.agent_name)
        const agentNameLower = agent.name.toLowerCase();
        const forThisAgent = list.filter((s: any) => {
          const meetingAgent = (s.meeting?.agent_name || "").toLowerCase();
          const transcriptAgent = (s.transcript?.agent_name || "").toLowerCase();
          return meetingAgent === agentNameLower || transcriptAgent === agentNameLower;
        });
        const items: SessionItem[] = forThisAgent.map((s: any) => ({
          sessionId: s.id,
          sessionName: s.meeting?.title ?? `Session ${s.id.slice(0, 8)}`,
          agentName: s.meeting?.agent_name || s.transcript?.agent_name || agent.name,
          meetingTitle: s.meeting?.title,
          startedAt: s.started_at,
          duration: s.duration_sec != null ? `${Math.round(Number(s.duration_sec) / 60)} min` : undefined,
        }));
        if (!cancelled) {
          setSessions(items);
          onSessionsLoaded?.(items);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load sessions");
          const mock = getMockSessions(agent);
          setSessions(mock);
          onSessionsLoaded?.(mock);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchSessions();
    return () => { cancelled = true; };
  }, [agent]);

  return (
    <>
      <div className="flex items-center gap-2 mb-8 text-[0.9rem] text-muted-foreground">
        <button
          type="button"
          onClick={onBack}
          className="text-muted-foreground no-underline transition-colors hover:text-primary flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          Agents
        </button>
        <span className="text-primary/40">|</span>
        <span className="text-primary font-semibold">{agent.name}</span>
      </div>

      <div className="text-center mb-10">
        <h1 className="text-[2rem] font-extrabold mb-2 text-foreground">Sessions for {agent.name}</h1>
        <p className="text-muted-foreground text-[1rem]">
          Choose the session to automate. Call details and transcripts are available when you open a session.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading sessions…</div>
      ) : (
        <div className="max-w-[700px] mx-auto space-y-2">
          {error && (
            <p className="text-sm text-amber-600 dark:text-amber-400 mb-4">
              Could not load from server: {error}. Showing sample sessions.
            </p>
          )}
          {sessions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No sessions yet for this agent.</p>
          ) : (
            sessions.map((session) => (
              <button
                key={session.sessionId}
                type="button"
                onClick={() => onSelectSession(session)}
                className="w-full flex items-center justify-between gap-4 bg-card/50 border-2 border-primary/30 rounded-xl px-6 py-4 text-left transition-all hover:border-primary hover:shadow-elegant"
              >
                <div>
                  <div className="font-semibold text-foreground">{session.sessionName}</div>
                  {(session.startedAt || session.duration) && (
                    <div className="text-[0.85rem] text-muted-foreground mt-0.5">
                      {session.startedAt
                        ? new Date(session.startedAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })
                        : null}
                      {session.duration ? ` · ${session.duration}` : null}
                    </div>
                  )}
                </div>
                <span className="text-primary text-[0.9rem] font-medium">Open →</span>
              </button>
            ))
          )}
        </div>
      )}
    </>
  );
}

function getMockSessions(agent: TacitAgent): SessionItem[] {
  const topics: Record<string, string[]> = {
    rachael: ["Finance Review", "Budget Planning", "Q4 Forecast"],
    ross: ["Compliance Review", "Policy Update", "Audit Prep"],
    monica: ["Operations Runbook", "Process Documentation", "Vendor Coordination"],
    chandler: ["Data Analysis", "Metrics Review", "Dashboard Design"],
  };
  const list = topics[agent.id as keyof typeof topics] ?? ["Session 1", "Session 2", "Session 3"];
  return list.map((title, i) => ({
    sessionId: `SID-${agent.id}-${2024}-${String(i + 1).padStart(3, "0")}`,
    sessionName: title,
    agentName: agent.name,
  }));
}
