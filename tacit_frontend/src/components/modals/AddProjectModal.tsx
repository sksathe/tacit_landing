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
import { Folder } from "lucide-react";

interface AddProjectModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAdd: (project: { name: string; description?: string }) => void;
}

export function AddProjectModal({
    open,
    onOpenChange,
    onAdd,
}: AddProjectModalProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onAdd({
                name: name.trim(),
                description: description.trim() || undefined,
            });
            setName("");
            setDescription("");
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center border border-primary/20">
                            <Folder className="h-5 w-5 text-primary" />
                        </div>
                        <DialogTitle>Create New Project</DialogTitle>
                    </div>
                    <DialogDescription>
                        Create a new project to organize your meetings and documents
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="project-name">Project Name</Label>
                            <Input
                                id="project-name"
                                placeholder="e.g., Q1 2024 Initiative"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="project-description">Description (Optional)</Label>
                            <Textarea
                                id="project-description"
                                placeholder="Describe what this project is about..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                            />
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
                            disabled={!name.trim()}
                        >
                            Create Project
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
