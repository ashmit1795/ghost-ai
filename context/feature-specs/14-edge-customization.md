# Feature 14: Collaborative Edge Customization & Adjustments

Introduce a premium custom edge type (`customCanvasEdge`) and collaborative configuration controls. Users should be able to toggle arrowheads, adjust edge paths using interactive mouse handles, and edit inline edge labels.

## Implementation

### 1. Connection Handles & Default Connection Behavior
- Each node should expose connection handles on the Top, Right, Bottom, and Left sides.
- Handles should fade in smoothly upon node hover (small white dots with a subtle dark border) and be hidden at rest.
- Any handle can connect to any other handle.
- Newly created connections should automatically use the custom edge renderer (`customCanvasEdge`).

### 2. Edge Style & Toggle Options (Directed vs. Undirected)
- Implement a floating Edge Toolbar (rendered at the edge path's midpoint using `EdgeLabelRenderer` when selected) containing style options:
  - **Directed (Arrowed)**: Renders a smooth-step path ending with a styled arrowhead marker (`markerEnd`).
  - **Undirected (Simple)**: Renders a clean line with rounded stroke caps, omitting the arrowhead marker.
- Clicking the toggle updates the edge properties (`data.directed` or `markerEnd`) collaboratively in the Liveblocks Storage room.

### 3. Mouse-Adjustable Paths (Control Points)
- Enable users to adjust the routing path of an edge manually using the mouse.
- Render interactive, draggable "control point handles" (small colored circular anchors) along the edge path:
  - When the edge is selected, show an anchor point at the path's bend or center.
  - Dragging the anchor point updates the custom offset properties (`data.controlX`, `data.controlY` or segment offsets) in the edge state.
  - The custom edge path generator (`getSmoothStepPath` or a custom bezier path builder) should dynamically incorporate these control coordinates to route the edge through the user's custom control points.
- Ensure that dragging the control handles is restricted to mouse movements and does not trigger canvas panning.

### 4. Collaborative Inline Edge Labels
- Double-clicking anywhere along the edge path (or clicking a label badge) toggles inline label editing.
- Position the inline editor at the path midpoint coordinates returned by the React Flow helper (e.g. `getSmoothStepPath` midpoint) using `EdgeLabelRenderer`.
- Prevent event propagation (`e.stopPropagation()`) on pointer down, key down, and click events inside the input field to prevent canvas pans or node selections during typing.
- Style the label badge as a sleek, dark-accented glassmorphic pill (`bg-surface/90 border border-surface-border text-copy-primary rounded-full px-2 py-0.5 text-[10px]`).
- Show a faint, dotted hint placeholder when a selected edge has no label.
- Save input values to the edge's `data.label` field on `onBlur` or `Enter`, and revert on `Escape`.
- Synchronize label changes collaboratively in real-time across all connected clients.

## Scope Limits
- Do not modify node rendering logic (except for the hover connection handles).
- Do not modify the bottom shape panel or sidebar navigation.
- Focus strictly on custom edge rendering, path controls, and collaborative label syncing.

## Check When Done
- Default connections use the `customCanvasEdge` renderer.
- Selected edges show a floating toolbar with toggles for Directed (arrowed) vs. Undirected styles.
- Selected edges render draggable control anchors allowing path adjustments with the mouse.
- Double-clicking an edge renders a midpoint text input editor.
- Edge labels and styles update collaboratively through the Liveblocks room state.
- `npm run build` compiles successfully without warnings.
