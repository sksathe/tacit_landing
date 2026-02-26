import { ChevronLeft } from "lucide-react";
import { TACIT_AGENTS, type TacitAgent } from "@/data/agents";
import { AgentAvatar } from "./AgentAvatar";

interface AutomateAgentPickerProps {
  onSelectAgent: (agent: TacitAgent) => void;
  onBack: () => void;
}

export function AutomateAgentPicker({ onSelectAgent, onBack }: AutomateAgentPickerProps) {
  return (
    <>
      <div className="flex items-center gap-2 mb-8 text-[0.9rem] text-muted-foreground">
        <button
          type="button"
          onClick={onBack}
          className="text-muted-foreground no-underline transition-colors hover:text-primary flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          Home
        </button>
        <span className="text-primary/40">|</span>
        <span className="text-primary font-semibold">Automate Knowledge Assets</span>
      </div>

      <div className="text-center mb-12">
        <h1 className="text-[2rem] font-extrabold mb-2 text-foreground">Choose an agent</h1>
        <p className="text-muted-foreground text-[1rem] max-w-[600px] mx-auto">
          Select the agent whose past sessions you want to automate. You’ll see their sessions next.
        </p>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-6 max-w-[1000px] mx-auto">
        {TACIT_AGENTS.map((agent) => (
          <button
            key={agent.id}
            type="button"
            onClick={() => onSelectAgent(agent)}
            className="bg-card/50 border-2 border-primary/30 rounded-2xl p-6 text-left transition-all duration-300 hover:border-primary hover:shadow-elegant hover:-translate-y-1 flex flex-col items-start gap-3"
          >
            <AgentAvatar agent={agent} size="lg" />
            <div>
              <div className="font-bold text-[1.1rem] text-foreground">{agent.name}</div>
              <div className="text-[0.85rem] text-muted-foreground">{agent.tagline}</div>
            </div>
            <span className="text-primary text-[0.85rem] font-medium mt-auto">View sessions →</span>
          </button>
        ))}
      </div>
    </>
  );
}
