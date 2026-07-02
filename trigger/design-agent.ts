import { task } from "@trigger.dev/sdk/v3";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateObject } from "ai";
import { z } from "zod";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { LiveObject, LiveMap } from "@liveblocks/node";
import { liveblocks } from "@/lib/liveblocks";
import { NODE_COLORS } from "@/types/canvas";

// Use any for internal Liveblocks CRDT node/map types so we can do low-level
// storage manipulation without fighting the LsonObject constraint.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyLiveObject = LiveObject<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyLiveMap = LiveMap<string, any>;

const MODEL = "google/gemini-2.5-flash-lite";
const AI_USER_ID = "ghost-ai";

// Mirror @liveblocks/react-flow internal sync configs.
// "atomic" = stored as a single JSON value (not a nested LiveObject).
// false    = local-only, not synced to storage.
const NODE_SYNC_CONFIG = {
  selected: false,
  dragging: false,
  measured: false,
  resizing: false,
  position: "atomic",
  sourcePosition: "atomic",
  targetPosition: "atomic",
  extent: "atomic",
  origin: "atomic",
  handles: "atomic",
} satisfies Record<string, boolean | "atomic">;

const EDGE_SYNC_CONFIG = {
  selected: false,
  markerStart: "atomic",
  markerEnd: "atomic",
  label: "atomic",
  labelBgPadding: "atomic",
} satisfies Record<string, boolean | "atomic">;

const MARKER_END = {
  type: "arrowclosed",
  width: 12,
  height: 12,
  color: "rgba(180,180,195,0.75)",
};

const VALID_SHAPES = ["rectangle", "diamond", "circle", "pill", "cylinder", "hexagon"] as const;
type NodeShape = (typeof VALID_SHAPES)[number];
const VALID_COLORS = NODE_COLORS.map((c) => c.fill);

const OperationSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("add_node"),
    id: z.string(),
    label: z.string(),
    shape: z.enum(VALID_SHAPES),
    color: z.string(),
    x: z.number(),
    y: z.number(),
    width: z.number().default(160),
    height: z.number().default(80),
  }),
  z.object({
    action: z.literal("update_node"),
    id: z.string(),
    label: z.string().optional(),
    color: z.string().optional(),
    shape: z.enum(VALID_SHAPES).optional(),
  }),
  z.object({
    action: z.literal("move_node"),
    id: z.string(),
    x: z.number(),
    y: z.number(),
  }),
  z.object({
    action: z.literal("resize_node"),
    id: z.string(),
    width: z.number(),
    height: z.number(),
  }),
  z.object({
    action: z.literal("delete_node"),
    id: z.string(),
  }),
  z.object({
    action: z.literal("add_edge"),
    id: z.string(),
    source: z.string(),
    target: z.string(),
    label: z.string().optional(),
  }),
  z.object({
    action: z.literal("delete_edge"),
    id: z.string(),
  }),
]);

const ResponseSchema = z.object({
  summary: z.string(),
  operations: z.array(OperationSchema),
});

function buildSystemPrompt(): string {
  return `You are Ghost AI, an expert system architect that modifies collaborative system design canvases.

Respond ONLY with a JSON object — no markdown, no explanation outside the JSON.

CANVAS RULES
- Nodes: id, type="canvasNode", position {x,y}, width, height, data {label, color, shape}
- Edges: id, type="canvasEdge", source (node id), target (node id), data {label}
- Node shapes: rectangle (services, APIs), diamond (decisions/gateways), circle (events/triggers), pill (message queues), cylinder (databases/storage), hexagon (external systems)
- Node colors (use ONLY these fill hex values): ${VALID_COLORS.join(", ")}
- Spacing: at least 80px between nodes; default size 160×80px; lay out left-to-right or top-to-bottom
- Use readable slug IDs: "api-gateway", "user-service", "edge-api-to-auth"

OPERATIONS (pick the right action per change)
- add_node    → id, label, shape, color (fill hex), x, y, width (default 160), height (default 80)
- update_node → id + optional label / color / shape
- move_node   → id, x, y
- resize_node → id, width, height
- delete_node → id
- add_edge    → id, source, target, optional label
- delete_edge → id

REQUIRED JSON FORMAT
{"summary":"what you did","operations":[...]}`;
}

type FlowLiveObject = LiveObject<{
  nodes: AnyLiveMap;
  edges: AnyLiveMap;
}>;

