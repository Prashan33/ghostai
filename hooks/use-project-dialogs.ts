"use client";

import { useState, useCallback } from "react";

export type DialogKind = "create" | "rename" | "delete" | null;

export interface MockProject {
  id: string;
  name: string;
  slug: string;
  isOwned: boolean;
}

export const MOCK_MY_PROJECTS: MockProject[] = [
  { id: "1", name: "Ghost AI Core", slug: "ghost-ai-core", isOwned: true },
  { id: "2", name: "Design System", slug: "design-system", isOwned: true },
  { id: "3", name: "My Project", slug: "my-project", isOwned: true },
];

export const MOCK_SHARED_PROJECTS: MockProject[] = [
  { id: "4", name: "Acme Corp Backend", slug: "acme-corp-backend", isOwned: false },
];

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function useProjectDialogs() {
  const [dialogOpen, setDialogOpen] = useState<DialogKind>(null);
  const [targetProject, setTargetProject] = useState<MockProject | null>(null);
  const [createName, setCreateName] = useState("");
  const [renameName, setRenameName] = useState("");
  const [isLoading] = useState(false);

  const openCreate = useCallback(() => {
    setCreateName("");
    setDialogOpen("create");
  }, []);

  const openRename = useCallback((project: MockProject) => {
    setTargetProject(project);
    setRenameName(project.name);
    setDialogOpen("rename");
  }, []);

  const openDelete = useCallback((project: MockProject) => {
    setTargetProject(project);
    setDialogOpen("delete");
  }, []);

  const close = useCallback(() => {
    setDialogOpen(null);
    setTargetProject(null);
  }, []);

  return {
    dialogOpen,
    targetProject,
    createName,
    createSlug: toSlug(createName),
    setCreateName,
    renameName,
    setRenameName,
    isLoading,
    openCreate,
    openRename,
    openDelete,
    close,
  };
}
