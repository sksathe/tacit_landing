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
import { Badge } from "@/components/ui/badge";
import { Calendar, Link as LinkIcon, Bot, FileText, CheckCircle2 } from "lucide-react";
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

interface ScheduleMeetingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSchedule: (meeting: {
    meetingLink: string;
    agentIds: string[];
    description: string;
  }) => void;
}

export function ScheduleMeetingModal({
  open,
  onOpenChange,
  onSchedule,
}: ScheduleMeetingModalProps) {
  const [meetingLink, setMeetingLink] = useState("");
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [isAgentDropdownOpen, setIsAgentDropdownOpen] = useState(false);

  const activeAgents = agents.filter(a => a.status === 'Active');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (meetingLink.trim() && selectedAgentId && description.trim()) {
      onSchedule({
        meetingLink: meetingLink.trim(),
        agentIds: [selectedAgentId],
        description: description.trim(),
      });
      // Reset form
      setMeetingLink("");
      setSelectedAgentId(null);
      setDescription("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center border border-primary/20">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle>Schedule New Meeting</DialogTitle>
          </div>
          <DialogDescription>
            Configure a meeting and assign an AI agent to join and capture knowledge.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="meeting-link">Meeting Link</Label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="meeting-link"
                  placeholder="https://zoom.us/j/123456789 or https://meet.google.com/abc-defg-hij"
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  required
                  autoFocus
                  className="pl-9"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Enter the meeting URL from Zoom, Google Meet, Microsoft Teams, or other platforms.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="agent-select">Select Agent</Label>
              <DropdownMenu open={isAgentDropdownOpen} onOpenChange={setIsAgentDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center justify-between w-full rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm transition-all duration-200 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-muted-foreground" />
                      <span className={selectedAgentId ? "text-foreground" : "text-muted-foreground"}>
                        {selectedAgentId 
                          ? activeAgents.find(a => a.id === selectedAgentId)?.name || "Selected"
                          : "Choose an agent..."}
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-full">
                  <DropdownMenuLabel>Available Agents</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {activeAgents.length > 0 ? (
                    activeAgents.map((agent) => {
                      const isSelected = selectedAgentId === agent.id;
                      return (
                        <DropdownMenuItem
                          key={agent.id}
                          onClick={() => {
                            setSelectedAgentId(agent.id);
                            setIsAgentDropdownOpen(false);
                          }}
                          className="flex items-start gap-2"
                        >
                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 mt-0.5 text-primary" />
                          )}
                          {!isSelected && (
                            <div className="w-4 h-4 mt-0.5" />
                          )}
                          <Bot className="h-4 w-4 mt-0.5 text-primary" />
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
              {selectedAgentId && (
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    {activeAgents.find(a => a.id === selectedAgentId)?.name}
                  </Badge>
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="meeting-description">Meeting Context & Description</Label>
              <textarea
                id="meeting-description"
                placeholder="Provide context for the agent about this meeting. What is the purpose? Who are the participants? What topics will be discussed?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                required
                className="flex w-full rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-base shadow-sm transition-all duration-200 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none"
              />
              <p className="text-xs text-muted-foreground">
                This context will help the persona understand the meeting's purpose and prepare accordingly.
              </p>
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
              disabled={!meetingLink.trim() || !selectedAgentId || !description.trim()}
            >
              Schedule Meeting
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

