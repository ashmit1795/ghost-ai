# Feature 20 — Canvas Autosave (Vercel Blob + Prisma)

Persist the collaborative canvas state to Vercel Blob so the canvas survives
outside Liveblocks (billing limits, plan changes, data ownership) and can be
loaded by AI generation tasks that need the current graph as input.

The storage split is already defined in `architecture-context.md`:
- **Prisma** stores project metadata and the reference URL (`canvasJsonPath`).
- **Vercel Blob** stores the actual canvas JSON at `canvas/{projectId}.json`.

---

## Prerequisites

### 1. Check / install `@vercel/blob`

Before writing any code, check whether `@vercel/blob` is already listed in
`package.json`. If it is not, install it:

```bash
npm install @vercel/blob
```

### 2. Schema field — no migration required

The `Project` model in `prisma/models/project.prisma` already has:

```prisma
canvasJsonPath String?
```

This field holds the Vercel Blob URL of the saved canvas snapshot. **Do not
add a new field.** Do not run a new migration.

---

## Implementation Steps

### Step 1 — PUT `/api/projects/[projectId]/canvas`

Create `app/api/projects/[projectId]/canvas/route.ts`.

**Purpose:** Receive the canvas JSON payload from the autosave hook, upload it
to Vercel Blob, and store the returned URL on the project record.

**Access control:** Both the project **owner AND collaborators** can save. The
canvas is collaborative — any participant in the room can move nodes or create
edges, so write access must not be restricted to the owner. Use the existing
`verifyProjectAccess` helper (or replicate its logic: owner OR listed
collaborator by email). Return `403` for any other user.

**Blob path:** Always write to `canvas/${projectId}.json` using
`allowOverwrite: true` (the `put` call from `@vercel/blob`). This replaces the
previous snapshot rather than accumulating blob versions.

**Route logic (in order):**

1. Authenticate with Clerk (`auth()`). Return `401` if unauthenticated.
2. Resolve `projectId` from route params (`await params`).
3. Load the project from Prisma. Return `404` if not found.
4. Verify the caller is the owner OR a collaborator (check
   `project.ownerId === userId` OR `ProjectCollaborator` record with matching
   email). Return `403` otherwise.
5. Parse the request body as JSON. Expect shape `{ nodes: [...], edges: [...] }`.
   Return `400` if malformed or missing required keys.
6. Serialize the payload to a `Blob` / `Buffer`.
7. Call `put(`canvas/${projectId}.json`, buffer, { access: 'private',
   allowOverwrite: true, contentType: 'application/json' })`.
8. On success, `prisma.project.update` — set `canvasJsonPath` to the returned
   blob URL.
9. Return `200` with `{ url: blobUrl }`.

---

### Step 2 — GET `/api/projects/[projectId]/canvas`

Add a `GET` export to the same `canvas/route.ts` file.

**Purpose:** Return the saved canvas JSON for a project so the editor can
restore it into an empty Liveblocks room.

**Access control:** Same as above — owner OR collaborator. Return `403`
otherwise.

**Route logic (in order):**

1. Authenticate. Return `401` if unauthenticated.
2. Load the project from Prisma. Return `404` if not found.
3. Verify access. Return `403` if unauthorized.
4. If `project.canvasJsonPath` is `null`, return `200` with `{ canvas: null }`.
   (No snapshot saved yet — this is normal for new projects.)
5. `fetch(project.canvasJsonPath)` from Vercel Blob. If the fetch fails (blob
   deleted, network error), return `200` with `{ canvas: null }` — do not throw
   a 500 that would break the editor load.
6. Parse the blob response JSON. Return `200` with `{ canvas: <parsed JSON> }`.

---

### Step 3 — `hooks/useCanvasAutosave.ts`

Create `hooks/useCanvasAutosave.ts`. This is a client-side React hook consumed
by `CollaborativeCanvas`.

> **Note:** The project folder is `hooks/` (plural). Do not create a new
> `hook/` directory.

**Inputs (parameters):**
```ts
interface UseCanvasAutosaveOptions {
  projectId: string
  nodes: CanvasNode[]
  edges: CanvasEdge[]
  enabled?: boolean   // default true; pass false to pause saving during template import
}
```

**Outputs (returned object):**
```ts
interface UseCanvasAutosaveReturn {
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'
}
```

**Behaviour:**

1. **Debounce:** watch `nodes` and `edges` for changes. When they change, wait
   **2 500 ms** before triggering a save. This prevents excessive writes during
   active dragging, multi-node moves, or rapid edits. Reset the timer on every
   change.

2. **Save function:** POST the current nodes and edges to
   `PUT /api/projects/${projectId}/canvas` as JSON. Set `saveStatus` to
   `'saving'` before the fetch, `'saved'` on success, `'error'` on failure.

3. **`beforeunload` flush:** Register a `beforeunload` event listener that
   calls `navigator.sendBeacon(`/api/projects/${projectId}/canvas/beacon`,
   payload)` as a best-effort last-chance save when the tab is closed.
   Alternatively, use a synchronous `fetch` with `keepalive: true` inside the
   `beforeunload` handler if `sendBeacon` is unavailable. Clean up the listener
   in the hook's `useEffect` cleanup.

