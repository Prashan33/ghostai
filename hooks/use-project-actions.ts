"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { ProjectData } from "@/lib/projects";

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function shortSuffix(): string {
  return Math.random().toString(36).slice(2, 7);
}

export function useProjectActions(activeProjectId?: string) {
  const router = useRouter();

  const [dialogOpen, setDialogOpen] = useState<"create" | "rename" | "delete" | null>(null);
  const [targetProject, setTargetProject] = useState<ProjectData | null>(null);
  const [createName, setCreateName] = useState("");
  const [renameName, setRenameName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suffix, setSuffix] = useState<string>(shortSuffix);

  const roomIdPreview = createName.trim()
    ? `${toSlug(createName)}-${suffix}`
    : "";

  const openCreate = useCallback(() => {
    setCreateName("");
    setSuffix(shortSuffix());
    setDialogOpen("create");
  }, []);

  const openRename = useCallback((project: ProjectData) => {
    setTargetProject(project);
    setRenameName(project.name);
    setDialogOpen("rename");
  }, []);

  const openDelete = useCallback((project: ProjectData) => {
    setTargetProject(project);
    setDialogOpen("delete");
  }, []);

  const close = useCallback(() => {
    setDialogOpen(null);
    setTargetProject(null);
  }, []);

  const handleCreate = useCallback(async () => {
    if (!createName.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: createName.trim() }),
      });
      if (!res.ok) throw new Error("Failed to create project");
      const project = (await res.json()) as { id: string };
      close();
      router.push(`/editor/${project.id}`);
    } finally {
      setIsLoading(false);
    }
  }, [createName, close, router]);

  const handleRename = useCallback(async () => {
    if (!renameName.trim() || !targetProject) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/projects/${targetProject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: renameName.trim() }),
      });
      if (!res.ok) throw new Error("Failed to rename project");
      close();
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  }, [renameName, targetProject, close, router]);

  const handleDelete = useCallback(async () => {
    if (!targetProject) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/projects/${targetProject.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete project");
      close();
      if (activeProjectId === targetProject.id) {
        router.push("/editor");
      } else {
        router.refresh();
      }
    } finally {
      setIsLoading(false);
    }
  }, [targetProject, activeProjectId, close, router]);

  return {
    dialogOpen,
    targetProject,
    createName,
    roomIdPreview,
    setCreateName,
    renameName,
    setRenameName,
    isLoading,
    openCreate,
    openRename,
    openDelete,
    close,
    handleCreate,
    handleRename,
    handleDelete,
  };
}
