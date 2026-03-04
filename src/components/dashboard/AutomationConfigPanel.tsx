import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface AutomationConfigPanelProps {
  automation: {
    type: string;
    title: string;
    icon: string;
    sessionId?: string | null;
  } | null;
}

interface AutomationRunResult {
  type: string;
  title: string;
  icon: string;
  outputText: string;
  downloadExt: "md" | "txt";
}

const API_URL = import.meta.env.VITE_API_URL || "";

function getDefaultInstructions(automationType: string | undefined): string {
  switch (automationType) {
    case "summary":
      return "Create a concise, high-level executive summary from the transcript with key takeaways, risks/unknowns, and action items (don’t invent details not in the transcript).";
    case "clarity-scorer":
      return "Score transcript clarity (0–10) across structure, operational detail, metrics/evidence, and risks/unknowns; then list strengths, gaps/ambiguities, and follow‑up questions (ground everything in the transcript).";
    default:
      return "Create a structured knowledge asset from the transcript with clear sections, concrete details, decisions, and next steps; call out risks and open questions (no unsupported claims).";
  }
}

export function AutomationConfigPanel({ automation }: AutomationConfigPanelProps) {
  const [config, setConfig] = useState(() => ({
    outputTone: "professional",
    targetAudience: "",
    additionalInstructions: getDefaultInstructions(automation?.type),
  }));
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<AutomationRunResult | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (automation) {
      // Reset form and local result when automation changes
      setConfig({
        outputTone: "professional",
        targetAudience: "",
        additionalInstructions: getDefaultInstructions(automation.type),
      });
      setIsProcessing(false);
      setResult(null);
    }
  }, [automation]);

  if (!automation) return null;

  const outputText = result?.outputText ?? "";

  const toMarkdownSummary = (summary: any) => {
    if (typeof summary === "string") return summary;
    if (!summary || typeof summary !== "object") return "Summary generated, but output was empty.";

    const summaryText =
      summary.summary_text ??
      summary.summary ??
      summary.text ??
      summary.body ??
      "";
    const keyPoints: any[] = Array.isArray(summary.key_points) ? summary.key_points : [];
    const actionItems: any[] = Array.isArray(summary.action_items) ? summary.action_items : [];

    const lines: string[] = [];
    if (summaryText) {
      lines.push(summaryText);
    }
    if (keyPoints.length) {
      lines.push("", "### Key takeaways");
      for (const p of keyPoints) lines.push(`- ${String(p)}`);
    }
    if (actionItems.length) {
      lines.push("", "### Action items");
      for (const a of actionItems) lines.push(`- ${typeof a === "string" ? a : JSON.stringify(a)}`);
    }
    return lines.join("\n").trim() || "Summary generated, but no text was returned.";
  };

  const toMarkdownClarity = (clarity: any) => {
    if (typeof clarity === "string") return clarity;
    if (!clarity || typeof clarity !== "object") return "Clarity score generated, but output was empty.";

    const overall =
      clarity.overview ??
      clarity.summary ??
      clarity.description ??
      clarity.notes ??
      "";

    const lines: string[] = [];
    if (overall) lines.push(overall);

    // Try to surface common clarity fields if present.
    const score = clarity.score ?? clarity.overall_score ?? clarity.overall ?? undefined;
    if (score != null) {
      lines.push("", `**Overall score:** ${String(score)}`);
    }

    const strengths: any[] = Array.isArray(clarity.strengths) ? clarity.strengths : [];
    const gaps: any[] = Array.isArray(clarity.gaps ?? clarity.ambiguities) ? (clarity.gaps ?? clarity.ambiguities) : [];
    const questions: any[] = Array.isArray(clarity.follow_up_questions ?? clarity.questions) ? (clarity.follow_up_questions ?? clarity.questions) : [];

    if (strengths.length) {
      lines.push("", "### Strengths");
      for (const s of strengths) lines.push(`- ${String(s)}`);
    }
    if (gaps.length) {
      lines.push("", "### Gaps & ambiguities");
      for (const g of gaps) lines.push(`- ${String(g)}`);
    }
    if (questions.length) {
      lines.push("", "### Follow‑up questions");
      for (const q of questions) lines.push(`- ${String(q)}`);
    }

    return lines.join("\n").trim() || "Clarity score generated, but no readable text was returned.";
  };

  const handleRun = async () => {
    if (!automation) return;
    if (!automation.sessionId) {
      toast({
        title: "Missing session",
        description: "No session is attached to this automation.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Summary and clarity scorer automations are wired to the backend.
      if (automation.type === "summary" && automation.sessionId) {
        const { supabase } = await import("@/integrations/supabase/client");
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          throw new Error("Not authenticated. Please log in.");
        }

        const response = await fetch(`${API_URL}/api/sessions/${automation.sessionId}/summary`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            tone: config.outputTone,
            audience: config.targetAudience,
            instructions: config.additionalInstructions,
          }),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.error || "Failed to generate summary.");
        }

        const { summary } = await response.json();

        toast({
          title: "Summary generated",
          description: "Executive summary created from this session's transcript.",
        });

        setResult({
          type: automation.type,
          title: automation.title,
          icon: automation.icon,
          outputText: toMarkdownSummary(summary),
          downloadExt: "md",
        });

        // Emit assetGenerated event so other views (e.g., session overview) can also react.
        const event = new CustomEvent("assetGenerated", {
          detail: {
            type: automation.type,
            title: automation.title,
            icon: automation.icon,
            config,
            summary,
          },
        });
        window.dispatchEvent(event);
      } else if (automation.type === "clarity-scorer" && automation.sessionId) {
        const { supabase } = await import("@/integrations/supabase/client");
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          throw new Error("Not authenticated. Please log in.");
        }

        const response = await fetch(`${API_URL}/api/sessions/${automation.sessionId}/clarity-score`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            instructions: config.additionalInstructions,
          }),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.error || "Failed to generate clarity score.");
        }

        const { clarity } = await response.json();

        toast({
          title: "Clarity score generated",
          description: "Transcript clarity analysis created for this session.",
        });

        setResult({
          type: automation.type,
          title: automation.title,
          icon: automation.icon,
          outputText: toMarkdownClarity(clarity),
          downloadExt: "md",
        });

        const event = new CustomEvent("assetGenerated", {
          detail: {
            type: automation.type,
            title: automation.title,
            icon: automation.icon,
            config,
            clarity,
          },
        });
        window.dispatchEvent(event);
      } else {
        // Other automations not yet wired; keep simulated behavior
        setResult({
          type: automation.type,
          title: automation.title,
          icon: automation.icon,
          outputText:
            "This automation is not yet fully wired to the backend. Showing simulated output.\n\n" +
            `Tone: ${config.outputTone}\n` +
            `Audience: ${config.targetAudience || "—"}\n\n` +
            `Instructions:\n${config.additionalInstructions}`.trim(),
          downloadExt: "txt",
        });

        const event = new CustomEvent("assetGenerated", {
          detail: {
            type: automation.type,
            title: automation.title,
            icon: automation.icon,
            config,
          },
        });
        window.dispatchEvent(event);
      }
    } catch (error: any) {
      console.error("Automation error:", error);
      toast({
        title: "Automation failed",
        description: error.message || "Could not run this automation.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = async () => {
    if (!outputText) return;
    try {
      await navigator.clipboard.writeText(outputText);
      toast({
        title: "Copied to clipboard",
        description: "The generated output has been copied.",
      });
    } catch (err) {
      console.error("Clipboard error:", err);
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard in this browser.",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    if (!outputText) return;
    const blob = new Blob([outputText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safeTitle = (result?.title || automation.title || "automation-output").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    a.href = url;
    a.download = `${safeTitle}.${result?.downloadExt ?? "txt"}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <section className="space-y-6 rounded-xl border border-primary/30 bg-card/60 p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-2xl">
          {automation.icon}
        </div>
        <div>
          <h1 className="text-lg font-extrabold text-primary sm:text-xl">
            Configure {automation.title}
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Tune output and run this automation on the selected recording.
          </p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[0.72rem] font-bold uppercase tracking-[0.1em] text-primary/85">
              Output tone
            </label>
            <select
              value={config.outputTone}
              onChange={(e) => setConfig({ ...config, outputTone: e.target.value })}
              className="h-10 w-full cursor-pointer rounded-lg border border-primary/30 bg-input px-3 text-xs text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="professional">Professional</option>
              <option value="casual">Casual</option>
              <option value="technical">Technical</option>
              <option value="friendly">Friendly</option>
              <option value="formal">Formal</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-[0.72rem] font-bold uppercase tracking-[0.1em] text-primary/85">
              Target audience
            </label>
            <input
              type="text"
              value={config.targetAudience}
              onChange={(e) => setConfig({ ...config, targetAudience: e.target.value })}
              placeholder="e.g., Executives, Engineers, General Staff"
              className="h-10 w-full rounded-lg border border-primary/30 bg-input px-3 text-xs text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[0.72rem] font-bold uppercase tracking-[0.1em] text-primary/85">
              Additional instructions
            </label>
            <textarea
              value={config.additionalInstructions}
              onChange={(e) => setConfig({ ...config, additionalInstructions: e.target.value })}
              placeholder="Any specific requirements or focus areas for this automation..."
              rows={4}
              className="min-h-[90px] w-full resize-none rounded-lg border border-primary/30 bg-input px-3 py-2 text-xs text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <button
            type="button"
            onClick={handleRun}
            disabled={isProcessing}
            className="mt-1 w-full rounded-lg bg-primary px-4 py-2.5 text-[0.78rem] font-bold uppercase tracking-[0.12em] text-primary-foreground shadow-elegant transition-all hover:-translate-y-0.5 hover:bg-primary-glow hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {isProcessing ? "Processing…" : "Run automation"}
          </button>
        </div>

        <div className="space-y-3 rounded-lg border border-primary/20 bg-background/40 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-primary/80">
                Output
              </h2>
              <p className="mt-0.5 text-[0.7rem] text-muted-foreground">
                Generated content for this automation will appear here.
              </p>
            </div>
            {result && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="rounded-md border border-primary/30 px-2 py-1 text-[0.68rem] font-medium text-primary hover:bg-primary/10"
                >
                  Copy
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="rounded-md border border-primary/30 px-2 py-1 text-[0.68rem] font-medium text-primary hover:bg-primary/10"
                >
                  Download
                </button>
                <button
                  type="button"
                  onClick={() => setIsViewOpen(true)}
                  className="rounded-md border border-primary/30 px-2 py-1 text-[0.68rem] font-medium text-primary hover:bg-primary/10"
                >
                  View
                </button>
              </div>
            )}
          </div>

          {result ? (
            <div className="max-h-[260px] overflow-auto rounded-md border border-primary/20 bg-black/30 p-3 text-xs leading-relaxed text-foreground whitespace-pre-wrap">
              {outputText}
            </div>
          ) : (
            <div className="flex h-[180px] items-center justify-center rounded-md border border-dashed border-primary/25 bg-black/20 text-[0.72rem] text-muted-foreground">
              Run the automation to see results here.
            </div>
          )}
        </div>
      </div>

      {isViewOpen && result && (
        <div
          className="fixed inset-0 z-[1200] bg-background/70 backdrop-blur-sm"
          onClick={() => setIsViewOpen(false)}
        >
          <div
            className="mx-auto mt-10 w-[92%] max-w-[1000px] rounded-2xl border border-primary/25 bg-card/95 shadow-elegant"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-primary/20 px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">{automation.icon}</span>
                <div className="text-sm font-semibold text-foreground">{automation.title}</div>
              </div>
              <button
                type="button"
                onClick={() => setIsViewOpen(false)}
                className="rounded-lg border border-primary/20 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10"
              >
                Close
              </button>
            </div>
            <div className="max-h-[75vh] overflow-auto px-5 py-4 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
              {outputText}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

