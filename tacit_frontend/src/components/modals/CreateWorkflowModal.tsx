"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Workflow } from "lucide-react";
import { WorkflowStep } from "@/types";
import { WorkflowBuilder } from "@/components/workflow/WorkflowBuilder";

interface CreateWorkflowModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreate: (workflow: {
        name: string;
        description?: string;
        steps: WorkflowStep[];
    }) => void;
}

export function CreateWorkflowModal({
    open,
    onOpenChange,
    onCreate,
}: CreateWorkflowModalProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [steps, setSteps] = useState<WorkflowStep[]>([]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim() && steps.length > 0) {
            onCreate({
                name: name.trim(),
                description: description.trim() || undefined,
                steps: steps.map((s, idx) => ({ ...s, order: idx })),
            });
            // Reset form
            setName("");
            setDescription("");
            setSteps([]);
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[900px] max-h-[95vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center border border-primary/20">
                            <Workflow className="h-5 w-5 text-primary" />
                        </div>
                        <DialogTitle>Create Workflow</DialogTitle>
                    </div>
                    <DialogDescription>
                        Build a workflow to transform meeting conversations into documents
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="workflow-name">Workflow Name</Label>
                            <Input
                                id="workflow-name"
                                placeholder="e.g., Meeting Summary to PDF"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="workflow-description">Description (Optional)</Label>
                            <Textarea
                                id="workflow-description"
                                placeholder="Describe what this workflow does..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                            />
                        </div>

                        <div className="space-y-3">
                            <Label>Build Your Workflow</Label>
                            <p className="text-sm text-muted-foreground mb-4">
                                Drag and drop nodes to create your workflow. Connect steps by dragging from the bottom handle to the top handle of another node.
                            </p>
                            <WorkflowBuilder steps={steps} onStepsChange={setSteps} />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="shadow-[0_0_20px_-5px_rgba(16,185,129,0.4)]"
                            disabled={!name.trim() || steps.length === 0}
                        >
                            Create Workflow
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

