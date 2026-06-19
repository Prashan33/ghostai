"use client";

import { useState } from "react";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { EditorHome } from "@/components/editor/editor-home";
import {
  CreateProjectDialog,
  RenameProjectDialog,
  DeleteProjectDialog,
} from "@/components/editor/project-dialogs";
import { useProjectActions } from "@/hooks/use-project-actions";
import type { ProjectData } from "@/lib/projects";

interface EditorShellProps {
  ownedProjects: ProjectData[];
  sharedProjects: ProjectData[];
}

export function EditorShell({ ownedProjects, sharedProjects }: EditorShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const actions = useProjectActions();

  return (
    <>
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onSidebarToggle={() => setIsSidebarOpen((prev) => !prev)}
      />
      <ProjectSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        ownedProjects={ownedProjects}
        sharedProjects={sharedProjects}
        onNewProject={actions.openCreate}
        onRenameProject={actions.openRename}
        onDeleteProject={actions.openDelete}
      />
      <main className="pt-11">
        <EditorHome onNewProject={actions.openCreate} />
      </main>

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
