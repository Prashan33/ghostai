"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CanvasNode, CanvasEdge } from "@/types/canvas";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export interface UseCanvasAutosaveResult {
  status: SaveStatus;
  save: () => void;
}

export function useCanvasAutosave({
  projectId,
  nodes,
  edges,
  enabled = true,
}: {
  projectId: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  enabled?: boolean;
}): UseCanvasAutosaveResult {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRun = useRef(true);
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  nodesRef.current = nodes;
  edgesRef.current = edges;

  const doSave = useCallback(async () => {
    setStatus("saving");
    try {
      const res = await fetch(`/api/projects/${projectId}/canvas`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes: nodesRef.current, edges: edgesRef.current }),
      });
      if (!res.ok) throw new Error("Save failed");
      setStatus("saved");
      if (resetRef.current) clearTimeout(resetRef.current);
      resetRef.current = setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("error");
      if (resetRef.current) clearTimeout(resetRef.current);
      resetRef.current = setTimeout(() => setStatus("idle"), 2000);
    }
  }, [projectId]);

  const save = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    void doSave();
  }, [doSave]);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    if (!enabled) return;

    setStatus("saving");

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => void doSave(), 2000);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [projectId, nodes, edges, enabled, doSave]);

  useEffect(() => {
    return () => {
      if (resetRef.current) clearTimeout(resetRef.current);
    };
  }, []);

  return { status, save };
}
