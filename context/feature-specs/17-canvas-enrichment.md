Expand the collaborative canvas with richer node types, icon-annotated nodes, sticky-note and text block primitives, and inline comment threads — giving users a much more expressive diagramming toolkit without changing the existing node/edge rendering pipeline.

## Implementation

### 1. Extend `types/canvas.ts`

Add new node variant types alongside the existing `canvasNode`:

```ts
// New node variant types
export type CanvasNodeType =
  | "canvasNode"       // existing shape node
  | "stickyNote"       // free-form sticky note / comment
  | "textBlock"        // annotation text, no border
  | "iconNode"         // service icon + label

// Extended CanvasNodeData (add optional fields; existing fields stay)
export interface CanvasNodeData extends Record<string, unknown> {
  label: string
  color?: string          // existing
  shape?: NodeShape       // existing

  // sticky / text
  fontSize?: "sm" | "md" | "lg" | "xl"
  textAlign?: "left" | "center" | "right"
  bold?: boolean
  italic?: boolean

  // icon node
  iconId?: string         // key into CANVAS_ICONS registry

  // comment / annotation
  commentText?: string    // body of comment thread
  commentAuthor?: string  // display name of author
  commentResolved?: boolean
}
```

Add `CANVAS_ICONS` registry in `types/canvas.ts`:

```ts
// Each entry maps a string ID to a display label and an inline SVG path (24×24 viewBox)
export interface CanvasIconDef {
  id: string
  label: string
  category: "cloud" | "database" | "network" | "compute" | "devops" | "messaging" | "security" | "client"
  // SVG path(s) data string rendered at 24x24 — use simple geometric SVG only
  svgContent: string
}

export const CANVAS_ICONS: CanvasIconDef[] = [ ... ]
// Include at least 30 icons covering:
// Cloud providers: AWS (Lambda, S3, EC2, RDS, SQS, SNS, CloudFront, ELB)
// GCP: Cloud Run, BigQuery, Pub/Sub, Cloud Storage
// Azure: Functions, Cosmos DB, Event Hub, Blob Storage
// Generic: PostgreSQL, Redis, MongoDB, Kafka, RabbitMQ,
//           Nginx, Docker, Kubernetes, GitHub, Terraform,
//           Browser/Client, Mobile, REST API, GraphQL, gRPC
```

Add `NODE_FONT_SIZES` constant for sticky/text fontSize choices.

---

### 2. New node component: `StickyNoteNode` in `components/editor/canvas.tsx`

Sticky note characteristics:
- Renders as a rounded rectangle with a soft, saturated fill (yellow, green, blue, pink, orange — mapped from the `color` field using a separate `STICKY_COLORS` palette distinct from the architecture node palette)
- No SVG shape outline — just a plain `div` with `border-radius` and a subtle drop shadow
- Inline multi-line text editing: double-click activates a `<textarea>` (not `<input>`) so the note wraps naturally; blur or `Ctrl+Enter` saves
- Font size controlled by `data.fontSize` (`text-xs`, `text-sm`, `text-base`, `text-lg`)
- Text align controlled by `data.textAlign`
- Bold / italic toggles available in the node toolbar
- `NodeResizer` enabled (min 120×80)
- Connection handles hidden by default (sticky notes can connect to other nodes but handles appear only on hover)
- Toolbar shows: color palette (5 sticky colors), font-size picker (S/M/L/XL), bold, italic, text-align, duplicate, delete

Register as `stickyNote` in `nodeTypes`.

---

### 3. New node component: `TextBlockNode` in `components/editor/canvas.tsx`

Text block characteristics:
- Transparent background, no border, no fill — pure floating text annotation
- Inline editing via `<textarea>` on double-click
- Supports `fontSize` (sm/md/lg/xl) and `textAlign` (left/center/right) via `data`
- `bold` and `italic` toggles
- Color maps to `text-copy-primary`, `text-copy-secondary`, `text-brand`, `text-brand-ai-text`, or `text-copy-muted` — selectable from a small set of text-color swatches in the toolbar
- No `NodeResizer` min constraints — free resize
- No connection handles
- No background fill — entirely transparent
- Toolbar: font-size, text-align, bold, italic, text-color, duplicate, delete

Register as `textBlock` in `nodeTypes`.

---

### 4. New node component: `IconNode` in `components/editor/canvas.tsx`

Icon node characteristics:
- Renders a large service icon (SVG from `CANVAS_ICONS` by `data.iconId`) centered in the node
- Label displayed below the icon in small mono text
- Background uses the same `NODE_COLORS` palette as regular shape nodes
- Shape is always `rectangle` with a fixed aspect ratio (square preferred, min 80×80)
- `NodeResizer` enabled (min 80×80, max 200×200)
- Toolbar: icon picker (opens inline icon picker panel), color palette, duplicate, delete
- An **icon picker panel** renders as a floating popover (inside `NodeToolbar`) showing icons grouped by category in a scrollable grid; clicking one updates `data.iconId`

Register as `iconNode` in `nodeTypes`.

---

### 5. Shape panel additions in `components/editor/canvas.tsx`

Extend the existing `ShapePanel` bottom toolbar:

- Add a **divider** after the existing 6 shape icons
- Add three new drag targets:
  - **Sticky Note** — represented by a square with a dog-ear corner icon
  - **Text** — represented by a capital "T" typography icon
  - **Icon Node** — represented by a grid/puzzle icon
- When dragged onto the canvas, each creates a node with the corresponding `type` field set (`stickyNote`, `textBlock`, `iconNode`)
- `textBlock` nodes drop with `width: 200, height: 60`; `stickyNote` with `width: 180, height: 120`; `iconNode` with `width: 100, height: 100`

