import { defineConfig } from "@trigger.dev/sdk/v3";
import { prismaExtension } from "@trigger.dev/build/extensions/prisma";

export default defineConfig({
  project: process.env.TRIGGER_PROJECT_REF!,
  runtime: "node",
  dirs: ["./trigger"],
  maxDuration: 3600,
  build: {
    extensions: [
      prismaExtension({
        mode: "modern",
      }),
    ],
  },
});
