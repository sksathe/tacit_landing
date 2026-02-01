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
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle2 } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { agents } from "@/data/mockData";
import { ChevronDown } from "lucide-react";

interface GoogleCalendarEvent {
    id: string;
    title: string;
    start: string;
    end: string;
    link: string;
    description: string;
}

interface ImportGoogleCalendarModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    events: GoogleCalendarEvent[];
    onImport: (importedMeetings: {
        eventId: string;
        agentIds: string[];
        context: string;
    }[]) => void;
}

export function ImportGoogleCalendarModal({
    open,
    onOpenChange,
    events,
    onImport,
}: ImportGoogleCalendarModalProps) {
    const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
    const [eventAgents, setEventAgents] = useState<Record<string, string | null>>({});

    const toggleEvent = (eventId: string) => {
        const newSelected = new Set(selectedEvents);
        if (newSelected.has(eventId)) {
            newSelected.delete(eventId);
            const newAgents = { ...eventAgents };
            delete newAgents[eventId];
            setEventAgents(newAgents);
        } else {
            newSelected.add(eventId);
        }
        setSelectedEvents(newSelected);
    };

    const handleImport = () => {
        const importedMeetings = Array.from(selectedEvents).map(eventId => ({
            eventId,
            agentIds: eventAgents[eventId] ? [eventAgents[eventId]!] : [],
            context: events.find(e => e.id === eventId)?.description || "",
        }));

        onImport(importedMeetings);
        setSelectedEvents(new Set());
        setEventAgents({});
        onOpenChange(false);
    };

    const activeAgents = agents.filter(a => a.status === 'Active');

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center border border-primary/20">
                            <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <DialogTitle>Import from Google Calendar</DialogTitle>
                    </div>
                    <DialogDescription>
                        Select calendar events to import as meetings and assign agents.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-3">
                    {events.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No upcoming events found in your Google Calendar.
                        </div>
                    ) : (
                        events.map((event) => {
                            const isSelected = selectedEvents.has(event.id);
                            const selectedAgentId = eventAgents[event.id];

                            return (
                                <div
                                    key={event.id}
                                    className={`border rounded-md p-4 cursor-pointer transition-all ${
                                        isSelected
                                            ? "border-primary bg-primary/5"
                                            : "border-white/10 hover:border-white/20"
                                    }`}
                                    onClick={() => toggleEvent(event.id)}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                {isSelected && (
                                                    <CheckCircle2 className="h-4 w-4 text-primary" />
                                                )}
                                                <h4 className="font-medium text-white">{event.title}</h4>
                                            </div>
                                            <p className="text-sm text-muted-foreground mb-2">
                                                {new Date(event.start).toLocaleString()}
                                            </p>
                                            {event.description && (
                                                <p className="text-xs text-muted-foreground mb-3">
                                                    {event.description}
                                                </p>
                                            )}
                                            {isSelected && (
                                                <div className="mt-3">
                                                    <label className="text-xs text-muted-foreground mb-1 block">
                                                        Assign Agent (Optional)
                                                    </label>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <button
                                                                type="button"
                                                                className="flex items-center justify-between w-full rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm transition-all duration-200 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <span className={selectedAgentId ? "text-foreground" : "text-muted-foreground"}>
                                                                    {selectedAgentId
                                                                        ? activeAgents.find(a => a.id === selectedAgentId)?.name || "Selected"
                                                                        : "Choose an agent..."}
                                                                </span>
                                                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                                            </button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="start" className="w-full">
                                                            <DropdownMenuLabel>Available Agents</DropdownMenuLabel>
                                                            <DropdownMenuSeparator />
                                                            {activeAgents.length > 0 ? (
                                                                activeAgents.map((agent) => {
                                                                    const isAgentSelected = selectedAgentId === agent.id;
                                                                    return (
                                                                        <DropdownMenuItem
                                                                            key={agent.id}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setEventAgents({
                                                                                    ...eventAgents,
                                                                                    [event.id]: agent.id,
                                                                                });
                                                                            }}
                                                                            className="flex items-start gap-2"
                                                                        >
                                                                            {isAgentSelected && (
                                                                                <CheckCircle2 className="w-4 h-4 mt-0.5 text-primary" />
                                                                            )}
                                                                            {!isAgentSelected && (
                                                                                <div className="w-4 h-4 mt-0.5" />
                                                                            )}
                                                                            <div className="flex flex-col">
                                                                                <span className="font-medium">{agent.name}</span>
                                                                                <span className="text-xs text-muted-foreground">{agent.persona}</span>
                                                                            </div>
                                                                        </DropdownMenuItem>
                                                                    );
                                                                })
                                                            ) : (
                                                                <DropdownMenuItem disabled>
                                                                    <span className="text-muted-foreground">No active agents available</span>
                                                                </DropdownMenuItem>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
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
                        onClick={handleImport}
                        disabled={selectedEvents.size === 0}
                    >
                        Import {selectedEvents.size > 0 && `(${selectedEvents.size})`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

