import { useState, useEffect } from "react";
import { GeneratedAssets } from "./GeneratedAssets";
import { AutomationOptions } from "./AutomationOptions";
import type { SessionItem } from "./AutomateSessionsList";

const API_URL = import.meta.env.VITE_API_URL || "";

/** Summary row from Supabase */
interface SummaryDetails {
  id?: string;
  summary_text?: string | null;
  key_points?: string[] | null;
  action_items?: any[] | null;
  model?: string | null;
  created_at?: string | null;
}

/** Session + meeting + invitees from GET /api/sessions/:id */
interface SessionDetails {
  id: string;
  duration_sec?: number | null;
  started_at?: string | null;
  meeting?: {
    title?: string;
    agenda?: string | null;
    agent_name?: string | null;
    scheduled_start_at?: string;
    scheduled_end_at?: string;
    meeting_invitees?: Array<{ email?: string; name?: string }>;
  } | null;
  /** Transcript relation: may be array (Supabase one-to-many) or single object */
  transcript?: Array<{ raw?: unknown }> | { raw?: unknown } | null;
  /** Embedded summary from summaries table, if it exists */
  summary?: SummaryDetails | null;
}

interface ClarityDimension {
  id: string;
  label: string;
  emoji: string;
  score: number;
  whyHigh: string[];
  whyLow: string[];
}

interface ClarityScore {
  model?: string;
  title?: string;
  dimensions: ClarityDimension[];
  overallScore?: number;
  overallLabel?: string;
  interpretation: string[];
}

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

function formatDateTime(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  });
}

function formatDuration(sec: number | undefined | null): string {
  if (sec == null || sec <= 0) return "—";
  const m = Math.floor(sec / 60);
  if (m < 60) return `${m} minute${m !== 1 ? "s" : ""}`;
  const h = Math.floor(m / 60);
  const mins = m % 60;
  if (mins === 0) return `${h} hour${h !== 1 ? "s" : ""}`;
  return `${h}h ${mins}m`;
}

function hasTranscript(details: SessionDetails | null): boolean {
  if (!details?.transcript) return false;
  const t = Array.isArray(details.transcript) ? details.transcript[0] : details.transcript;
  return Boolean(t?.raw);
}

