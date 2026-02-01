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
import { Label } from "@/components/ui/label";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Workflow } from "lucide-react";
import { meetings } from "@/data/mockData";
import { ChevronDown } from "lucide-react";
import { Workflow as WorkflowType } from "@/types";

interface RunWorkflowModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    workflow: WorkflowType | null;
    onExecute: (meetingId: string) => void;
}

export function RunWorkflowModal({
    open,
    onOpenChange,
    workflow,
    onExecute,
}: RunWorkflowModalProps) {
    const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
    const [isMeetingDropdownOpen, setIsMeetingDropdownOpen] = useState(false);

    const completedMeetings = meetings.filter(m => m.status === 'Completed');

    const handleExecute = () => {
        if (selectedMeetingId) {
            onExecute(selectedMeetingId);
            setSelectedMeetingId(null);
        }
    };

    if (!workflow) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center border border-primary/20">
                            <Workflow className="h-5 w-5 text-primary" />
                        </div>
                        <DialogTitle>Run Workflow</DialogTitle>
                    </div>
                    <DialogDescription>
                        Execute "{workflow.name}" on a completed meeting.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <Label>Select Meeting</Label>
                        <DropdownMenu open={isMeetingDropdownOpen} onOpenChange={setIsMeetingDropdownOpen}>
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    className="flex items-center justify-between w-full rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm transition-all duration-200 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <span className={selectedMeetingId ? "text-foreground" : "text-muted-foreground"}>
                                        {selectedMeetingId
                                            ? completedMeetings.find(m => m.id === selectedMeetingId)?.title || "Selected"
                                            : "Choose a meeting..."}
                                    </span>
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-full">
                                <DropdownMenuLabel>Completed Meetings</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {completedMeetings.length > 0 ? (
                                    completedMeetings.map((meeting) => {
                                        const isSelected = selectedMeetingId === meeting.id;
                                        return (
                                            <DropdownMenuItem
                                                key={meeting.id}
                                                onClick={() => {
                                                    setSelectedMeetingId(meeting.id);
                                                    setIsMeetingDropdownOpen(false);
                                                }}
                                                className="flex items-start gap-2"
                                            >
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{meeting.title}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(meeting.scheduledAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </DropdownMenuItem>
                                        );
                                    })
                                ) : (
                                    <DropdownMenuItem disabled>
                                        <span className="text-muted-foreground">No completed meetings available</span>
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {workflow.description && (
                        <div className="space-y-2">
                            <Label>Workflow Description</Label>
                            <p className="text-sm text-muted-foreground">{workflow.description}</p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Workflow Steps</Label>
                        <div className="space-y-1">
                            {workflow.steps.map((step, index) => (
                                <div key={step.id} className="text-sm text-muted-foreground">
                                    {index + 1}. {step.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </div>
                            ))}
                        </div>
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
                        type="button"
                        className="shadow-[0_0_20px_-5px_rgba(16,185,129,0.4)]"
                        onClick={handleExecute}
                        disabled={!selectedMeetingId}
                    >
                        Run Workflow
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

