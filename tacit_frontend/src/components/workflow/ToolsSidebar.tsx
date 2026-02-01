"use client";

import { WorkflowStepType } from "@/types";
import { Button } from "@/components/ui/button";

const WORKFLOW_STEP_TYPES: { value: WorkflowStepType; label: string; description: string; color: string; icon: string }[] = [
    { value: 'extract_topics', label: 'Extract Topics', description: 'Extract key topics', color: 'bg-blue-500', icon: '📋' },
    { value: 'summarize', label: 'Summarize', description: 'Create summary', color: 'bg-green-500', icon: '📝' },
    { value: 'extract_quotes', label: 'Extract Quotes', description: 'Extract quotes', color: 'bg-purple-500', icon: '💬' },
    { value: 'generate_action_items', label: 'Action Items', description: 'Generate actions', color: 'bg-orange-500', icon: '✅' },
    { value: 'create_transcript', label: 'Transcript', description: 'Create transcript', color: 'bg-pink-500', icon: '📄' },
    { value: 'format_markdown', label: 'Markdown', description: 'Format as Markdown', color: 'bg-cyan-500', icon: '📝' },
    { value: 'export_pdf', label: 'Export PDF', description: 'Export as PDF', color: 'bg-red-500', icon: '📕' },
    { value: 'export_docx', label: 'Export DOCX', description: 'Export as DOCX', color: 'bg-indigo-500', icon: '📘' },
    { value: 'custom_prompt', label: 'Custom', description: 'Custom prompt', color: 'bg-gray-500', icon: '⚙️' },
];

interface ToolsSidebarProps {
    onAddStep: (type: WorkflowStepType) => void;
}

export function ToolsSidebar({ onAddStep }: ToolsSidebarProps) {
    return (
        <div className="w-64 border-r border-white/10 bg-[rgba(255,255,255,0.02)] p-4 overflow-y-auto">
            <h3 className="text-sm font-semibold mb-4 text-white">Workflow Tools</h3>
            <div className="space-y-2">
                {WORKFLOW_STEP_TYPES.map((stepType) => (
                    <Button
                        key={stepType.value}
                        variant="outline"
                        className="w-full justify-start text-left h-auto py-3 px-3 bg-white/[0.03] border-white/10 hover:bg-white/[0.05] hover:border-primary/30"
                        onClick={() => onAddStep(stepType.value)}
                    >
                        <div className="flex items-center gap-3 w-full">
                            <div className={`w-8 h-8 rounded flex items-center justify-center text-lg ${stepType.color}`}>
                                {stepType.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-white">{stepType.label}</div>
                                <div className="text-xs text-white/60">{stepType.description}</div>
                            </div>
                        </div>
                    </Button>
                ))}
            </div>
        </div>
    );
}

