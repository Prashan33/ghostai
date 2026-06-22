"use client";

import { useState } from "react";
import { Settings, Bot } from "lucide-react";
import { WorkspaceNavbar } from "@/components/editor/workspace-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import {
  CreateProjectDialog,
  RenameProjectDialog,
  DeleteProjectDialog,
} from "@/components/editor/project-dialogs";
import { ShareDialog } from "@/components/editor/share-dialog";
import { CanvasWrapper } from "@/components/editor/canvas-wrapper";
import { Canvas } from "@/components/editor/canvas";
import { useProjectActions } from "@/hooks/use-project-actions";
import type { ProjectData } from "@/lib/projects";

interface WorkspaceShellProps {
  projectName: string;
  projectId: string;
  isOwner: boolean;
  ownedProjects: ProjectData[];
  sharedProjects: ProjectData[];
}

export function WorkspaceShell({
  projectName,
  projectId,
  isOwner,
  ownedProjects,
  sharedProjects,
}: WorkspaceShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAISidebarOpen, setIsAISidebarOpen] = useState(true);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const actions = useProjectActions(projectId);

  return (
    <>
      <WorkspaceNavbar
        projectName={projectName}
        isSidebarOpen={isSidebarOpen}
        onSidebarToggle={() => setIsSidebarOpen((prev) => !prev)}
        isAISidebarOpen={isAISidebarOpen}
        onAISidebarToggle={() => setIsAISidebarOpen((prev) => !prev)}
        onShareClick={() => setIsShareOpen(true)}
      />

      {/* Content area: fixed below navbar, flex row */}
      <div className="fixed inset-0 top-12 flex overflow-hidden">

        {/* Left sidebar panel */}
        {isSidebarOpen && (
          <ProjectSidebar
            inline
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            ownedProjects={ownedProjects}
            sharedProjects={sharedProjects}
            activeProjectId={projectId}
            onNewProject={actions.openCreate}
            onRenameProject={actions.openRename}
            onDeleteProject={actions.openDelete}
          />
        )}

        {/* Collaborative canvas */}
        <CanvasWrapper roomId={projectId}>
          <Canvas />
        </CanvasWrapper>

        {/* Right AI sidebar */}
        {isAISidebarOpen && (
          <aside className="w-[320px] shrink-0 bg-surface border-l border-surface-border flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between px-4 py-3 border-b border-surface-border shrink-0">
              <div>
                <p className="text-sm font-semibold text-copy-primary">AI Copilot</p>
                <p className="text-xs text-copy-muted mt-0.5">Placeholder panel</p>
              </div>
              <Settings className="h-4 w-4 text-copy-muted mt-0.5" />
            </div>

            {/* Content */}
            <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto">
              {/* Chat surface pending card */}
              <div className="rounded-2xl bg-elevated border border-surface-border p-4 flex gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-accent-dim shrink-0 mt-0.5">
                  <Bot className="h-4 w-4 text-brand" />
                </div>
                <div>
                  <p className="text-sm font-medium text-copy-primary">
                    Chat surface pending
                  </p>
                  <p className="text-xs text-copy-muted mt-1.5 leading-relaxed">
                    The toggle is wired. Messaging and generation are intentionally
                    out of scope here.
                  </p>
                </div>
              </div>
            </div>

            {/* Future hooks footer */}
            <div className="px-4 py-4 border-t border-surface-border shrink-0">
              <p className="text-[10px] font-mono tracking-[0.2em] text-copy-muted uppercase mb-2">
                Future Hooks
              </p>
              <p className="text-xs text-copy-muted leading-relaxed">
                Prompt composer, run status, and architecture guidance will attach
                to this sidebar.
              </p>
            </div>
          </aside>
        )}
      </div>

      <ShareDialog
        open={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        projectId={projectId}
        isOwner={isOwner}
      />
      <CreateProjectDialog
        open={actions.dialogOpen === "create"}
        name={actions.createName}
        roomId={actions.roomIdPreview}
        onNameChange={actions.setCreateName}
        isLoading={actions.isLoading}
        onConfirm={actions.handleCreate}
        onClose={actions.close}
      />
      <RenameProjectDialog
        open={actions.dialogOpen === "rename"}
        project={actions.targetProject}
        name={actions.renameName}
        onNameChange={actions.setRenameName}
        isLoading={actions.isLoading}
        onConfirm={actions.handleRename}
        onClose={actions.close}
      />
      <DeleteProjectDialog
        open={actions.dialogOpen === "delete"}
        project={actions.targetProject}
        isLoading={actions.isLoading}
        onConfirm={actions.handleDelete}
        onClose={actions.close}
      />
    </>
  );
}
