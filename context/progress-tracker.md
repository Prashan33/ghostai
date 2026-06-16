# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Phase 4: Project Dialogs — editor home screen and project CRUD dialogs

## Current Goal

- Editor home with New Project button; Create / Rename / Delete dialogs wired to sidebar and home; mock project data in sidebar with owned-only actions; mobile backdrop scrim.

## Completed

- `01-design-system`: shadcn/ui initialized for Tailwind v4; Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea added to `components/ui/`; `lucide-react` installed; `lib/utils.ts` with `cn()` created; `globals.css` configured with full dark theme CSS variables and project design tokens; `layout.tsx` applies `dark` class to `<html>`.
- `02-editor`: `components/editor/editor-navbar.tsx` — fixed-height top navbar (h-12, z-40) with sidebar toggle using `PanelLeftOpen`/`PanelLeftClose` icons; accepts `isSidebarOpen` and `onSidebarToggle` props. `components/editor/project-sidebar.tsx` — floating overlay sidebar (z-50, w-72) that slides in from left without pushing content; accepts `isOpen` and `onClose` props; header with "Projects" title + close button; shadcn `Tabs` with "My Projects" / "Shared" tabs showing empty placeholder state; full-width "New Project" button with `Plus` icon at bottom. `components/editor/editor-shell.tsx` — client component managing sidebar open/close state, composes `EditorNavbar` + `ProjectSidebar` + `<main>`. Dialog pattern ready for future use via existing shadcn `Dialog` component and color tokens in `globals.css`.
- `03-auth`: `ClerkProvider` wraps root layout with `dark` theme from `@clerk/ui/themes`; Clerk appearance variables overridden via CSS custom properties (no hardcoded colors). `proxy.ts` at project root protects all routes except sign-in/sign-up (paths read from env vars). `/` redirects authenticated users to `/editor` and unauthenticated users to `/sign-in`. Sign-in and sign-up pages use a two-panel layout on large screens (left: logo + tagline + feature list; right: Clerk form) and form-only on small screens — no gradients, no hero sections. `UserButton` added to editor navbar right section. `/editor` page route created using `EditorShell`.

## In Progress

- `04-project-dialogs`: editor home screen (`components/editor/editor-home.tsx`), three dialogs (`components/editor/project-dialogs.tsx`), hook (`hooks/use-project-dialogs.ts`) with dialog/form/loading state and mock data; sidebar updated with project items and rename/delete actions for owned projects, mobile backdrop scrim; all wired through `editor-shell.tsx`.

## Next Up

- Wire editor page content: canvas or placeholder for the actual writing surface.

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
