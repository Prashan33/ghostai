# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Phase 12 complete: Shape panel — draggable shape toolbar, custom canvasNode renderer, canvas drop handler

## Current Goal

- Next: node editing (label, color, shape picker), edge styling, or AI sidebar wiring.

## Completed

- `01-design-system`: shadcn/ui initialized for Tailwind v4; Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea added to `components/ui/`; `lucide-react` installed; `lib/utils.ts` with `cn()` created; `globals.css` configured with full dark theme CSS variables and project design tokens; `layout.tsx` applies `dark` class to `<html>`.
- `02-editor`: `components/editor/editor-navbar.tsx` — fixed-height top navbar (h-12, z-40) with sidebar toggle using `PanelLeftOpen`/`PanelLeftClose` icons; accepts `isSidebarOpen` and `onSidebarToggle` props. `components/editor/project-sidebar.tsx` — floating overlay sidebar (z-50, w-72) that slides in from left without pushing content; accepts `isOpen` and `onClose` props; header with "Projects" title + close button; shadcn `Tabs` with "My Projects" / "Shared" tabs showing empty placeholder state; full-width "New Project" button with `Plus` icon at bottom. `components/editor/editor-shell.tsx` — client component managing sidebar open/close state, composes `EditorNavbar` + `ProjectSidebar` + `<main>`. Dialog pattern ready for future use via existing shadcn `Dialog` component and color tokens in `globals.css`.
- `03-auth`: `ClerkProvider` wraps root layout with `dark` theme from `@clerk/ui/themes`; Clerk appearance variables overridden via CSS custom properties (no hardcoded colors). `proxy.ts` at project root protects all routes except sign-in/sign-up (paths read from env vars). `/` redirects authenticated users to `/editor` and unauthenticated users to `/sign-in`. Sign-in and sign-up pages use a two-panel layout on large screens (left: logo + tagline + feature list; right: Clerk form) and form-only on small screens — no gradients, no hero sections. `UserButton` added to editor navbar right section. `/editor` page route created using `EditorShell`.
- `05-prisma`: `prisma/models/project.prisma` — `Project` (ownerId, name, description?, status enum DRAFT/ARCHIVED, canvasJsonPath?, timestamps, indexes on ownerId and createdAt) and `ProjectCollaborator` (projectId with cascade delete, email, createdAt, unique on projectId/email, indexes on email and projectId/createdAt). `lib/prisma.ts` — cached singleton; branches on `DATABASE_URL` prefix: `prisma+postgres://` uses `{ accelerateUrl }`, otherwise uses `@prisma/adapter-pg` via `{ adapter: new PrismaPg({ connectionString }) }`. Generated client at `app/generated/prisma/`. Migration `20260616051745_add_project_models` applied. `npm run build` passes.

- `06-project-apis`: `app/api/projects/route.ts` — `GET` lists the authenticated user's projects ordered by `createdAt` desc; `POST` creates a project with `ownerId` set to the Clerk user ID, defaulting `name` to `"Untitled Project"`. `app/api/projects/[projectId]/route.ts` — `PATCH` renames a project (requires non-empty `name`); `DELETE` deletes a project; both enforce owner-only access returning `403` for non-owners and `401` for unauthenticated requests. `npm run build` passes.

- `04-project-dialogs`: editor home screen (`components/editor/editor-home.tsx`), three dialogs (`components/editor/project-dialogs.tsx`), hook (`hooks/use-project-dialogs.ts`) with dialog/form/loading state and mock data; sidebar updated with project items and rename/delete actions for owned projects, mobile backdrop scrim; all wired through `editor-shell.tsx`.

- `07-wire-editor-home`: `lib/projects.ts` — server-side `getOwnedProjects` and `getSharedProjects` helpers using Prisma + Clerk auth; `ProjectData` interface (`{ id, name }`). `hooks/use-project-actions.ts` — replaced mock hook with real mutations: create (POST → navigate to `/editor/[id]`), rename (PATCH → refresh), delete (DELETE → redirect if active, else refresh); generates slug+suffix room ID preview. `app/editor/page.tsx` — now an async server component that fetches both project lists and passes them to `EditorShell`. `editor-shell.tsx` accepts `ownedProjects`/`sharedProjects` props and uses `useProjectActions`. `project-sidebar.tsx` — removed mock data imports, reads real project lists from props. `project-dialogs.tsx` — wired `onConfirm`/`isLoading` to all three dialogs; create dialog shows room ID preview; rename pre-fills name; delete shows project name; loading states disable inputs and buttons. `npm run build` passes.

## In Progress



## Next Up

