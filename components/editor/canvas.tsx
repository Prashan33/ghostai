"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  ConnectionMode,
  MarkerType,
  type ReactFlowInstance,
  type OnNodesChange,
  type OnEdgesChange,
} from "@xyflow/react";
import { useLiveblocksFlow } from "@liveblocks/react-flow";
import { useUndo, useRedo, useCanUndo, useCanRedo, useUpdateMyPresence } from "@liveblocks/react";
import { CanvasNodeRenderer } from "@/components/editor/canvas-node";
import { CanvasEdgeRenderer } from "@/components/editor/canvas-edge";
import { ShapePanel, type ShapeDragPayload } from "@/components/editor/shape-panel";
import { CanvasControlBar } from "@/components/editor/canvas-control-bar";
import { LiveCursors } from "@/components/editor/live-cursors";
import { PresenceAvatars } from "@/components/editor/presence-avatars";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useCanvasAutosave, type SaveStatus } from "@/hooks/use-canvas-autosave";
import { NODE_COLORS } from "@/types/canvas";
import type { CanvasNode, CanvasEdge, NodeData } from "@/types/canvas";
import type { CanvasTemplate } from "@/components/editor/starter-templates";

import "@xyflow/react/dist/style.css";

interface CanvasActionsCtx {
  deleteNodes: (ids: string[]) => void;
  deleteEdges: (ids: string[]) => void;
}

export const CanvasActionsContext = createContext<CanvasActionsCtx | null>(null);

export function useCanvasActions() {
  const ctx = useContext(CanvasActionsContext);
  if (!ctx) throw new Error("useCanvasActions must be used inside Canvas");
  return ctx;
}

const nodeTypes = { canvasNode: CanvasNodeRenderer };
const edgeTypes = { canvasEdge: CanvasEdgeRenderer };

const defaultEdgeOptions = {
  type: "canvasEdge",
  data: {},
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 12,
    height: 12,
    color: "rgba(180,180,195,0.75)",
  },
};

let nodeCounter = 0;

function generateNodeId(shape: string): string {
  return `${shape}-${Date.now()}-${++nodeCounter}`;
}

const DEFAULT_COLOR = NODE_COLORS[0].fill;

interface CanvasProps {
  projectId: string;
  importTemplate?: CanvasTemplate | null;
  onTemplateImported?: () => void;
  onSaveStatusChange?: (status: SaveStatus) => void;
  onManualSaveReady?: (saveFn: () => void) => void;
  onGetCanvasDataReady?: (fn: () => { nodes: CanvasNode[]; edges: CanvasEdge[] }) => void;
}

