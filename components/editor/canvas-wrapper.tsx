"use client";

import { ReactNode } from "react";
import { LiveblocksProvider, RoomProvider, ClientSideSuspense } from "@liveblocks/react";

interface CanvasWrapperProps {
  roomId: string;
  children: ReactNode;
}

function CanvasLoadingState() {
  return (
    <div className="flex-1 flex items-center justify-center bg-base">
      <div className="flex flex-col items-center gap-3">
        <div className="w-6 h-6 rounded-full border-2 border-brand border-t-transparent animate-spin" />
        <span className="text-xs text-copy-muted font-mono tracking-widest uppercase">
          Connecting…
        </span>
      </div>
    </div>
  );
}

function CanvasErrorFallback() {
  return (
    <div className="flex-1 flex items-center justify-center bg-base">
      <div className="flex flex-col items-center gap-3 text-center max-w-xs px-6">
        <span className="text-sm font-medium text-state-error">
          Connection failed
        </span>
        <p className="text-xs text-copy-muted leading-relaxed">
          Could not connect to the collaboration server. Reload to try again.
        </p>
      </div>
    </div>
  );
}

export function CanvasWrapper({ roomId, children }: CanvasWrapperProps) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider
        id={roomId}
        initialPresence={{ cursor: null, isThinking: false }}
      >
        <ClientSideSuspense fallback={<CanvasLoadingState />}>
          {() => (
            <ErrorBoundaryCanvas fallback={<CanvasErrorFallback />}>
              {children}
            </ErrorBoundaryCanvas>
          )}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}

import { Component, type ErrorInfo } from "react";

interface ErrorBoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundaryCanvas extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[CanvasWrapper] Liveblocks error:", error, info);
  }

  override render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}
