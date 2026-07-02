"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Bot, X, FileText, Download, Send, Loader2, AlertCircle } from "lucide-react";
import {
  useOthers,
  useFeedMessages,
  useCreateFeed,
  useCreateFeedMessage,
  useEventListener,
  useSelf,
} from "@liveblocks/react";
import { useRealtimeRun } from "@trigger.dev/react-hooks";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,

  DialogTitle,

  DialogClose,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { aiStatusPayloadSchema, chatMessageSchema } from "@/types/tasks";

interface SpecMeta {
  id: string;
  filePath: string;
  createdAt: string;
}

const STARTER_CHIPS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
] as const;

const AI_STATUS_FEED = "ai-status-feed";
const AI_CHAT_FEED = "ai-chat";

const TERMINAL_STATUSES = new Set([
  "COMPLETED",
  "FAILED",
  "CANCELED",
  "TIMED_OUT",
  "CRASHED",
  "INTERRUPTED",
  "SYSTEM_FAILURE",
  "EXPIRED",
  "SKIPPED",
]);

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

// Mounts only when a run is active — avoids calling useRealtimeRun with empty tokens.
function RunTracker({
  runId,
  publicToken,
  onTerminal,
}: {
  runId: string;
  publicToken: string;
  onTerminal: (succeeded: boolean) => void;
}) {
  const { run } = useRealtimeRun(runId, { accessToken: publicToken });
  const onTerminalRef = useRef(onTerminal);
  onTerminalRef.current = onTerminal;

  useEffect(() => {
    if (!run) return;
    if (!TERMINAL_STATUSES.has(run.status)) return;
    onTerminalRef.current(run.status === "COMPLETED");
  }, [run?.status]);

  return null;
}

interface AISidebarProps {
  onClose: () => void;
  projectId: string;
  roomId: string;
  getCanvasData: () => { nodes: unknown[]; edges: unknown[] };
}

