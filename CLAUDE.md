@AGENTS.md

# Imago Search App

## Stack

Next.js 16.2.2 (App Router) | TypeScript 5 (strict) | Tailwind CSS v4 | shadcn/ui (base-nova) | React 19 | Lucide icons

## Structure

- `app/` — Pages, layouts, `globals.css` (Tailwind v4 config + shadcn theme)
- `components/ui/` — shadcn components (managed by CLI, **do not edit**)
- `components/` — Custom components (wrap/compose shadcn primitives here)
- `lib/utils.ts` — `cn()` class merge utility
- `hooks/` — Custom React hooks
- Path alias: `@/*` maps to project root

## Rules

- Server Components by default — only add `"use client"` for state/effects/browser APIs
- No `any` — use `unknown` + narrowing
- Use `cn()` from `@/lib/utils` for conditional classes
- Add shadcn via CLI: `npx shadcn@latest add <component>` — never copy-paste
- Tailwind v4 config lives in CSS (`globals.css`), not `tailwind.config.ts`
- Dark mode: Do not implement dark mode now, but keep the structure to implement later.
- Named exports for components, no barrel files
- Validate at boundaries only — trust internal code
- Use `next/image`, `next/font`, `loading.tsx`, `error.tsx`
- Prefer Server Actions over API routes for mutations
- Always make sure to use existing components and enhance it for expandable like SOLID principle.

## Commands

```bash
bun dev                             # Dev server
bun run build                       # Build
bun lint                            # Lint
bunx shadcn@latest add <component>  # Add shadcn component
```
