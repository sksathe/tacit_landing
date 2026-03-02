import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";
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
    sessionId?: string | null;
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
    setCurrentAutomation({ type, title, icon, sessionId: selectedSession?.sessionId ?? null });
    setIsConfigDrawerOpen(true);
  };

  const closeConfigDrawer = () => {
    setIsConfigDrawerOpen(false);
    setCurrentAutomation(null);
  };

  return (
    <div className="relative isolate min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[-12rem] top-[-10rem] h-[28rem] w-[28rem] rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute right-[-10rem] top-[8rem] h-[24rem] w-[24rem] rounded-full bg-primary/6 blur-3xl" />
        <div className="absolute bottom-[-14rem] left-1/2 h-[30rem] w-[40rem] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
      </div>
      <DashboardHeader />
      
      {/* Sidebar toggle */}
      <button
        type="button"
        aria-label="Open menu"
        onClick={toggleSidebar}
        className={`fixed left-4 top-4 z-[1001] flex h-9 w-9 items-center justify-center rounded-lg border border-primary/25 bg-background/90 text-primary shadow-sm backdrop-blur-sm transition-all hover:border-primary hover:bg-primary/10 hover:shadow ${
          isSidebarOpen ? "pointer-events-none opacity-0" : ""
        }`}
      >
        <Menu className="h-5 w-5" strokeWidth={2} />
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
      <main className="mx-auto max-w-[1700px] px-5 pb-20 pt-10 sm:px-8 sm:pt-14 lg:px-10">
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
      </main>

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
