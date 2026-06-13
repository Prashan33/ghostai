# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Phase 1: Design System & UI Primitives

## Current Goal

- Define the next feature to implement.

## Completed

- `01-design-system`: shadcn/ui initialized for Tailwind v4; Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea added to `components/ui/`; `lucide-react` installed; `lib/utils.ts` with `cn()` created; `globals.css` configured with full dark theme CSS variables and project design tokens; `layout.tsx` applies `dark` class to `<html>`.

## In Progress

- None yet.

## Next Up

- Add the next planned feature unit here.

## Open Questions

- Add unresolved product or implementation questions here.

## Architecture Decisions

- Dark-only theme: all shadcn semantic tokens (`--background`, `--foreground`, etc.) are mapped to the project's dark palette in `:root`. The `dark` class is always applied on `<html>` so `dark:` Tailwind variants work.
- Project color tokens (`--bg-base`, `--text-primary`, etc.) are defined in `:root` and registered in `@theme inline` as `--color-base`, `--color-copy-primary`, etc., creating utility classes `bg-base`, `text-copy-primary`, `border-surface-border`, `text-brand`, `bg-accent-dim`, etc.

## Session Notes

- Project uses Next.js 16.2.7, React 19, Tailwind v4 (CSS-first, no tailwind.config.js), TypeScript strict mode.
- `@/*` path alias resolves to project root.
- Do not modify files in `components/ui/` — managed by shadcn CLI.
