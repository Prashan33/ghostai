"use client";

import { useCallback, useRef, useState } from "react";
import { Handle, NodeResizer, Position, useReactFlow } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import type { CanvasNode, CanvasEdge } from "@/types/canvas";
import { NODE_COLORS } from "@/types/canvas";
import { NodeColorToolbar } from "@/components/editor/node-color-toolbar";

const DEFAULT_COLOR = NODE_COLORS[0];
const BORDER_REST = "#2a2a30";
const BORDER_SELECTED = "#00c8d4";
const PLACEHOLDER_COLOR = "#505060";
const MIN_WIDTH = 80;
const MIN_HEIGHT = 40;

const RESIZER_LINE_STYLE: React.CSSProperties = {
  stroke: "#00c8d4",
  strokeWidth: 1,
  opacity: 0.5,
};

const RESIZER_HANDLE_STYLE: React.CSSProperties = {
  background: "#00c8d4",
  width: 8,
  height: 8,
  borderRadius: 2,
  border: "none",
};

export function CanvasNodeRenderer({ id, data, selected }: NodeProps<CanvasNode>) {
  const pair = NODE_COLORS.find((c) => c.fill === data.color) ?? DEFAULT_COLOR;
  const shape = data.shape ?? "rectangle";
  const borderColor = selected ? BORDER_SELECTED : BORDER_REST;

  const { updateNodeData } = useReactFlow<CanvasNode, CanvasEdge>();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const startEditing = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setDraft(data.label ?? "");
      setIsEditing(true);
      setTimeout(() => {
        const ta = textareaRef.current;
        if (!ta) return;
        ta.style.height = "auto";
        ta.style.height = ta.scrollHeight + "px";
        ta.focus();
        ta.select();
      }, 0);
    },
    [data.label],
  );

  const commitEdit = useCallback(() => {
    updateNodeData(id, { label: draft });
    setIsEditing(false);
  }, [id, draft, updateNodeData]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setIsEditing(false);
      }
    },
    [],
  );

  const colorToolbar = selected ? (
    <NodeColorToolbar nodeId={id} activeFill={pair.fill} />
  ) : null;

  const handleClass =
    "!size-2 !rounded-full !bg-white !border !border-[#2a2a30] opacity-0 group-hover:opacity-100 transition-opacity duration-150 !min-w-0 !min-h-0";

  const handles = (
    <>
      <Handle id="top" type="source" position={Position.Top} className={handleClass} />
      <Handle id="right" type="source" position={Position.Right} className={handleClass} />
      <Handle id="bottom" type="source" position={Position.Bottom} className={handleClass} />
      <Handle id="left" type="source" position={Position.Left} className={handleClass} />
    </>
  );

  const resizer = (
    <NodeResizer
      isVisible={selected}
      minWidth={MIN_WIDTH}
      minHeight={MIN_HEIGHT}
      lineStyle={RESIZER_LINE_STYLE}
      handleStyle={RESIZER_HANDLE_STYLE}
    />
  );

  const labelOverlay = (
    <div className="absolute inset-0 flex items-center justify-center px-3">
      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={draft}
          rows={1}
          onChange={(e) => {
            setDraft(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = e.target.scrollHeight + "px";
          }}
          onBlur={commitEdit}
          onKeyDown={handleKeyDown}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
          className="nodrag nopan w-full resize-none bg-transparent text-sm font-medium text-center outline-none border-none overflow-hidden"
          style={{ color: pair.text, lineHeight: "1.4" }}
          placeholder="Label"
        />
      ) : (
        <span
          style={{ color: data.label ? pair.text : PLACEHOLDER_COLOR }}
          className="text-sm font-medium text-center wrap-break-word cursor-default select-none"
          onDoubleClick={startEditing}
        >
          {data.label || "Label"}
        </span>
      )}
    </div>
  );

  if (shape === "rectangle") {
    return (
      <div
        style={{ background: pair.fill, borderColor }}
        className="w-full h-full relative rounded-xl border group"
      >
        {colorToolbar}
        {resizer}
        {handles}
        {labelOverlay}
      </div>
    );
  }

  if (shape === "pill") {
    return (
      <div
        style={{ background: pair.fill, borderColor }}
        className="w-full h-full relative rounded-full border group"
      >
        {colorToolbar}
        {resizer}
        {handles}
        {labelOverlay}
      </div>
    );
  }

  if (shape === "circle") {
    return (
      <div
        style={{ background: pair.fill, borderColor }}
        className="w-full h-full relative rounded-full border group"
      >
        {colorToolbar}
        {resizer}
        {handles}
        {labelOverlay}
      </div>
    );
  }

  if (shape === "diamond") {
    return (
      <div className="w-full h-full relative group">
        {colorToolbar}
        {resizer}
        {handles}
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 160 120"
          preserveAspectRatio="none"
        >
          <polygon
            points="80,2 158,60 80,118 2,60"
            fill={pair.fill}
            stroke={borderColor}
            strokeWidth="2"
          />
        </svg>
        {labelOverlay}
      </div>
    );
  }

  if (shape === "hexagon") {
    return (
      <div className="w-full h-full relative group">
        {colorToolbar}
        {resizer}
        {handles}
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 120 100"
          preserveAspectRatio="none"
        >
          <polygon
            points="30,2 90,2 118,50 90,98 30,98 2,50"
            fill={pair.fill}
            stroke={borderColor}
            strokeWidth="2"
          />
        </svg>
        {labelOverlay}
      </div>
    );
  }

  if (shape === "cylinder") {
    return (
      <div className="w-full h-full relative group">
        {colorToolbar}
        {resizer}
        {handles}
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 120"
          preserveAspectRatio="none"
        >
          <rect x="1" y="15" width="98" height="90" fill={pair.fill} />
          <line x1="1" y1="15" x2="1" y2="105" stroke={borderColor} strokeWidth="1.5" />
          <line x1="99" y1="15" x2="99" y2="105" stroke={borderColor} strokeWidth="1.5" />
          <ellipse cx="50" cy="105" rx="49" ry="13" fill={pair.fill} stroke={borderColor} strokeWidth="1.5" />
          <ellipse cx="50" cy="15" rx="49" ry="13" fill={pair.fill} stroke={borderColor} strokeWidth="1.5" />
        </svg>
        {labelOverlay}
      </div>
    );
  }

  return (
    <div
      style={{ background: pair.fill, borderColor }}
      className="w-full h-full relative rounded-xl border group"
    >
      {colorToolbar}
      {resizer}
      {handles}
      {labelOverlay}
    </div>
  );
}
