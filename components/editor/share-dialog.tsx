"use client";

import { useState, useEffect, useCallback } from "react";
import { Link2, Mail, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CollaboratorProfile {
  email: string;
  name: string | null;
  avatarUrl: string | null;
}

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  isOwner: boolean;
}

function Avatar({ profile }: { profile: CollaboratorProfile }) {
  const initials = (profile.name ?? profile.email).charAt(0).toUpperCase();
  return (
    <div className="shrink-0 w-10 h-10 rounded-full overflow-hidden bg-elevated border border-surface-border flex items-center justify-center">
      {profile.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        <span className="text-sm font-semibold text-copy-secondary">{initials}</span>
      )}
    </div>
  );
}

function RoleBadge({ role }: { role: "OWNER" | "COLLABORATOR" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide",
        role === "OWNER"
          ? "bg-white/10 text-copy-secondary"
          : "bg-white/6 text-copy-muted",
      )}
    >
      {role}
    </span>
  );
}

export function ShareDialog({
  open,
  onClose,
  projectId,
  isOwner,
}: ShareDialogProps) {
  const [owner, setOwner] = useState<CollaboratorProfile | null>(null);
  const [collaborators, setCollaborators] = useState<CollaboratorProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [removingEmail, setRemovingEmail] = useState<string | null>(null);

  const fetchCollaborators = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/collaborators`);
      if (res.ok) {
        const data = (await res.json()) as {
          owner: CollaboratorProfile;
          collaborators: CollaboratorProfile[];
        };
        setOwner(data.owner);
        setCollaborators(data.collaborators);
      }
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (open) {
      void fetchCollaborators();
    } else {
      setInviteEmail("");
      setInviteError(null);
    }
  }, [open, fetchCollaborators]);

  async function handleInvite() {
    const email = inviteEmail.trim();
    if (!email) return;
    setIsInviting(true);
    setInviteError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setInviteEmail("");
        await fetchCollaborators();
      } else {
        const data = (await res.json()) as { error?: string };
        setInviteError(data.error ?? "Failed to invite");
      }
    } finally {
      setIsInviting(false);
    }
  }

  async function handleRemove(email: string) {
    setRemovingEmail(email);
    try {
      const res = await fetch(`/api/projects/${projectId}/collaborators`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        await fetchCollaborators();
      }
    } finally {
      setRemovingEmail(null);
    }
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(window.location.href)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        console.error("Failed to copy link:", err);
        // Optionally show error message to user
      });
  }

  const totalCount = 1 + collaborators.length;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="w-full max-w-[520px] bg-surface border-surface-border rounded-3xl p-6 flex flex-col gap-5">
        {/* Header */}
        <DialogHeader className="gap-1">
          <DialogTitle className="text-copy-primary text-lg font-semibold leading-none">
            Share project
          </DialogTitle>
          <DialogDescription className="text-copy-muted text-sm leading-snug">
            Invite collaborators, copy the workspace link, and manage access.
          </DialogDescription>
        </DialogHeader>

        {/* Workspace link card */}
        <div className="flex items-center justify-between gap-4 rounded-2xl bg-elevated border border-surface-border px-4 py-3.5">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-sm font-semibold text-copy-primary">Workspace link</span>
            <span className="text-xs text-copy-muted leading-snug">
              Share a direct link with teammates after you grant them access.
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyLink}
            className="shrink-0 h-8 gap-1.5 text-xs font-medium text-copy-secondary border border-surface-border hover:text-copy-primary"
          >
            <Link2 className="h-3.5 w-3.5" />
            {copied ? "Copied!" : "Copy link"}
          </Button>
        </div>

        {/* Invite section — owner only */}
        {isOwner && (
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              {/* Input with mail icon */}
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-copy-muted pointer-events-none" />
                <Input
                  type="email"
                  placeholder="teammate@company.com"
                  value={inviteEmail}
                  onChange={(e) => {
                    setInviteEmail(e.target.value);
                    setInviteError(null);
                  }}
                  onKeyDown={(e) => { if (e.key === "Enter") void handleInvite(); }}
                  className="h-10 pl-9 text-sm bg-elevated border-surface-border text-copy-primary placeholder:text-copy-muted"
                  disabled={isInviting}
                />
              </div>
              <Button
                size="sm"
                onClick={() => void handleInvite()}
                disabled={!inviteEmail.trim() || isInviting}
                className="h-10 px-5 text-sm font-medium"
              >
                {isInviting ? "Inviting…" : "Invite"}
              </Button>
            </div>
            {inviteError && (
              <p className="text-xs" style={{ color: "var(--state-error)" }}>
                {inviteError}
              </p>
            )}
          </div>
        )}

        {/* People with access */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-copy-muted">People with access</span>
            <span className="text-xs text-copy-muted">{totalCount} total</span>
          </div>

          {isLoading ? (
            <p className="text-sm text-copy-muted py-2">Loading…</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {/* Owner row */}
              {owner && (
                <li className="flex items-center gap-3 rounded-2xl bg-elevated border border-surface-border px-3.5 py-3">
                  <Avatar profile={owner} />
                  <div className="flex flex-col min-w-0 flex-1 gap-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-sm font-semibold text-copy-primary truncate leading-none">
                        {owner.name ?? owner.email}
                      </span>
                      <RoleBadge role="OWNER" />
                    </div>
                    {owner.name && (
                      <span className="text-xs text-copy-muted truncate leading-none">
                        {owner.email}
                      </span>
                    )}
                  </div>
                </li>
              )}

              {/* Collaborator rows */}
              {collaborators.map((c) => (
                <li
                  key={c.email}
                  className="flex items-center gap-3 rounded-2xl bg-elevated border border-surface-border px-3.5 py-3"
                >
                  <Avatar profile={c} />
                  <div className="flex flex-col min-w-0 flex-1 gap-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-sm font-semibold text-copy-primary truncate leading-none">
                        {c.name ?? c.email}
                      </span>
                      <RoleBadge role="COLLABORATOR" />
                    </div>
                    {c.name && (
                      <span className="text-xs text-copy-muted truncate leading-none">
                        {c.email}
                      </span>
                    )}
                  </div>

                  {/* Remove — owner only */}
                  {isOwner && (
                    <button
                      onClick={() => void handleRemove(c.email)}
                      disabled={removingEmail === c.email}
                      className="shrink-0 h-7 w-7 rounded-xl flex items-center justify-center text-copy-muted hover:bg-surface transition-colors"
                      style={{ cursor: "pointer" }}
                      aria-label={`Remove ${c.email}`}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = "var(--state-error)")
                      }
                      onMouseLeave={(e) => (e.currentTarget.style.color = "")}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
