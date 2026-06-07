"use client"

import React, { Component, ErrorInfo, ReactNode, useRef, useCallback, useState, useEffect, useContext } from "react"
import { ReactFlow, Background, BackgroundVariant, MiniMap, ConnectionMode, ReactFlowProvider, useReactFlow, Handle, Position, NodeProps, NodeResizer, NodeChange, NodeToolbar, MarkerType } from "@xyflow/react"
import { LiveblocksProvider, RoomProvider, ClientSideSuspense, useMutation, useUndo, useRedo } from "@liveblocks/react/suspense"
import { useLiveblocksFlow, Cursors } from "@liveblocks/react-flow"
import { LiveObject } from "@liveblocks/client"
import { AlertTriangle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"

// Import CSS styles for React Flow and Liveblocks
import "@xyflow/react/dist/style.css"
import "@liveblocks/react-ui/styles.css"
import "@liveblocks/react-flow/styles.css"

// Import Canvas types and constants
import { CanvasNode, CanvasEdge, NodeShape, NODE_COLORS, NODE_SHAPES, NodeColorKey } from "@/types/canvas"
import { CustomCanvasEdge } from "./custom-edge"
import { CanvasControls } from "./canvas-controls"

interface CanvasWrapperProps {
  roomId: string
}

// 1. Error Boundary Component
interface ErrorBoundaryProps {
  children?: ReactNode
  fallback: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

class CanvasErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
  }

  public static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in collaborative canvas:", error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback
    }

    return this.props.children
  }
}

interface LiveObjectLike {
  get(key: string): unknown
  set(key: string, val: unknown): void
}

interface CanvasActionsContextType {
  deleteNode: (id: string) => void
  duplicateNode: (id: string) => void
  deleteEdge: (id: string) => void
  updateEdgeData: (id: string, partialData: Record<string, unknown>) => void
}
export const CanvasActionsContext = React.createContext<CanvasActionsContextType | null>(null)

