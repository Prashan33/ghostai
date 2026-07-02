"use client";

import { useOthers } from "@liveblocks/react";
import { useViewport } from "@xyflow/react";

export function LiveCursors() {
  const others = useOthers();
  const { x: vpX, y: vpY, zoom } = useViewport();

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 50 }}>
      {others.map((other) => {
        const cursor = other.presence.cursor;
        if (!cursor) return null;

        const name = other.info?.name ?? "Unknown";
        const color = other.info?.color ?? "#6457f9";
        const thinking = other.presence.thinking;

        // Convert flow coordinates to screen coordinates within the canvas container.
        const screenX = cursor.x * zoom + vpX;
        const screenY = cursor.y * zoom + vpY;

        return (
          <div
            key={other.connectionId}
            className="absolute select-none"
            style={{ left: screenX, top: screenY, pointerEvents: "none" }}
          >
            <svg width="16" height="20" viewBox="0 0 16 20" fill="none">
              <path
                d="M0 0 L0 14 L3.5 10.5 L6 16 L8 15 L5.5 9 L10 9 Z"
                fill={color}
                stroke="rgba(0,0,0,0.4)"
                strokeWidth="0.5"
              />
            </svg>
            <div
              className="mt-0.5 ml-2 px-2 py-0.5 rounded-md text-[11px] font-medium whitespace-nowrap flex items-center gap-1"
              style={{ background: color, color: "#fff" }}
            >
              {thinking && (
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full border border-white/80 border-t-transparent animate-spin shrink-0"
                  aria-label="thinking"
                />
              )}
              {name}
            </div>
          </div>
        );
      })}
    </div>
  );
}