- `08-editor-workspace-shell`: `lib/project-access.ts` — `getCurrentIdentity` (userId + primary email via Clerk) and `getProjectAccess` (checks owner or collaborator). `components/editor/access-denied.tsx` — centered lock icon + message + link back to `/editor`. `components/editor/project-sidebar.tsx` — added optional `activeProjectId` prop; active item highlighted with left accent border. `components/editor/workspace-navbar.tsx` — fixed top navbar showing project name (centered), sidebar toggle (left), Share button + AI sidebar toggle (right). `components/editor/workspace-shell.tsx` — client shell managing sidebar/AI-sidebar state, composes `WorkspaceNavbar`, `ProjectSidebar`, canvas placeholder, AI sidebar placeholder, and project dialogs. `app/editor/[roomId]/page.tsx` — async server component: redirects unauthenticated users to `/sign-in`, shows `AccessDenied` for missing or unauthorized projects, renders `WorkspaceShell` with project context and project lists. `npm run build` passes.

- `09-share-dialog`: `app/api/projects/[projectId]/collaborators/route.ts` — `GET` lists collaborators (accessible to owner or collaborator), enriches emails with Clerk display name + avatar via `getUserList`; `POST` invites a collaborator by email (owner only, returns 409 if already present); `DELETE` removes a collaborator by email (owner only). `components/editor/share-dialog.tsx` — client dialog: owner view shows email invite form + collaborator list with per-row remove buttons; collaborator view shows read-only list; all rows show Clerk avatar/name with email fallback; copy-link button with 2-second "Copied!" feedback. `workspace-navbar.tsx` — Share button enabled with `onShareClick` prop. `workspace-shell.tsx` — accepts `isOwner` prop, manages `isShareOpen` state, wires `ShareDialog`. `app/editor/[roomId]/page.tsx` — derives `isOwner` from `project.ownerId === userId` and passes to `WorkspaceShell`. `npm run build` passes.

- `10-liveblocks-setup`: `liveblocks.config.ts` — defines `Presence` (`cursor: { x: number; y: number } | null`, `isThinking: boolean`) and `UserMeta` (`id`, `info.name`, `info.avatar`, `info.color`). `lib/liveblocks.ts` — cached singleton `LiveblocksClient` wrapping the Liveblocks REST API (`/v2/rooms` and `/v2/rooms/{id}/authorize`); `getCursorColor(userId)` deterministically maps a user ID to one of 10 fixed hex colors via djb2-style hash. `app/api/liveblocks-auth/route.ts` — `POST` requires Clerk auth, extracts `room` from request body, verifies project access via `getProjectAccess`, fetches Clerk user info (name, avatar), generates cursor color, calls `ensureRoom` (ignores 409), issues a session token, returns `{ token }`; returns `403` for unauthorized access. `npm run build` passes.

- `11-base-canvas`: `types/canvas.ts` — `NodeData` interface (`label`, `color`, `shape`); `CanvasNode` and `CanvasEdge` typed aliases; `NODE_COLORS` (8 fill/text pairs) and `NODE_SHAPES` (6 shape names). `components/editor/canvas-wrapper.tsx` — client component; `LiveblocksProvider` with `/api/liveblocks-auth`; `RoomProvider` with room ID and initial presence `{ cursor: null, isThinking: false }`; `ClientSideSuspense` with spinner loading state; `ErrorBoundaryCanvas` class component as error fallback. `components/editor/canvas.tsx` — client component; `useLiveblocksFlow<CanvasNode, CanvasEdge>({ suspense: true })`; `ReactFlow` with synced nodes/edges and change handlers, `ConnectionMode.Loose`, `fitView`, `colorMode="dark"`; `Background` with dot variant (gap 24, size 1); `MiniMap` with dark styling. `workspace-shell.tsx` — canvas placeholder replaced with `<CanvasWrapper roomId={projectId}><Canvas /></CanvasWrapper>`. `npm run build` passes.

- `12-shape-panel`: `components/editor/canvas-node.tsx` — custom `canvasNode` renderer: simple bordered rectangle, 4 connection handles (top/right/bottom/left), centered label, fill/text color derived from `NODE_COLORS`. `components/editor/shape-panel.tsx` — floating pill toolbar (absolute, bottom-center, z-10) with draggable buttons for rectangle, diamond, circle, pill, cylinder, hexagon; drag payload `application/ghost-shape` JSON `{ shape, width, height }` with sensible defaults. `canvas.tsx` — registers `canvasNode` in `nodeTypes`; captures `ReactFlowInstance` via `onInit`; adds `onDragOver`/`onDrop` handlers on wrapper div; on drop parses payload, converts screen position to canvas coordinates with `rfInstance.screenToFlowPosition`, generates ID as `${shape}-${Date.now()}-${counter}`, creates node with empty label and default color, pushes via `onNodesChange([{ type: "add", item }])`; renders `<ShapePanel />`. `npm run build` passes.

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
