# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Phase 2: Editor Chrome — Navbar & Sidebar Shell

## Current Goal

- Wire `EditorNavbar` and `ProjectSidebar` into an editor page layout.

## Completed

- `01-design-system`: shadcn/ui initialized for Tailwind v4; Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea added to `components/ui/`; `lucide-react` installed; `lib/utils.ts` with `cn()` created; `globals.css` configured with full dark theme CSS variables and project design tokens; `layout.tsx` applies `dark` class to `<html>`.
- `02-editor`: `components/editor/editor-navbar.tsx` — fixed-height top navbar (h-12, z-40) with sidebar toggle using `PanelLeftOpen`/`PanelLeftClose` icons; accepts `isSidebarOpen` and `onSidebarToggle` props. `components/editor/project-sidebar.tsx` — floating overlay sidebar (z-50, w-72) that slides in from left without pushing content; accepts `isOpen` and `onClose` props; header with "Projects" title + close button; shadcn `Tabs` with "My Projects" / "Shared" tabs showing empty placeholder state; full-width "New Project" button with `Plus` icon at bottom. Dialog pattern ready for future use via existing shadcn `Dialog` component and color tokens in `globals.css`.

## In Progress

- None.

## Next Up

- Create an editor page route that composes `EditorNavbar` + `ProjectSidebar` with shared `isOpen` state.

## Open Questions

- Add unresolved product or implementation questions here.

## Architecture Decisions

- Dark-only theme: all shadcn semantic tokens (`--background`, `--foreground`, etc.) are mapped to the project's dark palette in `:root`. The `dark` class is always applied on `<html>` so `dark:` Tailwind variants work.
- Project color tokens (`--bg-base`, `--text-primary`, etc.) are defined in `:root` and registered in `@theme inline` as `--color-base`, `--color-copy-primary`, etc., creating utility classes `bg-base`, `text-copy-primary`, `border-surface-border`, `text-brand`, `bg-accent-dim`, etc.

## Session Notes

- Project uses Next.js 16.2.7, React 19, Tailwind v4 (CSS-first, no tailwind.config.js), TypeScript strict mode.
- `@/*` path alias resolves to project root.
- Do not modify files in `components/ui/` — managed by shadcn CLI.
