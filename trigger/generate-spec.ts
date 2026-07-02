import { schemaTask } from "@trigger.dev/sdk/v3";
import { metadata } from "@trigger.dev/sdk/v3";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import { z } from "zod";
import { put } from "@vercel/blob";
import { PrismaClient } from "@/app/generated/prisma/client";

const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

const NodeSchema = z.record(z.string(), z.unknown());
const EdgeSchema = z.record(z.string(), z.unknown());

const InputSchema = z.object({
  projectId: z.string().min(1),
  roomId: z.string().min(1),
  chatHistory: z.array(ChatMessageSchema),
  nodes: z.array(NodeSchema),
  edges: z.array(EdgeSchema),
});

function buildSpecPrompt(
  nodes: z.infer<typeof NodeSchema>[],
  edges: z.infer<typeof EdgeSchema>[],
  chatHistory: z.infer<typeof ChatMessageSchema>[],
): string {
  const sections: string[] = [];

  if (nodes.length > 0) {
    sections.push(`## Canvas Nodes (${nodes.length})\n${JSON.stringify(nodes, null, 2)}`);
  } else {
    sections.push("## Canvas Nodes\nNo nodes present.");
  }

  if (edges.length > 0) {
    sections.push(`## Canvas Edges (${edges.length})\n${JSON.stringify(edges, null, 2)}`);
  } else {
    sections.push("## Canvas Edges\nNo edges present.");
  }

  if (chatHistory.length > 0) {
    const formatted = chatHistory
      .map((m) => `${m.role === "user" ? "User" : "AI"}: ${m.content}`)
      .join("\n");
    sections.push(`## Design Discussion\n${formatted}`);
  }

  return sections.join("\n\n");
}

export const generateSpecTask = schemaTask({
  id: "generate-spec",
  schema: InputSchema,
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 30_000,
    randomize: true,
  },
  run: async (payload) => {
    const { projectId, nodes, edges, chatHistory } = payload;

    const prisma = new PrismaClient({ accelerateUrl: process.env.DATABASE_URL! });

    try {
    metadata.set("status", "starting").set("projectId", projectId);

    const specRecord = await prisma.projectSpec.create({
      data: { projectId, filePath: "" },
    });

    const openrouter = createOpenRouter({ apiKey: process.env.OPENROUTER_AI_API_KEY });
    const model = openrouter("google/gemini-2.5-flash-lite");

    metadata.set("status", "generating");

    const { text } = await generateText({
      model,
      system: `You are a senior software architect. Generate a concise, well-structured Markdown technical specification from a system design canvas and conversation history.

The spec must include:
1. **Overview** — one paragraph describing what the system does
2. **Architecture** — describe the key components and how they connect
3. **Components** — for each node, describe its role, responsibilities, and interfaces
4. **Data Flow** — how data moves through the system following the edges
5. **Key Design Decisions** — important architectural choices inferred from the design
6. **Open Questions** — gaps or ambiguities worth addressing before implementation

Use clean Markdown with headers, bullet points, and code blocks where appropriate.
Keep the spec actionable and implementation-ready.
Output ONLY the Markdown document — no preamble, no explanation outside the spec.`,
      prompt: buildSpecPrompt(nodes, edges, chatHistory),
    });

    metadata.set("status", "saving");

    const blob = await put(
      `specs/${projectId}/${specRecord.id}.md`,
      text,
      {
        access: "private",
        allowOverwrite: false,
        addRandomSuffix: false,
        contentType: "text/markdown",
      },
    );

    await prisma.projectSpec.update({
      where: { id: specRecord.id },
      data: { filePath: blob.url },
    });

    metadata.set("status", "completed").set("specId", specRecord.id);

    return { spec: text, specId: specRecord.id };
    } finally {
      await prisma.$disconnect();
    }
  },
});
