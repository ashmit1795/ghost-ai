# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Phase 2: Collaborative Editor (Base Chrome)

## Current Goal

- Implement Prisma ORM database models, client singleton, and run the initial migration.

## Completed

- `[x]` Design System & Primitive Components (Tailwind v4 integration, shadcn/ui primitives, theme mappings)
- `[x]` Base Chrome Editor Components (Navbar & Project Sidebar with sliding transitions, tabs layout, and premium dark placeholder states)
- `[x]` Authentication Integration (Clerk integration, proxy.ts route protection, custom sign-in/up views, user button in editor navbar)
- `[x]` Project Dialogs (Create Project with live slug/autofocus/loading states, Rename Project, Delete Project, and Sidebar actions rename/delete for owned projects)
- `[x]` SaaS Copywriting & Design Refinement (Refactored project to workspace terminology, aligned tags/taglines/descriptions, improved empty states, and redesigned global error view)
- `[x]` Database Schema & Prisma Client Singleton (Model definitions, prisma.config.ts, lib/prisma.ts, migration runs)
- `[x]` Project REST API Routes (GET /api/projects, POST /api/projects, PATCH /api/projects/[projectId], DELETE /api/projects/[projectId])
- `[x]` Editor Home Integration & Project Mutations Hook (Server-side project fetching, hooks/use-project-actions.ts custom mutation hook, alignment of project ID and Liveblocks room ID, dynamic router refreshing)

## In Progress

- None.

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

- **Theme Configuration Deduplication**: Extracted Clerk's custom appearance configurations into a shared, reusable `clerkAppearance` object in [clerk-theme.ts](/lib/clerk-theme.ts). This single theme object is imported and shared across the root `ClerkProvider` in [layout.tsx](/app/layout.tsx), `<UserButton>` in [editor-navbar.tsx](/components/editor/editor-navbar.tsx), and Clerk auth page screens (`app/sign-in` and `app/sign-up`) to ensure a perfectly synchronized dark theme layout.

- **API & Route Protection**: Configured `proxy.ts` to include `/(api|trpc)(.*)` in addition to `/editor(.*)` as protected paths. This guarantees that any future API endpoints are secure by default, while public routing to `/sign-in`, `/sign-up`, and `/` (which handles middleware-level auth checks and redirects) remains accessible.

- **Immutable URL Slugs & Room IDs**: Designed workspace URL identifiers/slugs as immutable database primary keys (`Project.id`) to preserve database relations (e.g. `ProjectCollaborator` records) and guarantee Liveblocks multiplayer room session continuity. In Rename workflows, only the workspace's human-readable name and description can be mutated. Updated the Rename Dialog UI to clarify this system invariant and display a static workspace slug identifier.

- **Cross-Boundary Utility Helpers**: Moved the core `generateSlug` helper from the client-only hook file to a pure TypeScript utility file (`lib/utils.ts`). This allows both Next.js Server Components (prerendering initial pages) and Client Components (generating temporary previews in forms) to share the same slug logic without breaking Next.js 16 Client-Server boundary import constraints.

- **Robust REST API Request Validation**: Enhanced the projects endpoints (`POST /api/projects` and `PATCH /api/projects/[projectId]`) to check JSON payload formats early using try/catch blocks and strict checks (`typeof body !== 'object' || body === null || Array.isArray(body)`). This ensures arrays and non-object values are rejected with `400 Bad Request` rather than causing internal database exceptions (resulting in 500 status codes).
