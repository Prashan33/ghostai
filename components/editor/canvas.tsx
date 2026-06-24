"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { useUndo, useRedo, useCanUndo, useCanRedo } from "@liveblocks/react";
import { CanvasNodeRenderer } from "@/components/editor/canvas-node";
import { CanvasEdgeRenderer } from "@/components/editor/canvas-edge";
import { ShapePanel, type ShapeDragPayload } from "@/components/editor/shape-panel";
import { CanvasControlBar } from "@/components/editor/canvas-control-bar";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { NODE_COLORS } from "@/types/canvas";
import type { CanvasNode, CanvasEdge, NodeData } from "@/types/canvas";
import type { CanvasTemplate } from "@/components/editor/starter-templates";

import "@xyflow/react/dist/style.css";

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
  importTemplate?: CanvasTemplate | null;
  onTemplateImported?: () => void;
}

export function Canvas({ importTemplate, onTemplateImported }: CanvasProps) {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({ suspense: true });

  const [rfInstance, setRfInstance] = useState<ReactFlowInstance<CanvasNode, CanvasEdge> | null>(null);

  // Keep a live ref so the import effect always sees current nodes/edges.
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  nodesRef.current = nodes;
  edgesRef.current = edges;

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

  const undo = useUndo();
  const redo = useRedo();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  useKeyboardShortcuts({ rfInstance, onUndo: undo, onRedo: redo });

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

      const position = rfInstance.screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });

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
        fitView
        colorMode="dark"
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} />
      </ReactFlow>
      <CanvasControlBar
        rfInstance={rfInstance}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
      />
      <ShapePanel />
    </div>
  );
}
