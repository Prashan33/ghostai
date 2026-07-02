# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Phase 29 complete: Spec UI integration — `react-markdown` installed. `GET /api/projects/[projectId]/specs` added: auth + project access check, returns all `ProjectSpec` records (`id`, `filePath`, `createdAt`) ordered by `createdAt` desc. `GET /api/projects/[projectId]/specs/[specId]/content` added: same auth/access pattern, fetches Markdown from Vercel Blob via `head` + `downloadUrl`, returns content as `text/markdown` (no `Content-Disposition`). `components/editor/ai-sidebar.tsx` Specs tab fully wired: fetches spec list when the tab is selected; compact clickable list items showing filename (`spec-{id}.md`) and `createdAt`; per-item Download button calls the existing download route via an anchor click; clicking an item opens a `Dialog` modal that fetches content from the content endpoint and renders it as Markdown using `ReactMarkdown`; modal has a Download button and a Close button; `ScrollArea` wraps both the list and the modal body; empty state and error state handled; `npm run build` passes.

## Current Goal

- Next: No immediate next step identified.

## Completed

- `01-design-system`: shadcn/ui initialized for Tailwind v4; Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea added to `components/ui/`; `lucide-react` installed; `lib/utils.ts` with `cn()` created; `globals.css` configured with full dark theme CSS variables and project design tokens; `layout.tsx` applies `dark` class to `<html>`.
- `02-editor`: `components/editor/editor-navbar.tsx` — fixed-height top navbar (h-12, z-40) with sidebar toggle using `PanelLeftOpen`/`PanelLeftClose` icons; accepts `isSidebarOpen` and `onSidebarToggle` props. `components/editor/project-sidebar.tsx` — floating overlay sidebar (z-50, w-72) that slides in from left without pushing content; accepts `isOpen` and `onClose` props; header with "Projects" title + close button; shadcn `Tabs` with "My Projects" / "Shared" tabs showing empty placeholder state; full-width "New Project" button with `Plus` icon at bottom. `components/editor/editor-shell.tsx` — client component managing sidebar open/close state, composes `EditorNavbar` + `ProjectSidebar` + `<main>`. Dialog pattern ready for future use via existing shadcn `Dialog` component and color tokens in `globals.css`.
- `03-auth`: `ClerkProvider` wraps root layout with `dark` theme from `@clerk/ui/themes`; Clerk appearance variables overridden via CSS custom properties (no hardcoded colors). `proxy.ts` at project root protects all routes except sign-in/sign-up (paths read from env vars). `/` redirects authenticated users to `/editor` and unauthenticated users to `/sign-in`. Sign-in and sign-up pages use a two-panel layout on large screens (left: logo + tagline + feature list; right: Clerk form) and form-only on small screens — no gradients, no hero sections. `UserButton` added to editor navbar right section. `/editor` page route created using `EditorShell`.
- `05-prisma`: `prisma/models/project.prisma` — `Project` (ownerId, name, description?, status enum DRAFT/ARCHIVED, canvasJsonPath?, timestamps, indexes on ownerId and createdAt) and `ProjectCollaborator` (projectId with cascade delete, email, createdAt, unique on projectId/email, indexes on email and projectId/createdAt). `lib/prisma.ts` — cached singleton; branches on `DATABASE_URL` prefix: `prisma+postgres://` uses `{ accelerateUrl }`, otherwise uses `@prisma/adapter-pg` via `{ adapter: new PrismaPg({ connectionString }) }`. Generated client at `app/generated/prisma/`. Migration `20260616051745_add_project_models` applied. `npm run build` passes.

- `06-project-apis`: `app/api/projects/route.ts` — `GET` lists the authenticated user's projects ordered by `createdAt` desc; `POST` creates a project with `ownerId` set to the Clerk user ID, defaulting `name` to `"Untitled Project"`. `app/api/projects/[projectId]/route.ts` — `PATCH` renames a project (requires non-empty `name`); `DELETE` deletes a project; both enforce owner-only access returning `403` for non-owners and `401` for unauthenticated requests. `npm run build` passes.

- `04-project-dialogs`: editor home screen (`components/editor/editor-home.tsx`), three dialogs (`components/editor/project-dialogs.tsx`), hook (`hooks/use-project-dialogs.ts`) with dialog/form/loading state and mock data; sidebar updated with project items and rename/delete actions for owned projects, mobile backdrop scrim; all wired through `editor-shell.tsx`.

