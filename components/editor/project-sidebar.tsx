"use client";

import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ProjectSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectSidebar({ isOpen, onClose }: ProjectSidebarProps) {
  return (
    <div
      className={`fixed top-0 left-0 z-50 h-full w-72 flex flex-col bg-surface border-r border-surface-border transition-transform duration-200 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex items-center justify-between px-4 h-12 border-b border-surface-border shrink-0">
        <span className="text-sm font-medium text-copy-primary">Projects</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-7 w-7 text-copy-muted hover:text-copy-primary hover:bg-elevated"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Tabs defaultValue="my-projects" className="flex flex-col flex-1 min-h-0 pt-3">
        <TabsList className="mx-4 shrink-0">
          <TabsTrigger value="my-projects" className="flex-1 text-xs">
            My Projects
          </TabsTrigger>
          <TabsTrigger value="shared" className="flex-1 text-xs">
            Shared
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-projects" className="flex-1 min-h-0 mt-0">
          <ScrollArea className="h-full">
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <p className="text-sm text-copy-muted">No projects yet.</p>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="shared" className="flex-1 min-h-0 mt-0">
          <ScrollArea className="h-full">
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <p className="text-sm text-copy-muted">No shared projects.</p>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <div className="p-4 border-t border-surface-border shrink-0">
        <Button className="w-full gap-2 text-sm" variant="default">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>
    </div>
  );
}