---

### 6. Canvas comment threads (`commentNode` as a specialized `stickyNote`)

Add a **comment mode** that users can trigger from the navbar:

- Add a `CommentModeButton` to the editor navbar (speech-bubble icon, toggles comment mode on/off)
- When comment mode is active, clicking anywhere on the canvas drops a `stickyNote` node pre-populated with:
  - `data.commentText = ""` (opens in edit mode immediately)
  - `data.commentAuthor = currentUser.name`
  - `data.commentResolved = false`
  - A distinct visual badge showing the author avatar initials in the top-right corner of the note
- Comment nodes display a small resolve button (✓) in the node toolbar; pressing it sets `commentResolved = true` and visually dims the note
- Comment nodes can be connected to other nodes with edges to point at the thing being discussed

State:
- `isCommentMode: boolean` in `EditorWorkspaceContent`
- Passed into `Canvas` and `CollaborativeCanvas` via props
- When comment mode is active, the `onPaneClick` React Flow handler drops a new sticky note at the clicked flow coordinate

---

### 7. Contextual right-click context menu

Add a canvas context menu that appears on right-click:

- Create `components/editor/canvas-context-menu.tsx`
- Menu items:
  - **Paste** (if clipboard has nodes) — `Ctrl+V` equivalent
  - **Select All**
  - **Fit View**
  - **Add Sticky Note** — drops a sticky note at the right-click position
  - **Add Text Block** — drops a text block at the right-click position
  - **Zoom In / Zoom Out**
  - **Copy Canvas Link** (copies `window.location.href`)
- Menu appears at the cursor position as a floating `div` with `z-50`
- Closes on any click outside or on `Escape`
- Use the `onPaneContextMenu` React Flow prop to capture the event and position the menu
- Do not intercept right-click on nodes or edges — only fire on empty canvas pane clicks

---

### 8. Node quick-add via click-to-connect

When the user hovers over a connection handle on an existing node, show a **ghost "+" badge** at the end of a preview edge:

- On handle hover, show a translucent preview edge extending outward with a `+` circle at the end
- Clicking the `+` badge drops a new default `canvasNode` at that position and immediately draws an edge from the source handle to the new node
- This accelerates diagram building without requiring drag-from-shape-panel for every new node
- Implement via React Flow's `onConnectStart` / `onConnectEnd` events: if `onConnectEnd` fires without a valid target, create a new node at the drop position and connect it

This is sometimes called "connection-drop-to-create". Wire it inside `CollaborativeCanvas`.

---

### 9. Update `types/canvas.ts` `CanvasNode` type

The `CanvasNode` union must now cover all four node type strings:

```ts
export type CanvasNode =
  | Node<CanvasNodeData, "canvasNode">
  | Node<CanvasNodeData, "stickyNote">
  | Node<CanvasNodeData, "textBlock">
  | Node<CanvasNodeData, "iconNode">
```

Update the `nodeTypes` registry in `canvas.tsx` to register all four:

```ts
const nodeTypes = {
  canvasNode: CanvasNodeComponent,
  stickyNote: StickyNoteNode,
  textBlock: TextBlockNode,
  iconNode: IconNode,
}
```

All four types must share the same `CanvasNodeData` interface so existing Liveblocks sync config, template data, and mutation helpers work unchanged.

---

### 10. Update `starter-templates.ts`

Add at least 2 templates that showcase the new node types:
- One template using `iconNode` nodes (e.g., a cloud-provider architecture with AWS/GCP service icons)
- One template using `stickyNote` nodes as annotations alongside shape nodes

---

## Scope Limits

- Do not add real-time threaded comment replies — just single-note annotations for now
- Do not add comment notifications or email delivery
- Do not add a separate comment panel or inbox UI
- Do not change edge rendering, edge types, or edge data schemas
- Do not change the existing `canvasNode` rendering — `StickyNoteNode`, `TextBlockNode`, and `IconNode` are additive
- Do not add user-defined custom icons or icon uploads
- Do not add rich-text formatting (markdown, bold via syntax) — only the toggle buttons
- Icon SVGs must be self-contained inline data strings — no external image fetches

---

## File Checklist

| File | Action |
|------|--------|
| `types/canvas.ts` | Extend `CanvasNodeData`, add `CANVAS_ICONS`, update `CanvasNode` union |
| `components/editor/canvas.tsx` | Add `StickyNoteNode`, `TextBlockNode`, `IconNode`; extend `ShapePanel`; add comment mode click handler; add connection-drop-to-create; register new `nodeTypes`; accept `isCommentMode` prop |
| `components/editor/canvas-context-menu.tsx` | New right-click context menu component |
| `components/editor/editor-navbar.tsx` | Add comment mode toggle button |
| `app/editor/editor-workspace.tsx` | Pass `isCommentMode` state through to `Canvas` |
| `components/editor/starter-templates.ts` | Add 2 new templates using the new node types |

---

## Check When Done

- `stickyNote`, `textBlock`, and `iconNode` nodes can be dragged from the shape panel onto the canvas.
- Sticky notes support multi-line inline editing, color selection, and font controls from the toolbar.
- Text blocks render as transparent floating annotations with font and alignment controls.
- Icon nodes display a service icon chosen from the picker inside the node toolbar.
- Right-clicking empty canvas space opens the context menu with the listed actions.
- Clicking a canvas handle and releasing on empty space creates a new connected node.
- Comment mode button in the navbar is visible when a project is open; clicking the canvas drops a sticky note in comment mode.
- All four node types share the same `CanvasNodeData` interface and sync correctly through Liveblocks.
- Existing `canvasNode` rendering and behavior is unchanged.
- `npm run build` passes with no type errors.
