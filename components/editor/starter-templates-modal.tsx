"use client";

import { Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CANVAS_TEMPLATES, type CanvasTemplate } from "@/components/editor/starter-templates";
import type { NodeShape } from "@/types/canvas";

interface StarterTemplatesModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (template: CanvasTemplate) => void;
}

// ── SVG preview ──────────────────────────────────────────────────────────

const PREVIEW_W = 300;
const PREVIEW_H = 190;
const PREVIEW_PAD = 14;

interface ShapeProps {
  x: number;
  y: number;
  w: number;
  h: number;
  shape: NodeShape;
  fill: string;
}

function NodeShape({ x, y, w, h, shape, fill }: ShapeProps) {
  const stroke = "rgba(90,90,110,0.45)";
  const sw = 0.7;

  if (shape === "circle") {
    const cx = x + w / 2;
    const cy = y + h / 2;
    const r = Math.min(w, h) / 2;
    return <circle cx={cx} cy={cy} r={r} fill={fill} stroke={stroke} strokeWidth={sw} />;
  }

  if (shape === "diamond") {
    const cx = x + w / 2;
    const cy = y + h / 2;
    const pts = `${cx},${y} ${x + w},${cy} ${cx},${y + h} ${x},${cy}`;
    return <polygon points={pts} fill={fill} stroke={stroke} strokeWidth={sw} />;
  }

  if (shape === "hexagon") {
    const cx = x + w / 2;
    const cy = y + h / 2;
    const ry = h / 2;
    const pts = [
      [cx, y],
      [x + w, cy - ry / 2],
      [x + w, cy + ry / 2],
      [cx, y + h],
      [x, cy + ry / 2],
      [x, cy - ry / 2],
    ]
      .map(([px, py]) => `${px},${py}`)
      .join(" ");
    return <polygon points={pts} fill={fill} stroke={stroke} strokeWidth={sw} />;
  }

  if (shape === "pill") {
    return (
      <rect x={x} y={y} width={w} height={h} rx={h / 2} ry={h / 2} fill={fill} stroke={stroke} strokeWidth={sw} />
    );
  }

  if (shape === "cylinder") {
    const eyH = Math.min(h * 0.2, 5);
    return (
      <g>
        <rect x={x} y={y + eyH} width={w} height={h - eyH} fill={fill} stroke={stroke} strokeWidth={sw} />
        <ellipse cx={x + w / 2} cy={y + eyH} rx={w / 2} ry={eyH} fill={fill} stroke={stroke} strokeWidth={sw} />
      </g>
    );
  }

  // rectangle (default)
  return <rect x={x} y={y} width={w} height={h} rx={3} fill={fill} stroke={stroke} strokeWidth={sw} />;
}

