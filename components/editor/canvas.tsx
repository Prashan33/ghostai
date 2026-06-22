"use client";

import { useCallback, useRef, useState } from "react";
import {
  ReactFlow,
  MiniMap,
  Background,
  BackgroundVariant,
  ConnectionMode,
  type ReactFlowInstance,
  type OnNodesChange,
} from "@xyflow/react";
import { useLiveblocksFlow } from "@liveblocks/react-flow";
import { CanvasNodeRenderer } from "@/components/editor/canvas-node";
import { ShapePanel, type ShapeDragPayload } from "@/components/editor/shape-panel";
import { NODE_COLORS } from "@/types/canvas";
import type { CanvasNode, CanvasEdge, NodeData } from "@/types/canvas";

import "@xyflow/react/dist/style.css";

const nodeTypes = { canvasNode: CanvasNodeRenderer };
const edgeTypes = {};

let nodeCounter = 0;

function generateNodeId(shape: string): string {
  return `${shape}-${Date.now()}-${++nodeCounter}`;
}

const DEFAULT_COLOR = NODE_COLORS[0].fill;

export function Canvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({ suspense: true });

  const [rfInstance, setRfInstance] = useState<ReactFlowInstance<CanvasNode, CanvasEdge> | null>(null);

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
        onInit={setRfInstance}
        connectionMode={ConnectionMode.Loose}
        fitView
        colorMode="dark"
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} />
        <MiniMap
          nodeBorderRadius={4}
          maskColor="rgba(8,8,9,0.7)"
          style={{ background: "#111114" }}
        />
      </ReactFlow>
      <ShapePanel />
    </div>
  );
}
