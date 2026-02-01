"use client";

import { useState } from "react";
import { Search, Bell, Folder, Plus, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { projects } from "@/data/mockData";
import { AddProjectModal } from "@/components/modals/AddProjectModal";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Project } from "@/types";

interface TopBarProps {
    title: string;
}

export function TopBar({ title }: TopBarProps) {
    const { user } = useAuth();
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState('project_personal');

    const currentProject = projects.find((p: Project) => p.id === selectedProjectId) || projects[0];

    const handleAddProject = (projectData: { name: string; description?: string }) => {
        // TODO: Integrate with backend API
        console.log("Adding project:", projectData);
        alert(`Project "${projectData.name}" would be created.`);
    };

    return (
        <header className="h-16 border-b border-white/10 bg-black/95 backdrop-blur-xl sticky top-0 z-20 flex items-center justify-between px-6 lg:px-8 transition-all duration-300">
            <div className="flex items-center gap-4">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-white/5 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5">
                            <div className="w-5 h-5 rounded-lg bg-[rgba(255,255,255,0.02)] flex items-center justify-center border border-[#22c55e]/20">
                                <Folder className="h-3 w-3 text-[#22c55e]" />
                            </div>
                            <span className="text-white">{currentProject.name}</span>
                            {currentProject.isPersonal && (
                                <span className="text-[10px] text-white/60 bg-white/5 px-1.5 py-0.5 rounded-md border border-white/10">
                                    Personal
                                </span>
                            )}
                            <ChevronDown className="h-3.5 w-3.5 text-white/60" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-64 bg-[rgba(255,255,255,0.02)] border-white/10 backdrop-blur-xl">
                        <DropdownMenuLabel className="text-white">Projects</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-white/10" />
                        {projects.map((project: Project) => (
                            <DropdownMenuItem
                                key={project.id}
                                onClick={() => setSelectedProjectId(project.id)}
                                className={cn(
                                    "text-white/70 hover:text-white hover:bg-white/5 rounded-md",
                                    project.id === selectedProjectId && "bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/30"
                                )}
                            >
                                <Folder className="h-4 w-4 mr-2" />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="truncate">{project.name}</span>
                                        {project.isPersonal && (
                                            <span className="text-[10px] text-white/50">Personal</span>
                                        )}
                                    </div>
                                    {project.description && (
                                        <p className="text-xs text-white/50 truncate mt-0.5">
                                            {project.description}
                                        </p>
                                    )}
                                </div>
                            </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuItem 
                            onClick={() => setIsProjectModalOpen(true)}
                            className="text-white/70 hover:text-white hover:bg-white/5 rounded-md"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Create New Project
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <div className="h-4 w-px bg-white/10" />
                <h2 className="text-sm font-semibold text-white/60 tracking-tight uppercase">{title}</h2>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative w-72 hidden md:block group">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/40 group-hover:text-white/60 transition-colors" />
                    <Input
                        type="search"
                        placeholder="Search..."
                        className="pl-9 bg-white/5 border-white/10 focus:bg-white/10 focus:border-[#22c55e]/50 h-9 text-sm transition-all duration-200 rounded-md text-white placeholder:text-white/40"
                    />
                    <div className="absolute right-3 top-2.5 flex items-center gap-1 pointer-events-none">
                        <span className="text-[10px] font-mono text-white/40 bg-white/5 px-1.5 py-0.5 rounded-md border border-white/10">⌘K</span>
                    </div>
                </div>

                <div className="h-4 w-[1px] bg-white/10 mx-2" />

                <Button variant="ghost" size="icon" className="text-white/60 hover:text-white hover:bg-white/5 rounded-md w-8 h-8 transition-all duration-200 hover:-translate-y-0.5">
                    <Bell className="w-4 h-4" />
                </Button>

                {/* User Profile */}
                <div className="relative">
                    <div className="w-9 h-9 rounded-full bg-[rgba(255,255,255,0.02)] flex items-center justify-center text-sm font-medium text-white border border-white/10 cursor-pointer hover:border-[#22c55e]/30 transition-all duration-200 hover:-translate-y-0.5">
                        {user?.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#22c55e] border-2 border-[#09090b]" />
                </div>
            </div>

            <AddProjectModal
                open={isProjectModalOpen}
                onOpenChange={setIsProjectModalOpen}
                onAdd={handleAddProject}
            />
        </header>
    );
}