function TemplatePreview({ template }: { template: CanvasTemplate }) {
  const { nodes, edges } = template;

  if (nodes.length === 0) {
    return (
      <div style={{ width: PREVIEW_W, height: PREVIEW_H }} className="rounded-xl bg-base" />
    );
  }

  // Calculate diagram bounds
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const nd of nodes) {
    const nw = nd.width ?? 120;
    const nh = nd.height ?? 45;
    minX = Math.min(minX, nd.position.x);
    minY = Math.min(minY, nd.position.y);
    maxX = Math.max(maxX, nd.position.x + nw);
    maxY = Math.max(maxY, nd.position.y + nh);
  }

  const diagramW = maxX - minX || 1;
  const diagramH = maxY - minY || 1;
  const usableW = PREVIEW_W - PREVIEW_PAD * 2;
  const usableH = PREVIEW_H - PREVIEW_PAD * 2;
  const scale = Math.min(usableW / diagramW, usableH / diagramH);

  const offsetX = (PREVIEW_W - diagramW * scale) / 2 - minX * scale;
  const offsetY = (PREVIEW_H - diagramH * scale) / 2 - minY * scale;

  const tx = (v: number) => v * scale + offsetX;
  const ty = (v: number) => v * scale + offsetY;

  return (
    <svg
      width={PREVIEW_W}
      height={PREVIEW_H}
      viewBox={`0 0 ${PREVIEW_W} ${PREVIEW_H}`}
      className="w-full rounded-xl"
      style={{ background: "#080809" }}
    >
      {/* Edges first so nodes render on top */}
      {edges.map((eg) => {
        const src = nodes.find((nd) => nd.id === eg.source);
        const tgt = nodes.find((nd) => nd.id === eg.target);
        if (!src || !tgt) return null;
        const x1 = tx(src.position.x + (src.width ?? 120) / 2);
        const y1 = ty(src.position.y + (src.height ?? 45) / 2);
        const x2 = tx(tgt.position.x + (tgt.width ?? 120) / 2);
        const y2 = ty(tgt.position.y + (tgt.height ?? 45) / 2);
        return (
          <line
            key={eg.id}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="rgba(110,110,135,0.5)"
            strokeWidth={1}
          />
        );
      })}

      {/* Nodes */}
      {nodes.map((nd) => {
        const nw = (nd.width ?? 120) * scale;
        const nh = (nd.height ?? 45) * scale;
        const nx = tx(nd.position.x);
        const ny = ty(nd.position.y);
        return (
          <NodeShape
            key={nd.id}
            x={nx} y={ny} w={nw} h={nh}
            shape={nd.data.shape ?? "rectangle"}
            fill={nd.data.color ?? "#1F1F1F"}
          />
        );
      })}
    </svg>
  );
}

// ── Template card ─────────────────────────────────────────────────────────

function TemplateCard({
  template,
  onImport,
}: {
  template: CanvasTemplate;
  onImport: (t: CanvasTemplate) => void;
}) {
  return (
    <div className="flex flex-col rounded-2xl bg-elevated border border-surface-border overflow-hidden hover:border-[rgba(0,200,212,0.25)] transition-colors duration-150">
      {/* Preview */}
      <div className="w-full border-b border-surface-border overflow-hidden">
        <TemplatePreview template={template} />
      </div>

      {/* Info */}
      <div className="flex flex-col gap-3 p-5">
        <p className="text-[15px] font-semibold text-copy-primary leading-tight">{template.name}</p>
        <p className="text-sm text-copy-muted leading-relaxed">{template.description}</p>
        <Button
          size="sm"
          variant="ghost"
          className="w-full h-9 gap-2 text-sm border border-surface-border text-copy-secondary hover:text-copy-primary hover:bg-subtle mt-1"
          onClick={() => onImport(template)}
        >
          <Download className="h-4 w-4" />
          Import
        </Button>
      </div>
    </div>
  );
}

// ── Modal ────────────────────────────────────────────────────────────────

export function StarterTemplatesModal({
  open,
  onClose,
  onImport,
}: StarterTemplatesModalProps) {
  function handleImport(template: CanvasTemplate) {
    onImport(template);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="w-full max-w-4xl sm:max-w-4xl bg-surface border border-surface-border rounded-3xl p-0 gap-0">
        <DialogHeader className="px-8 pt-7 pb-5 border-b border-surface-border">
          <DialogTitle className="text-xl font-semibold text-copy-primary">
            Import Template
          </DialogTitle>
          <p className="text-sm text-copy-muted mt-1.5 leading-relaxed">
            Choose a starter template to pre-populate your canvas. Any existing nodes will be replaced — use{" "}
            <kbd className="px-1.5 py-0.5 rounded bg-elevated border border-surface-border text-copy-secondary font-mono text-[11px]">
              ⌘Z
            </kbd>{" "}
            to undo.
          </p>
        </DialogHeader>

        <ScrollArea className="max-h-[75vh]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 p-8">
            {CANVAS_TEMPLATES.map((tpl) => (
              <TemplateCard key={tpl.id} template={tpl} onImport={handleImport} />
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
