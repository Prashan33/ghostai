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
import { useProjectDialogs } from "@/hooks/use-project-dialogs";

export function EditorShell() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const dialogs = useProjectDialogs();

  return (
    <>
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onSidebarToggle={() => setIsSidebarOpen((prev) => !prev)}
      />
      <ProjectSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onNewProject={dialogs.openCreate}
        onRenameProject={dialogs.openRename}
        onDeleteProject={dialogs.openDelete}
      />
      <main className="pt-11">
        <EditorHome onNewProject={dialogs.openCreate} />
      </main>

      <CreateProjectDialog
        open={dialogs.dialogOpen === "create"}
        name={dialogs.createName}
        slug={dialogs.createSlug}
        onNameChange={dialogs.setCreateName}
        onClose={dialogs.close}
      />
      <RenameProjectDialog
        open={dialogs.dialogOpen === "rename"}
        project={dialogs.targetProject}
        name={dialogs.renameName}
        onNameChange={dialogs.setRenameName}
        onClose={dialogs.close}
      />
      <DeleteProjectDialog
        open={dialogs.dialogOpen === "delete"}
        project={dialogs.targetProject}
        onClose={dialogs.close}
      />
    </>
  );
}
