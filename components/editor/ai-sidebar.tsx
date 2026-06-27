"use client";

import { useState, useRef } from "react";
import { Bot, X, FileText, Download, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const STARTER_CHIPS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
] as const;

interface AISidebarProps {
  onClose: () => void;
}

export function AISidebar({ onClose }: AISidebarProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const send = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setMessages((prev) => [
      ...prev,
      { id: `${Date.now()}`, role: "user", content: trimmed },
    ]);
    setInput("");
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const handleChipClick = (chip: string) => {
    setInput(chip);
  };

  return (
    <aside className="w-[320px] shrink-0 bg-surface/95 backdrop-blur-sm border-l border-surface-border flex flex-col">
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

      {/* Tabbed content */}
      <Tabs defaultValue="architect" className="flex-1 flex flex-col overflow-hidden gap-0">
        {/* Tab list */}
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
          {/* Scrollable chat area */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="p-3 flex flex-col gap-2">
              {messages.length === 0 ? (
                /* Empty state */
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
                        onClick={() => handleChipClick(chip)}
                        className="text-left text-xs px-3 py-2 rounded-xl bg-subtle text-ai-text hover:bg-elevated transition-colors cursor-pointer"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Message list */
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex",
                      msg.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed",
                        msg.role === "user"
                          ? "bg-accent-dim border-2 border-brand/50 text-copy-primary"
                          : "bg-elevated border border-surface-border text-copy-primary"
                      )}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>
          </div>

          {/* Input area */}
          <div className="px-3 py-3 border-t border-surface-border shrink-0">
            <div className="rounded-xl bg-elevated border border-surface-border p-2 flex flex-col gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Ghost AI…"
                className="min-h-[72px] max-h-[160px] resize-none border-0 bg-transparent p-1 text-xs text-copy-primary placeholder:text-copy-faint focus-visible:border-transparent focus-visible:ring-0 shadow-none"
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={send}
                  disabled={!input.trim()}
                  className="h-7 px-3 text-xs gap-1.5 bg-ai text-white hover:bg-ai/90 disabled:opacity-40"
                >
                  <Send className="h-3 w-3" />
                  Send
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
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="p-3 flex flex-col gap-3">
              <Button
                size="sm"
                className="w-full text-xs bg-ai text-white hover:bg-ai/90"
              >
                Generate Spec
              </Button>

              {/* Demo spec card */}
              <div className="rounded-2xl bg-elevated border border-surface-border p-4 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-subtle shrink-0">
                    <FileText className="h-4 w-4 text-copy-muted" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-copy-primary truncate">
                      Architecture Spec v1
                    </p>
                    <p className="text-xs text-copy-muted mt-0.5 leading-relaxed line-clamp-2">
                      System design overview including API gateway, service mesh, and data layer components.
                    </p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled
                    className="h-7 gap-1.5 text-xs text-copy-muted opacity-50"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </aside>
  );
}
