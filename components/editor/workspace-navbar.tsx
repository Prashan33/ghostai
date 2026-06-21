"use client";

import { PanelLeftClose, PanelLeftOpen, Share2, Bot } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WorkspaceNavbarProps {
  projectName: string;
  isSidebarOpen: boolean;
  onSidebarToggle: () => void;
  isAISidebarOpen: boolean;
  onAISidebarToggle: () => void;
  onShareClick: () => void;
}

export function WorkspaceNavbar({
  projectName,
  isSidebarOpen,
  onSidebarToggle,
  isAISidebarOpen,
  onAISidebarToggle,
  onShareClick,
}: WorkspaceNavbarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-12 flex items-center justify-between px-3 bg-surface border-b border-surface-border">
      {/* Left: toggle + project name */}
      <div className="flex items-center gap-2.5">
        <Button
          variant="ghost"
          size="icon"
          onClick={onSidebarToggle}
          aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          aria-expanded={isSidebarOpen}
          aria-controls="project-sidebar"
          className="h-8 w-8 text-copy-secondary hover:text-copy-primary hover:bg-elevated"
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="h-5 w-5" />
          ) : (
            <PanelLeftOpen className="h-5 w-5" />
          )}
        </Button>

        <div className="flex flex-col leading-none">
          <span className="text-sm font-semibold text-copy-primary">{projectName}</span>
          <span className="text-[11px] text-copy-muted mt-0.5">Workspace</span>
        </div>
      </div>

      {/* Right: share + AI + user */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onShareClick}
          className="h-8 gap-1.5 text-xs text-copy-secondary border border-surface-border hover:text-copy-primary"
        >
          <Share2 className="h-3.5 w-3.5" />
          Share
        </Button>

        <Button
          size="sm"
          onClick={onAISidebarToggle}
          aria-label={isAISidebarOpen ? "Close AI sidebar" : "Open AI sidebar"}
          aria-expanded={isAISidebarOpen}
          className={cn(
            "h-8 gap-1.5 text-xs font-medium",
            isAISidebarOpen
              ? ""
              : "bg-elevated text-copy-secondary border border-surface-border hover:text-copy-primary"
          )}
        >
          <Bot className="h-3.5 w-3.5" />
          AI
        </Button>

        <UserButton />
      </div>
    </header>
  );
}
