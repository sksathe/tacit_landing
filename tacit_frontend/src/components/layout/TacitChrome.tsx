"use client";

import { ReactNode, useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { TacitSidebarProvider } from "@/contexts/TacitSidebarContext";
import { meetings, agents, workflows } from "@/data/mockData";
import { Meeting, Agent, Workflow } from "@/types";
import "@/app/tacit-dashboard.css";

type AutomationType =
  | "summary"
  | "insights"
  | "training"
  | "actions"
  | "kb-article"
  | "minutes";

interface GeneratedAsset {
  id: string;
  type: AutomationType;
  title: string;
  icon: string;
  timestamp: string;
}

interface TacitChromeProps {
  children: ReactNode;
  showSessionDetail?: boolean;
  onSessionDetailChange?: (show: boolean) => void;
}

export function TacitChrome({ children, showSessionDetail = false, onSessionDetailChange }: TacitChromeProps) {
  const { user } = useAuth();
  const router = useRouter();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    "agent_1": true,
    "agent_2": true,
    "all-automations": true,
    "drafts": true,
  });

  // Session detail state
  const [selectedSession, setSelectedSession] = useState<Meeting | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isConfigDrawerOpen, setIsConfigDrawerOpen] = useState(false);
  const [currentAutomation, setCurrentAutomation] = useState<{
    type: AutomationType;
    title: string;
    icon: string;
  } | null>(null);
  const [outputTone, setOutputTone] = useState("professional");
  const [targetAudience, setTargetAudience] = useState("");
  const [additionalInstructions, setAdditionalInstructions] = useState("");
  const [generatedAssets, setGeneratedAssets] = useState<GeneratedAsset[]>([]);

  // Group meetings by agent
  const meetingsByAgent = useMemo(() => {
    const grouped: Record<string, { agent: Agent; meetings: Meeting[] }> = {};
    
    // Get completed meetings only
    const completedMeetings = meetings.filter(m => m.status === "Completed");
    
    completedMeetings.forEach((meeting) => {
      meeting.agentIds.forEach((agentId) => {
        const agent = agents.find(a => a.id === agentId);
        if (agent) {
          if (!grouped[agentId]) {
            grouped[agentId] = { agent, meetings: [] };
          }
          grouped[agentId].meetings.push(meeting);
        }
      });
    });

    // Sort meetings by date (most recent first)
    Object.values(grouped).forEach(group => {
      group.meetings.sort((a, b) => 
        new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
      );
    });

    return grouped;
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const openSidebar = () => {
    setIsSidebarOpen(true);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const handleLogout = () => {
    router.push("/login");
  };

  const openSessionDetail = (meeting: Meeting) => {
    setSelectedSession(meeting);
    setIsSidebarOpen(false);
    if (onSessionDetailChange) {
      onSessionDetailChange(true);
    }
  };

  const backToDashboard = () => {
    setSelectedSession(null);
    if (onSessionDetailChange) {
      onSessionDetailChange(false);
    }
  };

  const togglePlayPause = () => {
    setIsPlaying((prev) => !prev);
  };

  const openConfigDrawer = (type: AutomationType, title: string, icon: string) => {
    setCurrentAutomation({ type, title, icon });
    setOutputTone("professional");
    setTargetAudience("");
    setAdditionalInstructions("");
    setIsConfigDrawerOpen(true);
  };

  const closeConfigDrawer = () => {
    setIsConfigDrawerOpen(false);
  };

  const runAutomation = () => {
    if (!currentAutomation) return;

    const now = new Date();
    const timestamp = now.toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    const newAsset: GeneratedAsset = {
      id: `asset-${currentAutomation.type}-${Date.now()}`,
      type: currentAutomation.type,
      title: currentAutomation.title,
      icon: currentAutomation.icon,
      timestamp,
    };

    setGeneratedAssets((prev) => [newAsset, ...prev]);
    closeConfigDrawer();
  };

  const automationOptions = [
    { type: "summary" as AutomationType, title: "Generate Summary", icon: "📄", description: "Create a comprehensive summary of the session" },
    { type: "insights" as AutomationType, title: "Extract Insights", icon: "💡", description: "Identify key insights and patterns" },
    { type: "training" as AutomationType, title: "Create Training Material", icon: "📚", description: "Generate training content from the session" },
    { type: "actions" as AutomationType, title: "Extract Action Items", icon: "✅", description: "Identify and list action items" },
    { type: "kb-article" as AutomationType, title: "Generate KB Article", icon: "📖", description: "Create a knowledge base article" },
    { type: "minutes" as AutomationType, title: "Generate Meeting Minutes", icon: "📝", description: "Create formal meeting minutes" },
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getAgentIcon = (agentName: string) => {
    // Simple icon assignment based on agent name
    if (agentName.toLowerCase().includes("ross")) return "👨";
    return "👩";
  };

  return (
    <TacitSidebarProvider
      openSidebar={openSidebar}
      closeSidebar={closeSidebar}
      toggleSidebar={toggleSidebar}
      isSidebarOpen={isSidebarOpen}
    >
      <div className={isSidebarOpen ? "sidebar-open" : ""}>
      {/* Header */}
      <header>
        <nav>
          <div className="logo">
            <span className="logo-icon">
              <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="10" r="2.5" fill="#10b981" />
                <circle cx="8" cy="20" r="2.5" fill="#10b981" />
                <circle cx="12" cy="30" r="2.5" fill="#10b981" />
                <circle cx="28" cy="10" r="2.5" fill="#10b981" />
                <circle cx="32" cy="20" r="2.5" fill="#10b981" />
                <circle cx="28" cy="30" r="2.5" fill="#10b981" />
                <circle cx="20" cy="20" r="3" fill="#10b981" />
                <line x1="12" y1="10" x2="20" y2="20" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" />
                <line x1="8" y1="20" x2="20" y2="20" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" />
                <line x1="12" y1="30" x2="20" y2="20" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" />
                <line x1="28" y1="10" x2="20" y2="20" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" />
                <line x1="32" y1="20" x2="20" y2="20" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" />
                <line x1="28" y1="30" x2="20" y2="20" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M 12 10 Q 10 15 8 20" stroke="#10b981" strokeWidth="1.8" fill="none" strokeLinecap="round" />
                <path d="M 8 20 Q 10 25 12 30" stroke="#10b981" strokeWidth="1.8" fill="none" strokeLinecap="round" />
                <path d="M 28 10 Q 30 15 32 20" stroke="#10b981" strokeWidth="1.8" fill="none" strokeLinecap="round" />
                <path d="M 32 20 Q 30 25 28 30" stroke="#10b981" strokeWidth="1.8" fill="none" strokeLinecap="round" />
              </svg>
            </span>
            <span>Tacit Studio</span>
          </div>
          <div className="user-section">
            <span className="user-name">Welcome back!</span>
            <div style={{ position: "relative" }}>
              <div
                className="user-avatar"
                onClick={() => setIsUserDropdownOpen((prev) => !prev)}
              >
                {user?.email?.[0]?.toUpperCase() || "U"}
              </div>
              <div className={`user-dropdown ${isUserDropdownOpen ? "active" : ""}`}>
                <button className="dropdown-item" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            </div>
          </div>
        </nav>
      </header>

      {/* Hamburger Menu */}
      <button className="hamburger-menu" onClick={toggleSidebar}>
        <span className="hamburger-line" />
        <span className="hamburger-line" />
        <span className="hamburger-line" />
      </button>

      {/* Sidebar */}
      <div className="sidebar">
        <button className="sidebar-close" onClick={toggleSidebar}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="sidebar-section">
          <div className="sidebar-title">Past Sessions</div>

          {Object.values(meetingsByAgent).map(({ agent, meetings: agentMeetings }) => {
            const groupId = agent.id;
            const isExpanded = expandedGroups[groupId] ?? false;
            
            return (
              <div key={agent.id} className="sidebar-group">
                <div 
                  className={`sidebar-group-header ${isExpanded ? "expanded" : ""}`}
                  onClick={() => toggleGroup(groupId)}
                >
                  <span className="sidebar-icon">{getAgentIcon(agent.name)}</span>
                  <span className="sidebar-text">{agent.name}</span>
                  <span className="sidebar-chevron">▶</span>
                </div>
                {isExpanded && (
                  <div className="sidebar-group-items expanded">
                    {agentMeetings.map((meeting) => (
                      <div
                        key={meeting.id}
                        className="sidebar-item"
                        onClick={() => openSessionDetail(meeting)}
                      >
                        {meeting.title}
                      </div>
                    ))}
                    {agentMeetings.length === 0 && (
                      <div className="sidebar-item" style={{ color: "#666", cursor: "default" }}>
                        No completed sessions
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {Object.keys(meetingsByAgent).length === 0 && (
            <div className="sidebar-item" style={{ color: "#666", padding: "0.8rem 1.5rem", cursor: "default" }}>
              No past sessions
            </div>
          )}
        </div>

        <div className="sidebar-section">
          <div className="sidebar-title">Automations</div>

          <div className="sidebar-group">
            <div 
              className={`sidebar-group-header ${expandedGroups["all-automations"] ? "expanded" : ""}`}
              onClick={() => toggleGroup("all-automations")}
            >
              <span className="sidebar-icon">⚡</span>
              <span className="sidebar-text">All Automations</span>
              <span className="sidebar-chevron">▶</span>
            </div>
            {expandedGroups["all-automations"] && (
              <div className="sidebar-group-items expanded">
                {workflows.map((workflow) => (
                  <div
                    key={workflow.id}
                    className="sidebar-item"
                    onClick={() => router.push(`/workflows`)}
                  >
                    {workflow.name}
                  </div>
                ))}
                {workflows.length === 0 && (
                  <div className="sidebar-item" style={{ color: "#666", cursor: "default" }}>
                    No workflows
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="sidebar-group">
            <div 
              className={`sidebar-group-header ${expandedGroups["drafts"] ? "expanded" : ""}`}
              onClick={() => toggleGroup("drafts")}
            >
              <span className="sidebar-icon">📝</span>
              <span className="sidebar-text">Drafts</span>
              <span className="sidebar-chevron">▶</span>
            </div>
            {expandedGroups["drafts"] && (
              <div className="sidebar-group-items expanded">
                <div className="sidebar-item" style={{ color: "#666", cursor: "default" }}>
                  No draft automations
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar Overlay */}
      {isSidebarOpen && <div className="sidebar-overlay" onClick={toggleSidebar} />}

      {/* Configuration Drawer */}
      <div className={`config-drawer ${isConfigDrawerOpen ? "open" : ""}`}>
        <div className="drawer-header">
          <h3 className="drawer-title">
            {currentAutomation ? `Configure ${currentAutomation.title}` : "Configure Automation"}
          </h3>
          <button className="drawer-close" onClick={closeConfigDrawer}>
            ×
          </button>
        </div>

        <div className="drawer-content">
          <div className="form-field">
            <label className="field-label">Output Tone</label>
            <select
              className="field-select"
              value={outputTone}
              onChange={(e) => setOutputTone(e.target.value)}
            >
              <option value="professional">Professional</option>
              <option value="casual">Casual</option>
              <option value="technical">Technical</option>
              <option value="friendly">Friendly</option>
              <option value="formal">Formal</option>
            </select>
          </div>

          <div className="form-field">
            <label className="field-label">Target Audience</label>
            <input
              type="text"
              className="field-input"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="e.g., Executives, Engineers, General Staff"
            />
          </div>

          <div className="form-field">
            <label className="field-label">Additional Instructions</label>
            <textarea
              className="field-textarea"
              value={additionalInstructions}
              onChange={(e) => setAdditionalInstructions(e.target.value)}
              placeholder="Any specific requirements or focus areas for this automation..."
            />
          </div>
        </div>

        <div className="drawer-footer">
          <button className="btn-run-automation" onClick={runAutomation}>
            Run Automation
          </button>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="container">
        {/* Session Detail View */}
        {selectedSession && (showSessionDetail !== false) && (
          <div className="session-detail-view active">
            <div className="breadcrumb">
              <button className="breadcrumb-item" onClick={backToDashboard}>
                Home
              </button>
              <span className="breadcrumb-separator">|</span>
              <span className="breadcrumb-item">Automate Past Session</span>
              <span className="breadcrumb-separator">|</span>
              <span className="breadcrumb-item active">
                {selectedSession.agentIds.map(id => agents.find(a => a.id === id)?.name).join(", ") || "Unknown Agent"}
              </span>
            </div>

            <div className="session-details-card">
              <div className="session-header">
                <div className="session-main-info">
                  <h2>{selectedSession.title}</h2>
                  <p className="session-id">Session ID: {selectedSession.id}</p>
                </div>
              </div>

              <div className="session-meta">
                <div className="meta-item">
                  <div className="meta-label">Agent Name</div>
                  <div className="meta-value">
                    {selectedSession.agentIds.map(id => agents.find(a => a.id === id)?.name).join(", ") || "Unknown"}
                  </div>
                </div>
                <div className="meta-item">
                  <div className="meta-label">Topic</div>
                  <div className="meta-value">{selectedSession.description}</div>
                </div>
                {selectedSession.participants && selectedSession.participants.length > 0 && (
                  <div className="meta-item">
                    <div className="meta-label">Participants</div>
                    <div className="meta-value">{selectedSession.participants.join(", ")}</div>
                  </div>
                )}
                <div className="meta-item">
                  <div className="meta-label">Date & Time</div>
                  <div className="meta-value">{formatDate(selectedSession.scheduledAt)}</div>
                </div>
                {selectedSession.duration && (
                  <div className="meta-item">
                    <div className="meta-label">Duration</div>
                    <div className="meta-value">{selectedSession.duration}</div>
                  </div>
                )}
              </div>

              <div className="audio-player-section">
                <button className="play-button" onClick={togglePlayPause}>
                  {isPlaying ? "⏸" : "▶"}
                </button>
                <div className="audio-controls">
                  <span className="time-display">15:42</span>
                  <div className="progress-bar">
                    <div className="progress-fill" />
                  </div>
                  <span className="time-display">45:00</span>
                </div>
              </div>
            </div>

            {/* Generated Knowledge Assets Section */}
            {generatedAssets.length > 0 && (
              <div className="generated-assets-section visible">
                <h3 className="section-header">Generated Knowledge Assets</h3>
                <div>
                  {generatedAssets.map((asset) => (
                    <div key={asset.id} className="asset-card">
                      <div className="asset-header">
                        <div className="asset-icon-large">{asset.icon}</div>
                        <div className="asset-info">
                          <h4 className="asset-title">{asset.title}</h4>
                          <p className="asset-timestamp">Generated: {asset.timestamp}</p>
                        </div>
                      </div>
                      <div className="asset-actions">
                        <button className="btn-view">View</button>
                        <button className="btn-chat">Chat</button>
                        <button className="btn-export">↓</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Automation Options Section */}
            <div className="automation-options-section">
              <h3 className="section-header">Available Automations</h3>
              <div className="automation-grid">
                {automationOptions.map((option) => (
                  <div key={option.type} className="automation-card">
                    <div className="automation-icon">{option.icon}</div>
                    <h4 className="automation-title">{option.title}</h4>
                    <p className="automation-description">{option.description}</p>
                    <button
                      className="btn-apply"
                      onClick={() => openConfigDrawer(option.type, option.title, option.icon)}
                    >
                      Apply
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Regular Page Content */}
        {(!selectedSession || showSessionDetail === false) && children}
      </div>
    </div>
    </TacitSidebarProvider>
  );
}


