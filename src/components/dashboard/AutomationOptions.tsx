import { useState } from "react";

interface AutomationOptionsProps {
  onOpenConfigDrawer: (type: string, title: string, icon: string) => void;
}

export function AutomationOptions({ onOpenConfigDrawer }: AutomationOptionsProps) {
  const [processingAutomations, setProcessingAutomations] = useState<Set<string>>(new Set());

  const automations = [
    {
      id: "summary",
      icon: "📄",
      title: "Generate Summary",
      description: "Create an executive summary of the session with key takeaways and action items.",
    },
    {
      id: "insights",
      icon: "📊",
      title: "Extract Insights",
      description: "AI-powered analysis to identify patterns, themes, and critical insights from the conversation.",
    },
    {
      id: "training",
      icon: "📚",
      title: "Create Training Module",
      description: "Transform session content into a structured training module with lessons and quizzes.",
    },
    {
      id: "actions",
      icon: "✅",
      title: "Action Items List",
      description: "Extract and organize all action items, decisions, and next steps mentioned in the session.",
    },
    {
      id: "kb-article",
      icon: "🎯",
      title: "Knowledge Base Article",
      description: "Convert tacit knowledge into a well-structured article for your knowledge base.",
    },
    {
      id: "minutes",
      icon: "📝",
      title: "Meeting Minutes",
      description: "Generate formal meeting minutes with attendees, discussions, and resolutions.",
    },
  ];

  return (
    <div className="mt-12">
      <h3 className="text-[1.8rem] font-extrabold text-primary mb-8">Available Automations</h3>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6">
        {automations.map((automation) => {
          const isProcessing = processingAutomations.has(automation.id);
          return (
            <div
              key={automation.id}
              className="bg-card/50 border-2 border-primary/30 rounded-2xl p-8 transition-all hover:border-primary hover:-translate-y-1 hover:shadow-elegant"
            >
              <div className="text-[2.5rem] mb-4">{automation.icon}</div>
              <h4 className="text-[1.3rem] font-bold text-foreground mb-3">{automation.title}</h4>
              <p className="text-muted-foreground text-[0.95rem] mb-6 leading-relaxed">{automation.description}</p>
              <button
                onClick={() => onOpenConfigDrawer(automation.id, automation.title, automation.icon)}
                disabled={isProcessing}
                className={`bg-transparent border-2 border-primary text-primary px-7 py-3 rounded-[20px] text-[0.9rem] font-semibold cursor-pointer transition-all uppercase tracking-wide ${
                  isProcessing
                    ? "opacity-60 cursor-not-allowed bg-transparent border-primary/50"
                    : "hover:bg-primary hover:text-primary-foreground hover:shadow-elegant"
                }`}
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <span>Processing...</span>
                  </span>
                ) : (
                  "Apply"
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
