import { z } from "zod";

export const aiStatusPayloadSchema = z.object({
  text: z.string().optional(),
});

export type AiStatusPayload = z.infer<typeof aiStatusPayloadSchema>;

export const chatMessageSchema = z.object({
  sender: z.string(),
  role: z.union([z.literal("user"), z.literal("assistant")]),
  content: z.string(),
  timestamp: z.string(),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;
