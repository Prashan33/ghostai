"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import type { MockProject } from "@/hooks/use-project-dialogs";

// ── Create Project ──────────────────────────────────────────────────────────

interface CreateProjectDialogProps {
  open: boolean;
  name: string;
  slug: string;
  onNameChange: (value: string) => void;
  onClose: () => void;
}

export function CreateProjectDialog({
  open,
  name,
  slug,
  onNameChange,
  onClose,
}: CreateProjectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="rounded-3xl" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>New project</DialogTitle>
          <DialogDescription>
            Give your project a name to get started.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-1">
          <Input
            placeholder="Project name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            autoFocus
          />
          {name.trim() && (
            <p className="text-xs text-copy-muted">
              Slug: <span className="text-copy-secondary font-mono">{slug}</span>
            </p>
          )}
        </div>

        <DialogFooter className="rounded-b-3xl">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!name.trim()} onClick={onClose}>
            Create project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Rename Project ──────────────────────────────────────────────────────────

interface RenameProjectDialogProps {
  open: boolean;
  project: MockProject | null;
  name: string;
  onNameChange: (value: string) => void;
  onClose: () => void;
}

export function RenameProjectDialog({
  open,
  project,
  name,
  onNameChange,
  onClose,
}: RenameProjectDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && name.trim()) onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="rounded-3xl" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Rename project</DialogTitle>
          {project && (
            <DialogDescription>
              Renaming &ldquo;{project.name}&rdquo;
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="py-1">
          <Input
            ref={inputRef}
            placeholder="Project name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        <DialogFooter className="rounded-b-3xl">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!name.trim()} onClick={onClose}>
            Rename
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Delete Project ──────────────────────────────────────────────────────────

interface DeleteProjectDialogProps {
  open: boolean;
  project: MockProject | null;
  onClose: () => void;
}

export function DeleteProjectDialog({
  open,
  project,
  onClose,
}: DeleteProjectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="rounded-3xl" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Delete project</DialogTitle>
          {project && (
            <DialogDescription>
              &ldquo;{project.name}&rdquo; will be permanently deleted. This cannot be undone.
            </DialogDescription>
          )}
        </DialogHeader>

        <DialogFooter className="rounded-b-3xl">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onClose}>
            Delete project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
