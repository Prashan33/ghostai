"use client";

import { useState, useRef, useCallback } from "react";
import {
  EdgeLabelRenderer,
  getSmoothStepPath,
  useReactFlow,
  type EdgeProps,
} from "@xyflow/react";
import type { CanvasNode, CanvasEdge } from "@/types/canvas";

const EDGE_REST = "rgba(110,110,130,0.45)";
const EDGE_ACTIVE = "rgba(210,210,220,0.88)";

export function CanvasEdgeRenderer({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  markerEnd,
  data,
}: EdgeProps<CanvasEdge>) {
  const { updateEdgeData } = useReactFlow<CanvasNode, CanvasEdge>();
  const [hovered, setHovered] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const active = selected || hovered;
  const stroke = active ? EDGE_ACTIVE : EDGE_REST;
  const label = data?.label ?? "";

  const startEditing = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setDraft(label);
      setEditing(true);
      setTimeout(() => inputRef.current?.focus(), 0);
    },
    [label],
  );

  const commit = useCallback(() => {
    updateEdgeData(id, { label: draft });
    setEditing(false);
  }, [id, draft, updateEdgeData]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        commit();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setEditing(false);
      }
    },
    [commit],
  );

  return (
    <>
      {/* Wide transparent hit area — makes edges easier to hover and click */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onDoubleClick={startEditing}
        style={{ cursor: "pointer" }}
      />
      {/* Visible edge line */}
      <path
        d={edgePath}
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinecap="round"
        markerEnd={markerEnd}
        style={{ transition: "stroke 0.15s", pointerEvents: "none" }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
          }}
          className="nodrag nopan"
          onDoubleClick={startEditing}
        >
          {editing ? (
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              className="nodrag nopan bg-elevated border border-surface-border rounded px-2 py-0.5 text-xs text-copy-primary outline-none"
              style={{ width: `${Math.max(48, draft.length * 8 + 20)}px` }}
              placeholder="Label"
            />
          ) : label ? (
            <span className="bg-elevated border border-surface-border rounded-full px-2 py-0.5 text-xs text-copy-primary select-none cursor-default">
              {label}
            </span>
          ) : active ? (
            <span
              className="nodrag nopan text-xs text-copy-faint select-none cursor-pointer"
              onDoubleClick={startEditing}
            >
              label
            </span>
          ) : null}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
