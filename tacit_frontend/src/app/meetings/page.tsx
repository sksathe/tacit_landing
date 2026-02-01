"use client";

import { useState } from "react";
import { TacitChrome } from "@/components/layout/TacitChrome";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { meetings, agents, documents } from "@/data/mockData";
import { Plus, Search, Calendar, Bot, Clock, CheckCircle2, PlayCircle, XCircle, CalendarDays, Workflow, FileText } from "lucide-react";
import Link from "next/link";
import { ScheduleMeetingModal } from "@/components/modals/ScheduleMeetingModal";
import { ConnectGoogleCalendarModal } from "@/components/modals/ConnectGoogleCalendarModal";
import { ImportGoogleCalendarModal } from "@/components/modals/ImportGoogleCalendarModal";
import { useRouter } from "next/navigation";
import { Hint } from "@/components/ui/hint";

export default function MeetingsPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isGoogleCalendarConnected, setIsGoogleCalendarConnected] = useState(false);

    const filteredMeetings = meetings.filter((meeting) =>
        meeting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        meeting.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleScheduleMeeting = (meetingData: {
        meetingLink: string;
        agentIds: string[];
        description: string;
    }) => {
        // TODO: Integrate with backend API
        console.log("Scheduling meeting:", meetingData);
        const agentNames = meetingData.agentIds.map(id => {
            const agent = agents.find(a => a.id === id);
            return agent?.name || 'Unknown';
        }).join(', ');
        alert(`Meeting with ${agentNames} would be scheduled.`);
    };

    const handleConnectGoogleCalendar = () => {
        // TODO: Implement Google Calendar OAuth
        setIsGoogleCalendarConnected(true);
        alert("Google Calendar connected! (This is a demo)");
    };

    const handleImportMeetings = (importedMeetings: {
        eventId: string;
        agentIds: string[];
        context: string;
    }[]) => {
        // TODO: Integrate with backend API
        console.log("Importing meetings:", importedMeetings);
        alert(`${importedMeetings.length} meeting(s) imported with agents assigned!`);
    };

    // Mock Google Calendar events for demo
    const mockGoogleCalendarEvents = [
        {
            id: 'google_event_1',
            title: 'Team Standup',
            start: '2025-11-25T10:00:00Z',
            end: '2025-11-25T10:30:00Z',
            link: 'https://meet.google.com/standup-123',
            description: 'Daily team standup meeting',
        },
        {
            id: 'google_event_2',
            title: 'Client Presentation',
            start: '2025-11-25T14:00:00Z',
            end: '2025-11-25T15:00:00Z',
            link: 'https://zoom.us/j/client-presentation',
            description: 'Present Q4 results to client',
        },
        {
            id: 'google_event_3',
            title: 'Product Review',
            start: '2025-12-25T11:00:00Z',
            end: '2025-12-25T12:00:00Z',
            link: 'https://meet.google.com/product-review',
            description: 'Review product roadmap and features',
        },
    ];

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", { 
            month: "short", 
            day: "numeric", 
            year: "numeric",
            hour: "numeric",
            minute: "2-digit"
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Scheduled':
                return <Badge variant="outline" className="text-xs"><Calendar className="w-3 h-3 mr-1" /> Scheduled</Badge>;
            case 'In Progress':
                return <Badge variant="default" className="text-xs"><PlayCircle className="w-3 h-3 mr-1" /> In Progress</Badge>;
            case 'Completed':
                return <Badge variant="secondary" className="text-xs"><CheckCircle2 className="w-3 h-3 mr-1" /> Completed</Badge>;
            case 'Cancelled':
                return <Badge variant="destructive" className="text-xs"><XCircle className="w-3 h-3 mr-1" /> Cancelled</Badge>;
            default:
                return null;
        }
    };

    const getMeetingAgents = (agentIds: string[]) => {
        return agents.filter(a => agentIds.includes(a.id));
    };

    return (
        <TacitChrome>
            <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Your Meetings</h1>
                        <p className="text-muted-foreground">
                            Schedule meetings and add AI agents to join them
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {isGoogleCalendarConnected ? (
                            <Button
                                variant="outline"
                                onClick={() => setIsImportModalOpen(true)}
                            >
                                <CalendarDays className="mr-2 h-4 w-4" /> Import from Google Calendar
                            </Button>
                        ) : (
                            <Button
                                variant="outline"
                                onClick={() => setIsConnectModalOpen(true)}
                            >
                                <CalendarDays className="mr-2 h-4 w-4" /> Connect Google Calendar
                            </Button>
                        )}
                        <Button 
                            className="shadow-[0_0_20px_-5px_rgba(16,185,129,0.4)]"
                            onClick={() => setIsModalOpen(true)}
                        >
                            <Plus className="mr-2 h-4 w-4" /> Schedule Meeting
                        </Button>
                    </div>
                </div>

                <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search meetings..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-white/[0.03] border-white/5 focus:bg-white/[0.05] focus:border-primary/30"
                    />
                </div>
                <Hint variant="tip">
                    Schedule meetings and attach AI agents to automatically join. Click on any meeting card to view the transcript and generated documents. Connect Google Calendar to import meetings automatically.
                </Hint>
            </div>

            <ScheduleMeetingModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                onSchedule={handleScheduleMeeting}
            />

            <ConnectGoogleCalendarModal
                open={isConnectModalOpen}
                onOpenChange={setIsConnectModalOpen}
                onConnect={handleConnectGoogleCalendar}
                isConnected={isGoogleCalendarConnected}
            />

            <ImportGoogleCalendarModal
                open={isImportModalOpen}
                onOpenChange={setIsImportModalOpen}
                events={mockGoogleCalendarEvents}
                onImport={handleImportMeetings}
            />

            {filteredMeetings.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredMeetings.map((meeting) => {
                        const meetingAgents = getMeetingAgents(meeting.agentIds);
                        // Count documents generated from this meeting
                        const documentCount = documents.filter(doc => doc.sourceId === meeting.id || doc.source === 'meeting').length;
                        
                        return (
                            <Card 
                                key={meeting.id} 
                                className="glass-morphism rounded-md overflow-hidden hover-lift cursor-pointer"
                                onClick={() => router.push(`/meetings/${meeting.id}`)}
                            >
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                        <CardTitle className="text-base font-semibold text-white line-clamp-2 flex-1">
                                            {meeting.title}
                                        </CardTitle>
                                        {getStatusBadge(meeting.status)}
                                    </div>
                                    <CardDescription className="text-white/60 text-sm line-clamp-2 mb-3">
                                        {meeting.description}
                                    </CardDescription>
                                    <div className="flex items-center gap-2 text-xs text-white/50">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>{formatDate(meeting.scheduledAt)}</span>
                                        {meeting.duration && (
                                            <>
                                                <span>•</span>
                                                <span>{meeting.duration}</span>
                                            </>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-0 space-y-3">
                                    {meetingAgents.length > 0 && (
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <Bot className="w-3.5 h-3.5 text-[#22c55e]" />
                                                <span className="text-xs font-medium text-white/80">Agents</span>
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {meetingAgents.slice(0, 2).map((agent) => (
                                                    <Badge 
                                                        key={agent.id} 
                                                        variant="outline" 
                                                        className="text-xs bg-white/5 border-white/10 text-white/70 px-2 py-0.5"
                                                    >
                                                        {agent.name}
                                                    </Badge>
                                                ))}
                                                {meetingAgents.length > 2 && (
                                                    <Badge 
                                                        variant="outline" 
                                                        className="text-xs bg-white/5 border-white/10 text-white/70 px-2 py-0.5"
                                                    >
                                                        +{meetingAgents.length - 2}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    {documentCount > 0 && (
                                        <div className="flex items-center gap-2 pt-3 border-t border-white/10">
                                            <FileText className="w-3.5 h-3.5 text-[#22c55e]" />
                                            <span className="text-xs text-white/80">
                                                <span className="font-semibold text-[#22c55e]">{documentCount}</span> document{documentCount !== 1 ? 's' : ''} generated
                                            </span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-16">
                    <Calendar className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2 text-white">No meetings found</h3>
                    <p className="text-white/60 mb-6">
                        {searchQuery
                            ? "Try adjusting your search terms"
                            : "Get started by scheduling your first meeting"}
                    </p>
                    {!searchQuery && (
                        <>
                            <Hint variant="help" className="max-w-md mx-auto mb-6">
                                Schedule meetings and attach AI agents to automatically join. Agents will listen, take notes, and generate documents based on your workflows.
                            </Hint>
                            <Button 
                                className="shadow-[0_0_20px_-5px_rgba(16,185,129,0.4)]"
                                onClick={() => setIsModalOpen(true)}
                            >
                                <Plus className="mr-2 h-4 w-4" /> Schedule Your First Meeting
                            </Button>
                        </>
                    )}
                </div>
            )}
        </TacitChrome>
    );
}

