import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { SessionsSidebar } from "@/components/dashboard/SessionsSidebar";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { AutomateAgentPicker } from "@/components/dashboard/AutomateAgentPicker";
import { AutomateSessionsList } from "@/components/dashboard/AutomateSessionsList";
import { SessionDetailView } from "@/components/dashboard/SessionDetailView";
import { StartSessionModal } from "@/components/dashboard/StartSessionModal";
import { ScheduleSessionModal } from "@/components/dashboard/ScheduleSessionModal";
import { ConfigDrawer } from "@/components/dashboard/ConfigDrawer";
import { ChooseMeetingTypeModal } from "@/components/dashboard/ChooseMeetingTypeModal";
import type { TacitAgent } from "@/data/agents";
import type { SessionItem } from "@/components/dashboard/AutomateSessionsList";

const Dashboard = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState<"dashboard" | "automate-agents" | "automate-sessions" | "session">("dashboard");
  const [selectedAgent, setSelectedAgent] = useState<TacitAgent | null>(null);
  const [sessionsForAgent, setSessionsForAgent] = useState<SessionItem[]>([]);
  const [selectedSession, setSelectedSession] = useState<{
    agentName: string;
    sessionName: string;
    sessionId: string;
  } | null>(null);
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isConfigDrawerOpen, setIsConfigDrawerOpen] = useState(false);
  const [currentAutomation, setCurrentAutomation] = useState<{
    type: string;
    title: string;
    icon: string;
  } | null>(null);

  const [meetingTypeFlow, setMeetingTypeFlow] = useState<"start" | "schedule" | null>(null);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const openAutomateFlow = () => {
    setCurrentView("automate-agents");
    setSelectedAgent(null);
    setSessionsForAgent([]);
    setSelectedSession(null);
  };

  const openAgentSessions = (agent: TacitAgent) => {
    setSelectedAgent(agent);
    setCurrentView("automate-sessions");
  };

  const openSessionDetail = (session: SessionItem) => {
    setSelectedSession({
      agentName: session.agentName,
      sessionName: session.sessionName,
      sessionId: session.sessionId,
    });
    setCurrentView("session");
  };

  const openSessionDetailFromSidebar = (agentName: string, sessionName: string, sessionId: string) => {
    setSelectedSession({ agentName, sessionName, sessionId });
    setCurrentView("session");
    setIsSidebarOpen(false);
  };

  const backToDashboard = () => {
    setCurrentView("dashboard");
    setSelectedAgent(null);
    setSessionsForAgent([]);
    setSelectedSession(null);
  };

  const backToAgents = () => {
    setCurrentView("automate-agents");
    setSelectedAgent(null);
    setSessionsForAgent([]);
  };

  const backToSessionsList = () => {
    setCurrentView("automate-sessions");
  };

  const openConfigDrawer = (type: string, title: string, icon: string) => {
    setCurrentAutomation({ type, title, icon });
    setIsConfigDrawerOpen(true);
  };

  const closeConfigDrawer = () => {
    setIsConfigDrawerOpen(false);
    setCurrentAutomation(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DashboardHeader />
      
      {/* Hamburger Menu Button */}
      <button
        onClick={toggleSidebar}
        className={`fixed top-6 left-6 w-[50px] h-[50px] flex flex-col justify-center items-center gap-1.5 p-2.5 rounded-xl transition-all z-[1001] ${
          isSidebarOpen ? "opacity-0 pointer-events-none" : ""
        } bg-primary/15 border-2 border-primary/30 hover:bg-primary/25 hover:border-primary hover:shadow-glow`}
      >
        <span className="w-6 h-0.5 bg-primary rounded-sm transition-all" />
        <span className="w-6 h-0.5 bg-primary rounded-sm transition-all" />
        <span className="w-6 h-0.5 bg-primary rounded-sm transition-all" />
      </button>

      {/* Sidebar */}
      <SessionsSidebar
        isOpen={isSidebarOpen}
        onClose={toggleSidebar}
        onSessionClick={openSessionDetailFromSidebar}
      />

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 bg-background/50 backdrop-blur-sm z-[998]"
        />
      )}

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-8 py-16">
        {currentView === "dashboard" && (
          <DashboardView
            onStartSession={() => setMeetingTypeFlow("start")}
            onScheduleSession={() => setMeetingTypeFlow("schedule")}
            onAutomateSessions={openAutomateFlow}
          />
        )}
        {currentView === "automate-agents" && (
          <AutomateAgentPicker onSelectAgent={openAgentSessions} onBack={backToDashboard} />
        )}
        {currentView === "automate-sessions" && selectedAgent && (
          <AutomateSessionsList
            agent={selectedAgent}
            onSelectSession={(session) => {
              openSessionDetail(session);
            }}
            onSessionsLoaded={setSessionsForAgent}
            onBack={backToAgents}
          />
        )}
        {currentView === "session" && selectedSession && (
          <SessionDetailView
            session={selectedSession}
            sessions={sessionsForAgent}
            onSessionChange={(s) =>
              setSelectedSession({ agentName: s.agentName, sessionName: s.sessionName, sessionId: s.sessionId })
            }
            onBack={backToDashboard}
            onBackToSessions={sessionsForAgent.length > 0 ? backToSessionsList : undefined}
            onOpenConfigDrawer={openConfigDrawer}
          />
        )}
      </div>

      {/* Meeting type chooser + modals */}
      <ChooseMeetingTypeModal
        open={meetingTypeFlow !== null}
        flow={meetingTypeFlow}
        onClose={() => setMeetingTypeFlow(null)}
        onContinueVirtual={() => {
          setMeetingTypeFlow(null);
          navigate("/meeting-type/coming-soon");
        }}
        onContinuePhone={() => {
          if (meetingTypeFlow === "start") {
            setIsStartModalOpen(true);
          } else if (meetingTypeFlow === "schedule") {
            setIsScheduleModalOpen(true);
          }
          setMeetingTypeFlow(null);
        }}
      />

      <StartSessionModal
        open={isStartModalOpen}
        onClose={() => setIsStartModalOpen(false)}
      />
      <ScheduleSessionModal
        open={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
      />

      {/* Configuration Drawer */}
      <ConfigDrawer
        open={isConfigDrawerOpen}
        onClose={closeConfigDrawer}
        automation={currentAutomation}
      />
    </div>
  );
};

export default Dashboard;
