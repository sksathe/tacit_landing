"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { SessionsSidebar } from "@/components/dashboard/SessionsSidebar";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { SessionDetailView } from "@/components/dashboard/SessionDetailView";
import { StartSessionModal } from "@/components/dashboard/StartSessionModal";
import { ScheduleSessionModal } from "@/components/dashboard/ScheduleSessionModal";
import { ConfigDrawer } from "@/components/dashboard/ConfigDrawer";

export default function Home() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState<"dashboard" | "session">("dashboard");
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

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const openSessionDetail = (agentName: string, sessionName: string, sessionId: string) => {
    setSelectedSession({ agentName, sessionName, sessionId });
    setCurrentView("session");
    setIsSidebarOpen(false);
  };

  const backToDashboard = () => {
    setCurrentView("dashboard");
    setSelectedSession(null);
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
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a] text-white">
      <DashboardHeader />
      
      {/* Hamburger Menu Button */}
      <button
        onClick={toggleSidebar}
        className={`fixed top-6 left-6 w-[50px] h-[50px] flex flex-col justify-center items-center gap-1.5 p-2.5 rounded-xl transition-all z-[1001] ${
          isSidebarOpen ? "opacity-0 pointer-events-none" : ""
        } bg-[rgba(16,185,129,0.15)] border-2 border-[rgba(16,185,129,0.3)] hover:bg-[rgba(16,185,129,0.25)] hover:border-[#10b981] hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]`}
      >
        <span className="w-6 h-0.5 bg-[#10b981] rounded-sm transition-all" />
        <span className="w-6 h-0.5 bg-[#10b981] rounded-sm transition-all" />
        <span className="w-6 h-0.5 bg-[#10b981] rounded-sm transition-all" />
      </button>

      {/* Sidebar */}
      <SessionsSidebar
        isOpen={isSidebarOpen}
        onClose={toggleSidebar}
        onSessionClick={openSessionDetail}
      />

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[998]"
        />
      )}

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-8 py-16">
        {currentView === "dashboard" ? (
          <DashboardView
            onStartSession={() => setIsStartModalOpen(true)}
            onScheduleSession={() => setIsScheduleModalOpen(true)}
            onAutomateSessions={toggleSidebar}
          />
        ) : (
          <SessionDetailView
            session={selectedSession!}
            onBack={backToDashboard}
            onOpenConfigDrawer={openConfigDrawer}
          />
        )}
      </div>

      {/* Modals */}
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
}