// 2. Custom Node Component with dynamic shape rendering, resize controls, and inline editing
function CanvasNodeComponent({ id, data, selected, width, height }: NodeProps<CanvasNode>) {
  const colorKey = (data.color || "neutral") as NodeColorKey
  const colors = NODE_COLORS[colorKey] || NODE_COLORS.neutral
  const actions = useContext(CanvasActionsContext)

  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState("")

  const handleStartEditing = () => {
    setEditValue(data.label)
    setIsEditing(true)
  }

  // Liveblocks mutation to update node data properties collaboratively
  const updateNodeData = useMutation(({ storage }, nodeId: string, partialData: Partial<typeof data>) => {
    const flow = (storage as unknown as LiveObjectLike).get("flow") as LiveObjectLike
    if (!flow) return
    const nodesMap = flow.get("nodes") as LiveObjectLike
    if (!nodesMap) return
    const nodeObj = nodesMap.get(nodeId) as LiveObjectLike
    if (!nodeObj) return
    const dataObj = nodeObj.get("data") as LiveObjectLike
    if (dataObj) {
      for (const [key, val] of Object.entries(partialData)) {
        dataObj.set(key, val)
      }
    }
  }, [])

  const handleSave = () => {
    setIsEditing(false)
    const trimmed = editValue.trim()
    if (trimmed !== data.label) {
      updateNodeData(id, { label: trimmed })
    }
  }

  const reactFlowInstance = useReactFlow()
  const node = reactFlowInstance.getNode(id)
  const w = width ?? node?.width ?? 150
  const h = height ?? node?.height ?? 80
  const shape = data.shape || "rectangle"
  const strokeColor = selected ? "var(--accent-primary)" : "var(--border-default)"
  const strokeWidth = selected ? 2.5 : 1.5

  return (
    <div className="w-full h-full relative group">
      {/* Node Customization Toolbar */}
      {selected && (
        <NodeToolbar
          position={Position.Top}
          offset={12}
          className="z-30 pointer-events-auto"
        >
          <div
            className="flex items-center gap-1.5 bg-surface/90 backdrop-blur-md border border-surface-border shadow-2xl rounded-2xl p-1.5"
            onKeyDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 1. Color Swatches */}
            <div className="flex items-center gap-1 pr-1.5 border-r border-surface-border">
              {Object.entries(NODE_COLORS).map(([colorKey, colors]) => {
                const isActive = data.color === colorKey || (!data.color && colorKey === "neutral")
                return (
                  <button
                    key={colorKey}
                    onClick={() => updateNodeData(id, { color: colorKey })}
                    className={cn(
                      "w-4 h-4 rounded-full transition-all duration-150 relative flex items-center justify-center border",
                      isActive ? "scale-110" : "hover:scale-105"
                    )}
                    style={{
                      backgroundColor: colors.fill,
                      borderColor: isActive ? colors.text : "var(--border-default)",
                      boxShadow: isActive ? `0 0 6px ${colors.text}40` : undefined,
                    }}
                    title={`${colorKey} theme`}
                  >
                    <span 
                      className="w-1.5 h-1.5 rounded-full" 
                      style={{ backgroundColor: colors.text }} 
                    />
                    {/* Hover Glow Effect via CSS/Tailwind */}
                    <span 
                      className="absolute inset-0 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-150 shadow-[0_0_8px_var(--glow-color)] pointer-events-none"
                      style={{ 
                        // @ts-expect-error Custom CSS property for hover glow
                        "--glow-color": colors.text 
                      }}
                    />
                  </button>
                )
              })}
            </div>

            {/* 2. Shape Selector Toggle */}
            <div className="flex items-center gap-1 pr-1.5 border-r border-surface-border">
              {NODE_SHAPES.map((s) => {
                const isActive = data.shape === s || (!data.shape && s === "rectangle")
                return (
                  <button
                    key={s}
                    onClick={() => updateNodeData(id, { shape: s })}
                    className={cn(
                      "p-1 rounded-lg hover:bg-subtle text-copy-secondary transition-all duration-150",
                      isActive ? "bg-subtle text-brand border border-surface-border-subtle" : "hover:text-brand"
                    )}
                    title={`Change shape to ${s}`}
                  >
                    {s === "rectangle" && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                        <rect x="3" y="6" width="18" height="12" rx="1" />
                      </svg>
                    )}
                    {s === "diamond" && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                        <path d="M12 3L21 12L12 21L3 12Z" />
                      </svg>
                    )}
                    {s === "circle" && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                        <circle cx="12" cy="12" r="9" />
                      </svg>
                    )}
                    {s === "pill" && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                        <rect x="4" y="8" width="16" height="8" rx="4" />
                      </svg>
                    )}
                    {s === "cylinder" && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                        <ellipse cx="12" cy="7" rx="6" ry="2" />
                        <path d="M6 7v10c0 1 2.7 2 6 2s6-1 6-2V7" />
                      </svg>
                    )}
                    {s === "hexagon" && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                        <path d="M12 3l6.5 3.75v7.5L12 18l-6.5-3.75v-7.5Z" />
                      </svg>
                    )}
                  </button>
                )
              })}
            </div>

            {/* 3. Custom Action Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => actions?.duplicateNode(id)}
                className="p-1 rounded-lg hover:bg-subtle text-copy-secondary hover:text-brand transition-all duration-150"
                title="Duplicate node"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </button>
              <button
                onClick={() => actions?.deleteNode(id)}
                className="p-1 rounded-lg hover:bg-subtle text-copy-secondary hover:text-error transition-all duration-150"
                title="Delete node"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                  <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
              </button>
            </div>
          </div>
        </NodeToolbar>
      )}

      {/* NodeResizer handles resizing nodes when selected */}
      <NodeResizer
        color="var(--accent-primary)"
        minWidth={80}
        minHeight={40}
        isVisible={selected}
        lineClassName="border-brand"
        handleClassName="h-2.5 w-2.5 bg-white border-2 border-brand rounded-md shadow-md"
      />

      {/* SVG Shape Outline Background */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
        {shape === "rectangle" && (
          <rect
            x={strokeWidth / 2}
            y={strokeWidth / 2}
            width={w - strokeWidth}
            height={h - strokeWidth}
            rx={12}
            fill={colors.fill}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
        )}
        {shape === "circle" && (
          <ellipse
            cx={w / 2}
            cy={h / 2}
            rx={w / 2 - strokeWidth / 2}
            ry={h / 2 - strokeWidth / 2}
            fill={colors.fill}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
        )}
        {shape === "pill" && (
          <rect
            x={strokeWidth / 2}
            y={strokeWidth / 2}
            width={w - strokeWidth}
            height={h - strokeWidth}
            rx={Math.min(w, h) / 2}
            fill={colors.fill}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
        )}
        {shape === "diamond" && (
          <path
            d={`M ${w / 2} ${strokeWidth / 2} L ${w - strokeWidth / 2} ${h / 2} L ${w / 2} ${h - strokeWidth / 2} L ${strokeWidth / 2} ${h / 2} Z`}
            fill={colors.fill}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
        )}
        {shape === "hexagon" && (
          <path
            d={`M ${w * 0.25} ${strokeWidth / 2} L ${w * 0.75} ${strokeWidth / 2} L ${w - strokeWidth / 2} ${h / 2} L ${w * 0.75} ${h - strokeWidth / 2} L ${w * 0.25} ${h - strokeWidth / 2} L ${strokeWidth / 2} ${h / 2} Z`}
            fill={colors.fill}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
        )}
        {shape === "cylinder" && (
          <>
            <path
              d={`M ${strokeWidth / 2} 12 L ${strokeWidth / 2} ${h - 12} A ${w / 2 - strokeWidth / 2} 8 0 0 0 ${w - strokeWidth / 2} ${h - 12} L ${w - strokeWidth / 2} 12 Z`}
              fill={colors.fill}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            <ellipse
              cx={w / 2}
              cy={12}
              rx={w / 2 - strokeWidth / 2}
              ry={8}
              fill={colors.fill}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
          </>
        )}
      </svg>

      {/* Interactive Label Content (overlays the SVG background shape) */}
      <div
        onDoubleClick={handleStartEditing}
        className={cn(
          "relative w-full h-full flex items-center justify-center p-4 select-none cursor-pointer z-10 text-center rounded-xl",
          "hover:text-copy-primary transition-all duration-200"
        )}
        style={{
          color: colors.text,
        }}
      >
        {isEditing ? (
          <input
            type="text"
            data-nodrag
            data-nopan
            className="bg-transparent border-none text-center outline-none w-full text-xs font-sans text-copy-primary focus:ring-0 p-0 cursor-text select-text nodrag nopan"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              e.stopPropagation()
              if (e.key === "Enter") handleSave()
              if (e.key === "Escape") {
                setEditValue(data.label)
                setIsEditing(false)
              }
            }}
            autoFocus
          />
        ) : (
          <div className="font-sans text-xs font-medium tracking-wide leading-snug px-1 truncate w-full">
            {data.label || <span className="opacity-30 italic select-none">Double-click to edit</span>}
          </div>
        )}
      </div>

      {/* Connection Handles: Top, Right, Bottom, Left (Dual Source and Target handles for bidirectional compatibility) */}
      <Handle
        type="target"
        position={Position.Top}
        id="t"
        className="!w-2 !h-2 !bg-copy-primary !border-2 !border-brand shadow-md opacity-0 group-hover:opacity-100 transition-all hover:scale-125 duration-200 cursor-crosshair z-20"
      />
      <Handle
        type="source"
        position={Position.Top}
        id="t"
        className="!w-2 !h-2 !bg-copy-primary !border-2 !border-brand shadow-md opacity-0 group-hover:opacity-100 transition-all hover:scale-125 duration-200 cursor-crosshair z-20"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="r"
        className="!w-2 !h-2 !bg-copy-primary !border-2 !border-brand shadow-md opacity-0 group-hover:opacity-100 transition-all hover:scale-125 duration-200 cursor-crosshair z-20"
      />
      <Handle
        type="target"
        position={Position.Right}
        id="r"
        className="!w-2 !h-2 !bg-copy-primary !border-2 !border-brand shadow-md opacity-0 group-hover:opacity-100 transition-all hover:scale-125 duration-200 cursor-crosshair z-20"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="b"
        className="!w-2 !h-2 !bg-copy-primary !border-2 !border-brand shadow-md opacity-0 group-hover:opacity-100 transition-all hover:scale-125 duration-200 cursor-crosshair z-20"
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="b"
        className="!w-2 !h-2 !bg-copy-primary !border-2 !border-brand shadow-md opacity-0 group-hover:opacity-100 transition-all hover:scale-125 duration-200 cursor-crosshair z-20"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="l"
        className="!w-2 !h-2 !bg-copy-primary !border-2 !border-brand shadow-md opacity-0 group-hover:opacity-100 transition-all hover:scale-125 duration-200 cursor-crosshair z-20"
      />
      <Handle
        type="source"
        position={Position.Left}
        id="l"
        className="!w-2 !h-2 !bg-copy-primary !border-2 !border-brand shadow-md opacity-0 group-hover:opacity-100 transition-all hover:scale-125 duration-200 cursor-crosshair z-20"
      />
    </div>
  )
}

