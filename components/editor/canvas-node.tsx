"use client";

import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import type { CanvasNode } from "@/types/canvas";
import { NODE_COLORS } from "@/types/canvas";

const DEFAULT_COLOR = NODE_COLORS[0];

export function CanvasNodeRenderer({ data }: NodeProps<CanvasNode>) {
  const pair = NODE_COLORS.find((c) => c.fill === data.color) ?? DEFAULT_COLOR;

  return (
    <div
      style={{ background: pair.fill, color: pair.text }}
      className="w-full h-full flex items-center justify-center rounded-xl border border-surface-border text-sm font-medium"
    >
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Right} />
      <Handle type="source" position={Position.Bottom} />
      <Handle type="target" position={Position.Left} />
      <span className="px-3 text-center break-words">{data.label}</span>
    </div>
  );
}
