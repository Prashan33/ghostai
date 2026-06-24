"use client";

import { ZoomIn, ZoomOut, Maximize2, Undo2, Redo2 } from "lucide-react";

interface RfZoomInstance {
  zoomIn: (options?: { duration?: number }) => void;
  zoomOut: (options?: { duration?: number }) => void;
  fitView: (options?: { duration?: number }) => void;
}

interface CanvasControlBarProps {
  rfInstance: RfZoomInstance | null;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

interface ControlButtonProps {
  onClick: () => void;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}

function ControlButton({ onClick, disabled = false, title, children }: ControlButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-150 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#2a2a30] active:bg-[#3a3a42]"
      style={{ color: "var(--text-secondary)" }}
    >
      {children}
    </button>
  );
}

export function CanvasControlBar({ rfInstance, canUndo, canRedo, onUndo, onRedo }: CanvasControlBarProps) {
  return (
    <div
      className="absolute bottom-6 left-6 z-10 flex items-center gap-1 px-2 py-1.5 rounded-full pointer-events-auto"
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-default)",
      }}
    >
      <ControlButton
        onClick={() => rfInstance?.zoomOut({ duration: 300 })}
        title="Zoom out (−)"
      >
        <ZoomOut className="h-4 w-4" />
      </ControlButton>

      <ControlButton
        onClick={() => rfInstance?.fitView({ duration: 300 })}
        title="Fit view"
      >
        <Maximize2 className="h-4 w-4" />
      </ControlButton>

      <ControlButton
        onClick={() => rfInstance?.zoomIn({ duration: 300 })}
        title="Zoom in (+)"
      >
        <ZoomIn className="h-4 w-4" />
      </ControlButton>

      <div
        className="w-px h-5 mx-1"
        style={{ background: "var(--border-default)" }}
      />

      <ControlButton
        onClick={onUndo}
        disabled={!canUndo}
        title="Undo (⌘Z)"
      >
        <Undo2 className="h-4 w-4" />
      </ControlButton>

      <ControlButton
        onClick={onRedo}
        disabled={!canRedo}
        title="Redo (⌘⇧Z)"
      >
        <Redo2 className="h-4 w-4" />
      </ControlButton>
    </div>
  );
}