// Node types registry for React Flow
const nodeTypes = {
  canvasNode: CanvasNodeComponent,
}

// Edge types registry for React Flow
const edgeTypes = {
  customCanvasEdge: CustomCanvasEdge,
}

// 3. Bottom Shape Panel Toolbar
interface ShapePanelProps {
  onDragStart: (event: React.DragEvent, shape: NodeShape) => void
}

function ShapePanel({ onDragStart }: ShapePanelProps) {
  // SVG Icons for each shape
  const shapeIcons: Record<NodeShape, React.ReactNode> = {
    rectangle: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <rect x="3" y="6" width="18" height="12" rx="1.5" />
      </svg>
    ),
    diamond: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path d="M12 3L21 12L12 21L3 12Z" />
      </svg>
    ),
    circle: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <circle cx="12" cy="12" r="9" />
      </svg>
    ),
    pill: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <rect x="4" y="8" width="16" height="8" rx="4" />
      </svg>
    ),
    cylinder: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <ellipse cx="12" cy="6" rx="6" ry="2.5" />
        <path d="M6 6v12c0 1.5 2.7 2.5 6 2.5s6-1 6-2.5V6" />
        <path d="M6 12c0 1.5 2.7 2.5 6 2.5s6-1 6-2.5" strokeDasharray="2 2" />
      </svg>
    ),
    hexagon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path d="M12 2.5l7.79 4.5v9L12 21.5l-7.79-4.5v-9Z" />
      </svg>
    ),
  }

  return (
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-surface/90 backdrop-blur-md border border-surface-border px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-3 z-30 animate-in slide-in-from-bottom-5 duration-300">
      <div className="text-[10px] font-mono text-copy-muted pr-3 border-r border-surface-border select-none uppercase tracking-wider">
        Shapes
      </div>
      {NODE_SHAPES.map((shape) => (
        <div
          key={shape}
          draggable
          onDragStart={(e) => onDragStart(e, shape)}
          className="p-2 rounded-xl hover:bg-subtle text-copy-secondary hover:text-brand cursor-grab active:cursor-grabbing transition-all duration-200 group relative flex items-center justify-center"
        >
          {shapeIcons[shape]}
          {/* Custom Tooltip */}
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 rounded-lg bg-surface border border-surface-border text-[9px] text-copy-primary font-mono uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-lg">
            {shape}
          </span>
        </div>
      ))}
    </div>
  )
}

