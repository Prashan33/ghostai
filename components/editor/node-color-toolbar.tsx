"use client";

import { useCallback, useState } from "react";
import { useReactFlow } from "@xyflow/react";
import { Trash2 } from "lucide-react";
import { NODE_COLORS } from "@/types/canvas";
import type { CanvasNode, CanvasEdge } from "@/types/canvas";
import { useCanvasActions } from "@/components/editor/canvas";

interface NodeColorToolbarProps {
  nodeId: string;
  activeFill: string;
}

export function NodeColorToolbar({ nodeId, activeFill }: NodeColorToolbarProps) {
  const { updateNodeData } = useReactFlow<CanvasNode, CanvasEdge>();
  const { deleteNodes } = useCanvasActions();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const handleDelete = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();
      deleteNodes([nodeId]);
    },
    [nodeId, deleteNodes],
  );

  const handleSwatchClick = useCallback(
    (fill: string, e: React.MouseEvent) => {
      e.stopPropagation();
      updateNodeData(nodeId, { color: fill });
    },
    [nodeId, updateNodeData],
  );

  return (
    <div
      className="nodrag nopan absolute"
      style={{
        bottom: "calc(100% + 10px)",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 50,
        pointerEvents: "all",
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        style={{
          background: "#18181c",
          border: "1px solid #2a2a30",
          borderRadius: 999,
          padding: "5px 8px",
          display: "flex",
          gap: 6,
          alignItems: "center",
          boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
          whiteSpace: "nowrap",
        }}
      >
        {NODE_COLORS.map((pair, i) => {
          const isActive = pair.fill === activeFill;
          const isHovered = hoveredIndex === i;
          return (
            <button
              key={pair.fill}
              type="button"
              className="nodrag nopan"
              style={{
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: pair.fill,
                border: isActive
                  ? "2px solid rgba(255,255,255,0.85)"
                  : "2px solid rgba(255,255,255,0.1)",
                cursor: "pointer",
                boxShadow: isHovered ? `0 0 5px 2px ${pair.text}66` : "none",
                transition: "box-shadow 0.15s ease, border-color 0.15s ease",
                flexShrink: 0,
                padding: 0,
              }}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={(e) => handleSwatchClick(pair.fill, e)}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              aria-label={`Color ${i + 1}`}
            />
          );
        })}

        <div style={{ width: 1, height: 14, background: "#2a2a30", flexShrink: 0 }} />

        <button
          type="button"
          className="nodrag nopan"
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "#c0c0cc",
            flexShrink: 0,
            padding: 0,
            transition: "color 0.15s ease, background 0.15s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "#ff6b6b";
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,107,107,0.12)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "#c0c0cc";
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
          }}
          onPointerDown={handleDelete}
          aria-label="Delete node"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}