export function SessionDetailView({
  session,
  sessions = [],
  onSessionChange,
  onBack,
  onBackToSessions,
  onOpenConfigDrawer,
}: SessionDetailViewProps) {
  const [sessionDetails, setSessionDetails] = useState<SessionDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(true);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [summaries, setSummaries] = useState<SummaryDetails[]>([]);
  const [isSummaryPanelOpen, setIsSummaryPanelOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(35);
  const [assets, setAssets] = useState<Array<{ type: string; title: string; icon: string; timestamp: string }>>([]);
  const [clarityScore, setClarityScore] = useState<ClarityScore | null>(null);
  const [expandedDimensionId, setExpandedDimensionId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDetails() {
      setDetailsLoading(true);
      setDetailsError(null);
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data: { session: authSession } } = await supabase.auth.getSession();
        if (!authSession || cancelled) return;

        const res = await fetch(`${API_URL}/api/sessions/${session.sessionId}`, {
          headers: { Authorization: `Bearer ${authSession.access_token}` },
        });
        if (!res.ok) throw new Error("Failed to load session details");
        const data = await res.json();
        if (!cancelled) {
          setSessionDetails(data.session ?? null);
        }
      } catch (e) {
        if (!cancelled) setDetailsError(e instanceof Error ? e.message : "Failed to load session");
      } finally {
        if (!cancelled) setDetailsLoading(false);
      }
    }

    loadDetails();
    return () => { cancelled = true; };
  }, [session.sessionId]);

  // Load summary history for this session
  useEffect(() => {
    let cancelled = false;

    async function loadSummaries() {
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data: { session: authSession } } = await supabase.auth.getSession();
        if (!authSession || cancelled) return;

        const res = await fetch(`${API_URL}/api/sessions/${session.sessionId}/summaries`, {
          headers: { Authorization: `Bearer ${authSession.access_token}` },
        });
        if (!res.ok) {
          // If endpoint not available or no permission, just hide summaries
          setSummaries([]);
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          const list: SummaryDetails[] = Array.isArray(data.summaries) ? data.summaries : [];
          setSummaries(list);
        }
      } catch {
        if (!cancelled) setSummaries([]);
      }
    }

    loadSummaries();
    return () => { cancelled = true; };
  }, [session.sessionId]);

  useEffect(() => {
    const handleAssetGenerated = (event: CustomEvent) => {
      const { type, title, icon, summary: generatedSummary, clarity } = event.detail as {
        type: string;
        title: string;
        icon: string;
        summary?: SummaryDetails;
        clarity?: ClarityScore;
      };
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

      // If this automation produced a summary, reflect it at the top of the summaries list
      if (generatedSummary) {
        setSummaries((prev) => [generatedSummary, ...prev]);
        setIsSummaryPanelOpen(true);
      }

      // If this automation produced a clarity score, surface it in a dedicated panel of cards.
      if (clarity && clarity.dimensions && clarity.dimensions.length > 0 && type === "clarity-scorer") {
        setClarityScore(clarity);
        setTimeout(() => {
          const panel = document.getElementById("clarity-score-panel");
          if (panel) {
            panel.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 100);
      }

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

      {detailsError && (
        <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm">
          {detailsError}
        </div>
      )}

      <div className="bg-card/50 border-2 border-primary/30 rounded-[20px] p-12 mb-12">
        {detailsLoading ? (
          <div className="py-12 text-center text-muted-foreground">Loading session details…</div>
        ) : (
          <>
            <div className="flex justify-between items-start mb-8 pb-8 border-b border-primary/20">
              <div>
                <h2 className="text-[2rem] font-extrabold text-foreground mb-2">
                  {sessionDetails?.meeting?.title ?? session.sessionName}
                </h2>
                <p className="text-muted-foreground text-[0.9rem] font-mono">Session ID: {session.sessionId}</p>
              </div>
            </div>

            <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-8 mb-10">
              <div className="flex flex-col gap-2">
                <div className="text-[0.85rem] font-bold text-primary/80 uppercase tracking-wide">
                  Agent Name
                </div>
                <div className="text-[1.1rem] text-foreground font-medium">
                  {sessionDetails?.meeting?.agent_name ?? session.agentName ?? "—"}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="text-[0.85rem] font-bold text-primary/80 uppercase tracking-wide">
                  Topic
                </div>
                <div className="text-[1.1rem] text-foreground font-medium">
                  {sessionDetails?.meeting?.agenda?.trim() || "No agenda provided"}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="text-[0.85rem] font-bold text-primary/80 uppercase tracking-wide">
                  Invited Parties
                </div>
                <div className="text-[1.1rem] text-foreground font-medium">
                  {sessionDetails?.meeting?.meeting_invitees?.length
                    ? sessionDetails.meeting.meeting_invitees.map((i) => i.email).filter(Boolean).join(", ")
                    : "—"}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="text-[0.85rem] font-bold text-primary/80 uppercase tracking-wide">
                  Date & Time
                </div>
                <div className="text-[1.1rem] text-foreground font-medium">
                  {formatDateTime(sessionDetails?.meeting?.scheduled_start_at)}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="text-[0.85rem] font-bold text-primary/80 uppercase tracking-wide">
                  Duration
                </div>
                <div className="text-[1.1rem] text-foreground font-medium">
                  {formatDuration(sessionDetails?.duration_sec ?? undefined)}
                </div>
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
                <span className="text-muted-foreground text-[0.9rem] font-mono">0:00</span>
                <div
                  onClick={handleSeek}
                  className="flex-1 h-2 bg-primary/20 rounded cursor-pointer overflow-hidden"
                >
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-muted-foreground text-[0.9rem] font-mono">
                  {sessionDetails?.duration_sec != null
                    ? `${Math.floor(sessionDetails.duration_sec / 60)}:${String(sessionDetails.duration_sec % 60).padStart(2, "0")}`
                    : "—"}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* All summaries for this session (latest first), shown when opened from Generate Summary */}
      {isSummaryPanelOpen && (
        <div id="session-summaries-panel" className="mb-10 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-[1.4rem] font-bold text-primary flex items-center gap-2">
              <span>Session Summaries</span>
            </h3>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onOpenConfigDrawer("summary", "Generate Summary", "📄")}
                disabled={!hasTranscript(sessionDetails)}
                title={!hasTranscript(sessionDetails) ? "No transcript for this session. Transcripts are saved when the call is finalized with a transcript." : undefined}
                className="bg-primary text-primary-foreground border-2 border-primary px-4 py-2 rounded-[999px] text-[0.85rem] font-semibold cursor-pointer transition-all hover:bg-primary/90 hover:shadow-elegant uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary"
              >
                Create Summary
              </button>
              <button
                type="button"
                onClick={() => setIsSummaryPanelOpen(false)}
                className="text-xs text-muted-foreground hover:text-primary bg-transparent border-none cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>

          {summaries.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No summaries have been generated yet for this session.
            </p>
          ) : (
            summaries.map((s, index) => (
              <div
                key={s.id ?? index}
                className="bg-card/60 border-2 border-primary/40 rounded-2xl p-6 space-y-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-primary">
                      {index === 0 ? "Latest summary" : `Previous summary ${summaries.length - index}`}
                    </span>
                    {s.model && (
                      <span className="text-[0.7rem] text-muted-foreground font-mono">
                        Model: {s.model}
                      </span>
                    )}
                  </div>
                  {s.created_at && (
                    <span className="text-xs text-muted-foreground font-mono">
                      {new Date(s.created_at).toLocaleString()}
                    </span>
                  )}
                </div>

                {s.summary_text && (
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                    {s.summary_text}
                  </p>
                )}

                {s.key_points && s.key_points.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-primary mb-1">Key points</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      {s.key_points.map((point, idx) => (
                        <li key={idx}>{point}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {s.action_items && s.action_items.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-primary mb-1">Action items</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      {s.action_items.map((item, idx) => (
                        <li key={idx}>
                          {typeof item === "string" ? item : JSON.stringify(item)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      <GeneratedAssets
        assets={assets}
        onViewAsset={(asset) => {
          if (asset.type === "summary") {
            setIsSummaryPanelOpen(true);
            setTimeout(() => {
              const el = document.getElementById("session-summaries-panel");
              if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "start" });
              }
            }, 50);
          } else if (asset.type === "clarity-scorer") {
            const el = document.getElementById("clarity-score-panel");
            if (el) {
              el.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          }
        }}
      />

      {clarityScore && clarityScore.dimensions && clarityScore.dimensions.length > 0 && (
        <div
          id="clarity-score-panel"
          className="mb-10 space-y-6"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col gap-1">
              <span className="inline-flex items-center gap-2 text-[0.9rem] font-semibold text-primary uppercase tracking-wide">
                <span>✨ Clarity Scorer</span>
                <span className="text-[0.7rem] text-muted-foreground uppercase tracking-wide">
                  Based strictly on transcript
                </span>
              </span>
              {clarityScore.title && (
                <span className="text-[0.9rem] font-semibold text-foreground">
                  {clarityScore.title}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {clarityScore.dimensions.map((dim) => (
              <div
                key={dim.id}
                onClick={() =>
                  setExpandedDimensionId((current) => (current === dim.id ? null : dim.id))
                }
                className={`bg-card/60 border rounded-2xl p-4 flex flex-col justify-between items-stretch shadow-sm cursor-pointer transition-all min-h-[220px] text-center self-start ${
                  expandedDimensionId === dim.id
                    ? "border-primary/80 shadow-elegant scale-[1.02]"
                    : "border-primary/40 hover:border-primary/70 hover:shadow-elegant hover:scale-[1.01]"
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <span className="text-3xl">{dim.emoji}</span>
                  <span className="text-[1rem] font-extrabold text-foreground">
                    {dim.label}
                  </span>
                  <div className="mt-1">
                    <span className="block text-[0.7rem] uppercase tracking-wide text-muted-foreground">
                      Score
                    </span>
                    <div className="text-2xl font-black text-primary">
                      {Math.round(dim.score)}{" "}
                      <span className="text-xs text-muted-foreground">/ 100</span>
                    </div>
                  </div>
                </div>

                {expandedDimensionId === dim.id && (
                  <div className="mt-3 space-y-3 border-t border-primary/20 pt-2 text-left">
                    {dim.whyHigh && dim.whyHigh.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-[0.75rem] font-semibold text-emerald-400 uppercase tracking-wide">
                          Why high
                        </div>
                        <ul className="list-disc list-inside space-y-1 text-[0.8rem] text-muted-foreground">
                          {dim.whyHigh.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {dim.whyLow && dim.whyLow.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-[0.75rem] font-semibold text-amber-400 uppercase tracking-wide">
                          Why low
                        </div>
                        <ul className="list-disc list-inside space-y-1 text-[0.8rem] text-muted-foreground">
                          {dim.whyLow.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            <div
              key="overall-clarity"
              onClick={() =>
                setExpandedDimensionId((current) => (current === "overall" ? null : "overall"))
              }
              className={`bg-card/70 border rounded-2xl p-4 flex flex-col justify-between items-stretch shadow-sm cursor-pointer transition-all min-h-[220px] text-center self-start ${
                expandedDimensionId === "overall"
                  ? "border-primary/80 shadow-elegant scale-[1.02]"
                  : "border-primary/50 hover:border-primary/80 hover:shadow-elegant hover:scale-[1.01]"
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <span className="text-3xl">🎯</span>
                <span className="text-[1rem] font-extrabold text-foreground">
                  Overall Clarity
                </span>
                {typeof clarityScore.overallScore === "number" && (
                  <div className="mt-1">
                    <span className="block text-[0.7rem] uppercase tracking-wide text-muted-foreground">
                      Score
                    </span>
                    <div className="text-2xl font-black text-primary">
                      {Math.round(clarityScore.overallScore)}{" "}
                      <span className="text-xs text-muted-foreground">/ 100</span>
                    </div>
                  </div>
                )}
              </div>

              {expandedDimensionId === "overall" && (
                <div className="mt-3 space-y-3 border-t border-primary/20 pt-2 text-left">
                  {clarityScore.overallLabel && (
                    <div className="text-[0.8rem] text-muted-foreground">
                      {clarityScore.overallLabel}
                    </div>
                  )}

                  {clarityScore.interpretation && clarityScore.interpretation.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[0.75rem] font-semibold text-primary uppercase tracking-wide">
                        Interpretation
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-[0.8rem] text-muted-foreground">
                        {clarityScore.interpretation.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <AutomationOptions
        onOpenConfigDrawer={onOpenConfigDrawer}
        onOpenSummaryPanel={() => setIsSummaryPanelOpen(true)}
        agentName={session.agentName}
      />
    </>
  );
}