4. **Skip on mount:** Do not fire a save on the very first render — only after
   a genuine change. Use a `hasInitialized` ref that flips to `true` after the
   first effect cycle.

5. **Cleanup:** Cancel any pending debounce timer on unmount.

6. **Type imports:** Import `CanvasNode` and `CanvasEdge` from `@/types/canvas`.

---

### Step 4 — Wire the hook into `CollaborativeCanvas`

Inside `components/editor/canvas.tsx`, inside the `CollaborativeCanvas`
function (which already has access to `nodes`, `edges`, and `roomId` / the
project ID):

**4a — Load saved canvas on first open (empty-room guard)**

After `useLiveblocksFlow` resolves (the component is already inside
`<ClientSideSuspense>` so it is fully hydrated by the time it renders), add a
`useEffect` that fires once on mount:

```
1. Check if nodes.length === 0 && edges.length === 0.
2. If not empty — the Liveblocks room already has content. Skip loading.
   Set a ref `didAttemptLoad = true` and return.
3. If empty — fetch GET /api/projects/${projectId}/canvas.
4. If the response returns { canvas: null } — no snapshot exists yet. Skip.
5. If the response returns { canvas: { nodes, edges } } — use the existing
   `useMutation` to write those nodes and edges into Liveblocks storage.
   This populates the room so all future joins see the restored state.
6. Set `didAttemptLoad = true` so this effect never runs twice.
```

Use a `useRef<boolean>(false)` guard (`didAttemptLoad`) to ensure this load
only happens once per component mount, even under React StrictMode double
invocation.

**4b — Wire autosave hook**

Call `useCanvasAutosave({ projectId, nodes, edges })` inside
`CollaborativeCanvas`. The `projectId` prop is already available as `roomId`
(they are the same ID). No additional prop threading is needed.

---

### Step 5 — Save status indicator in the editor navbar

**Location:** `components/editor/editor-navbar.tsx`, to the left of the Share
button, in the right-hand action cluster.

**Design:**
- Show nothing (render `null`) when `saveStatus === 'idle'`.
- `'saving'` → small spinning `Loader2` icon + text `"Saving…"` in
  `text-copy-muted`, `text-[10px]`.
- `'saved'` → `Check` icon + text `"Saved"` in `text-copy-muted`,
  `text-[10px]`. Fade out after 3 seconds (use a `useEffect` + `setTimeout`
  that resets status back to `'idle'`).
- `'error'` → `AlertTriangle` icon + text `"Save failed"` in `text-error`,
  `text-[10px]`.

The status must be passed **down from `CollaborativeCanvas`** through a
callback prop or lifted into a shared state. The simplest approach: add an
`onSaveStatusChange: (status: SaveStatus) => void` prop to
`CollaborativeCanvasProps` and `CanvasWrapperProps`, then wire it up through
the existing prop chain in `editor-workspace.tsx` → `Canvas` →
`CollaborativeCanvas`.

---

## Storage Pattern Summary

```
Browser (CollaborativeCanvas)
  │── useLiveblocksFlow ──► Liveblocks (live collaboration, real-time sync)
  │── useCanvasAutosave ──► PUT /api/projects/[id]/canvas
                                │── @vercel/blob.put("canvas/{id}.json")
                                │── prisma.project.update({ canvasJsonPath })

Editor first load (empty room only):
  CollaborativeCanvas ──► GET /api/projects/[id]/canvas
                              │── prisma: read canvasJsonPath
                              │── fetch blob URL
                              └── inject nodes/edges into Liveblocks via useMutation
```

---

## Files to Create / Modify

| Action   | File |
| -------- | ---- |
| CREATE   | `app/api/projects/[projectId]/canvas/route.ts` |
| CREATE   | `hooks/useCanvasAutosave.ts` |
| MODIFY   | `components/editor/canvas.tsx` — load guard + autosave hook + onSaveStatusChange prop |
| MODIFY   | `components/editor/editor-navbar.tsx` — save status indicator |
| MODIFY   | `app/editor/editor-workspace.tsx` — thread onSaveStatusChange through prop chain |

---

## Acceptance Criteria

- [ ] `@vercel/blob` is listed in `package.json`.
- [ ] `PUT /api/projects/[projectId]/canvas` accepts owner and collaborator
      writes, uploads JSON to `canvas/{projectId}.json`, stores the blob URL in
      `canvasJsonPath`, and returns `{ url }`.
- [ ] `GET /api/projects/[projectId]/canvas` returns `{ canvas: null }` for
      projects with no snapshot, or the saved canvas JSON.
- [ ] `useCanvasAutosave` debounces saves by 2 500 ms, sets saveStatus
      correctly, and flushes on tab close.
- [ ] `CollaborativeCanvas` loads the saved snapshot into an empty Liveblocks
      room exactly once on mount and never overwrites a room that already has
      content.
- [ ] The navbar shows saving / saved / error states correctly and the "saved"
      indicator fades after 3 seconds.
- [ ] `npm run build` passes with zero TypeScript errors.