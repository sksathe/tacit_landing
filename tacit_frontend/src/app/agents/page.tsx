"use client";

import { useState } from "react";
import { TacitChrome } from "@/components/layout/TacitChrome";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { agents } from "@/data/mockData";
import { Plus, Search, Bot, Clock, CheckCircle2, XCircle } from "lucide-react";
import { AddAgentModal } from "@/components/modals/AddAgentModal";
import { cn } from "@/lib/utils";
import { Hint } from "@/components/ui/hint";

export default function AgentsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);

    const filteredAgents = agents.filter((agent) =>
        agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.persona.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleAddAgent = (agentData: {
        name: string;
        persona: string;
        description: string;
        systemPrompt: string;
        questions: string[];
        channels: string[];
    }) => {
        // TODO: Integrate with backend API
        console.log("Adding agent:", agentData);
        alert(`Agent "${agentData.name}" would be created.`);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };

    return (
        <TacitChrome>
            <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Your Agents</h1>
                        <p className="text-muted-foreground">
                            Create and manage AI personas to join your meetings
                        </p>
                    </div>
                    <Button 
                        className="shadow-[0_0_20px_-5px_rgba(16,185,129,0.4)]"
                        onClick={() => setIsModalOpen(true)}
                    >
                        <Plus className="mr-2 h-4 w-4" /> New Agent
                    </Button>
                </div>

                <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search agents..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-white/[0.03] border-white/5 focus:bg-white/[0.05] focus:border-primary/30"
                    />
                </div>
                <Hint variant="tip">
                    Create AI agent personas with specific roles (like SOC2 Auditor, Product Manager) to join your meetings. Agents will listen, take notes, and generate documents based on their expertise.
                </Hint>
            </div>

            <AddAgentModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                onAdd={handleAddAgent}
            />

            {filteredAgents.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredAgents.map((agent) => (
                        <Card key={agent.id} className="bg-[#1a1a1f] border-white/10 rounded-md overflow-hidden">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="w-12 h-12 rounded-md bg-white/5 flex items-center justify-center border border-white/10 flex-shrink-0">
                                        <Bot className="h-6 w-6 text-white/80" />
                                    </div>
                                    <Badge 
                                        variant={agent.status === 'Active' ? 'default' : 'secondary'}
                                        className={cn(
                                            "text-xs",
                                            agent.status === 'Active' 
                                                ? "bg-emerald-500 text-white border-emerald-500" 
                                                : "bg-white/5 text-white/60 border-white/10"
                                        )}
                                    >
                                        {agent.status === 'Active' ? (
                                            <><CheckCircle2 className="w-3 h-3 mr-1" /> Active</>
                                        ) : (
                                            <><XCircle className="w-3 h-3 mr-1" /> Inactive</>
                                        )}
                                    </Badge>
                                </div>
                                <CardTitle className="text-lg font-semibold text-white">
                                    {agent.name}
                                </CardTitle>
                                <CardDescription className="mt-1 text-white/50">
                                    {agent.persona}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-white/60 mb-4 line-clamp-2">
                                    {agent.description}
                                </p>
                                <div className="flex flex-wrap gap-1.5 mb-4">
                                    {agent.channels.map((channel) => (
                                        <Badge key={channel} variant="outline" className="text-xs bg-white/5 border-white/10 text-white/70">
                                            {channel}
                                        </Badge>
                                    ))}
                                </div>
                                <div className="flex items-center justify-between text-xs text-white/50 pt-4 border-t border-white/10">
                                    {agent.lastActive && (
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            <span>Active {formatDate(agent.lastActive)}</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16">
                    <Bot className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No agents found</h3>
                    <p className="text-muted-foreground mb-6">
                        {searchQuery
                            ? "Try adjusting your search terms"
                            : "Get started by creating your first AI agent"}
                    </p>
                    {!searchQuery && (
                        <Button 
                            className="shadow-[0_0_20px_-5px_rgba(16,185,129,0.4)]"
                            onClick={() => setIsModalOpen(true)}
                        >
                            <Plus className="mr-2 h-4 w-4" /> Create Your First Agent
                        </Button>
                    )}
                </div>
            )}
        </TacitChrome>
    );
}

