# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Phase 3: AI Orchestration & Generation

## Current Goal

- Implement natural language prompt-to-graph AI generation and specification builder.

## Completed

- `[x]` Design System & Primitive Components (Tailwind v4 integration, shadcn/ui primitives, theme mappings)
- `[x]` Base Chrome Editor Components (Navbar & Project Sidebar with sliding transitions, tabs layout, and premium dark placeholder states)
- `[x]` Authentication Integration (Clerk integration, proxy.ts route protection, custom sign-in/up views, user button in editor navbar)
- `[x]` Project Dialogs (Create Project with live slug/autofocus/loading states, Rename Project, Delete Project, and Sidebar actions rename/delete for owned projects)
- `[x]` SaaS Copywriting & Design Refinement (Refactored project to workspace terminology, aligned tags/taglines/descriptions, improved empty states, and redesigned global error view)
- `[x]` Database Schema & Prisma Client Singleton (Model definitions, prisma.config.ts, lib/prisma.ts, migration runs)
- `[x]` Project REST API Routes (GET /api/projects, POST /api/projects, PATCH /api/projects/[projectId], DELETE /api/projects/[projectId])
- `[x]` Editor Home Integration & Project Mutations Hook (Server-side project fetching, hooks/use-project-actions.ts custom mutation hook, alignment of project ID and Liveblocks room ID, dynamic router refreshing)
- `[x]` Editor Workspace Shell (Server-side access checks, dynamic route parameter synchronization, collapsible AI copilot side panel, and sharing button)
- `[x]` Share Collaboration Dialog (Invite/remove collaborators by email, enrich display names/avatars via Clerk Backend API)
- `[x]` Liveblocks Setup (Configuring liveblocks.config.ts, caching lib/liveblocks-client.ts client, and creating /api/liveblocks-auth route)
- `[x]` Base Canvas (React Flow wrapper with LiveblocksProvider, RoomProvider, ClientSideSuspense, error fallback, useLiveblocksFlow, types/canvas.ts)
- `[x]` Shape Panel (Bottom toolbar, shape drag-and-drop to canvas, useReactFlow coordinate conversion, custom canvasNode component rendering shapes as bordered rectangles)
- `[x]` Collaborative Node Customization & Controls (Feature 13: Nodes Color Toolbar floating toolbar with 8-color swatches, shape mutations, duplications, and deletions)
- `[x]` Collaborative Edge Customization & Adjustments (Feature 14: customCanvasEdge renderer with draggable control points, Directed/Undirected toggles, and inline labels)
- `[x]` Canvas Ergonomics (Feature 15: keyboard shortcuts hook for canvas zoom and Liveblocks collaborative history actions, input focus isolation, and float controls overlay integration)
- `[x]` Starter Template Library (Feature 16: `CanvasTemplate` type, 8 pre-built templates across architecture/devops/flowchart/org-chart/mind-map categories, lightweight SVG mini-preview modal with category badges, navbar `LayoutTemplate` button, and canvas `importTemplate` action that clears and replaces canvas content then fits the view)
- `[x]` Canvas Enrichment (Feature 17: Sticky Notes, Text Blocks, and Icon Nodes with category-based popover picker, canvas context menu, connection-drop-to-create node spawning, navbar comment mode, and 2 new templates)
- `[x]` UI/UX Polish Fixes (Closed-by-default floating AI sidebar, responsive overlays preventing controls/minimap collisions, and one-shot auto-disabling comment mode)
- `[x]` Collaborative Presence (Feature 18: Live cursors overlay tracking other participants relative to zoom/pan transforms, and floating avatars stack + Clerk UserButton group in canvas)
- `[x]` AI Sidebar Shell (Feature 19: Dedicated floating overlay panel with AI Architect chat and Specs markdown generator card preview)
- `[x]` Canvas Autosave (Feature 20: Persistent storage of collaborative canvas state to Vercel Blob and load empty-room guard)
- `[x]` Design Agent API Setup (Feature 21: Added Prisma model TaskRun, created minimal design task trigger/design-agent.ts, created POST /api/ai/design to trigger background task, created POST /api/ai/design/token to generate scoped public read tokens)
- `[x]` Design Agent Logic (Feature 22: Added full AI design agent backend execution using Gemini 2.5 and Liveblocks room storage mutations; animated cursor and thinking status presence broadcasts; integrated realtime useRealtimeRun hooks in the AI sidebar to stream progress status and explanation logs)
- `[x]` System Improvement & Design Agent Overhaul (Overhauled `trigger/design-agent.ts` with gemini-2.5-pro, system/prompt split, few-shot examples, minimum actions rules, validation, sequential animation, cursor centroid tracking; added generation cancel route /api/ai/design/cancel, sessionStorage persistence; fixed storage type safety; split canvas.tsx into 7 sub-components)


## In Progress

- None.

## Next Up

- AI Architecture Generation (natural language prompt to canvas nodes and edges, background worker tasks)
- Technical Spec Generation (convert final graph to persistent Markdown document)

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

- **Route-Based Project State Synchronization**: Synced the client-side active workspace state directly with dynamic route transitions (`/editor/[roomId]`). Instead of modifying local component states on project activation/deactivation, actions invoke `router.push('/editor/[roomId]')` and `router.push('/editor')` transitions. This maintains URL bookmarkability and enables multiplayer page links.

- **Dynamic Page Parameter Awaiting in Next.js 16**: In compliance with Next.js 16's asynchronous layout constraints, dynamic params are typed as `Promise<{ roomId: string }>` in `/editor/[roomId]/page.tsx` and resolved asynchronously using `await params` before checking project access.