export function Canvas({ projectId, importTemplate, onTemplateImported, onSaveStatusChange, onManualSaveReady, onGetCanvasDataReady }: CanvasProps) {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({ suspense: true });

  const [rfInstance, setRfInstance] = useState<ReactFlowInstance<CanvasNode, CanvasEdge> | null>(null);
  const rfInstanceRef = useRef(rfInstance);
  rfInstanceRef.current = rfInstance;

  // Keep a live ref so the import and load effects always see current nodes/edges.
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  nodesRef.current = nodes;
  edgesRef.current = edges;

  const [hasSelection, setHasSelection] = useState(false);

  const deleteSelected = useCallback(() => {
    const instance = rfInstanceRef.current;
    if (!instance) return;
    const selNodes = instance.getNodes().filter((n) => n.selected);
    const selEdges = instance.getEdges().filter((eg) => eg.selected);
    if (selNodes.length === 0 && selEdges.length === 0) return;
    onDelete({ nodes: selNodes, edges: selEdges });
  }, [onDelete]);

  const deleteNodes = useCallback(
    (ids: string[]) => {
      const instance = rfInstanceRef.current;
      if (!instance) return;
      const allNodes = instance.getNodes();
      const allEdges = instance.getEdges();
      const targetNodes = allNodes.filter((n) => ids.includes(n.id));
      const connectedEdges = allEdges.filter(
        (eg) => ids.includes(eg.source) || ids.includes(eg.target),
      );
      onDelete({ nodes: targetNodes, edges: connectedEdges });
    },
    [onDelete],
  );

  const deleteEdges = useCallback(
    (ids: string[]) => {
      const instance = rfInstanceRef.current;
      if (!instance) return;
      const targetEdges = instance.getEdges().filter((eg) => ids.includes(eg.id));
      onDelete({ nodes: [], edges: targetEdges });
    },
    [onDelete],
  );

  useEffect(() => {
    if (!importTemplate) return;

    const currentNodes = nodesRef.current;
    const currentEdges = edgesRef.current;

    // Remove all current nodes and edges.
    if (currentNodes.length > 0) {
      (onNodesChange as OnNodesChange<CanvasNode>)(
        currentNodes.map((nd) => ({ type: "remove" as const, id: nd.id })),
      );
    }
    if (currentEdges.length > 0) {
      (onEdgesChange as OnEdgesChange<CanvasEdge>)(
        currentEdges.map((eg) => ({ type: "remove" as const, id: eg.id })),
      );
    }

    // Add template nodes and edges.
    (onNodesChange as OnNodesChange<CanvasNode>)(
      importTemplate.nodes.map((nd) => ({ type: "add" as const, item: nd })),
    );
    (onEdgesChange as OnEdgesChange<CanvasEdge>)(
      importTemplate.edges.map((eg) => ({ type: "add" as const, item: eg })),
    );

    // Fit the view after the new nodes have been rendered.
    setTimeout(() => rfInstance?.fitView({ duration: 400, padding: 0.15 }), 150);

    onTemplateImported?.();
    // Intentionally omitting nodes/edges — we read from refs to avoid stale closure issues.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importTemplate]);

  // Load saved canvas state once on mount if the Liveblocks room is empty.
  const hasLoadedRef = useRef(false);
  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    // Room already has active nodes or edges — skip load to avoid overwriting collaboration.
    if (nodesRef.current.length > 0 || edgesRef.current.length > 0) return;

    fetch(`/api/projects/${projectId}/canvas`)
      .then((res) => {
        if (!res.ok) return null;
        return res.json() as Promise<{ nodes: CanvasNode[]; edges: CanvasEdge[] }>;
      })
      .then((data) => {
        if (!data) return;
        if (data.nodes?.length > 0) {
          (onNodesChange as OnNodesChange<CanvasNode>)(
            data.nodes.map((nd) => ({ type: "add" as const, item: nd })),
          );
        }
        if (data.edges?.length > 0) {
          (onEdgesChange as OnEdgesChange<CanvasEdge>)(
            data.edges.map((eg) => ({ type: "add" as const, item: eg })),
          );
        }
        setTimeout(() => rfInstanceRef.current?.fitView({ duration: 400, padding: 0.15 }), 150);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { status: saveStatus, save } = useCanvasAutosave({ projectId, nodes, edges });

  useEffect(() => {
    onSaveStatusChange?.(saveStatus);
  }, [saveStatus, onSaveStatusChange]);

  useEffect(() => {
    onManualSaveReady?.(save);
  }, [save, onManualSaveReady]);

  useEffect(() => {
    if (!onGetCanvasDataReady) return;
    onGetCanvasDataReady(() => ({ nodes: nodesRef.current, edges: edgesRef.current }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onGetCanvasDataReady]);

  const updateMyPresence = useUpdateMyPresence();

  const undo = useUndo();
  const redo = useRedo();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  useKeyboardShortcuts({ rfInstance, onUndo: undo, onRedo: redo });

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== "Delete" && e.key !== "Backspace") return;
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) return;
      deleteSelected();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deleteSelected]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!rfInstance) return;

      const raw = e.dataTransfer.getData("application/ghost-shape");
      if (!raw) return;

      let payload: ShapeDragPayload;
      try {
        payload = JSON.parse(raw) as ShapeDragPayload;
      } catch {
        return;
      }

      const flowCenter = rfInstance.screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });
      const position = {
        x: flowCenter.x - payload.width / 2,
        y: flowCenter.y - payload.height / 2,
      };

      const newNode: CanvasNode = {
        id: generateNodeId(payload.shape),
        type: "canvasNode",
        position,
        width: payload.width,
        height: payload.height,
        data: {
          label: "",
          color: DEFAULT_COLOR,
          shape: payload.shape,
        } satisfies NodeData,
      };

      (onNodesChange as OnNodesChange<CanvasNode>)([{ type: "add", item: newNode }]);
    },
    [rfInstance, onNodesChange],
  );

  return (
    <CanvasActionsContext.Provider value={{ deleteNodes, deleteEdges }}>
    <div className="flex-1 relative" onDragOver={onDragOver} onDrop={onDrop}>
      <ReactFlow<CanvasNode, CanvasEdge>
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        onInit={setRfInstance}
        connectionMode={ConnectionMode.Loose}
        colorMode="dark"
        onMouseMove={(e) => {
          if (!rfInstance) return;
          const pos = rfInstance.screenToFlowPosition({ x: e.clientX, y: e.clientY });
          updateMyPresence({ cursor: pos });
        }}
        onMouseLeave={() => {
          updateMyPresence({ cursor: null });
        }}
        onSelectionChange={({ nodes: sel, edges: selE }) => {
          setHasSelection(sel.length > 0 || selE.length > 0);
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} />
        <LiveCursors />
      </ReactFlow>
      <PresenceAvatars />
      <CanvasControlBar
        rfInstance={rfInstance}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        hasSelection={hasSelection}
        onDeleteSelected={deleteSelected}
      />
      <ShapePanel />
    </div>
    </CanvasActionsContext.Provider>
  );
}
