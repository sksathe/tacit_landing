"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bot, User, FileText, Workflow as WorkflowIcon, FileDown, Eye, Plus } from "lucide-react";
import { meetings, agents, documents, workflows } from "@/data/mockData";
import { Meeting } from "@/types";
import { Hint } from "@/components/ui/hint";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface TranscriptSegment {
    id: string;
    speaker: 'user' | 'agent';
    text: string;
    timestamp: string;
    citationId?: number;
}


export default function LiveSessionPage() {
    const params = useParams();
    const router = useRouter();
    const meetingId = params.meetingId as string;
    const meeting = meetings.find(m => m.id === meetingId);
    const transcriptRef = useRef<HTMLDivElement>(null);

    // Mock live transcript data
    const [transcript, setTranscript] = useState<TranscriptSegment[]>([
        { id: '1', speaker: 'user', text: 'Welcome everyone to today\'s standup. Let\'s start with updates.', timestamp: '00:00:15' },
        { id: '2', speaker: 'agent', text: 'Thank you. I\'ve reviewed the SOC2 compliance requirements and identified three key areas that need attention.', timestamp: '00:00:32', citationId: 1 },
        { id: '3', speaker: 'user', text: 'Can you elaborate on those areas?', timestamp: '00:01:05' },
        { id: '4', speaker: 'agent', text: 'Certainly. The first area is access management. We need to implement role-based access controls with proper audit logging.', timestamp: '00:01:18', citationId: 2 },
        { id: '5', speaker: 'agent', text: 'The second area involves data encryption at rest and in transit, which requires updating our infrastructure.', timestamp: '00:02:45', citationId: 3 },
        { id: '6', speaker: 'user', text: 'What about the third area?', timestamp: '00:03:12' },
        { id: '7', speaker: 'agent', text: 'The third area is monitoring and alerting. We need to establish real-time monitoring for security events.', timestamp: '00:03:28', citationId: 4 },
    ]);


    const handleCitationClick = (citationId: number) => {
        const segment = transcript.find(t => t.citationId === citationId);
        if (segment && transcriptRef.current) {
            const element = document.getElementById(`segment-${segment.id}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                element.classList.add('highlight-citation');
                setTimeout(() => {
                    element.classList.remove('highlight-citation');
                }, 2000);
            }
        }
    };

    if (!meeting) {
        return (
            <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
                <div className="text-center">
                    <p className="text-white/60 mb-4">Meeting not found</p>
                    <Button onClick={() => router.push('/meetings')} variant="outline">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Meetings
                    </Button>
                </div>
            </div>
        );
    }

    const meetingAgent = agents.find(a => meeting.agentIds.includes(a.id));
    
    // Get documents for this meeting
    const meetingDocuments = documents.filter(doc => doc.sourceId === meetingId || doc.source === 'meeting');
    
    // Get assigned workflow
    const assignedWorkflow = meeting.workflowId ? workflows.find(w => w.id === meeting.workflowId) : null;
    
    // Mock summary data
    const meetingSummary = meeting.summary || [
        'Discussed SOC2 compliance requirements and identified three key areas needing attention',
        'Access management requires role-based access controls with audit logging',
        'Data encryption at rest and in transit needs infrastructure updates',
        'Monitoring and alerting systems need real-time security event tracking'
    ];

    return (
        <div className="fixed inset-0 bg-black flex flex-col z-50">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[rgba(255,255,255,0.02)]">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push('/meetings')}
                        className="text-white/60 hover:text-white"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <div className="h-6 w-px bg-white/10" />
                    <h1 className="text-lg font-semibold text-white">{meeting.title}</h1>
                    {meetingAgent && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg border border-white/10">
                            <Bot className="w-3.5 h-3.5 text-[#22c55e]" />
                            <span className="text-xs text-white/80">{meetingAgent.name}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* 3-Column Split Screen */}
            <div className="flex-1 flex overflow-hidden">
                    {/* Left Column - Transcript */}
                    <div className="w-80 border-r border-white/10 bg-black flex flex-col">
                        <div className="p-4 border-b border-white/10 bg-[rgba(255,255,255,0.02)]">
                            <h2 className="text-sm font-semibold text-white">Transcript</h2>
                        </div>
                        <div className="p-3 border-b border-white/10 bg-[rgba(255,255,255,0.02)]/50">
                            <Hint variant="info" className="py-2 px-2 text-xs">
                                Agent messages are highlighted in green. Click citation numbers [1] in the center column to jump to source segments.
                            </Hint>
                        </div>
                        <ScrollArea className="flex-1">
                            <div ref={transcriptRef} className="p-4 space-y-4">
                                {transcript.map((segment) => (
                                    <div
                                        key={segment.id}
                                        id={`segment-${segment.id}`}
                                        className={`p-3 rounded-md transition-all ${
                                            segment.speaker === 'agent'
                                                ? 'bg-[#22c55e]/10 border border-[#22c55e]/20'
                                                : 'bg-white/5 border border-white/10'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 mb-1.5">
                                            {segment.speaker === 'agent' ? (
                                                <Bot className="w-3.5 h-3.5 text-[#22c55e]" />
                                            ) : (
                                                <User className="w-3.5 h-3.5 text-white/60" />
                                            )}
                                            <span className="text-xs text-white/50 font-mono">{segment.timestamp}</span>
                                            {segment.citationId && (
                                                <span className="text-xs text-[#22c55e] font-semibold">[{segment.citationId}]</span>
                                            )}
                                        </div>
                                        <p className={`text-sm leading-relaxed ${
                                            segment.speaker === 'agent' ? 'text-white' : 'text-white/70'
                                        }`}>
                                            {segment.text}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Center Column - Tabs: Summary, Assets, Workflows */}
                    <div className="flex-1 flex flex-col bg-[rgba(255,255,255,0.02)] min-h-0">
                        <Tabs defaultValue="summary" className="flex-1 flex flex-col h-full min-h-0">
                            <div className="border-b border-white/10 bg-[rgba(255,255,255,0.02)] px-4 flex-shrink-0">
                                <TabsList className="bg-transparent h-auto p-0 gap-1">
                                    <TabsTrigger 
                                        value="summary" 
                                        className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60 rounded-md px-4 py-2 h-9 flex items-center justify-center"
                                    >
                                        Summary
                                    </TabsTrigger>
                                    <TabsTrigger 
                                        value="assets" 
                                        className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60 rounded-md px-4 py-2 h-9 flex items-center justify-center"
                                    >
                                        Assets
                                    </TabsTrigger>
                                    <TabsTrigger 
                                        value="workflows" 
                                        className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60 rounded-md px-4 py-2 h-9 flex items-center justify-center"
                                    >
                                        Workflows
                                    </TabsTrigger>
                                </TabsList>
                            </div>
                            
                            {/* Summary Tab */}
                            <TabsContent value="summary" className="flex-1 m-0 overflow-hidden min-h-0 flex flex-col">
                                <ScrollArea className="flex-1 h-full">
                                    <div className="p-6">
                                        <div className="glass-morphism rounded-md p-6 max-w-4xl mx-auto">
                                            <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                                                <FileText className="w-5 h-5 text-[#22c55e]" />
                                                Meeting Summary
                                            </h3>
                                            <div className="space-y-4">
                                                {meetingSummary.map((item, idx) => (
                                                    <div key={idx} className="flex items-start gap-3 p-4 bg-white/5 rounded-md border border-white/10 hover:bg-white/10 transition-colors">
                                                        <span className="text-[#22c55e] mt-0.5 font-bold text-lg">•</span>
                                                        <p className="text-sm text-white/90 leading-relaxed flex-1">{item}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </ScrollArea>
                            </TabsContent>
                            
                            {/* Assets Tab */}
                            <TabsContent value="assets" className="flex-1 m-0 overflow-hidden min-h-0 flex flex-col">
                                <ScrollArea className="flex-1 h-full">
                                    <div className="p-6">
                                        {/* Documents Section */}
                                        <div className="glass-morphism rounded-md p-6 max-w-4xl mx-auto">
                                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                                <FileText className="w-5 h-5 text-[#22c55e]" />
                                                Documents ({meetingDocuments.length})
                                            </h3>
                                            {meetingDocuments.length > 0 ? (
                                                <div className="space-y-3">
                                                    {meetingDocuments.map((doc) => {
                                                        const getTypeIcon = (type: string) => {
                                                            switch (type) {
                                                                case 'pdf': return '📄';
                                                                case 'docx': return '📘';
                                                                case 'markdown': return '📝';
                                                                case 'text': return '📃';
                                                                default: return '📄';
                                                            }
                                                        };
                                                        
                                                        return (
                                                            <div
                                                                key={doc.id}
                                                                className="flex items-center justify-between p-4 bg-white/5 rounded-md border border-white/10 hover:bg-white/10 transition-colors"
                                                            >
                                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                    <div className="text-2xl flex-shrink-0">
                                                                        {getTypeIcon(doc.type)}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <h4 className="text-sm font-semibold text-white truncate">{doc.name}</h4>
                                                                        {doc.description && (
                                                                            <p className="text-xs text-white/60 truncate mt-1">{doc.description}</p>
                                                                        )}
                                                                        <div className="flex items-center gap-2 mt-2">
                                                                            <Badge variant="outline" className="text-xs bg-white/5 border-white/10 text-white/70">
                                                                                {doc.type.toUpperCase()}
                                                                            </Badge>
                                                                            <span className="text-xs text-white/50">
                                                                                {new Date(doc.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                                                                    {doc.type === 'markdown' && (
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            className="bg-white/5 border-white/10 text-white hover:bg-white/10 h-8 px-3 rounded-lg"
                                                                        >
                                                                            <Eye className="w-3.5 h-3.5 mr-1.5" />
                                                                            View
                                                                        </Button>
                                                                    )}
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="bg-white/5 border-white/10 text-white hover:bg-white/10 h-8 px-3 rounded-lg"
                                                                    >
                                                                        <FileDown className="w-3.5 h-3.5 mr-1.5" />
                                                                        Download
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="text-center py-8">
                                                    <FileText className="w-12 h-12 text-white/30 mx-auto mb-3" />
                                                    <p className="text-sm text-white/60">No documents generated yet</p>
                                                    <p className="text-xs text-white/40 mt-1">Assign a workflow to generate documents from this meeting</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </ScrollArea>
                            </TabsContent>
                            
                            {/* Workflows Tab */}
                            <TabsContent value="workflows" className="flex-1 m-0 overflow-hidden min-h-0 flex flex-col">
                                <ScrollArea className="flex-1 h-full">
                                    <div className="p-6">
                                        {assignedWorkflow ? (
                                            <div className="glass-morphism rounded-md p-6">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                                                            <WorkflowIcon className="w-5 h-5 text-[#22c55e]" />
                                                            Assigned Workflow
                                                        </h3>
                                                        <p className="text-sm text-white/60">{assignedWorkflow.description || 'No description'}</p>
                                                    </div>
                                                    <Badge variant="outline" className="bg-[#22c55e]/20 text-[#22c55e] border-[#22c55e]/30">
                                                        Active
                                                    </Badge>
                                                </div>
                                                <div className="space-y-3">
                                                    <h4 className="text-sm font-medium text-white/80 mb-2">Workflow Steps:</h4>
                                                    {assignedWorkflow.steps.map((step, idx) => (
                                                        <div key={step.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-md border border-white/10">
                                                            <div className="w-6 h-6 rounded-lg bg-[#22c55e]/20 flex items-center justify-center flex-shrink-0">
                                                                <span className="text-xs font-bold text-[#22c55e]">{idx + 1}</span>
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="text-sm font-medium text-white">{step.name}</p>
                                                                {step.description && (
                                                                    <p className="text-xs text-white/60 mt-0.5">{step.description}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="glass-morphism rounded-md p-6">
                                                <div className="text-center py-8">
                                                    <WorkflowIcon className="w-12 h-12 text-white/30 mx-auto mb-3" />
                                                    <h3 className="text-lg font-semibold text-white mb-2">No Workflow Assigned</h3>
                                                    <p className="text-sm text-white/60 mb-4">
                                                        Assign a workflow to automatically generate documents from this meeting transcript
                                                    </p>
                                                    <div className="space-y-3 max-w-md mx-auto">
                                                        <Hint variant="tip">
                                                            Available workflows will appear here. Create workflows in the Workflows page to transform meeting transcripts into structured documents.
                                                        </Hint>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Right Column - Workflows */}
                    <div className="w-80 border-l border-white/10 bg-black flex flex-col">
                        <div className="p-4 border-b border-white/10 bg-[rgba(255,255,255,0.02)]">
                            <h2 className="text-sm font-semibold text-white">Workflows</h2>
                        </div>
                        <ScrollArea className="flex-1 p-4">
                            <div className="space-y-4">
                                {assignedWorkflow ? (
                                    <div className="glass-morphism rounded-md p-4">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                                                    <WorkflowIcon className="w-4 h-4 text-[#22c55e]" />
                                                    Assigned
                                                </h3>
                                                <p className="text-xs text-white/60 line-clamp-2">{assignedWorkflow.name}</p>
                                            </div>
                                            <Badge variant="outline" className="bg-[#22c55e]/20 text-[#22c55e] border-[#22c55e]/30 text-xs">
                                                Active
                                            </Badge>
                                        </div>
                                        <div className="space-y-2 mt-3">
                                            <p className="text-xs font-medium text-white/80">Steps:</p>
                                            {assignedWorkflow.steps.slice(0, 3).map((step, idx) => (
                                                <div key={step.id} className="flex items-center gap-2 text-xs">
                                                    <span className="text-[#22c55e] font-mono">{idx + 1}.</span>
                                                    <span className="text-white/70">{step.name}</span>
                                                </div>
                                            ))}
                                            {assignedWorkflow.steps.length > 3 && (
                                                <p className="text-xs text-white/50">+{assignedWorkflow.steps.length - 3} more</p>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="glass-morphism rounded-md p-4">
                                        <div className="text-center py-4">
                                            <WorkflowIcon className="w-8 h-8 text-white/30 mx-auto mb-2" />
                                            <p className="text-xs text-white/60 mb-3">No workflow assigned</p>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-xs font-semibold text-white/80">Available Workflows</h3>
                                    </div>
                                    {workflows.slice(0, 3).map((workflow) => (
                                        <div
                                            key={workflow.id}
                                            className={`p-3 rounded-md border transition-colors cursor-pointer ${
                                                workflow.id === meeting.workflowId
                                                    ? 'bg-[#22c55e]/10 border-[#22c55e]/30'
                                                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium text-white truncate">{workflow.name}</p>
                                                    {workflow.description && (
                                                        <p className="text-xs text-white/50 line-clamp-1 mt-0.5">{workflow.description}</p>
                                                    )}
                                                    <div className="flex items-center gap-2 mt-1.5">
                                                        <span className="text-xs text-white/40">{workflow.steps.length} steps</span>
                                                    </div>
                                                </div>
                                                {workflow.id === meeting.workflowId && (
                                                    <Badge variant="outline" className="bg-[#22c55e]/20 text-[#22c55e] border-[#22c55e]/30 text-xs flex-shrink-0">
                                                        Active
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {workflows.length > 3 && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10 text-xs h-8"
                                            onClick={() => router.push('/workflows')}
                                        >
                                            <Plus className="w-3 h-3 mr-1.5" />
                                            View All ({workflows.length})
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </ScrollArea>
                    </div>
                </div>
            </div>
    );
}

