"use client";

import { useRef, useState } from "react";
import { WorkspaceNavbar } from "@/components/editor/workspace-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import {
  CreateProjectDialog,
  RenameProjectDialog,
  DeleteProjectDialog,
} from "@/components/editor/project-dialogs";
import { ShareDialog } from "@/components/editor/share-dialog";
import { StarterTemplatesModal } from "@/components/editor/starter-templates-modal";
import { CanvasWrapper } from "@/components/editor/canvas-wrapper";
import { Canvas } from "@/components/editor/canvas";
import { AISidebar } from "@/components/editor/ai-sidebar";
import { useProjectActions } from "@/hooks/use-project-actions";
import type { ProjectData } from "@/lib/projects";
import type { CanvasTemplate } from "@/components/editor/starter-templates";
import type { SaveStatus } from "@/hooks/use-canvas-autosave";

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
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState<CanvasTemplate | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const saveFnRef = useRef<() => void>(() => {});
  const getCanvasDataRef = useRef<() => { nodes: unknown[]; edges: unknown[] }>(() => ({ nodes: [], edges: [] }));
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
        onTemplatesClick={() => setIsTemplatesOpen(true)}
        saveStatus={saveStatus}
        onSave={() => saveFnRef.current()}
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

        {/* Collaborative canvas + AI sidebar share the same Liveblocks room context */}
        <CanvasWrapper roomId={projectId}>
          <Canvas
            projectId={projectId}
            importTemplate={pendingTemplate}
            onTemplateImported={() => setPendingTemplate(null)}
            onSaveStatusChange={setSaveStatus}
            onManualSaveReady={(fn) => { saveFnRef.current = fn; }}
            onGetCanvasDataReady={(fn) => { getCanvasDataRef.current = fn; }}
          />
          {isAISidebarOpen && (
            <AISidebar
              onClose={() => setIsAISidebarOpen(false)}
              projectId={projectId}
              roomId={projectId}
              getCanvasData={() => getCanvasDataRef.current()}
            />
          )}
        </CanvasWrapper>
      </div>

      <StarterTemplatesModal
        open={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onImport={(tpl) => setPendingTemplate(tpl)}
      />
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
