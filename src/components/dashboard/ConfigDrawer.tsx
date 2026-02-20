import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface ConfigDrawerProps {
  open: boolean;
  onClose: () => void;
  automation: {
    type: string;
    title: string;
    icon: string;
  } | null;
}

export function ConfigDrawer({ open, onClose, automation }: ConfigDrawerProps) {
  const [config, setConfig] = useState({
    outputTone: "professional",
    targetAudience: "",
    additionalInstructions: "",
  });
  const [isProcessing, setIsProcessing] = useState(false);

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

  const handleRunAutomation = () => {
    if (!automation) return;

    setIsProcessing(true);

    // Simulate processing (2 seconds)
    setTimeout(() => {
      // Create generated asset
      const event = new CustomEvent("assetGenerated", {
        detail: {
          type: automation.type,
          title: automation.title,
          icon: automation.icon,
          config,
        },
      });
      window.dispatchEvent(event);

      setIsProcessing(false);
      onClose();
    }, 2000);
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
        className={`fixed top-0 right-0 w-[450px] h-screen bg-background/98 border-l-[3px] border-primary-dashboard z-[1002] transition-transform duration-300 overflow-y-auto shadow-lg ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="sticky top-0 bg-background/95 px-8 py-8 border-b border-primary-dashboard/30 z-10">
          <h3 className="text-[1.5rem] font-extrabold text-primary-dashboard mb-2">
            Configure {automation.title}
          </h3>
          <button
            onClick={onClose}
            className="absolute top-6 right-6 bg-transparent border-none text-muted-foreground text-[1.8rem] cursor-pointer transition-colors leading-none hover:text-primary-dashboard"
          >
            ×
          </button>
        </div>

        <div className="px-8 py-8">
          <div className="mb-6">
            <label className="block text-[0.9rem] font-bold text-primary-dashboard/90 uppercase tracking-wide mb-3">
              Output Tone
            </label>
            <select
              value={config.outputTone}
              onChange={(e) => setConfig({ ...config, outputTone: e.target.value })}
              className="w-full bg-input border-2 border-primary-dashboard/30 rounded-lg px-4 py-3 text-foreground text-base transition-all focus:outline-none focus:border-primary-dashboard focus:ring-2 focus:ring-primary-dashboard/20 cursor-pointer"
            >
              <option value="professional">Professional</option>
              <option value="casual">Casual</option>
              <option value="technical">Technical</option>
              <option value="friendly">Friendly</option>
              <option value="formal">Formal</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-[0.9rem] font-bold text-primary-dashboard/90 uppercase tracking-wide mb-3">
              Target Audience
            </label>
            <input
              type="text"
              value={config.targetAudience}
              onChange={(e) => setConfig({ ...config, targetAudience: e.target.value })}
              placeholder="e.g., Executives, Engineers, General Staff"
              className="w-full bg-input border-2 border-primary-dashboard/30 rounded-lg px-4 py-3 text-foreground text-base transition-all focus:outline-none focus:border-primary-dashboard focus:ring-2 focus:ring-primary-dashboard/20"
            />
          </div>

          <div className="mb-6">
            <label className="block text-[0.9rem] font-bold text-primary-dashboard/90 uppercase tracking-wide mb-3">
              Additional Instructions
            </label>
            <textarea
              value={config.additionalInstructions}
              onChange={(e) => setConfig({ ...config, additionalInstructions: e.target.value })}
              placeholder="Any specific requirements or focus areas for this automation..."
              rows={5}
              className="w-full bg-input border-2 border-primary-dashboard/30 rounded-lg px-4 py-3 text-foreground text-base transition-all focus:outline-none focus:border-primary-dashboard focus:ring-2 focus:ring-primary-dashboard/20 resize-none min-h-[120px]"
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-background/95 px-8 py-8 border-t border-primary-dashboard/30">
          <button
            onClick={handleRunAutomation}
            disabled={isProcessing}
            className="w-full bg-primary text-primary-foreground px-5 py-5 rounded-xl text-[1.1rem] font-bold cursor-pointer transition-all border-none shadow-elegant hover:bg-primary-glow hover:shadow-glow hover:-translate-y-0.5 uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-primary-dashboard/30 border-t-primary-dashboard rounded-full animate-spin" />
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
