"use client";

import {
  RectangleHorizontal,
  Diamond,
  Circle,
  Pill,
  Cylinder,
  Hexagon,
} from "lucide-react";
import type { NodeShape } from "@/types/canvas";

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

export function ShapePanel() {
  function handleDragStart(e: React.DragEvent, cfg: ShapeConfig) {
    const payload: ShapeDragPayload = { shape: cfg.shape, width: cfg.width, height: cfg.height };
    e.dataTransfer.setData("application/ghost-shape", JSON.stringify(payload));
    e.dataTransfer.effectAllowed = "copy";
  }

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
      <div className="flex items-center gap-1 px-3 py-2 bg-surface border border-surface-border rounded-full shadow-lg pointer-events-auto">
        {SHAPES.map((cfg) => (
          <button
            key={cfg.shape}
            draggable
            onDragStart={(e) => handleDragStart(e, cfg)}
            title={cfg.label}
            className="flex items-center justify-center w-9 h-9 rounded-xl text-copy-muted hover:text-copy-primary hover:bg-elevated transition-colors cursor-grab active:cursor-grabbing"
          >
            {cfg.icon}
          </button>
        ))}
      </div>
    </div>
  );
}
