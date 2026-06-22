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
} from "@/components/ui/dialog";
import type { ProjectData } from "@/lib/projects";

// ── Create Project ──────────────────────────────────────────────────────────

interface CreateProjectDialogProps {
  open: boolean;
  name: string;
  roomId: string;
  onNameChange: (value: string) => void;
  isLoading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function CreateProjectDialog({
  open,
  name,
  roomId,
  onNameChange,
  isLoading,
  onConfirm,
  onClose,
}: CreateProjectDialogProps) {
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && name.trim() && !isLoading) onConfirm();
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="rounded-3xl" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-copy-primary">New project</DialogTitle>
          <DialogDescription>
            Give your project a name to get started.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-1">
          <Input
            className="text-copy-primary"
            placeholder="Project name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            disabled={isLoading}
          />
          {roomId && (
            <p className="text-xs text-copy-muted">
              Room ID: <span className="text-copy-secondary font-mono">{roomId}</span>
            </p>
          )}
        </div>

        <DialogFooter className="rounded-b-3xl">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button disabled={!name.trim() || isLoading} onClick={onConfirm}>
            {isLoading ? "Creating…" : "Create project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Rename Project ──────────────────────────────────────────────────────────

interface RenameProjectDialogProps {
  open: boolean;
  project: ProjectData | null;
  name: string;
  onNameChange: (value: string) => void;
  isLoading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function RenameProjectDialog({
  open,
  project,
  name,
  onNameChange,
  isLoading,
  onConfirm,
  onClose,
}: RenameProjectDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && name.trim() && !isLoading) onConfirm();
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="rounded-3xl" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-copy-primary">Rename project</DialogTitle>
          {project && (
            <DialogDescription>
              Renaming &ldquo;{project.name}&rdquo;
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="py-1">
          <Input
            ref={inputRef}
            className="text-copy-primary"
            placeholder="Project name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
        </div>

        <DialogFooter className="rounded-b-3xl">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button disabled={!name.trim() || isLoading} onClick={onConfirm}>
            {isLoading ? "Renaming…" : "Rename"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Delete Project ──────────────────────────────────────────────────────────

interface DeleteProjectDialogProps {
  open: boolean;
  project: ProjectData | null;
  isLoading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function DeleteProjectDialog({
  open,
  project,
  isLoading,
  onConfirm,
  onClose,
}: DeleteProjectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="rounded-3xl" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-copy-primary">Delete project</DialogTitle>
          {project && (
            <DialogDescription>
              &ldquo;{project.name}&rdquo; will be permanently deleted. This cannot be undone.
            </DialogDescription>
          )}
        </DialogHeader>

        <DialogFooter className="rounded-b-3xl">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? "Deleting…" : "Delete project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
