import { useState, useRef, useEffect } from "react";
import { X, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface ScheduleSessionModalProps {
  open: boolean;
  onClose: () => void;
}

export function ScheduleSessionModal({ open, onClose }: ScheduleSessionModalProps) {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    sessionTitle: "",
    sessionDate: "",
    sessionTime: "",
    sessionDuration: "",
    inviteeEmail: "",
    sessionNotes: "",
  });

  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const agents = [
    { id: "rachael", name: "Rachael", description: "Finance Expert", icon: "👩‍💼", keywords: ["finance", "financial", "accounting", "money", "budget", "revenue", "expenses"] },
    { id: "ross", name: "Ross", description: "Compliance Specialist", icon: "👨‍⚖️", keywords: ["compliance", "legal", "regulation", "policy", "audit", "governance", "risk"] },
    { id: "monica", name: "Monica", description: "Operations Manager", icon: "👩‍🔧", keywords: ["operations", "operational", "process", "workflow", "efficiency", "management", "logistics"] },
    { id: "chandler", name: "Chandler", description: "Data Analyst", icon: "👨‍💻", keywords: ["data", "analytics", "analysis", "reporting", "metrics", "insights", "statistics"] },
  ];

  // Filter agents based on search query (matches name, description, or keywords)
  const filteredAgents = agents.filter((agent) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      agent.name.toLowerCase().includes(query) ||
      agent.description.toLowerCase().includes(query) ||
      agent.keywords.some((keyword) => keyword.toLowerCase().includes(query))
    );
  });

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };

    if (isSearchFocused) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSearchFocused]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgent || !formData.sessionTitle || !formData.sessionDate || !formData.sessionTime || !formData.sessionDuration || !formData.inviteeEmail) {
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to schedule a session.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get user's session token
      const { data: { session } } = await (await import("@/integrations/supabase/client")).supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }

      // Get user's first project (or you can add project selection UI)
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
      const projectsResponse = await fetch(`${API_URL}/api/projects`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!projectsResponse.ok) {
        throw new Error("Failed to fetch projects");
      }

      const { projects } = await projectsResponse.json();
      if (!projects || projects.length === 0) {
        throw new Error("No projects found. Please create a project first.");
      }

      const projectId = projects[0].id;

      // Calculate scheduled times
      const scheduledStartAt = new Date(`${formData.sessionDate}T${formData.sessionTime}`).toISOString();
      const durationMinutes = parseInt(formData.sessionDuration);
      const scheduledEndAt = new Date(new Date(scheduledStartAt).getTime() + durationMinutes * 60000).toISOString();

      // Extract invitee name from email (or you can add a name field)
      const inviteeName = formData.inviteeEmail.split("@")[0];

      // Create meeting
      const meetingResponse = await fetch(`${API_URL}/api/meetings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          project_id: projectId,
          title: formData.sessionTitle,
          agenda: formData.sessionNotes || undefined,
          scheduled_start_at: scheduledStartAt,
          scheduled_end_at: scheduledEndAt,
          invitees: [
            {
              name: inviteeName,
              email: formData.inviteeEmail,
            },
          ],
        }),
      });

      if (!meetingResponse.ok) {
        const errorData = await meetingResponse.json();
        throw new Error(errorData.error || "Failed to create meeting");
      }

      const { meeting } = await meetingResponse.json();

      toast({
        title: "Session Scheduled!",
        description: `Meeting invitation has been sent to ${formData.inviteeEmail}`,
      });

      onClose();
      setSelectedAgent(null);
      setSearchQuery("");
      setIsSearchFocused(false);
      setFormData({
        sessionTitle: "",
        sessionDate: "",
        sessionTime: "",
        sessionDuration: "",
        inviteeEmail: "",
        sessionNotes: "",
      });
    } catch (error: any) {
      console.error("Error scheduling session:", error);
      toast({
        title: "Failed to Schedule Session",
        description: error.message || "An error occurred while scheduling the session.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset search when modal closes
  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setIsSearchFocused(false);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[1000] flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-card border-2 border-primary rounded-[20px] p-12 max-w-[800px] w-[90%] max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 bg-transparent border-none text-muted-foreground text-[2rem] cursor-pointer transition-colors leading-none hover:text-primary"
        >
          ×
        </button>
        <h2 className="text-[2rem] font-extrabold text-primary mb-4 text-center">
          Schedule Tacit Session
        </h2>
        <p className="text-muted-foreground mb-8 text-center text-base">
          Search for an agent by name, expertise, or keywords. The invitee will receive a calendar invitation
          with your unique phone number.
        </p>

        {/* Netflix-style Search Bar */}
        <div ref={searchRef} className="relative mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              placeholder="Search agents by name, expertise, or keywords (e.g., 'operations', 'finance', 'data')..."
              className="w-full bg-black/40 border border-white/20 rounded-md pl-12 pr-4 py-4 text-white text-lg placeholder:text-white/50 focus:outline-none focus:border-white/40 focus:bg-black/60 transition-all"
            />
          </div>

          {/* Search Results Dropdown */}
          {isSearchFocused && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-black/95 backdrop-blur-md border border-white/20 rounded-md shadow-2xl max-h-[400px] overflow-y-auto z-50">
              {filteredAgents.length > 0 ? (
                <div className="p-2">
                  {filteredAgents.map((agent) => (
                    <div
                      key={agent.id}
                      onClick={() => {
                        setSelectedAgent(agent.id);
                        setSearchQuery(agent.name);
                        setIsSearchFocused(false);
                      }}
                      className={`flex items-center gap-4 p-4 rounded-md cursor-pointer transition-all ${
                        selectedAgent === agent.id
                          ? "bg-primary/20 border border-primary"
                          : "hover:bg-white/10 border border-transparent"
                      }`}
                    >
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 via-primary/15 to-primary/10 flex items-center justify-center text-4xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200">
                          <span className="drop-shadow-sm">{agent.icon}</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-semibold text-lg mb-1">{agent.name}</div>
                        <div className="text-white/70 text-sm">{agent.description}</div>
                        {searchQuery && (
                          <div className="text-white/50 text-xs mt-1">
                            Matched: {agent.keywords.filter(k => k.toLowerCase().includes(searchQuery.toLowerCase())).join(", ")}
                          </div>
                        )}
                      </div>
                      {selectedAgent === agent.id && (
                        <div className="text-primary text-xl">✓</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-white/50">
                  <div className="text-lg mb-2">No agents found</div>
                  <div className="text-sm">Try searching for "finance", "operations", "compliance", or "data"</div>
                </div>
              )}
            </div>
          )}

          {/* Selected Agent Display */}
          {selectedAgent && !isSearchFocused && (
            <div className="mt-4 flex items-center gap-4 p-4 bg-primary/10 border border-primary/30 rounded-md">
              {agents.find(a => a.id === selectedAgent) && (
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/30 via-primary/20 to-primary/10 flex items-center justify-center text-5xl shadow-xl ring-2 ring-primary/40">
                    <span className="drop-shadow-md">{agents.find(a => a.id === selectedAgent)?.icon}</span>
                  </div>
                </div>
              )}
              <div className="flex-1">
                <div className="text-foreground font-semibold text-lg">
                  {agents.find(a => a.id === selectedAgent)?.name}
                </div>
                <div className="text-muted-foreground text-sm">
                  {agents.find(a => a.id === selectedAgent)?.description}
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedAgent(null);
                  setSearchQuery("");
                }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-8">
          <div className="mb-6">
            <label htmlFor="scheduleSessionTitle" className="block text-primary font-semibold mb-2 text-[0.95rem]">
              Session Title
            </label>
            <input
              type="text"
              id="scheduleSessionTitle"
              value={formData.sessionTitle}
              onChange={(e) => setFormData({ ...formData, sessionTitle: e.target.value })}
              placeholder="e.g., Payment Gateway Integration"
              required
              className="w-full bg-input border-2 border-primary/30 rounded-lg px-4 py-3 text-foreground text-base transition-all focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label htmlFor="sessionDate" className="block text-[#10b981] font-semibold mb-2 text-[0.95rem]">
                Date
              </label>
              <input
                type="date"
                id="sessionDate"
                value={formData.sessionDate}
                onChange={(e) => setFormData({ ...formData, sessionDate: e.target.value })}
                required
                className="w-full bg-input border-2 border-primary/30 rounded-lg px-4 py-3 text-foreground text-base transition-all focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label htmlFor="sessionTime" className="block text-[#10b981] font-semibold mb-2 text-[0.95rem]">
                Time
              </label>
              <input
                type="time"
                id="sessionTime"
                value={formData.sessionTime}
                onChange={(e) => setFormData({ ...formData, sessionTime: e.target.value })}
                required
                className="w-full bg-input border-2 border-primary/30 rounded-lg px-4 py-3 text-foreground text-base transition-all focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="sessionDuration" className="block text-[#10b981] font-semibold mb-2 text-[0.95rem]">
              Duration (minutes)
            </label>
            <input
              type="number"
              id="sessionDuration"
              value={formData.sessionDuration}
              onChange={(e) => setFormData({ ...formData, sessionDuration: e.target.value })}
              placeholder="60"
              min="15"
              max="240"
              required
              className="w-full bg-input border-2 border-primary/30 rounded-lg px-4 py-3 text-foreground text-base transition-all focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="scheduleInviteeEmail" className="block text-[#10b981] font-semibold mb-2 text-[0.95rem]">
              SME Email (Invitee)
            </label>
            <input
              type="email"
              id="scheduleInviteeEmail"
              value={formData.inviteeEmail}
              onChange={(e) => setFormData({ ...formData, inviteeEmail: e.target.value })}
              placeholder="expert@company.com"
              required
              className="w-full bg-input border-2 border-primary/30 rounded-lg px-4 py-3 text-foreground text-base transition-all focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="scheduleSessionNotes" className="block text-[#10b981] font-semibold mb-2 text-[0.95rem]">
              Session Notes (Optional)
            </label>
            <textarea
              id="scheduleSessionNotes"
              value={formData.sessionNotes}
              onChange={(e) => setFormData({ ...formData, sessionNotes: e.target.value })}
              placeholder="Any specific topics or areas to focus on..."
              rows={4}
              className="w-full bg-[rgba(26,26,26,0.8)] border-2 border-[rgba(16,185,129,0.3)] rounded-lg px-4 py-3 text-white text-base transition-all focus:outline-none focus:border-[#10b981] focus:shadow-[0_0_0_3px_rgba(16,185,129,0.1)] resize-vertical min-h-[100px]"
            />
          </div>

          <button
            type="submit"
            disabled={
              isSubmitting ||
              !selectedAgent ||
              !formData.sessionTitle ||
              !formData.sessionDate ||
              !formData.sessionTime ||
              !formData.sessionDuration ||
              !formData.inviteeEmail
            }
            className="w-full bg-primary text-primary-foreground px-5 py-4 rounded-xl text-[1.1rem] font-bold cursor-pointer transition-all border-none shadow-elegant hover:bg-primary-glow hover:shadow-glow hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 mt-4"
          >
            {isSubmitting ? "Scheduling..." : "Schedule & Send Invite"}
          </button>
        </form>
      </div>
    </div>
  );
}