// 4. Collaborative Canvas (inside ReactFlowProvider)
function CollaborativeCanvas() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const reactFlowInstance = useReactFlow()

  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } = useLiveblocksFlow<CanvasNode, CanvasEdge>({
    suspense: true,
    nodes: {
      initial: [],
      sync: {
        "*": {
          label: "atomic",
          color: "atomic",
          shape: "atomic",
        }
      }
    },
    edges: {
      initial: [],
      sync: {
        "*": {
          label: "atomic",
          directed: "atomic",
          controlX: "atomic",
          controlY: "atomic",
        }
      }
    },
  })

  const undo = useUndo()
  const redo = useRedo()

  const addNodes = useCallback((newNodes: CanvasNode[]) => {
    const selectionChanges = nodes
      .filter((n) => n.selected)
      .map((n) => ({
        id: n.id,
        type: "select",
        selected: false,
      } as unknown as NodeChange<CanvasNode>))

    onNodesChange([
      ...selectionChanges,
      ...newNodes.map((n) => ({
        type: "add",
        item: n,
      } as unknown as NodeChange<CanvasNode>)),
    ])
  }, [nodes, onNodesChange])

  const deleteSelectedNodes = useCallback(() => {
    const selectedNodes = nodes.filter((n) => n.selected)
    if (selectedNodes.length > 0) {
      reactFlowInstance.deleteElements({ nodes: selectedNodes })
    }
  }, [nodes, reactFlowInstance])

  const duplicateSelectedNodes = useCallback(() => {
    const selectedNodes = nodes.filter((n) => n.selected)
    if (selectedNodes.length === 0) return

    const selectionChanges = nodes
      .filter((n) => n.selected)
      .map((n) => ({
        id: n.id,
        type: "select",
        selected: false,
      } as unknown as NodeChange<CanvasNode>))

    const duplicatedNodes = selectedNodes.map((targetNode) => {
      const shape = targetNode.data.shape || "rectangle"
      const newId = `${shape}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
      return {
        id: newId,
        type: targetNode.type,
        position: {
          x: targetNode.position.x + 30,
          y: targetNode.position.y - 45,
        },
        data: { ...targetNode.data },
        width: targetNode.width,
        height: targetNode.height,
        selected: true,
      }
    })

    onNodesChange([
      ...selectionChanges,
      ...duplicatedNodes.map((n) => ({
        type: "add",
        item: n,
      } as unknown as NodeChange<CanvasNode>)),
    ])
  }, [nodes, onNodesChange])

  // Bind viewport and history keyboard shortcuts
  useKeyboardShortcuts({
    reactFlowInstance,
    undo,
    redo,
    nodes,
    addNodes,
    deleteSelectedNodes,
    duplicateSelectedNodes,
  })

  // Handles drag start payload
  const handleDragStart = useCallback((event: React.DragEvent, shape: NodeShape) => {
    let width = 150
    let height = 80
    switch (shape) {
      case "rectangle":
        width = 150
        height = 80
        break
      case "diamond":
        width = 120
        height = 120
        break
      case "circle":
        width = 80
        height = 80
        break
      case "pill":
        width = 120
        height = 60
        break
      case "cylinder":
        width = 100
        height = 100
        break
      case "hexagon":
        width = 120
        height = 100
        break
    }

    event.dataTransfer.setData("application/reactflow/shape", shape)
    event.dataTransfer.setData("application/reactflow/width", String(width))
    event.dataTransfer.setData("application/reactflow/height", String(height))
    event.dataTransfer.effectAllowed = "move"
  }, [])

  // Drag over handler
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
  }, [])

  // Drop handler to create nodes
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      if (!reactFlowWrapper.current) return

      const shape = event.dataTransfer.getData("application/reactflow/shape") as NodeShape
      const widthStr = event.dataTransfer.getData("application/reactflow/width")
      const heightStr = event.dataTransfer.getData("application/reactflow/height")

      if (!shape) return

      const width = parseInt(widthStr, 10) || 150
      const height = parseInt(heightStr, 10) || 80

      // Convert screen client coordinates to flow coordinates
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })

      // Center the node on drop coordinates
      const centerPosition = {
        x: position.x - width / 2,
        y: position.y - height / 2,
      }

      // Generate node ID
      const id = `${shape}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`

      const newNode: CanvasNode = {
        id,
        type: "canvasNode",
        position: centerPosition,
        data: {
          label: "",
          shape,
          color: "neutral",
        },
        width,
        height,
      }

      // Add node using type: "add"
      onNodesChange([
        {
          type: "add",
          item: newNode,
        } as unknown as NodeChange<CanvasNode>,
      ])
    },
    [reactFlowInstance, onNodesChange]
  )

  const deleteNode = useCallback((id: string) => {
    const targetNode = nodes.find((n) => n.id === id)
    if (targetNode) {
      reactFlowInstance.deleteElements({ nodes: [targetNode] })
    }
  }, [nodes, reactFlowInstance])

  const duplicateNode = useCallback((id: string) => {
    const targetNode = nodes.find((n) => n.id === id)
    if (!targetNode) return

    const shape = targetNode.data.shape || "rectangle"
    const newId = `${shape}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    
    // Deselect other currently selected nodes locally to transfer focus to the clone
    const selectionChanges = nodes
      .filter((n) => n.selected)
      .map((n) => ({
        id: n.id,
        type: "select",
        selected: false,
      } as unknown as NodeChange<CanvasNode>))

    const duplicatedNode: CanvasNode = {
      id: newId,
      type: targetNode.type,
      position: {
        x: targetNode.position.x + 30,
        y: targetNode.position.y - 45, // Offset above (physically higher in Y) and to the right
      },
      data: { ...targetNode.data },
      width: targetNode.width,
      height: targetNode.height,
      selected: true,
    }

    onNodesChange([
      ...selectionChanges,
      {
        type: "add",
        item: duplicatedNode,
      } as unknown as NodeChange<CanvasNode>,
    ])
  }, [nodes, onNodesChange])

  const deleteEdge = useCallback((id: string) => {
    const targetEdge = edges.find((e) => e.id === id)
    if (targetEdge) {
      onDelete({ nodes: [], edges: [targetEdge] })
    }
  }, [edges, onDelete])

  const updateEdgeData = useMutation(({ storage }, edgeId: string, partialData: Record<string, unknown>) => {
    const flow = (storage as unknown as LiveObjectLike).get("flow") as LiveObjectLike
    if (!flow) return
    const edgesMap = flow.get("edges") as LiveObjectLike
    if (!edgesMap) return
    const edgeObj = edgesMap.get(edgeId) as LiveObjectLike
    if (!edgeObj) return
    let dataObj = edgeObj.get("data") as any
    if (!dataObj) {
      edgeObj.set("data", new LiveObject({ label: "", directed: true, ...partialData }))
    } else if (typeof dataObj.set === "function") {
      for (const [key, val] of Object.entries(partialData)) {
        if (val === undefined || val === null) {
          if (typeof dataObj.delete === "function") {
            dataObj.delete(key)
          } else {
            dataObj.set(key, null)
          }
        } else {
          dataObj.set(key, val)
        }
      }
    } else {
      const newData = { ...dataObj, ...partialData }
      for (const [key, val] of Object.entries(partialData)) {
        if (val === undefined || val === null) {
          delete newData[key]
        }
      }
      edgeObj.set("data", newData)
    }
  }, [])

  return (
    <CanvasActionsContext.Provider value={{ deleteNode, duplicateNode, deleteEdge, updateEdgeData }}>
      <div 
        ref={reactFlowWrapper} 
        className="w-full h-full relative select-none"
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDelete={onDelete}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={{
            type: "customCanvasEdge",
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 16,
              height: 16,
              color: "var(--border-default)",
            }
          }}
          connectionMode={ConnectionMode.Loose}
          zoomOnDoubleClick={false}
          fitView
          className="bg-base"
        >
          <Background 
            variant={BackgroundVariant.Dots} 
            color="rgba(240, 240, 244, 0.15)" 
            gap={24} 
            size={1} 
          />
          <MiniMap
            position="bottom-left"
            className="!bg-surface !border !border-surface-border rounded-xl overflow-hidden shadow-lg"
            maskColor="rgba(8, 8, 9, 0.7)"
            nodeColor="#1a1a20"
            nodeStrokeWidth={0}
          />
          <Cursors />
        </ReactFlow>

        {/* Floating Pill Toolbar */}
        <ShapePanel onDragStart={handleDragStart} />

        {/* Floating Zoom & History Controls */}
        <CanvasControls />
      </div>
    </CanvasActionsContext.Provider>
  )
}

