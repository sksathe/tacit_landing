import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { SessionDetailView } from "@/components/dashboard/SessionDetailView";
import { AutomationConfigPanel } from "@/components/dashboard/AutomationConfigPanel";
import type { SessionItem } from "@/components/dashboard/AutomateSessionsList";

type AutomationParams = {
  agentId?: string;
  automationId?: string;
  sessionId?: string;
};

interface AutomationRouteState {
  session: {
    agentName: string;
    sessionName: string;
    sessionId: string;
  };
  sessionsForAgent?: SessionItem[];
}

export default function RachelAutomation() {
  const { agentId, automationId, sessionId } = useParams<AutomationParams>();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as AutomationRouteState | undefined;

  if (!agentId || !automationId || !sessionId) {
    return <Navigate to="/dashboard" replace />;
  }

  const sessionFromState = state?.session;

  if (!sessionFromState || sessionFromState.sessionId !== sessionId) {
    // If we don't have session context (e.g. direct URL visit), send user back to dashboard.
    return <Navigate to="/dashboard" replace />;
  }

  const sessionsForAgent = state.sessionsForAgent ?? [];

  const handleBack = () => {
    // Always go to dashboard home so we never send user back to login.
    navigate("/dashboard");
  };

  const automationLabel = automationId.replace(/-/g, " ");
  const automationMeta = {
    type: automationId,
    title: automationLabel
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" "),
    icon: automationId === "summary" ? "📄" : automationId === "clarity-scorer" ? "💎" : "✅",
    sessionId,
  };

  return (
    <div className="relative isolate min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[-12rem] top-[-10rem] h-[28rem] w-[28rem] rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute right-[-10rem] top-[8rem] h-[24rem] w-[24rem] rounded-full bg-primary/6 blur-3xl" />
        <div className="absolute bottom-[-14rem] left-1/2 h-[30rem] w-[40rem] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <DashboardHeader />

      <main className="mx-auto max-w-[1700px] px-5 pb-20 pt-10 sm:px-8 sm:pt-14 lg:px-10">
        <div className="mb-5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="cursor-pointer border-none bg-transparent p-0 transition-colors hover:text-primary"
          >
            Home
          </button>
          <span className="text-primary/40">|</span>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="cursor-pointer border-none bg-transparent p-0 transition-colors hover:text-primary"
          >
            Sessions
          </button>
          <span className="text-primary/40">|</span>
          <span className="text-muted-foreground">Automate Past Session</span>
          <span className="text-primary/40">|</span>
          <span className="text-primary font-semibold">{sessionFromState.agentName}</span>
        </div>

        <div className="mb-6">
          <AutomationConfigPanel automation={automationMeta} />
        </div>

        <SessionDetailView
          session={sessionFromState}
          sessions={sessionsForAgent}
          onSessionChange={(s) =>
            navigate(`/dashboard/${agentId}/${automationId}/${s.sessionId}`, {
              replace: true,
              state: {
                session: {
                  agentName: s.agentName,
                  sessionName: s.sessionName,
                  sessionId: s.sessionId,
                },
                sessionsForAgent,
              },
            })
          }
          onBack={handleBack}
          onBackToSessions={sessionsForAgent.length > 0 ? handleBack : undefined}
          onOpenConfigDrawer={() => {}}
          initialAutomationId={automationId}
          hideBreadcrumb
          compactLayout
        />
      </main>
    </div>
  );
}

