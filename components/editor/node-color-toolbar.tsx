"use client";

import { useCallback, useState } from "react";
import { useReactFlow } from "@xyflow/react";
import { NODE_COLORS } from "@/types/canvas";
import type { CanvasNode, CanvasEdge } from "@/types/canvas";

interface NodeColorToolbarProps {
  nodeId: string;
  activeFill: string;
}

export function NodeColorToolbar({ nodeId, activeFill }: NodeColorToolbarProps) {
  const { updateNodeData } = useReactFlow<CanvasNode, CanvasEdge>();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

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
      </div>
    </div>
  );
}