// 5. Loading Fallback
function CanvasLoadingState() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-base text-copy-primary z-50">
      <div className="flex flex-col items-center gap-4 animate-in fade-in duration-300">
        <Loader2 className="h-8 w-8 text-brand animate-spin" />
        <p className="text-xs font-mono text-copy-muted tracking-wider uppercase">
          Initializing Canvas Session...
        </p>
      </div>
    </div>
  )
}

// 6. Connection Error Fallback
function CanvasErrorState({ onReset }: { onReset: () => void }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-base text-copy-primary p-6 z-50">
      <div className="max-w-sm text-center flex flex-col items-center gap-4 animate-in fade-in duration-300">
        <div className="h-12 w-12 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive mb-2 shadow-lg shadow-destructive/5">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-medium tracking-wide text-copy-primary">
          Connection Issue
        </h3>
        <p className="text-xs text-copy-secondary leading-relaxed font-light">
          Unable to establish a collaborative canvas session. This could be due to network changes or room initialization issues.
        </p>
        <button
          onClick={onReset}
          className="mt-2 bg-destructive hover:bg-destructive/80 text-destructive-foreground text-xs font-semibold px-6 h-10 rounded-xl shadow-lg transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
        >
          Try Reconnecting
        </button>
      </div>
    </div>
  )
}

// 7. Canvas Root Component
export function Canvas({ roomId }: CanvasWrapperProps) {
  const [errorKey, setErrorKey] = useState(0)

  const handleReset = () => {
    setErrorKey((prev) => prev + 1)
  }

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-base">
      <CanvasErrorBoundary key={errorKey} fallback={<CanvasErrorState onReset={handleReset} />}>
        <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
          <RoomProvider 
            id={roomId} 
            initialPresence={{ cursor: null, isThinking: false }}
          >
            <ClientSideSuspense fallback={<CanvasLoadingState />}>
              <ReactFlowProvider>
                <CollaborativeCanvas />
              </ReactFlowProvider>
            </ClientSideSuspense>
          </RoomProvider>
        </LiveblocksProvider>
      </CanvasErrorBoundary>
    </div>
  )
}