- `07-wire-editor-home`: `lib/projects.ts` — server-side `getOwnedProjects` and `getSharedProjects` helpers using Prisma + Clerk auth; `ProjectData` interface (`{ id, name }`). `hooks/use-project-actions.ts` — replaced mock hook with real mutations: create (POST → navigate to `/editor/[id]`), rename (PATCH → refresh), delete (DELETE → redirect if active, else refresh); generates slug+suffix room ID preview. `app/editor/page.tsx` — now an async server component that fetches both project lists and passes them to `EditorShell`. `editor-shell.tsx` accepts `ownedProjects`/`sharedProjects` props and uses `useProjectActions`. `project-sidebar.tsx` — removed mock data imports, reads real project lists from props. `project-dialogs.tsx` — wired `onConfirm`/`isLoading` to all three dialogs; create dialog shows room ID preview; rename pre-fills name; delete shows project name; loading states disable inputs and buttons. `npm run build` passes.

- `20-ai-sidebar-shell`: `components/editor/ai-sidebar.tsx` — new client component; `AISidebar` receives `onClose` prop; header with bot icon, "AI Workspace" title, "Collaborate with Ghost AI" subtitle, and close button; shadcn `Tabs` with "AI Architect" and "Specs" tabs; active tab styled `data-active:bg-subtle data-active:text-brand`; AI Architect tab has a scrollable chat area with empty state (bot icon, description, three starter chips styled `bg-subtle text-ai-text`), message list (user messages `bg-accent-dim border-2 border-brand/50`, assistant messages `bg-elevated border-surface-border`), and auto-resizing `Textarea` (72px min, 160px max via `field-sizing-content`) with Send button (`bg-ai text-white`); Enter submits, Shift+Enter newlines; Specs tab has a `Generate Spec` button (`bg-ai text-white`) and a static demo spec card (`bg-elevated border-surface-border`) with file icon, title, snippet, and disabled Download action. `workspace-shell.tsx` — removed inline aside placeholder and its `Settings`/`Bot` imports; imports and renders `<AISidebar onClose={...} />` instead. `npm run build` passes.

- `21-canvas-autosave`: `@vercel/blob` installed. `app/api/projects/[projectId]/canvas/route.ts` — `PUT` uploads canvas JSON to Vercel Blob (`canvas/{projectId}.json`, `addRandomSuffix: false`) and stores the blob URL on the Prisma `Project.canvasJsonPath` field; `GET` reads `canvasJsonPath` from Prisma and fetches and returns the blob JSON. Both routes verify auth (401) and project access via `getProjectAccess` (404/403). `hooks/use-canvas-autosave.ts` — watches `nodes` and `edges`, debounces saves by 2 seconds, skips the initial render, tracks `SaveStatus` (`idle | saving | saved | error`). `canvas.tsx` — added `projectId` and `onSaveStatusChange` props; load effect runs once on mount: if room is empty it fetches from the canvas API and adds nodes/edges via Liveblocks change handlers, then `fitView`; uses `useCanvasAutosave` and emits status changes via `onSaveStatusChange`. `workspace-shell.tsx` — passes `projectId` to `Canvas` and `saveStatus` to `WorkspaceNavbar`. `workspace-navbar.tsx` — shows `Loader2 + "Saving…"`, `CheckCircle2 + "Saved"`, or `AlertCircle + "Save failed"` based on `saveStatus`; idle state shows nothing. `npm run build` passes.

- `08-editor-workspace-shell`: `lib/project-access.ts` — `getCurrentIdentity` and `getProjectAccess`. `components/editor/access-denied.tsx`. `workspace-navbar.tsx`, `workspace-shell.tsx`, `app/editor/[roomId]/page.tsx`. `npm run build` passes.

- `09-share-dialog`: Collaborator API routes. `components/editor/share-dialog.tsx`. Wired into workspace. `npm run build` passes.

- `10-liveblocks-setup`: `liveblocks.config.ts`, `lib/liveblocks.ts`, `app/api/liveblocks-auth/route.ts`. `npm run build` passes.

- `11-base-canvas` through `19-presence-avatars-cursor`: Canvas, shapes, editing, color toolbar, edges, ergonomics, starter templates, presence avatars and live cursors — all fully implemented. `npm run build` passes.

- `22-trigger-dev-setup`: `@trigger.dev/sdk@4.4.6` installed. `trigger.config.ts`. Stub tasks. `npm run build` passes.

- `23-design-agent-logic`: `trigger/design-agent.ts` fully implemented — OpenRouter AI, structured canvas operations, Liveblocks storage mutation, presence broadcast, status broadcast events. `npm run build` passes.

- `22-design-agent-api`: `TaskRun` Prisma model + migration. `app/api/ai/design/route.ts` and `app/api/ai/design/token/route.ts`. `npm run build` passes.

- `24-ai-presence-state`: `liveblocks.config.ts` typed with `RoomEvent`, `FeedMessageData`, presence `thinking` field. `live-cursors.tsx` shows spinner badge when thinking. `ai-sidebar.tsx` derives `isGenerating` from presence. `npm run build` passes.

- `25-sidebar-chat-feed`: `ai-chat` Liveblocks feed wired; `chatMessageSchema` validation; user/AI message rendering with sender alignment; `useSelf` for identity. `npm run build` passes.

