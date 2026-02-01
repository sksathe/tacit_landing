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
import { Badge } from "@/components/ui/badge";
import { Bot, Plus, X } from "lucide-react";

interface AddAgentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAdd: (agentData: {
        name: string;
        persona: string;
        description: string;
        systemPrompt: string;
        questions: string[];
        channels: string[];
    }) => void;
}

export function AddAgentModal({
    open,
    onOpenChange,
    onAdd,
}: AddAgentModalProps) {
    const [name, setName] = useState("");
    const [persona, setPersona] = useState("");
    const [description, setDescription] = useState("");
    const [systemPrompt, setSystemPrompt] = useState("");
    const [questions, setQuestions] = useState<string[]>([""]);
    const [channels, setChannels] = useState<string[]>([""]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const filteredQuestions = questions.filter(q => q.trim() !== "");
        const filteredChannels = channels.filter(c => c.trim() !== "");
        
        if (name.trim() && persona.trim() && description.trim() && systemPrompt.trim() && filteredQuestions.length > 0 && filteredChannels.length > 0) {
            onAdd({
                name: name.trim(),
                persona: persona.trim(),
                description: description.trim(),
                systemPrompt: systemPrompt.trim(),
                questions: filteredQuestions,
                channels: filteredChannels,
            });
            // Reset form
            setName("");
            setPersona("");
            setDescription("");
            setSystemPrompt("");
            setQuestions([""]);
            setChannels([""]);
            onOpenChange(false);
        }
    };

    const addQuestion = () => {
        setQuestions([...questions, ""]);
    };

    const removeQuestion = (index: number) => {
        if (questions.length > 1) {
            setQuestions(questions.filter((_, i) => i !== index));
        }
    };

    const updateQuestion = (index: number, value: string) => {
        const updated = [...questions];
        updated[index] = value;
        setQuestions(updated);
    };

    const addChannel = () => {
        setChannels([...channels, ""]);
    };

    const removeChannel = (index: number) => {
        if (channels.length > 1) {
            setChannels(channels.filter((_, i) => i !== index));
        }
    };

    const updateChannel = (index: number, value: string) => {
        const updated = [...channels];
        updated[index] = value;
        setChannels(updated);
    };

    const isFormValid = () => {
        const filteredQuestions = questions.filter(q => q.trim() !== "");
        const filteredChannels = channels.filter(c => c.trim() !== "");
        return name.trim() && persona.trim() && description.trim() && systemPrompt.trim() && filteredQuestions.length > 0 && filteredChannels.length > 0;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[95vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center border border-primary/20">
                            <Bot className="h-5 w-5 text-primary" />
                        </div>
                        <DialogTitle>Create New Agent</DialogTitle>
                    </div>
                    <DialogDescription>
                        Create an AI agent persona with specific expertise to join your meetings
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="agent-name">Agent Name</Label>
                            <Input
                                id="agent-name"
                                placeholder="e.g., SOC2 Auditor"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="agent-persona">Persona</Label>
                            <Input
                                id="agent-persona"
                                placeholder="e.g., Compliance Specialist"
                                value={persona}
                                onChange={(e) => setPersona(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="agent-description">Description</Label>
                            <Textarea
                                id="agent-description"
                                placeholder="Describe what this agent does and their expertise..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="system-prompt">System Prompt</Label>
                            <Textarea
                                id="system-prompt"
                                placeholder="Define the agent's behavior, role, and how they should interact..."
                                value={systemPrompt}
                                onChange={(e) => setSystemPrompt(e.target.value)}
                                rows={5}
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                This prompt defines how the agent behaves and what knowledge they bring to meetings.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label>Questions to Ask</Label>
                            <p className="text-xs text-muted-foreground mb-2">
                                Define questions this agent should ask during meetings
                            </p>
                            <div className="space-y-2">
                                {questions.map((question, index) => (
                                    <div key={index} className="flex gap-2">
                                        <Input
                                            placeholder={`Question ${index + 1}`}
                                            value={question}
                                            onChange={(e) => updateQuestion(index, e.target.value)}
                                        />
                                        {questions.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                onClick={() => removeQuestion(index)}
                                                className="flex-shrink-0"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={addQuestion}
                                    className="w-full"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Question
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Channels</Label>
                            <p className="text-xs text-muted-foreground mb-2">
                                Select communication channels this agent can join
                            </p>
                            <div className="space-y-2">
                                {channels.map((channel, index) => (
                                    <div key={index} className="flex gap-2">
                                        <Input
                                            placeholder={`Channel ${index + 1} (e.g., Zoom, Teams, Meet)`}
                                            value={channel}
                                            onChange={(e) => updateChannel(index, e.target.value)}
                                        />
                                        {channels.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                onClick={() => removeChannel(index)}
                                                className="flex-shrink-0"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={addChannel}
                                    className="w-full"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Channel
                                </Button>
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
                            type="submit"
                            className="shadow-[0_0_20px_-5px_rgba(16,185,129,0.4)]"
                            disabled={!isFormValid()}
                        >
                            Create Agent
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

