import { MarkerType } from "@xyflow/react";
import type { CanvasNode, CanvasEdge } from "@/types/canvas";

export interface CanvasTemplate {
  id: string;
  name: string;
  description: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

// ── palette shortcuts (indices match NODE_COLORS) ──────────────────────────
const NEUTRAL = "#1F1F1F";
const BLUE = "#10233D";
const PURPLE = "#2E1938";
const ORANGE = "#331B00";
const RED = "#3C1618";
const GREEN = "#0F2E18";
const TEAL = "#062822";

const DEFAULT_MARKER = {
  type: MarkerType.ArrowClosed,
  width: 12,
  height: 12,
  color: "rgba(180,180,195,0.75)",
} as const;

function n(
  id: string,
  label: string,
  x: number,
  y: number,
  shape: CanvasNode["data"]["shape"],
  color: string,
  width = 130,
  height = 45,
): CanvasNode {
  return { id, type: "canvasNode", position: { x, y }, width, height, data: { label, shape, color } };
}

function e(id: string, source: string, target: string): CanvasEdge {
  return { id, source, target, type: "canvasEdge", data: {}, markerEnd: DEFAULT_MARKER };
}

// ── 1. Microservices ───────────────────────────────────────────────────────
const microservices: CanvasTemplate = {
  id: "microservices",
  name: "Microservices",
  description: "API Gateway routes traffic to isolated services, each backed by a dedicated database and connected via a shared message bus.",
  nodes: [
    n("ms-gw",  "API Gateway",      175,   0, "rectangle", BLUE,   160, 45),
    n("ms-us",  "User Service",       0, 120, "pill",      GREEN,  130, 45),
    n("ms-os",  "Order Service",    175, 120, "pill",      PURPLE, 130, 45),
    n("ms-ps",  "Product Service",  350, 120, "pill",      ORANGE, 150, 45),
    n("ms-udb", "Users DB",          15, 235, "cylinder",  TEAL,   100, 45),
    n("ms-odb", "Orders DB",        190, 235, "cylinder",  TEAL,   100, 45),
    n("ms-pdb", "Products DB",      365, 235, "cylinder",  TEAL,   110, 45),
  ],
  edges: [
    e("ms-e1", "ms-gw", "ms-us"),
    e("ms-e2", "ms-gw", "ms-os"),
    e("ms-e3", "ms-gw", "ms-ps"),
    e("ms-e4", "ms-us", "ms-udb"),
    e("ms-e5", "ms-os", "ms-odb"),
    e("ms-e6", "ms-ps", "ms-pdb"),
  ],
};

// ── 2. CI/CD Pipeline ─────────────────────────────────────────────────────
const cicd: CanvasTemplate = {
  id: "ci-cd",
  name: "CI/CD Pipeline",
  description: "End-to-end delivery from source commit through build, test, containerisation, and staged deployment to production.",
  nodes: [
    n("cd-src",    "Source Control",  0,  60, "hexagon",   NEUTRAL, 140, 45),
    n("cd-build",  "Build",         165,  60, "pill",      BLUE,    100, 45),
    n("cd-test",   "Test",          295,  60, "pill",      GREEN,   100, 45),
    n("cd-stg",    "Staging",       425,  60, "pill",      ORANGE,  110, 45),
    n("cd-prod",   "Production",    565,  60, "pill",      PURPLE,  120, 45),
    n("cd-notify", "Notify",        345, 160, "diamond",   RED,     100, 45),
  ],
  edges: [
    e("cd-e1", "cd-src",  "cd-build"),
    e("cd-e2", "cd-build", "cd-test"),
    e("cd-e3", "cd-test",  "cd-stg"),
    e("cd-e4", "cd-stg",   "cd-prod"),
    e("cd-e5", "cd-test",  "cd-notify"),
    e("cd-e6", "cd-stg",   "cd-notify"),
  ],
};

// ── 3. Event-Driven System ────────────────────────────────────────────────
const eventDriven: CanvasTemplate = {
  id: "event-driven",
  name: "Event-Driven System",
  description: "Producers publish events to a central bus. Independent consumers handle emails, push notifications, analytics, and error queues.",
  nodes: [
    n("ev-p1",  "Producer A",   0,  80, "rectangle", BLUE,   120, 45),
    n("ev-p2",  "Producer B",   0, 165, "rectangle", BLUE,   120, 45),
    n("ev-bus", "Event Bus",  175, 115, "hexagon",   ORANGE, 130, 55),
    n("ev-c1",  "Consumer A", 375,  50, "pill",      GREEN,  120, 45),
    n("ev-c2",  "Consumer B", 375, 140, "pill",      PURPLE, 120, 45),
    n("ev-c3",  "Consumer C", 375, 230, "pill",      TEAL,   120, 45),
    n("ev-db",  "Event Store",175, 245, "cylinder",  NEUTRAL,120, 45),
  ],
  edges: [
    e("ev-e1", "ev-p1",  "ev-bus"),
    e("ev-e2", "ev-p2",  "ev-bus"),
    e("ev-e3", "ev-bus", "ev-c1"),
    e("ev-e4", "ev-bus", "ev-c2"),
    e("ev-e5", "ev-bus", "ev-c3"),
    e("ev-e6", "ev-bus", "ev-db"),
  ],
};

export const CANVAS_TEMPLATES: CanvasTemplate[] = [microservices, cicd, eventDriven];
