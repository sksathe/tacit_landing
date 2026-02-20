import { X } from "lucide-react";
import type { TacitAgent } from "@/data/agents";

interface SelectedAgentDescriptionProps {
  agent: TacitAgent;
  onClear: () => void;
  /** Compact: just name + tagline (e.g. for small chips). Default false = full card. */
  compact?: boolean;
}

export function SelectedAgentDescription({ agent, onClear, compact }: SelectedAgentDescriptionProps) {
  if (compact) {
    return (
      <div className="mt-4 flex items-center gap-4 p-4 bg-primary/10 border border-primary/30 rounded-md">
        <div className="flex-shrink-0 text-3xl">{agent.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="text-foreground font-semibold text-lg">{agent.name}</div>
          <div className="text-muted-foreground text-sm">{agent.tagline}</div>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="text-muted-foreground hover:text-foreground transition-colors p-1"
          aria-label="Clear selection"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 p-5 bg-card border-2 border-primary/30 rounded-xl text-left space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-4xl flex-shrink-0" aria-hidden>
            {agent.icon}
          </span>
          <div className="min-w-0">
            <h3 className="text-xl font-bold text-foreground truncate">{agent.name}</h3>
            <p className="text-primary font-semibold text-sm">{agent.tagline}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
          aria-label="Clear selection"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-1 text-sm">
        <p className="text-muted-foreground">
          <span className="font-medium text-foreground">Role:</span> {agent.role}
        </p>
        <p className="text-muted-foreground">
          <span className="font-medium text-foreground">Persona:</span> {agent.persona}
        </p>
      </div>

      <div className="space-y-2">
        <p className="font-medium text-foreground text-sm">Description:</p>
        <p className="text-muted-foreground text-sm leading-relaxed">{agent.description}</p>
        {agent.descriptionContinued && (
          <p className="text-muted-foreground text-sm leading-relaxed">{agent.descriptionContinued}</p>
        )}
      </div>

      <div className="space-y-2">
        <p className="font-medium text-foreground text-sm">Specialties:</p>
        <ul className="text-muted-foreground text-sm list-none space-y-1 pl-0">
          {agent.specialties.map((s) => (
            <li key={s} className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
