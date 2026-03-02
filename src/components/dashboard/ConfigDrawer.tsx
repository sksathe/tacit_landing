import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ConfigDrawerProps {
  open: boolean;
  onClose: () => void;
  automation: {
    type: string;
    title: string;
    icon: string;
    sessionId?: string | null;
  } | null;
}

export function ConfigDrawer({ open, onClose, automation }: ConfigDrawerProps) {
  const [config, setConfig] = useState({
    outputTone: "professional",
    targetAudience: "",
    additionalInstructions: "",
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && automation) {
      // Reset form when drawer opens
      setConfig({
        outputTone: "professional",
        targetAudience: "",
        additionalInstructions: "",
      });
      setIsProcessing(false);
    }
  }, [open, automation]);

  const handleRunAutomation = async () => {
    if (!automation) return;

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

        const API_URL = import.meta.env.VITE_API_URL || "";
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

        // Emit assetGenerated event so SessionDetailView shows a card
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

        const API_URL = import.meta.env.VITE_API_URL || "";
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

      onClose();
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

  if (!automation) return null;

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-background/50 backdrop-blur-sm z-[1001]"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 z-[1002] h-screen w-[450px] overflow-y-auto border-l border-primary/35 bg-background/96 shadow-2xl backdrop-blur-md transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="sticky top-0 z-10 border-b border-primary/25 bg-background/95 px-6 py-6">
          <p className="mb-2 inline-flex rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.11em] text-primary">
            Automation Config
          </p>
          <h3 className="mb-1 text-[1.45rem] font-extrabold text-primary">
            Configure {automation.title}
          </h3>
          <p className="text-sm text-muted-foreground">Tune output and run this automation on the selected recording.</p>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-5 top-5 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-6">
          <div className="mb-6">
            <label className="mb-2 block text-[0.72rem] font-bold uppercase tracking-[0.1em] text-primary/85">
              Output Tone
            </label>
            <select
              value={config.outputTone}
              onChange={(e) => setConfig({ ...config, outputTone: e.target.value })}
              className="h-11 w-full cursor-pointer rounded-lg border border-primary/30 bg-input px-4 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="professional">Professional</option>
              <option value="casual">Casual</option>
              <option value="technical">Technical</option>
              <option value="friendly">Friendly</option>
              <option value="formal">Formal</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="mb-2 block text-[0.72rem] font-bold uppercase tracking-[0.1em] text-primary/85">
              Target Audience
            </label>
            <input
              type="text"
              value={config.targetAudience}
              onChange={(e) => setConfig({ ...config, targetAudience: e.target.value })}
              placeholder="e.g., Executives, Engineers, General Staff"
              className="h-11 w-full rounded-lg border border-primary/30 bg-input px-4 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="mb-6">
            <label className="mb-2 block text-[0.72rem] font-bold uppercase tracking-[0.1em] text-primary/85">
              Additional Instructions
            </label>
            <textarea
              value={config.additionalInstructions}
              onChange={(e) => setConfig({ ...config, additionalInstructions: e.target.value })}
              placeholder="Any specific requirements or focus areas for this automation..."
              rows={5}
              className="min-h-[120px] w-full resize-none rounded-lg border border-primary/30 bg-input px-4 py-3 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="sticky bottom-0 border-t border-primary/25 bg-background/95 px-6 py-5">
          <button
            type="button"
            onClick={handleRunAutomation}
            disabled={isProcessing}
            className="w-full rounded-xl bg-primary px-5 py-3.5 text-[0.82rem] font-bold uppercase tracking-[0.12em] text-primary-foreground shadow-elegant transition-all hover:-translate-y-0.5 hover:bg-primary-glow hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
                <span>Processing...</span>
              </span>
            ) : (
              "Run Automation"
            )}
          </button>
        </div>
      </div>
    </>
  );
}