export const designAgentTask = task({
  id: "design-agent",
  run: async (payload: { prompt: string; roomId: string }) => {
    const { prompt, roomId } = payload;

    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_AI_API_KEY,
    });

    // Announce AI presence to all room participants.
    await Promise.all([
      liveblocks.setPresence(roomId, {
        userId: AI_USER_ID,
        data: { thinking: true, cursor: null },
        userInfo: { name: "Ghost AI", color: "#00c8d4" },
        ttl: 300,
      }),
      liveblocks.broadcastEvent(roomId, {
        type: "ai:status",
        message: "Reading canvas…",
      }),
    ]);

    try {
      // Read current canvas state to give the AI context.
      const storageJson = (await liveblocks.getStorageDocument(roomId, "json")) as Record<
        string,
        unknown
      >;
      const flowData = storageJson?.flow as
        | { nodes?: Record<string, unknown>; edges?: Record<string, unknown> }
        | undefined;
      const existingNodes = flowData?.nodes ? Object.values(flowData.nodes) : [];
      const existingEdges = flowData?.edges ? Object.values(flowData.edges) : [];

      await liveblocks.broadcastEvent(roomId, {
        type: "ai:status",
        message: "Generating design…",
      });

      const { object } = await generateObject({
        model: openrouter(MODEL),
        schema: ResponseSchema,
        system: buildSystemPrompt(),
        prompt: [
          `Current canvas: ${existingNodes.length} node(s), ${existingEdges.length} edge(s).`,
          existingNodes.length > 0
            ? `Existing nodes:\n${JSON.stringify(existingNodes, null, 2)}`
            : "Canvas is empty.",
          existingEdges.length > 0
            ? `Existing edges:\n${JSON.stringify(existingEdges, null, 2)}`
            : "",
          `\nUser request: ${prompt}`,
        ]
          .filter(Boolean)
          .join("\n"),
      });

      const { summary, operations } = object;

      await liveblocks.broadcastEvent(roomId, {
        type: "ai:status",
        message: `Applying ${operations.length} operation${operations.length !== 1 ? "s" : ""}…`,
      });

      // Apply all operations directly to Liveblocks storage.
      await liveblocks.mutateStorage(roomId, ({ root }) => {
        const r = root as unknown as AnyLiveObject;

        // Initialize the flow storage document if this is a fresh room.
        if (!r.get("flow")) {
          r.set(
            "flow",
            new LiveObject({
              nodes: new LiveMap() as AnyLiveMap,
              edges: new LiveMap() as AnyLiveMap,
            }),
          );
        }

        const flow = r.get("flow") as FlowLiveObject;
        const nodesMap = flow.get("nodes") as AnyLiveMap;
        const edgesMap = flow.get("edges") as AnyLiveMap;

        for (const op of operations) {
          switch (op.action) {
            case "add_node": {
              // Clamp color to the allowed palette; fall back to the first if unrecognized.
              const color = VALID_COLORS.includes(op.color) ? op.color : VALID_COLORS[0];
              const shape: NodeShape = VALID_SHAPES.includes(op.shape) ? op.shape : "rectangle";
              const node = {
                id: op.id,
                type: "canvasNode",
                position: { x: op.x, y: op.y },
                width: op.width,
                height: op.height,
                data: { label: op.label, color, shape },
              };
              nodesMap.set(op.id, LiveObject.from(node as never, NODE_SYNC_CONFIG) as AnyLiveObject);
              break;
            }

            case "update_node": {
              const existing = nodesMap.get(op.id) as AnyLiveObject | undefined;
              if (!existing) break;
              const data = existing.get("data") as AnyLiveObject;
              if (op.label !== undefined) data.set("label", op.label);
              if (op.color !== undefined && VALID_COLORS.includes(op.color))
                data.set("color", op.color);
              if (op.shape !== undefined && (VALID_SHAPES as readonly string[]).includes(op.shape))
                data.set("shape", op.shape);
              break;
            }

            case "move_node": {
              const existing = nodesMap.get(op.id) as AnyLiveObject | undefined;
              if (!existing) break;
              existing.set("position", { x: op.x, y: op.y });
              break;
            }

            case "resize_node": {
              const existing = nodesMap.get(op.id) as AnyLiveObject | undefined;
              if (!existing) break;
              existing.set("width", op.width);
              existing.set("height", op.height);
              break;
            }

            case "delete_node": {
              nodesMap.delete(op.id);
              // Remove edges connected to this node.
              const edgesToDelete: string[] = [];
              for (const [edgeId, edge] of edgesMap) {
                const e = edge as AnyLiveObject;
                if (e.get("source") === op.id || e.get("target") === op.id) {
                  edgesToDelete.push(edgeId);
                }
              }
              for (const id of edgesToDelete) edgesMap.delete(id);
              break;
            }

            case "add_edge": {
              const edge = {
                id: op.id,
                type: "canvasEdge",
                source: op.source,
                target: op.target,
                data: { label: op.label ?? "" },
                markerEnd: MARKER_END,
              };
              edgesMap.set(op.id, LiveObject.from(edge as never, EDGE_SYNC_CONFIG) as AnyLiveObject);
              break;
            }

            case "delete_edge": {
              edgesMap.delete(op.id);
              break;
            }
          }
        }
      });

      await liveblocks.broadcastEvent(roomId, {
        type: "ai:status",
        message: summary,
      });

      return { summary, operationsApplied: operations.length };
    } catch (error) {
      await liveblocks.broadcastEvent(roomId, {
        type: "ai:status",
        message: "Design generation failed. Please try again.",
      });
      throw error;
    } finally {
      // Clear AI thinking state for all participants.
      await liveblocks.setPresence(roomId, {
        userId: AI_USER_ID,
        data: { thinking: false, cursor: null },
        userInfo: { name: "Ghost AI", color: "#00c8d4" },
        ttl: 5,
      });
    }
  },
});