- `26-design-agent-frontend`: `@trigger.dev/react-hooks` installed. `send()` calls design API + token API; `RunTracker` child component uses `useRealtimeRun`; run terminal state pushes final AI message and resets; green status strip above input during active run; `useEventListener` bridges `ai:status` broadcast events to the status strip; user bubbles green `#62C073`; submit button green when enabled, spinner when running. `npm run build` passes.

- `issue-1-save-button`: Manual save button in workspace navbar; `useCanvasAutosave` returns save fn; Canvas API uses `allowOverwrite: true`. `npm run build` passes.

- `issue-2-delete-nodes-edges`: Delete/Backspace keydown listener in `canvas.tsx`. `npm run build` passes.

- `issue-3-handle-connections`: `pointer-events-none` on `labelOverlay` div; `pointer-events-auto` restored on inner span/textarea. `npm run build` passes.

- `issue-4-drop-position`: `onDrop` uses `screenToFlowPosition` then subtracts half node dimensions. `npm run build` passes.

- `issue-5-auto-zoom`: Removed `fitView` prop from `<ReactFlow>`; manual `fitView` retained for load and template import. `npm run build` passes.

- `issue-6-clerk-images`: `img.clerk.com` added to `next.config.ts` `images.remotePatterns`. `npm run build` passes.

- `issue-7-remove-userbutton-navbar`: `UserButton` removed from `workspace-navbar.tsx`; retained in `presence-avatars.tsx`. `npm run build` passes.

- `27-spec-generation-flow`: `app/api/ai/spec/route.ts` — POST route; validates `roomId`, `chatHistory`, `nodes`, `edges`; resolves project via `getProjectAccess(roomId)` (roomId = projectId); triggers `generate-spec` task; saves `TaskRun`; returns `runId`. `app/api/ai/spec/token/route.ts` — verifies `TaskRun` ownership; issues 1-hour scoped Trigger.dev public token. `trigger/generate-spec.ts` — `schemaTask` with Zod; Gemini `gemini-2.0-flash` via `@ai-sdk/google`; generates full Markdown spec from canvas and chat; `metadata` progress tracking; returns `{ spec }`. `npm run build` passes.

- `28-spec-persistence-download`: `prisma/models/project-spec.prisma` — `ProjectSpec` model with `id`, `projectId` (cascade FK to `Project`), `filePath`, `createdAt`, and indexes. Migration `20260629000000_add_project_spec_model` applied. `trigger/generate-spec.ts` — after generation, creates a `ProjectSpec` record, uploads Markdown to Vercel Blob at `specs/{projectId}/{specId}.md` (private, no random suffix), updates `filePath` with blob URL; returns `{ spec, specId }`; sets `specId` in metadata. `app/api/projects/[projectId]/specs/[specId]/download/route.ts` — `GET`; auth + project access check; verifies spec belongs to project; fetches blob via `head`/`downloadUrl`; returns Markdown as `Content-Disposition: attachment`. `npm run build` passes.

- `29-spec-ui-integration`: `react-markdown` installed. `app/api/projects/[projectId]/specs/route.ts` — `GET`; lists `ProjectSpec` records for the project ordered by `createdAt` desc; returns `id`, `filePath`, `createdAt`. `app/api/projects/[projectId]/specs/[specId]/content/route.ts` — `GET`; same auth/access pattern; fetches Markdown from Vercel Blob; returns plain `text/markdown` without `Content-Disposition`. `components/editor/ai-sidebar.tsx` — Specs tab replaced: controlled tab state; spec list fetched from the list API when tab is active; compact clickable list items (filename + createdAt); per-item Download button triggers existing download route via anchor click; item click opens a `Dialog` modal; modal fetches content from the content API and renders with `ReactMarkdown`; `ScrollArea` on list and modal body; empty + error states; modal has Download + Close. `npm run build` passes.

## In Progress

- Nothing currently in progress.

## Open Questions

- Add unresolved product or implementation questions here.

## Architecture Decisions

- Dark-only theme: all shadcn semantic tokens (`--background`, `--foreground`, etc.) are mapped to the project's dark palette in `:root`. The `dark` class is always applied on `<html>` so `dark:` Tailwind variants work.
- Project color tokens (`--bg-base`, `--text-primary`, etc.) are defined in `:root` and registered in `@theme inline` as `--color-base`, `--color-copy-primary`, etc., creating utility classes `bg-base`, `text-copy-primary`, `border-surface-border`, `text-brand`, `bg-accent-dim`, etc.
- Auth uses `proxy.ts` (not `middleware.ts`) per Clerk's proxy configuration pattern. All routes are protected by default; only sign-in/sign-up paths are public.

## Session Notes

- Project uses Next.js 16.2.7, React 19, Tailwind v4 (CSS-first, no tailwind.config.js), TypeScript strict mode.
- `@/*` path alias resolves to project root.
- Do not modify files in `components/ui/` — managed by shadcn CLI.
