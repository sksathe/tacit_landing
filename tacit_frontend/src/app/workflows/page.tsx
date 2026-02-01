"use client";

import { useState } from "react";
import { TacitChrome } from "@/components/layout/TacitChrome";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { workflows } from "@/data/mockData";
import { Plus, Search, Workflow as WorkflowIcon, Play, Trash2, Edit } from "lucide-react";
import { RunWorkflowModal } from "@/components/modals/RunWorkflowModal";
import { Workflow } from "@/types";
import { useRouter } from "next/navigation";
import { Hint } from "@/components/ui/hint";

export default function WorkflowsPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [isRunModalOpen, setIsRunModalOpen] = useState(false);
    const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);

    const filteredWorkflows = workflows.filter((workflow) =>
        workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        workflow.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );


    const handleRunWorkflow = (workflowId: string) => {
        const workflow = workflows.find(w => w.id === workflowId);
        if (workflow) {
            setSelectedWorkflow(workflow);
            setIsRunModalOpen(true);
        }
    };

    const handleExecuteWorkflow = (meetingId: string) => {
        // TODO: Integrate with backend API to execute workflow
        console.log("Executing workflow:", {
            workflowId: selectedWorkflow?.id,
            meetingId,
        });
        alert(`Workflow "${selectedWorkflow?.name}" would be executed on meeting.`);
        setIsRunModalOpen(false);
        setSelectedWorkflow(null);
    };

    const handleDeleteWorkflow = (workflowId: string) => {
        if (confirm("Are you sure you want to delete this workflow?")) {
            // TODO: Integrate with backend API
            console.log("Deleting workflow:", workflowId);
            alert("Workflow would be deleted.");
        }
    };

    return (
        <TacitChrome>
            <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Workflows</h1>
                        <p className="text-muted-foreground">
                            Create workflows to transform meeting conversations into documents
                        </p>
                    </div>
                    <Button 
                        className="shadow-[0_0_20px_-5px_rgba(16,185,129,0.4)]"
                        onClick={() => router.push('/studio')}
                    >
                        <Plus className="mr-2 h-4 w-4" /> Create Workflow
                    </Button>
                </div>

                <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search workflows..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-white/[0.03] border-white/5 focus:bg-white/[0.05] focus:border-primary/30"
                    />
                </div>
                <Hint variant="tip">
                    Workflows transform meeting transcripts into structured documents. Build workflows with steps like "Extract Topics", "Summarize", or "Export PDF" to automate document generation.
                </Hint>
            </div>

            <RunWorkflowModal
                open={isRunModalOpen}
                onOpenChange={setIsRunModalOpen}
                workflow={selectedWorkflow}
                onExecute={handleExecuteWorkflow}
            />

            {filteredWorkflows.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredWorkflows.map((workflow) => (
                        <Card key={workflow.id} className="bg-[#1a1a1f] border-white/10 rounded-md overflow-hidden">
                            <CardHeader>
                                <div className="flex items-start justify-between gap-4 mb-2">
                                    <div className="flex-1">
                                        <CardTitle className="text-xl font-semibold text-white mb-2">
                                            {workflow.name}
                                        </CardTitle>
                                        <CardDescription className="mb-3 text-white/50">
                                            {workflow.description || "No description"}
                                        </CardDescription>
                                    </div>
                                    <div className="w-10 h-10 rounded-md bg-white/5 flex items-center justify-center border border-white/10">
                                        <WorkflowIcon className="h-5 w-5 text-white/80" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs bg-white/5 border-white/10 text-white/70">
                                        {workflow.steps.length} step{workflow.steps.length !== 1 ? 's' : ''}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 mb-4">
                                    <p className="text-xs font-medium text-white/60 mb-2">Steps:</p>
                                    <div className="space-y-1">
                                        {workflow.steps.slice(0, 3).map((step, idx) => (
                                            <div key={step.id} className="flex items-center gap-2 text-sm">
                                                <span className="text-emerald-400 font-mono text-xs">{idx + 1}.</span>
                                                <span className="text-white/60">{step.name}</span>
                                            </div>
                                        ))}
                                        {workflow.steps.length > 3 && (
                                            <div className="text-xs text-white/50">
                                                +{workflow.steps.length - 3} more steps
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10"
                                        onClick={() => handleRunWorkflow(workflow.id)}
                                    >
                                        <Play className="w-3 h-3 mr-1" /> Run
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {/* TODO: Edit workflow */}}
                                    >
                                        <Edit className="w-3 h-3" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDeleteWorkflow(workflow.id)}
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16">
                    <WorkflowIcon className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No workflows found</h3>
                    <p className="text-muted-foreground mb-6">
                        {searchQuery
                            ? "Try adjusting your search terms"
                            : "Create your first workflow to transform meeting conversations into documents"}
                    </p>
                    {!searchQuery && (
                        <Button 
                            className="shadow-[0_0_20px_-5px_rgba(16,185,129,0.4)]"
                            onClick={() => router.push('/studio')}
                        >
                            <Plus className="mr-2 h-4 w-4" /> Create Your First Workflow
                        </Button>
                    )}
                </div>
            )}
        </TacitChrome>
    );
}

