"use client";

import Link from "next/link";
import { X, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ProjectData } from "@/lib/projects";

interface ProjectSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  ownedProjects: ProjectData[];
  sharedProjects: ProjectData[];
  activeProjectId?: string;
  /** Render as an inline flex panel instead of a fixed overlay */
  inline?: boolean;
  onNewProject: () => void;
  onRenameProject: (project: ProjectData) => void;
  onDeleteProject: (project: ProjectData) => void;
}

function ProjectItem({
  project,
  isActive,
  onRename,
  onDelete,
}: {
  project: ProjectData;
  isActive?: boolean;
  onRename?: (p: ProjectData) => void;
  onDelete?: (p: ProjectData) => void;
}) {
  return (
    <Link
      href={`/editor/${project.id}`}
      className={`group flex items-center gap-2.5 px-3 py-2 transition-colors ${
        isActive ? "bg-accent-dim" : "hover:bg-elevated"
      }`}
    >
      <div
        className={`h-1.5 w-1.5 rounded-full shrink-0 transition-opacity ${
          isActive ? "bg-brand opacity-100" : "opacity-0"
        }`}
      />
      <span
        className={`text-sm truncate flex-1 transition-colors ${
          isActive
            ? "text-copy-primary font-medium"
            : "text-copy-secondary group-hover:text-copy-primary"
        }`}
      >
        {project.name}
      </span>

      {onRename && onDelete && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <Button
            variant="ghost"
            size="icon-sm"
            className="h-6 w-6 text-copy-muted hover:text-copy-primary hover:bg-subtle"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRename(project); }}
            aria-label={`Rename ${project.name}`}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="h-6 w-6 text-copy-muted hover:text-error hover:bg-error/10"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(project); }}
            aria-label={`Delete ${project.name}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </Link>
  );
}

function SidebarContent({
  onClose,
  ownedProjects,
  sharedProjects,
  activeProjectId,
  onNewProject,
  onRenameProject,
  onDeleteProject,
}: Omit<ProjectSidebarProps, "isOpen" | "inline">) {
  return (
    <>
      {/* Header */}
      <div
        id="project-sidebar"
        className="flex items-center justify-between px-4 h-11 border-b border-surface-border shrink-0"
      >
        <span className="text-sm font-medium text-copy-primary">Projects</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Close project sidebar"
          className="h-7 w-7 text-copy-muted hover:text-copy-primary hover:bg-elevated"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="my-projects" className="flex flex-col flex-1 min-h-0 pt-2">
        <div className="px-3 shrink-0">
          <TabsList className="w-full">
            <TabsTrigger value="my-projects" className="flex-1 text-xs">
              My Projects
            </TabsTrigger>
            <TabsTrigger value="shared" className="flex-1 text-xs">
              Shared
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="my-projects" className="flex-1 min-h-0 mt-0">
          <ScrollArea className="h-full">
            {ownedProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <p className="text-sm text-copy-muted">No projects yet.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-0.5 py-2">
                {ownedProjects.map((project) => (
                  <ProjectItem
                    key={project.id}
                    project={project}
                    isActive={project.id === activeProjectId}
                    onRename={onRenameProject}
                    onDelete={onDeleteProject}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="shared" className="flex-1 min-h-0 mt-0">
          <ScrollArea className="h-full">
            {sharedProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <p className="text-sm text-copy-muted">No shared projects.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-0.5 py-2">
                {sharedProjects.map((project) => (
                  <ProjectItem
                    key={project.id}
                    project={project}
                    isActive={project.id === activeProjectId}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="p-3 border-t border-surface-border shrink-0">
        <Button className="w-full gap-1.5 text-sm h-8" onClick={onNewProject}>
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>
    </>
  );
}

export function ProjectSidebar({
  isOpen,
  onClose,
  ownedProjects,
  sharedProjects,
  activeProjectId,
  inline,
  onNewProject,
  onRenameProject,
  onDeleteProject,
}: ProjectSidebarProps) {
  const contentProps = {
    onClose,
    ownedProjects,
    sharedProjects,
    activeProjectId,
    onNewProject,
    onRenameProject,
    onDeleteProject,
  };

  if (inline) {
    return (
      <div className="flex flex-col h-full w-[300px] shrink-0 bg-surface border-r border-surface-border">
        <SidebarContent {...contentProps} />
      </div>
    );
  }

  return (
    <>
      {/* Mobile backdrop scrim */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <div
        className={`fixed top-0 left-0 z-50 h-full w-60 flex flex-col bg-surface border-r border-surface-border transition-transform duration-200 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!isOpen}
        inert={!isOpen}
      >
        <SidebarContent {...contentProps} />
      </div>
    </>
  );
}