- **Clerk Backend User Profile Enrichment**: Implemented batch lookup helper queries using the Clerk Backend SDK (`clerkClient.users.getUserList`) to dynamically resolve full names and custom profile image URLs for collaborator accounts matching project access emails.

- **Collaborator Read-Only Access Gating**: Enforced security checks at both API routing endpoints and React UI trees. Users listed as collaborators (not owners) are shown a read-only list of workspace users, the delete and invite fields are hidden/disabled, and POST/DELETE actions are blocked server-side (returning a `403 Forbidden` response).

- **Dynamic Edge Markers Fallback Renderer**: Configured `defaultEdgeOptions` in React Flow to set the `MarkerType.ArrowClosed` shape on newly created edges. Refactored `CustomCanvasEdge` to dynamically compute `resolvedMarkerEnd` based on `isDirected` (`data.directed !== false`) and `selected` properties, rendering a customized arrow (colored matching selection highlights: `var(--accent-primary)` if selected, `var(--border-default)` if not) and resolving to `undefined` when undirected, resolving the directed toggle visually.

- **Reconstructing Cloned Nodes from Persisted State (Duplication)**: Refactored the node duplication logic (`duplicateNode`) to explicitly build the cloned node using only stable persisted properties (`id`, `type`, `position`, `data`, `width`, `height`) instead of copying the whole runtime node with a spread (`...targetNode`). This prevents React Flow transient client states (like `resizing`, `measured`, `dragging`) from being duplicated. The clone is set to `selected: true` (and other nodes are deselected) to smoothly transfer selection focus.

- **Opting Out of Drag/Pan and Bubble Control in Inline Inputs**: Appended event propagation blocking (`event.stopPropagation()`) and React Flow drag/pan opt-out attributes (`data-nodrag`, `data-nopan`, class `nodrag nopan`) on the text input inside `CanvasNodeComponent` so that placing the cursor, highlighting text, or typing in the inline label editor does not trigger node movement or canvas panning.

- **History & Zoom controls Floating Overlay**: Created a modular controls component overlay (`CanvasControls`) incorporating Liveblocks' `useUndo`, `useRedo`, `useCanUndo`, and `useCanRedo` hooks for collaborative history rollback/forward, alongside viewport scaling functions (`zoomIn`, `zoomOut`, `zoomTo`, `fitView`). Fully optimized for accessibility using descriptive `aria-label` fields.

- **Stateless Auth Latency Speedup via Clerk JWT Session Claims**: Refactored the `/api/liveblocks-auth` route to read user profile fields (`email`, `firstName`, `lastName`, `imageUrl`) directly from Clerk's `sessionClaims` JWT payload instead of calling the slow `currentUser()` API. This runs as a completely local JWT decryption taking `< 1ms` with no Clerk network calls. We also cache verified rooms in memory (`verifiedRooms`) to skip redundant `liveblocks.getOrCreateRoom()` calls, and pre-create the Liveblocks room in `POST /api/projects` to make connection times instantaneous (<10ms).

- **In-Memory Clipboard & Cursor-Relative Paste Positioning**: Added support for complete clipboard operations (`Ctrl+C`, `Ctrl+V`, `Ctrl+X`, `Ctrl+D`, `Delete`, `Backspace`) for canvas nodes. To ensure a premium UX, the paste operation tracks mouse movement to center the pasted elements directly under the user's cursor on the canvas, falling back to the viewport center. Preserves relative node spacing during multi-node paste, and isolates keyboard event triggers from active text inputs to avoid interference.

- **Vercel Blob Path Convention for Canvas Snapshots**: Standardized path naming as `canvas/${projectId}.json` using `allowOverwrite: true` to avoid accumulating multiple versioned blob objects per project and minimize Vercel storage usage.

- **Collaborator Write Access on Canvas Snapshots**: Configured the canvas snapshot PUT API route to permit writes from both the workspace owner and any authenticated collaborator, as the design canvas is a multi-user workspace.

- **Empty-Room Canvas Hydration Guard**: Designed an empty-room guard inside the collaborative canvas. On mount, if the Liveblocks room is empty (`nodes` and `edges` lengths are 0), it triggers a GET request to restore the Vercel Blob canvas snapshot into the room's Liveblocks storage using `useMutation`. A `didAttemptLoad` ref prevents double execution under React StrictMode double invocation, and the autosave hook remains disabled during the loading phase to avoid loopback saves.

- **Resilient SPA Hook and Tab Exit Persistence (Autosave)**: Implemented tab-unload persistence using `beforeunload` listener with a `keepalive: true` fetch, coupled with an SPA component unmount cleanup flush. This ensures last-tick user edits are captured during both page reloads and internal client-side router transitions.

- **Background Task Run Tracking & Scoped Tokens**: Implemented the `TaskRun` database tracking model to verify and protect background job runs. Real-time updates are enabled securely by generating run-scoped public access tokens (`auth.createPublicToken`) that restrict client-side token consumption only to the specific execution run and task ID.

- **Node DNS Resolution Order for Trigger.dev Task Worker**: Configured `dns.setDefaultResultOrder("ipv4first")` at the entry point of the background task file (`trigger/design-agent.ts`) to force the local worker process (which runs child/worker processes under Windows/Node/Undici global fetch context) to prioritize IPv4 DNS resolutions. This resolves the recurring `TypeError: fetch failed` network resolution issues with Liveblocks and external API hosts.



