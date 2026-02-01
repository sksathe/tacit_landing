"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, Calendar, Menu, X, Settings, Home, Workflow, FileText, ChevronDown, Plus, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTacitSidebar } from "@/contexts/TacitSidebarContext";
import { useAuth } from "@/contexts/AuthContext";
import { meetings } from "@/data/mockData";
import { formatDistanceToNow } from "date-fns";

export function AppSidebar() {
    const pathname = usePathname();
    const { isSidebarOpen, toggleSidebar } = useTacitSidebar();
    const { user } = useAuth();
    const [isMeetingsExpanded, setIsMeetingsExpanded] = useState(true);

    const navItems = [
        { name: "Dashboard", href: "/", icon: Home },
        { name: "Agents", href: "/agents", icon: Bot },
        { name: "Meetings", href: "/meetings", icon: Calendar },
        { name: "Workflows", href: "/workflows", icon: Workflow },
        { name: "Documents", href: "/documents", icon: FileText },
        { name: "Settings", href: "/settings", icon: Settings },
    ];

    // Get current/upcoming meetings (Scheduled or In Progress)
    const currentMeetings = meetings
        .filter(m => m.status === 'Scheduled' || m.status === 'In Progress')
        .slice(0, 3)
        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'In Progress':
                return 'bg-[#22c55e]';
            case 'Scheduled':
                return 'bg-yellow-500';
            case 'Completed':
                return 'bg-white/20';
            default:
                return 'bg-gray-500';
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'In Progress':
                return { text: 'Active', color: 'bg-[#22c55e]/20 text-[#22c55e] border-[#22c55e]/30' };
            case 'Scheduled':
                return { text: 'Upcoming', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' };
            default:
                return { text: status, color: 'bg-white/10 text-white/60 border-white/20' };
        }
    };

    if (!isSidebarOpen) {
        return (
            <div className="bg-black border-r border-white/10 h-screen fixed left-0 top-0 flex flex-col z-30 transition-all duration-300 w-16">
                <div className="p-4 flex flex-col gap-3">
                    <div className="w-8 h-8 rounded-md bg-[rgba(255,255,255,0.02)] flex items-center justify-center border border-[#22c55e]/20 shadow-lg shadow-[#22c55e]/10">
                        <Bot className="w-4 h-4 text-[#22c55e]" />
                    </div>
                    <button
                        onClick={toggleSidebar}
                        className="w-full flex justify-center p-1.5 rounded-md hover:bg-white/5 text-white/60 hover:text-white transition-all duration-200 hover:translate-y-[-1px]"
                        aria-label="Expand sidebar"
                    >
                        <Menu className="w-4 h-4" />
                    </button>
                </div>
                <nav className="flex-1 space-y-1 py-4 px-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center justify-center rounded-md p-2 transition-all duration-200",
                                isActive
                                    ? "bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/30 shadow-lg shadow-[#22c55e]/10"
                                    : "text-white/60 hover:text-white hover:bg-white/5 hover:translate-y-[-1px]"
                                )}
                                title={item.name}
                            >
                                <item.icon className="w-4 h-4" />
                            </Link>
                        );
                    })}
                </nav>
            </div>
        );
    }

    return (
        <div className="bg-black border-r border-white/10 h-screen fixed left-0 top-0 flex flex-col z-30 transition-all duration-300 w-64 shadow-2xl">
            {/* Logo Area */}
            <div className="p-6 border-b border-white/10 bg-[rgba(255,255,255,0.02)]/50 backdrop-blur-sm">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-md bg-[rgba(255,255,255,0.02)] flex items-center justify-center border border-[#22c55e]/30 shadow-lg shadow-[#22c55e]/10">
                            <Bot className="w-4 h-4 text-[#22c55e]" />
                        </div>
                        <h1 className="text-lg font-bold text-white tracking-tight whitespace-nowrap">Tacit</h1>
                    </div>
                    <button
                        onClick={toggleSidebar}
                        className="p-1.5 rounded-md hover:bg-white/5 text-white/60 hover:text-white transition-all duration-200 hover:translate-y-[-1px] flex-shrink-0"
                        aria-label="Collapse sidebar"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200",
                                isActive
                                    ? "bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/30 shadow-lg shadow-[#22c55e]/10"
                                    : "text-white/70 hover:text-white hover:bg-white/5 hover:-translate-y-0.5 hover:shadow-lg"
                            )}
                        >
                            <item.icon className={cn("w-4 h-4 flex-shrink-0", isActive ? "text-[#22c55e]" : "text-white/60 group-hover:text-white")} />
                            <span className="flex-1 min-w-0">{item.name}</span>
                        </Link>
                    );
                })}

                {/* Current Meetings Section */}
                <div className="mt-6 pt-4 border-t border-white/10">
                    <button
                        onClick={() => setIsMeetingsExpanded(!isMeetingsExpanded)}
                        className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-white/60 hover:text-white transition-all duration-200 uppercase tracking-wider hover:bg-white/5 rounded-md"
                    >
                        <div className="flex items-center gap-2">
                            <ChevronDown className={cn("w-3 h-3 transition-transform duration-200", isMeetingsExpanded ? "rotate-0" : "-rotate-90")} />
                            <span>Current Meetings</span>
                        </div>
                        <Plus className="w-3 h-3 hover:bg-white/10 rounded-md p-0.5 transition-all duration-200 hover:translate-y-[-1px]" />
                    </button>

                    {isMeetingsExpanded && (
                        <div className="mt-2 space-y-2">
                            {currentMeetings.length > 0 ? (
                                currentMeetings.map((meeting) => {
                                    const statusBadge = getStatusBadge(meeting.status);
                                    const isNow = meeting.status === 'In Progress';
                                    return (
                                        <div
                                            key={meeting.id}
                                            className={cn(
                                                "group rounded-md px-3 py-2.5 transition-all duration-200 cursor-pointer",
                                                isNow
                                                    ? "bg-[#22c55e]/20 border border-[#22c55e]/30 shadow-lg shadow-[#22c55e]/10 hover:shadow-xl hover:shadow-[#22c55e]/20"
                                                    : "bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 hover:-translate-y-0.5 hover:shadow-lg"
                                            )}
                                        >
                                            <div className="flex items-start gap-2 mb-1.5">
                                                <div className={cn("w-2 h-2 rounded-lg mt-1.5 flex-shrink-0", getStatusColor(meeting.status))} />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium text-white truncate">{meeting.title}</p>
                                                    <p className="text-[10px] text-white/50 mt-0.5 line-clamp-1">{meeting.description}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className={cn("text-[10px] px-1.5 py-0.5 rounded-md border font-medium", statusBadge.color)}>
                                                    {statusBadge.text}
                                                </span>
                                                {meeting.status === 'Scheduled' && (
                                                    <div className="flex items-center gap-1 text-[10px] text-white/50">
                                                        <Clock className="w-3 h-3" />
                                                        <span>{formatDistanceToNow(new Date(meeting.scheduledAt), { addSuffix: true })}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="px-3 py-4 text-center">
                                    <p className="text-xs text-white/40">No active meetings</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </nav>

        </div>
    );
}