export function AISidebar({ onClose, projectId, roomId, getCanvasData }: AISidebarProps) {
  const [input, setInput] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const [publicToken, setPublicToken] = useState<string | null>(null);
  const [liveStatusText, setLiveStatusText] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<"architect" | "specs">("architect");
  const [specs, setSpecs] = useState<SpecMeta[]>([]);
  const [specsLoading, setSpecsLoading] = useState(false);
  const [specsError, setSpecsError] = useState<string | null>(null);
  const [previewSpec, setPreviewSpec] = useState<SpecMeta | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [specRunId, setSpecRunId] = useState<string | null>(null);
  const [specPublicToken, setSpecPublicToken] = useState<string | null>(null);
  const [isGeneratingSpec, setIsGeneratingSpec] = useState(false);
  const [generateSpecError, setGenerateSpecError] = useState<string | null>(null);

  const self = useSelf();
  const others = useOthers();
  const isGenerating = others.some((o) => o.presence.thinking);

  const createFeed = useCreateFeed();
  const createFeedMessage = useCreateFeedMessage();

  const { messages: statusFeedMessages } = useFeedMessages(AI_STATUS_FEED);
  const { messages: chatFeedMessages } = useFeedMessages(AI_CHAT_FEED);

  useEffect(() => {
    createFeed(AI_STATUS_FEED).catch(() => {});
    createFeed(AI_CHAT_FEED).catch(() => {});
  }, [createFeed]);

  // Capture live status broadcast events from the design agent.
  useEventListener(({ event }) => {
    if (event.type === "ai:status") {
      setLiveStatusText(event.message);
    }
  });

  const feedStatusText = useMemo(() => {
    if (!statusFeedMessages?.length) return null;
    const sorted = [...statusFeedMessages].sort((a, b) => b.createdAt - a.createdAt);
    const result = aiStatusPayloadSchema.safeParse(sorted[0].data);
    return result.success ? (result.data.text ?? null) : null;
  }, [statusFeedMessages]);

  // Prefer live broadcast event text; fall back to persistent feed entry.
  const latestStatusText = liveStatusText ?? feedStatusText;

  const chatMessages = useMemo(() => {
    if (!chatFeedMessages?.length) return [];
    return chatFeedMessages
      .map((msg) => {
        const result = chatMessageSchema.safeParse(msg.data);
        if (!result.success) return null;
        return { id: msg.id, createdAt: msg.createdAt, ...result.data };
      })
      .filter((m): m is NonNullable<typeof m> => m !== null)
      .sort((a, b) => a.createdAt - b.createdAt);
  }, [chatFeedMessages]);

  useEffect(() => {
    if (chatMessages.length > 0) {
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }, [chatMessages.length]);

  const handleRunTerminal = useCallback(
    (succeeded: boolean) => {
      const content = succeeded
        ? "Done! Your canvas has been updated."
        : "Something went wrong generating your design. Please try again.";

      createFeedMessage(AI_CHAT_FEED, {
        sender: "Ghost AI",
        role: "assistant",
        content,
        timestamp: new Date().toISOString(),
      }).catch(() => {});

      setRunId(null);
      setPublicToken(null);
      setLiveStatusText(null);
    },
    [createFeedMessage]
  );

  const [specsVersion, setSpecsVersion] = useState(0);

  const handleSpecRunTerminal = useCallback((succeeded: boolean) => {
    setIsGeneratingSpec(false);
    setSpecRunId(null);
    setSpecPublicToken(null);
    if (succeeded) {
      setSpecsVersion((v) => v + 1);
    } else {
      setGenerateSpecError("Spec generation failed. Please try again.");
    }
  }, []);

  const generateSpec = useCallback(async () => {
    setGenerateSpecError(null);
    setIsGeneratingSpec(true);
    const { nodes, edges } = getCanvasData();
    const history = chatMessages.map((m) => ({ role: m.role, content: m.content }));
    try {
      const res = await fetch("/api/ai/spec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, chatHistory: history, nodes, edges }),
      });
      if (!res.ok) throw new Error();
      const { runId: newRunId } = (await res.json()) as { runId: string };

      const tokenRes = await fetch("/api/ai/spec/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId: newRunId }),
      });
      if (!tokenRes.ok) throw new Error();
      const { token } = (await tokenRes.json()) as { token: string };

      setSpecRunId(newRunId);
      setSpecPublicToken(token);
    } catch {
      setIsGeneratingSpec(false);
      setGenerateSpecError("Failed to start spec generation. Please try again.");
    }
  }, [getCanvasData, chatMessages, roomId]);

  useEffect(() => {
    if (activeTab !== "specs") return;
    let cancelled = false;
    setSpecsLoading(true);
    setSpecsError(null);
    fetch(`/api/projects/${projectId}/specs`)
      .then(async (r) => {
        const data = await r.json() as { specs?: SpecMeta[]; error?: string };
        if (!r.ok) throw new Error(data.error ?? `HTTP ${r.status}`);
        return data;
      })
      .then((data) => {
        if (!cancelled) setSpecs(data.specs ?? []);
      })
      .catch((err: unknown) => {
        if (!cancelled) setSpecsError(err instanceof Error ? err.message : "Failed to load specs.");
      })
      .finally(() => {
        if (!cancelled) setSpecsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeTab, projectId, specsVersion]);

  const openPreview = useCallback(async (spec: SpecMeta) => {
    setPreviewSpec(spec);
    setPreviewContent(null);
    setPreviewLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/specs/${spec.id}/content`);
      if (!res.ok) throw new Error();
      setPreviewContent(await res.text());
    } catch {
      setPreviewContent(null);
    } finally {
      setPreviewLoading(false);
    }
  }, [projectId]);

  const closePreview = useCallback(() => {
    setPreviewSpec(null);
    setPreviewContent(null);
  }, []);

  const downloadSpec = useCallback((specId: string) => {
    const link = document.createElement("a");
    link.href = `/api/projects/${projectId}/specs/${specId}/download`;
    link.download = `spec-${specId}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [projectId]);

  const getFilename = (spec: SpecMeta) => `spec-${spec.id}.md`;

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString([], {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  const isRunActive = !!runId;
  const isDisabled = isRunActive || isGenerating;

  const send = async () => {
    const trimmed = input.trim();
    if (!trimmed || isDisabled) return;
    setSendError(null);
    const senderName = self?.info?.name ?? "You";

    try {
      await createFeedMessage(AI_CHAT_FEED, {
        sender: senderName,
        role: "user",
        content: trimmed,
        timestamp: new Date().toISOString(),
      });
      setInput("");
    } catch {
      setSendError("Failed to send. Please try again.");
      return;
    }

    try {
      const designRes = await fetch("/api/ai/design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: trimmed, roomId, projectId }),
      });

      if (!designRes.ok) throw new Error("Design request failed");

      const { runId: newRunId } = (await designRes.json()) as { runId: string };

      const tokenRes = await fetch("/api/ai/design/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId: newRunId }),
      });

      if (!tokenRes.ok) throw new Error("Token request failed");

      const { token } = (await tokenRes.json()) as { token: string };

      setRunId(newRunId);
      setPublicToken(token);
    } catch {
      createFeedMessage(AI_CHAT_FEED, {
        sender: "Ghost AI",
        role: "assistant",
        content: "Failed to start the design agent. Please try again.",
        timestamp: new Date().toISOString(),
      }).catch(() => {});
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const currentUserName = self?.info?.name;

  return (
    <aside className="w-[320px] shrink-0 bg-surface/95 backdrop-blur-sm border-l border-surface-border flex flex-col">
      {/* Mounts only while a run is in flight; avoids calling the hook with empty tokens */}
      {runId && publicToken && (
        <RunTracker runId={runId} publicToken={publicToken} onTerminal={handleRunTerminal} />
      )}
      {specRunId && specPublicToken && (
        <RunTracker runId={specRunId} publicToken={specPublicToken} onTerminal={handleSpecRunTerminal} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-accent-dim shrink-0">
            <Bot className="h-4 w-4 text-brand" />
          </div>
          <div className="leading-none">
            <p className="text-sm font-semibold text-copy-primary">AI Workspace</p>
            <p className="text-xs text-copy-muted mt-1">Collaborate with Ghost AI</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Close AI sidebar"
          className="h-7 w-7 text-copy-muted hover:text-copy-primary hover:bg-elevated shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Presence-based AI status indicator */}
      {(isGenerating || latestStatusText) && (
        <div className="px-4 py-2 border-b border-surface-border bg-elevated shrink-0">
          <div className="flex items-center gap-2">
            {isGenerating && (
              <Loader2 className="h-3 w-3 text-brand animate-spin shrink-0" />
            )}
            <p className="text-xs text-brand truncate">
              {latestStatusText ?? "Ghost AI is working…"}
            </p>
          </div>
        </div>
      )}

      {/* Tabbed content */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "architect" | "specs")}
        className="flex-1 flex flex-col overflow-hidden gap-0"
      >
        <div className="px-3 pt-2 pb-1 shrink-0">
          <TabsList className="w-full bg-elevated h-8 p-0.5">
            <TabsTrigger
              value="architect"
              className="flex-1 text-xs text-copy-muted hover:text-copy-secondary data-active:bg-subtle data-active:text-brand data-active:shadow-none"
            >
              AI Architect
            </TabsTrigger>
            <TabsTrigger
              value="specs"
              className="flex-1 text-xs text-copy-muted hover:text-copy-secondary data-active:bg-subtle data-active:text-brand data-active:shadow-none"
            >
              Specs
            </TabsTrigger>
          </TabsList>
        </div>

        {/* AI Architect tab */}
        <TabsContent
          value="architect"
          className="flex-1 flex flex-col overflow-hidden m-0 p-0"
        >
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="p-3 flex flex-col gap-2">
              {chatMessages.length === 0 ? (
                <div className="flex flex-col items-center text-center pt-6 pb-4 gap-3">
                  <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-accent-dim">
                    <Bot className="h-6 w-6 text-brand" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-copy-primary">Ghost AI</p>
                    <p className="text-xs text-copy-muted mt-1 leading-relaxed max-w-[200px]">
                      Describe the architecture you want to build and I&apos;ll help you design it.
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5 w-full mt-1">
                    {STARTER_CHIPS.map((chip) => (
                      <button
                        key={chip}
                        onClick={() => setInput(chip)}
                        className="text-left text-xs px-3 py-2 rounded-xl bg-subtle text-ai-text hover:bg-elevated transition-colors cursor-pointer"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isOwn = msg.sender === currentUserName;
                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex flex-col gap-0.5",
                        isOwn ? "items-end" : "items-start"
                      )}
                    >
                      <div
                        className={cn(
                          "flex items-center gap-1.5 px-1",
                          isOwn ? "flex-row-reverse" : "flex-row"
                        )}
                      >
                        <span className="text-[10px] text-copy-faint font-medium">
                          {msg.sender}
                        </span>
                        <span className="text-[10px] text-copy-faint">·</span>
                        <span className="text-[10px] text-copy-faint">
                          {formatTime(msg.timestamp)}
                        </span>
                      </div>
                      <div
                        className={cn(
                          "max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed",
                          isOwn
                            ? "text-[#0f2e18]"
                            : "bg-elevated border border-surface-border text-copy-primary"
                        )}
                        style={isOwn ? { backgroundColor: "#62C073" } : undefined}
                      >
                        {msg.content}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>
          </div>

          {/* Input area */}
          <div className="px-3 py-3 border-t border-surface-border shrink-0">
            {/* Status strip — compact bar above input, only shown during active run */}
            {isRunActive && (
              <div className="mb-2 rounded-lg bg-elevated border border-surface-border px-3 py-2 flex items-center gap-2">
                <Loader2
                  className="h-3 w-3 shrink-0 animate-spin"
                  style={{ color: "#62C073" }}
                />
                <p className="text-[11px] truncate" style={{ color: "#62C073" }}>
                  {latestStatusText ?? "Ghost AI is working on your design…"}
                </p>
              </div>
            )}

            {sendError && (
              <div className="flex items-center gap-1.5 mb-2 px-1">
                <AlertCircle className="h-3 w-3 text-destructive shrink-0" />
                <p className="text-[11px] text-destructive">{sendError}</p>
              </div>
            )}

            <div className="rounded-xl bg-elevated border border-surface-border p-2 flex flex-col gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isDisabled}
                placeholder={isDisabled ? "Ghost AI is generating…" : "Ask Ghost AI…"}
                className="min-h-18 max-h-40 resize-none border-0 bg-transparent p-1 text-xs text-copy-primary placeholder:text-copy-faint focus-visible:border-transparent focus-visible:ring-0 shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={send}
                  disabled={!input.trim() || isDisabled}
                  className="h-7 px-3 text-xs gap-1.5 text-white disabled:opacity-40 disabled:bg-muted"
                  style={
                    !(!input.trim() || isDisabled) ? { backgroundColor: "#62C073" } : undefined
                  }
                >
                  {isRunActive ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Send className="h-3 w-3" />
                  )}
                  {isRunActive ? "Generating…" : "Send"}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Specs tab */}
        <TabsContent
          value="specs"
          className="flex-1 flex flex-col overflow-hidden m-0 p-0"
        >
          {/* Generate button bar */}
          <div className="px-3 pt-2 pb-2 border-b border-surface-border shrink-0 flex flex-col gap-1.5">
            <Button
              size="sm"
              onClick={generateSpec}
              disabled={isGeneratingSpec}
              className="w-full h-8 text-xs gap-1.5 text-white disabled:opacity-50"
              style={!isGeneratingSpec ? { backgroundColor: "#62C073" } : undefined}
            >
              {isGeneratingSpec ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <FileText className="h-3 w-3" />
              )}
              {isGeneratingSpec ? "Generating spec…" : "Generate Spec"}
            </Button>
            {generateSpecError && (
              <div className="flex items-center gap-1.5 px-1">
                <AlertCircle className="h-3 w-3 text-destructive shrink-0" />
                <p className="text-[11px] text-destructive">{generateSpecError}</p>
              </div>
            )}
          </div>

          <ScrollArea className="flex-1 min-h-0">
            <div className="p-3 flex flex-col gap-2">
              {specsLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-4 w-4 text-brand animate-spin" />
                </div>
              )}

              {specsError && !specsLoading && (
                <div className="flex items-center gap-1.5 px-1 py-4">
                  <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                  <p className="text-xs text-destructive">{specsError}</p>
                </div>
              )}

              {!specsLoading && !specsError && specs.length === 0 && (
                <div className="flex flex-col items-center text-center pt-6 pb-4 gap-3">
                  <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-accent-dim">
                    <FileText className="h-6 w-6 text-brand" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-copy-primary">No specs yet</p>
                    <p className="text-xs text-copy-muted mt-1 leading-relaxed max-w-[200px]">
                      Click &quot;Generate Spec&quot; to create a spec from your canvas.
                    </p>
                  </div>
                </div>
              )}

              {!specsLoading && specs.map((spec) => (
                <div
                  key={spec.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openPreview(spec)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openPreview(spec);
                    }
                  }}
                  className="w-full text-left rounded-xl bg-elevated border border-surface-border p-3 flex items-center gap-3 hover:border-border-subtle transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-subtle shrink-0">
                    <FileText className="h-3.5 w-3.5 text-copy-muted" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-copy-primary truncate">
                      {getFilename(spec)}
                    </p>
                    <p className="text-[10px] text-copy-faint mt-0.5">
                      {formatDate(spec.createdAt)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadSpec(spec.id);
                    }}
                    aria-label="Download spec"
                    className="h-6 w-6 shrink-0 text-copy-muted hover:text-copy-primary hover:bg-subtle"
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Spec preview modal */}
      <Dialog open={!!previewSpec} onOpenChange={(open) => { if (!open) closePreview(); }}>
        <DialogContent
          showCloseButton={false}
          className="max-w-2xl w-full bg-surface border border-surface-border rounded-3xl flex flex-col p-0 overflow-hidden max-h-[80vh]"
        >
          {/* Header */}
          <div className="flex items-center gap-2.5 px-5 pt-5 pb-3 border-b border-surface-border shrink-0">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-accent-dim shrink-0">
              <FileText className="h-3.5 w-3.5 text-brand" />
            </div>
            <DialogTitle className="text-sm font-semibold text-copy-primary truncate">
              {previewSpec ? getFilename(previewSpec) : ""}
            </DialogTitle>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto min-h-0 px-5 py-4">
            {previewLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 text-brand animate-spin" />
              </div>
            )}
            {!previewLoading && previewContent === null && (
              <div className="flex items-center gap-2 py-8">
                <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                <p className="text-sm text-destructive">Failed to load content.</p>
              </div>
            )}
            {!previewLoading && previewContent !== null && (
              <div className="text-xs text-copy-primary leading-relaxed [&_h1]:text-base [&_h1]:font-bold [&_h1]:text-copy-primary [&_h1]:mb-3 [&_h1]:mt-4 [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:text-copy-primary [&_h2]:mb-2 [&_h2]:mt-4 [&_h3]:text-xs [&_h3]:font-semibold [&_h3]:text-copy-secondary [&_h3]:mb-1.5 [&_h3]:mt-3 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:mb-2 [&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:mb-2 [&_li]:mb-0.5 [&_code]:bg-subtle [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:text-[10px] [&_pre]:bg-subtle [&_pre]:p-3 [&_pre]:rounded-xl [&_pre]:overflow-x-auto [&_pre]:mb-3 [&_blockquote]:border-l-2 [&_blockquote]:border-brand [&_blockquote]:pl-3 [&_blockquote]:text-copy-muted [&_strong]:text-copy-primary [&_strong]:font-semibold [&_hr]:border-surface-border [&_hr]:my-3">
                <ReactMarkdown>{previewContent}</ReactMarkdown>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="shrink-0 flex flex-row items-center gap-2 justify-end px-5 py-3 border-t border-surface-border bg-elevated/50 rounded-b-3xl">
            {previewSpec && (
              <Button
                size="sm"
                onClick={() => downloadSpec(previewSpec.id)}
                className="h-7 px-3 gap-1.5 text-xs bg-ai text-white hover:bg-ai/90"
              >
                <Download className="h-3 w-3" />
                Download
              </Button>
            )}
            <DialogClose
              render={
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-3 text-xs text-copy-muted hover:text-copy-primary"
                >
                  Close
                </Button>
              }
            />
          </div>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
