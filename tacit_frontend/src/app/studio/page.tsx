"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WorkflowBuilder } from "@/components/workflow/WorkflowBuilder";
import { ToolsSidebar } from "@/components/workflow/ToolsSidebar";
import { WorkflowStep, WorkflowStepType } from "@/types";
import { Save, X, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function StudioPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [steps, setSteps] = useState<WorkflowStep[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!name.trim() || steps.length === 0) {
            alert("Please provide a workflow name and add at least one step.");
            return;
        }

        // Ask for description if not provided
        if (!description.trim()) {
            const userDescription = prompt("Please provide a description for this workflow:");
            if (userDescription === null) {
                // User cancelled
                return;
            }
            if (userDescription.trim()) {
                setDescription(userDescription.trim());
            } else {
                alert("Description is required to save the workflow.");
                return;
            }
        }

        setIsSaving(true);
        // TODO: Integrate with backend API
        console.log("Saving workflow:", {
            name: name.trim(),
            description: description.trim(),
            steps: steps.map((s, idx) => ({ ...s, order: idx })),
        });
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        alert(`Workflow "${name}" saved successfully!`);
        setIsSaving(false);
        
        // Optionally redirect to workflows page
        // router.push('/workflows');
    };

    const handleDiscard = () => {
        if (confirm("Are you sure you want to discard this workflow? All unsaved changes will be lost.")) {
            router.push('/workflows');
        }
    };

    return (
        <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-black">
            {/* Floating Header */}
            <div className="absolute top-4 left-4 right-4 z-50">
                <div className="bg-[rgba(255,255,255,0.02)]/90 backdrop-blur-md border border-white/10 rounded-md shadow-lg p-3">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push('/workflows')}
                                className="bg-white/5 hover:bg-white/10 h-8 px-3"
                            >
                                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back
                            </Button>
                            <div className="h-4 w-px bg-white/10" />
                            <h1 className="text-base font-semibold">Workflow Studio</h1>
                        </div>
                        <div className="flex items-center gap-2 flex-1 max-w-md justify-end">
                            <Input
                                id="workflow-name"
                                placeholder="Workflow name..."
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="bg-white/[0.03] h-8 text-sm flex-1 max-w-xs"
                            />
                            <Button
                                variant="outline"
                                onClick={handleDiscard}
                                disabled={isSaving}
                                className="bg-white/5 hover:bg-white/10 h-8 px-3"
                                size="sm"
                            >
                                <X className="w-3.5 h-3.5 mr-1.5" /> Discard
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={isSaving || !name.trim() || steps.length === 0}
                                className="shadow-[0_0_20px_-5px_rgba(34,197,94,0.4)] h-8 px-3 bg-[#22c55e] hover:bg-[#22c55e]/90 text-white rounded-lg breathing-glow"
                                size="sm"
                            >
                                <Save className="w-3.5 h-3.5 mr-1.5" />
                                {isSaving ? "Saving..." : "Save"}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Canvas and Sidebar */}
            <div className="absolute top-20 bottom-0 left-0 right-0 w-full flex">
                {/* Full-screen Canvas */}
                <div className="flex-1">
                    <WorkflowBuilder steps={steps} onStepsChange={setSteps} />
                </div>
                
                {/* Tools Sidebar */}
                <ToolsSidebar 
                    onAddStep={(stepType: WorkflowStepType) => {
                        const stepTypeInfo = [
                            { value: 'extract_topics' as WorkflowStepType, label: 'Extract Topics' },
                            { value: 'summarize' as WorkflowStepType, label: 'Summarize' },
                            { value: 'extract_quotes' as WorkflowStepType, label: 'Extract Quotes' },
                            { value: 'generate_action_items' as WorkflowStepType, label: 'Action Items' },
                            { value: 'create_transcript' as WorkflowStepType, label: 'Transcript' },
                            { value: 'format_markdown' as WorkflowStepType, label: 'Markdown' },
                            { value: 'export_pdf' as WorkflowStepType, label: 'Export PDF' },
                            { value: 'export_docx' as WorkflowStepType, label: 'Export DOCX' },
                            { value: 'custom_prompt' as WorkflowStepType, label: 'Custom' },
                        ].find(t => t.value === stepType);
                        
                        const newStep: WorkflowStep = {
                            id: `step_${Date.now()}`,
                            type: stepType,
                            name: stepTypeInfo?.label || 'New Step',
                            order: steps.length,
                        };
                        setSteps([...steps, newStep]);
                    }}
                />
            </div>
        </div>
    );
}

