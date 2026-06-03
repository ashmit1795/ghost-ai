# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Phase 2: Collaborative Editor (Base Chrome)

## Current Goal

- Implement shared collaborative workspace canvas using React Flow & Liveblocks.

## Completed

- `[x]` Design System & Primitive Components (Tailwind v4 integration, shadcn/ui primitives, theme mappings)
- `[x]` Base Chrome Editor Components (Navbar & Project Sidebar with sliding transitions, tabs layout, and premium dark placeholder states)
- `[x]` Authentication Integration (Clerk integration, proxy.ts route protection, custom sign-in/up views, user button in editor navbar)

## In Progress

- None yet.

## Next Up

- Canvas Integration with React Flow & Liveblocks

## Open Questions

- None.

## Architecture Decisions

- **Client Component Boundaries**: Explicitly marked foundation elements (`components/ui/button.tsx`, `components/ui/input.tsx`) as `"use client"` since their library implementations rely on React hooks, preventing prerendering errors in standard Next.js Server Components.

- **Next.js 16 proxy.ts Convention**: Implemented `proxy.ts` at the project root instead of `middleware.ts` for route protection to comply with Next.js 16's deprecation and renaming of Edge/routing middleware.

- **Clerk v7 Theme & Variable Mapping**: Overrode Clerk's prebuilt `dark` theme appearance variables directly with CSS custom properties (`var(--accent-primary)`, `var(--bg-surface)`, etc.) using the v7 `theme` (instead of `baseTheme`) property. Omitted unsupported properties like `colorInputBorder` since global borders are controlled by `colorBorder`.

- **NODE_ENV Environment Variable & build Script**: Note that the local environment has `NODE_ENV` globally configured to `development` which triggers React 19 / Next 16 prerendering and hook context errors during builds. Production compilation of `package.json` scripts must ensure `NODE_ENV` resolves to `production`. Recommend using `cross-env` for a unified cross-platform execution, or run using shell-specific commands:
  - **Cross-Platform / cross-env**: `npx cross-env NODE_ENV=production npm run build`
  - **POSIX (Linux/macOS)**: `NODE_ENV=production npm run build`
  - **Windows Command Prompt (cmd)**: `set NODE_ENV=production && npm run build`
  - **Windows PowerShell**: `$env:NODE_ENV="production"; npm run build`

- **Proxy-Layer Root Route Redirection**: Moved the root-level (`/`) redirection logic out of the server component (`app/page.tsx`) and directly into the proxy middleware (`proxy.ts`). Intercepting `/` requests early at the proxy layer and returning an HTTP 307 redirect (to `/editor` if authenticated, or `/sign-in` if unauthenticated) prevents React 19 / Next 16 rendering and router loops during sign-out. The browser receives a direct HTTP redirect prior to page execution, resulting in an instantaneous and reliable redirection.


