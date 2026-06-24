"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import {
  RectangleHorizontal,
  Diamond,
  Circle,
  Pill,
  Cylinder,
  Hexagon,
} from "lucide-react";
import type { NodeShape } from "@/types/canvas";
import { NODE_COLORS } from "@/types/canvas";

export interface ShapeDragPayload {
  shape: NodeShape;
  width: number;
  height: number;
}

interface ShapeConfig {
  shape: NodeShape;
  icon: React.ReactNode;
  label: string;
  width: number;
  height: number;
}

const SHAPES: ShapeConfig[] = [
  { shape: "rectangle", icon: <RectangleHorizontal className="h-4 w-4" />, label: "Rectangle", width: 200, height: 80 },
  { shape: "diamond",   icon: <Diamond            className="h-4 w-4" />, label: "Diamond",   width: 160, height: 120 },
  { shape: "circle",    icon: <Circle             className="h-4 w-4" />, label: "Circle",    width: 100, height: 100 },
  { shape: "pill",      icon: <Pill               className="h-4 w-4" />, label: "Pill",      width: 180, height: 70 },
  { shape: "cylinder",  icon: <Cylinder           className="h-4 w-4" />, label: "Cylinder",  width: 100, height: 120 },
  { shape: "hexagon",   icon: <Hexagon            className="h-4 w-4" />, label: "Hexagon",   width: 120, height: 100 },
];

const PREVIEW_SCALE = 0.6;
const DEFAULT_FILL = NODE_COLORS[0].fill;
const BORDER_COLOR = "#2a2a30";

function ShapeGhostPreview({
  shape,
  width,
  height,
}: {
  shape: NodeShape;
  width: number;
  height: number;
}) {
  const w = Math.round(width * PREVIEW_SCALE);
  const h = Math.round(height * PREVIEW_SCALE);
  const style = { width: w, height: h };

  if (shape === "rectangle") {
    return (
      <div
        style={{ ...style, background: DEFAULT_FILL, borderColor: BORDER_COLOR }}
        className="border rounded-xl"
      />
    );
  }

  if (shape === "pill") {
    return (
      <div
        style={{ ...style, background: DEFAULT_FILL, borderColor: BORDER_COLOR }}
        className="border rounded-full"
      />
    );
  }

  if (shape === "circle") {
    return (
      <div
        style={{ ...style, background: DEFAULT_FILL, borderColor: BORDER_COLOR }}
        className="border rounded-full"
      />
    );
  }

  if (shape === "diamond") {
    return (
      <div style={style}>
        <svg width="100%" height="100%" viewBox="0 0 160 120" preserveAspectRatio="none">
          <polygon
            points="80,2 158,60 80,118 2,60"
            fill={DEFAULT_FILL}
            stroke={BORDER_COLOR}
            strokeWidth="2"
          />
        </svg>
      </div>
    );
  }

  if (shape === "hexagon") {
    return (
      <div style={style}>
        <svg width="100%" height="100%" viewBox="0 0 120 100" preserveAspectRatio="none">
          <polygon
            points="30,2 90,2 118,50 90,98 30,98 2,50"
            fill={DEFAULT_FILL}
            stroke={BORDER_COLOR}
            strokeWidth="2"
          />
        </svg>
      </div>
    );
  }

  if (shape === "cylinder") {
    return (
      <div style={style}>
        <svg width="100%" height="100%" viewBox="0 0 100 120" preserveAspectRatio="none">
          <rect x="1" y="15" width="98" height="90" fill={DEFAULT_FILL} />
          <line x1="1" y1="15" x2="1" y2="105" stroke={BORDER_COLOR} strokeWidth="1.5" />
          <line x1="99" y1="15" x2="99" y2="105" stroke={BORDER_COLOR} strokeWidth="1.5" />
          <ellipse cx="50" cy="105" rx="49" ry="13" fill={DEFAULT_FILL} stroke={BORDER_COLOR} strokeWidth="1.5" />
          <ellipse cx="50" cy="15" rx="49" ry="13" fill={DEFAULT_FILL} stroke={BORDER_COLOR} strokeWidth="1.5" />
        </svg>
      </div>
    );
  }

  return (
    <div
      style={{ ...style, background: DEFAULT_FILL, borderColor: BORDER_COLOR }}
      className="border rounded-xl"
    />
  );
}

interface DragPreview {
  shape: NodeShape;
  width: number;
  height: number;
  x: number;
  y: number;
}

export function ShapePanel() {
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null);

  function handleDragStart(e: React.DragEvent, cfg: ShapeConfig) {
    const payload: ShapeDragPayload = { shape: cfg.shape, width: cfg.width, height: cfg.height };
    e.dataTransfer.setData("application/ghost-shape", JSON.stringify(payload));
    e.dataTransfer.effectAllowed = "copy";
    setDragPreview({ shape: cfg.shape, width: cfg.width, height: cfg.height, x: e.clientX, y: e.clientY });
  }

  function handleDrag(e: React.DragEvent) {
    if (e.clientX === 0 && e.clientY === 0) return;
    setDragPreview((prev) => (prev ? { ...prev, x: e.clientX, y: e.clientY } : null));
  }

  function handleDragEnd() {
    setDragPreview(null);
  }

  return (
    <>
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
        <div className="flex items-center gap-1 px-3 py-2 bg-surface border border-surface-border rounded-full shadow-lg pointer-events-auto">
          {SHAPES.map((cfg) => (
            <button
              key={cfg.shape}
              draggable
              onDragStart={(e) => handleDragStart(e, cfg)}
              onDrag={handleDrag}
              onDragEnd={handleDragEnd}
              title={cfg.label}
              className="flex items-center justify-center w-9 h-9 rounded-xl text-copy-muted hover:text-copy-primary hover:bg-elevated transition-colors cursor-grab active:cursor-grabbing"
            >
              {cfg.icon}
            </button>
          ))}
        </div>
      </div>
      {dragPreview &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            style={{
              position: "fixed",
              left: dragPreview.x,
              top: dragPreview.y,
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
              opacity: 0.75,
              zIndex: 9999,
            }}
          >
            <ShapeGhostPreview
              shape={dragPreview.shape}
              width={dragPreview.width}
              height={dragPreview.height}
            />
          </div>,
          document.body,
        )}
    </>
  );
}
