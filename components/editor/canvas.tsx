"use client"

import React, { Component, ErrorInfo, ReactNode, useRef, useCallback, useState, useEffect, useContext } from "react"
import { ReactFlow, Background, BackgroundVariant, MiniMap, ConnectionMode, ReactFlowProvider, useReactFlow, Handle, Position, NodeProps, NodeResizer, NodeChange, EdgeChange, NodeToolbar, MarkerType } from "@xyflow/react"
import { LiveblocksProvider, RoomProvider, ClientSideSuspense, useMutation, useUndo, useRedo } from "@liveblocks/react/suspense"
import { useLiveblocksFlow, Cursors } from "@liveblocks/react-flow"
import { LiveObject } from "@liveblocks/client"
import { AlertTriangle, Loader2, Check, Bold, Italic, AlignLeft, AlignCenter, AlignRight, Sparkles, Plus, Grid, Type, StickyNote, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"
import { useUser } from "@clerk/nextjs"

// Import CSS styles for React Flow and Liveblocks
import "@xyflow/react/dist/style.css"
import "@liveblocks/react-ui/styles.css"
import "@liveblocks/react-flow/styles.css"

// Import Canvas types and constants
import { CanvasNode, CanvasEdge, NodeShape, NODE_COLORS, NODE_SHAPES, NodeColorKey, STICKY_COLORS, StickyColorKey, NODE_FONT_SIZES, CANVAS_ICONS, CanvasIconDef, CanvasNodeType } from "@/types/canvas"
import { CanvasTemplate } from "./starter-templates"
import { CustomCanvasEdge } from "./custom-edge"
import { CanvasControls } from "./canvas-controls"
import { CanvasContextMenu } from "./canvas-context-menu"
import { ClipboardNode } from "@/hooks/useKeyboardShortcuts"

function getInitials(name?: string) {
  if (!name) return "?"
  return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
}


interface CanvasWrapperProps {
  roomId: string
  onImportTemplate?: (importFn: (template: CanvasTemplate) => void) => void
  isCommentMode?: boolean
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
  delete?: (key: string) => void
}

interface CanvasActionsContextType {
  deleteNode: (id: string) => void
  duplicateNode: (id: string) => void
  deleteEdge: (id: string) => void
  updateEdgeData: (id: string, partialData: Record<string, unknown>) => void
  updateNodeData: (id: string, partialData: Record<string, unknown>) => void
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

  const handleSave = () => {
    setIsEditing(false)
    const trimmed = editValue.trim()
    if (trimmed !== data.label) {
      actions?.updateNodeData(id, { label: trimmed })
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
                    onClick={() => actions?.updateNodeData(id, { color: colorKey })}
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
                    onClick={() => actions?.updateNodeData(id, { shape: s })}
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

// 2b. Sticky Note Component (for annotations and comments)
function StickyNoteNode({ id, data, selected, width, height }: NodeProps<CanvasNode>) {
  const actions = useContext(CanvasActionsContext)
  const colorKey = (data.color || "yellow") as StickyColorKey
  const colors = STICKY_COLORS[colorKey] || STICKY_COLORS.yellow
  const fontSizeClass = NODE_FONT_SIZES[data.fontSize || "md"]
  
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState("")

  const handleStartEditing = () => {
    setEditValue(data.commentText !== undefined ? (data.commentText || "") : data.label)
    setIsEditing(true)
  }

  const handleSave = () => {
    setIsEditing(false)
    const trimmed = editValue.trim()
    if (data.commentText !== undefined) {
      if (trimmed !== data.commentText) {
        actions?.updateNodeData(id, { commentText: trimmed })
      }
    } else {
      if (trimmed !== data.label) {
        actions?.updateNodeData(id, { label: trimmed })
      }
    }
  }

  const reactFlowInstance = useReactFlow()
  const node = reactFlowInstance.getNode(id)
  const w = width ?? node?.width ?? 180
  const h = height ?? node?.height ?? 120

  const isComment = data.commentText !== undefined || !!data.commentAuthor
  const isResolved = !!data.commentResolved

  return (
    <div 
      className={cn(
        "w-full h-full relative group rounded-2xl shadow-lg border transition-all duration-200",
        isResolved ? "opacity-55 saturate-50" : ""
      )}
      style={{
        backgroundColor: colors.fill,
        borderColor: selected ? "var(--accent-primary)" : colors.border,
        boxShadow: selected ? `0 0 12px var(--accent-primary-dim)` : undefined,
      }}
    >
      {/* NodeResizer */}
      <NodeResizer
        color="var(--accent-primary)"
        minWidth={120}
        minHeight={80}
        isVisible={selected}
        lineClassName="border-brand"
        handleClassName="h-2.5 w-2.5 bg-white border-2 border-brand rounded-md shadow-md"
      />

      {/* Toolbar */}
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
            {/* Color Swatches */}
            <div className="flex items-center gap-1 pr-1.5 border-r border-surface-border">
              {Object.entries(STICKY_COLORS).map(([colorKey, colors]) => {
                const isActive = data.color === colorKey || (!data.color && colorKey === "yellow")
                return (
                  <button
                    key={colorKey}
                    onClick={() => actions?.updateNodeData(id, { color: colorKey })}
                    className={cn(
                      "w-4 h-4 rounded-full transition-all duration-150 relative flex items-center justify-center border",
                      isActive ? "scale-110" : "hover:scale-105"
                    )}
                    style={{
                      backgroundColor: colors.fill,
                      borderColor: isActive ? colors.text : "var(--border-default)",
                    }}
                    title={`${colorKey} sticky`}
                  />
                )
              })}
            </div>

            {/* Font Sizes */}
            <div className="flex items-center bg-subtle/50 rounded-lg p-0.5 pr-1.5 border-r border-surface-border">
              {(["sm", "md", "lg", "xl"] as const).map((sz) => {
                const label = sz.toUpperCase()
                const isActive = (data.fontSize || "md") === sz
                return (
                  <button
                    key={sz}
                    onClick={() => actions?.updateNodeData(id, { fontSize: sz })}
                    className={cn(
                      "px-1.5 py-0.5 rounded text-[10px] font-semibold transition-all duration-150 cursor-pointer",
                      isActive ? "bg-brand text-background" : "text-copy-secondary hover:text-copy-primary"
                    )}
                  >
                    {label}
                  </button>
                )
              })}
            </div>

            {/* Formatting */}
            <div className="flex items-center gap-0.5 pr-1.5 border-r border-surface-border">
              <button
                onClick={() => actions?.updateNodeData(id, { bold: !data.bold })}
                className={cn(
                  "p-1 rounded hover:bg-subtle transition-colors duration-150 cursor-pointer",
                  data.bold ? "bg-subtle text-brand" : "text-copy-secondary"
                )}
                title="Bold"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => actions?.updateNodeData(id, { italic: !data.italic })}
                className={cn(
                  "p-1 rounded hover:bg-subtle transition-colors duration-150 cursor-pointer",
                  data.italic ? "bg-subtle text-brand" : "text-copy-secondary"
                )}
                title="Italic"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Alignment */}
            <div className="flex items-center gap-0.5 pr-1.5 border-r border-surface-border">
              {(["left", "center", "right"] as const).map((align) => {
                const Icon = align === "left" ? AlignLeft : align === "center" ? AlignCenter : AlignRight
                const isActive = (data.textAlign || "left") === align
                return (
                  <button
                    key={align}
                    onClick={() => actions?.updateNodeData(id, { textAlign: align })}
                    className={cn(
                      "p-1 rounded hover:bg-subtle transition-colors duration-150 cursor-pointer",
                      isActive ? "bg-subtle text-brand" : "text-copy-secondary"
                    )}
                    title={`Align ${align}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                )
              })}
            </div>

            {/* Comment actions */}
            {isComment && (
              <div className="flex items-center gap-0.5 pr-1.5 border-r border-surface-border">
                <button
                  onClick={() => actions?.updateNodeData(id, { commentResolved: !isResolved })}
                  className={cn(
                    "p-1 rounded hover:bg-subtle transition-colors duration-150 cursor-pointer",
                    isResolved ? "bg-success/20 text-success" : "text-copy-secondary"
                  )}
                  title={isResolved ? "Unresolve comment" : "Resolve comment"}
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* General Actions */}
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => actions?.duplicateNode(id)}
                className="p-1 rounded hover:bg-subtle text-copy-secondary hover:text-brand transition-all duration-150 cursor-pointer"
                title="Duplicate"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </button>
              <button
                onClick={() => actions?.deleteNode(id)}
                className="p-1 rounded hover:bg-subtle text-copy-secondary hover:text-error transition-all duration-150 cursor-pointer"
                title="Delete"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                  <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
              </button>
            </div>
          </div>
        </NodeToolbar>
      )}

      {/* Initials Badge for Comment Mode */}
      {isComment && data.commentAuthor && (
        <div 
          className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full bg-brand border border-white/20 shadow-md flex items-center justify-center text-[9px] font-semibold text-background select-none z-10"
          title={`Comment by ${data.commentAuthor}`}
        >
          {getInitials(data.commentAuthor)}
        </div>
      )}

      {/* Double click editable area */}
      <div
        onDoubleClick={handleStartEditing}
        className={cn(
          "w-full h-full flex items-center justify-center p-4 select-none cursor-pointer rounded-xl overflow-hidden leading-relaxed",
          fontSizeClass,
          data.textAlign === "center" ? "text-center" : data.textAlign === "right" ? "text-right" : "text-left",
          data.bold ? "font-bold" : "font-normal",
          data.italic ? "italic" : "not-italic"
        )}
        style={{
          color: colors.text,
        }}
      >
        {isEditing ? (
          <textarea
            data-nodrag
            data-nopan
            className="bg-transparent border-none outline-none w-full h-full text-inherit font-inherit resize-none focus:ring-0 p-0 cursor-text select-text nodrag nopan leading-relaxed"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              e.stopPropagation()
              if (e.key === "Enter" && e.ctrlKey) handleSave()
              if (e.key === "Escape") {
                setEditValue(isComment ? (data.commentText || "") : data.label)
                setIsEditing(false)
              }
            }}
            autoFocus
          />
        ) : (
          <div className="w-full h-full overflow-y-auto break-words select-none pointer-events-none pr-1">
            {isComment ? (
              data.commentText || <span className="opacity-40 italic">Type a comment...</span>
            ) : (
              data.label || <span className="opacity-40 italic">Double-click to edit</span>
            )}
          </div>
        )}
      </div>

      {/* Connection Handles: shown on hover */}
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

// 2c. Text Block Component (transparent floating labels)
function TextBlockNode({ id, data, selected, width, height }: NodeProps<CanvasNode>) {
  const actions = useContext(CanvasActionsContext)
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState("")

  const handleStartEditing = () => {
    setEditValue(data.label)
    setIsEditing(true)
  }

  const handleSave = () => {
    setIsEditing(false)
    const trimmed = editValue.trim()
    if (trimmed !== data.label) {
      actions?.updateNodeData(id, { label: trimmed })
    }
  }

  const reactFlowInstance = useReactFlow()
  const node = reactFlowInstance.getNode(id)
  const w = width ?? node?.width ?? 200
  const h = height ?? node?.height ?? 60

  const fontSizeClass = NODE_FONT_SIZES[data.fontSize || "md"]
  
  const textColors = {
    neutral: "text-copy-primary",
    blue: "text-brand",
    purple: "text-brand-ai-text",
    orange: "text-copy-secondary",
    red: "text-copy-muted"
  } as const
  const textColorClass = textColors[data.color as keyof typeof textColors || "neutral"]

  return (
    <div 
      className={cn(
        "w-full h-full relative group flex items-center justify-center p-2 rounded-xl transition-all duration-200 border border-transparent",
        selected ? "border-brand/40 border-dashed bg-subtle/10" : "hover:border-surface-border-subtle/30"
      )}
    >
      {/* NodeResizer */}
      <NodeResizer
        color="var(--accent-primary)"
        minWidth={40}
        minHeight={20}
        isVisible={selected}
        lineClassName="border-brand border-dashed"
        handleClassName="h-2.5 w-2.5 bg-white border border-brand rounded shadow-md"
      />

      {/* Toolbar */}
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
            {/* Text Colors */}
            <div className="flex items-center gap-1 pr-1.5 border-r border-surface-border">
              {Object.entries(textColors).map(([colorKey]) => {
                const isActive = data.color === colorKey || (!data.color && colorKey === "neutral")
                
                let dotBg = "var(--text-primary)"
                if (colorKey === "blue") dotBg = "var(--accent-primary)"
                if (colorKey === "purple") dotBg = "var(--accent-ai-text)"
                if (colorKey === "orange") dotBg = "var(--text-secondary)"
                if (colorKey === "red") dotBg = "var(--text-muted)"

                return (
                  <button
                    key={colorKey}
                    onClick={() => actions?.updateNodeData(id, { color: colorKey })}
                    className={cn(
                      "w-3.5 h-3.5 rounded-full transition-all duration-150 relative flex items-center justify-center border cursor-pointer",
                      isActive ? "scale-110 border-brand" : "border-transparent hover:scale-105"
                    )}
                    style={{ backgroundColor: dotBg }}
                    title={`${colorKey} text`}
                  />
                )
              })}
            </div>

            {/* Font Sizes: S M L XL */}
            <div className="flex items-center bg-subtle/50 rounded-lg p-0.5 pr-1.5 border-r border-surface-border">
              {(["sm", "md", "lg", "xl"] as const).map((sz) => {
                const label = sz.toUpperCase()
                const isActive = (data.fontSize || "md") === sz
                return (
                  <button
                    key={sz}
                    onClick={() => actions?.updateNodeData(id, { fontSize: sz })}
                    className={cn(
                      "px-1.5 py-0.5 rounded text-[10px] font-semibold transition-all duration-150 cursor-pointer",
                      isActive ? "bg-brand text-background" : "text-copy-secondary hover:text-copy-primary"
                    )}
                  >
                    {label}
                  </button>
                )
              })}
            </div>

            {/* Formatting */}
            <div className="flex items-center gap-0.5 pr-1.5 border-r border-surface-border">
              <button
                onClick={() => actions?.updateNodeData(id, { bold: !data.bold })}
                className={cn(
                  "p-1 rounded hover:bg-subtle transition-colors duration-150 cursor-pointer",
                  data.bold ? "bg-subtle text-brand" : "text-copy-secondary"
                )}
                title="Bold"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => actions?.updateNodeData(id, { italic: !data.italic })}
                className={cn(
                  "p-1 rounded hover:bg-subtle transition-colors duration-150 cursor-pointer",
                  data.italic ? "bg-subtle text-brand" : "text-copy-secondary"
                )}
                title="Italic"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Alignment */}
            <div className="flex items-center gap-0.5 pr-1.5 border-r border-surface-border">
              {(["left", "center", "right"] as const).map((align) => {
                const Icon = align === "left" ? AlignLeft : align === "center" ? AlignCenter : AlignRight
                const isActive = (data.textAlign || "center") === align
                return (
                  <button
                    key={align}
                    onClick={() => actions?.updateNodeData(id, { textAlign: align })}
                    className={cn(
                      "p-1 rounded hover:bg-subtle transition-colors duration-150 cursor-pointer",
                      isActive ? "bg-subtle text-brand" : "text-copy-secondary"
                    )}
                    title={`Align ${align}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                )
              })}
            </div>

            {/* General Actions */}
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => actions?.duplicateNode(id)}
                className="p-1 rounded hover:bg-subtle text-copy-secondary hover:text-brand transition-all duration-150 cursor-pointer"
                title="Duplicate"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </button>
              <button
                onClick={() => actions?.deleteNode(id)}
                className="p-1 rounded hover:bg-subtle text-copy-secondary hover:text-error transition-all duration-150 cursor-pointer"
                title="Delete"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                  <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
              </button>
            </div>
          </div>
        </NodeToolbar>
      )}

      {/* Double click editable area */}
      <div 
        onDoubleClick={handleStartEditing}
        className={cn(
          "w-full h-full flex items-center justify-center leading-normal select-none cursor-pointer rounded-xl overflow-hidden",
          textColorClass,
          fontSizeClass,
          data.textAlign === "left" ? "text-left" : data.textAlign === "right" ? "text-right" : "text-center",
          data.bold ? "font-bold" : "font-normal",
          data.italic ? "italic" : "not-italic"
        )}
      >
        {isEditing ? (
          <textarea
            data-nodrag
            data-nopan
            className="bg-transparent border-none outline-none w-full h-full text-inherit font-inherit resize-none focus:ring-0 p-0 cursor-text select-text nodrag nopan text-center leading-normal"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              e.stopPropagation()
              if (e.key === "Enter" && e.ctrlKey) handleSave()
              if (e.key === "Escape") {
                setEditValue(data.label)
                setIsEditing(false)
              }
            }}
            autoFocus
          />
        ) : (
          <div className="w-full h-full overflow-y-auto break-words select-none pointer-events-none pr-1">
            {data.label || <span className="opacity-40 italic">Double-click to type</span>}
          </div>
        )}
      </div>
    </div>
  )
}

// Helper: blocks all wheel events from propagating to React Flow (which uses native listeners)
function WheelIsolatedDiv({ className, children, style }: { className?: string; children: React.ReactNode; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const stop = (e: WheelEvent) => { e.stopPropagation() }
    el.addEventListener("wheel", stop, { passive: true })
    return () => el.removeEventListener("wheel", stop)
  }, [])
  return <div ref={ref} className={className} style={style}>{children}</div>
}

// 2d. Icon Node Component (service icons from CANVAS_ICONS)
function IconNodeComponent({ id, data, selected, width, height }: NodeProps<CanvasNode>) {
  const actions = useContext(CanvasActionsContext)
  const colorKey = (data.color || "neutral") as NodeColorKey
  const colors = NODE_COLORS[colorKey] || NODE_COLORS.neutral

  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState("")
  const [showIconPicker, setShowIconPicker] = useState(false)

  const handleStartEditing = () => {
    setEditValue(data.label)
    setIsEditing(true)
  }

  const handleSave = () => {
    setIsEditing(false)
    const trimmed = editValue.trim()
    if (trimmed !== data.label) {
      actions?.updateNodeData(id, { label: trimmed })
    }
  }

  const reactFlowInstance = useReactFlow()
  const node = reactFlowInstance.getNode(id)
  const w = width ?? node?.width ?? 100
  const h = height ?? node?.height ?? 100

  const strokeColor = selected ? "var(--accent-primary)" : "var(--border-default)"
  const strokeWidth = selected ? 2.5 : 1.5

  const iconDef = CANVAS_ICONS.find(icon => icon.id === (data.iconId || "aws-lambda")) || CANVAS_ICONS[0]

  return (
    <div className="w-full h-full relative group rounded-xl">
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
            {/* Icon Picker Toggle */}
            <div className="pr-1.5 border-r border-surface-border relative">
              <button
                onClick={() => setShowIconPicker(!showIconPicker)}
                className={cn(
                  "p-1 rounded-lg hover:bg-subtle text-copy-secondary hover:text-brand transition-all duration-150 flex items-center gap-1 text-[10px] font-semibold cursor-pointer",
                  showIconPicker ? "bg-subtle text-brand" : ""
                )}
                title="Choose service icon"
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Icon</span>
              </button>

              {/* Floating Popover Icon Picker */}
              {showIconPicker && (
                <WheelIsolatedDiv 
                  className="absolute top-full left-0 mt-2 w-72 bg-surface/95 backdrop-blur-md border border-surface-border rounded-2xl shadow-2xl p-3 z-50 flex flex-col gap-3 text-copy-primary"
                >
                  <div
                    onPointerDown={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    className="flex flex-col gap-3"
                  >
                  <div className="flex items-center justify-between border-b border-surface-border-subtle pb-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-copy-muted">Select Service Icon</span>
                    <button 
                      onClick={() => setShowIconPicker(false)}
                      className="text-[10px] font-mono hover:text-brand text-copy-secondary cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                  <WheelIsolatedDiv className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 scrollbar-thin max-h-52">
                    {(["cloud", "compute", "database", "messaging", "network", "devops", "client", "security"] as const).map(category => {
                      const catIcons = CANVAS_ICONS.filter(i => i.category === category)
                      if (catIcons.length === 0) return null
                      return (
                        <div key={category} className="flex flex-col gap-1.5 text-left">
                          <span className="text-[9px] font-mono text-copy-faint uppercase tracking-wider">{category}</span>
                          <div className="grid grid-cols-4 gap-1.5">
                            {catIcons.map(icon => {
                              const isSelected = data.iconId === icon.id
                              return (
                                <button
                                  key={icon.id}
                                  onClick={() => {
                                    actions?.updateNodeData(id, { iconId: icon.id })
                                    setShowIconPicker(false)
                                  }}
                                  className={cn(
                                    "p-1.5 rounded-lg flex flex-col items-center justify-center gap-1 transition-all duration-150 hover:bg-subtle cursor-pointer border",
                                    isSelected ? "bg-brand/10 border-brand text-brand" : "border-transparent text-copy-secondary hover:text-copy-primary"
                                  )}
                                  title={icon.label}
                                >
                                  <svg 
                                    viewBox="0 0 24 24" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    strokeWidth="1.5" 
                                    className="w-4 h-4"
                                    dangerouslySetInnerHTML={{ __html: icon.svgContent }}
                                  />
                                  <span className="text-[8px] font-mono truncate max-w-full leading-none scale-95 opacity-80">{icon.label.split(" ")[1] || icon.label}</span>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </WheelIsolatedDiv>
                  </div>
                </WheelIsolatedDiv>
              )}
            </div>

            {/* Color Swatches */}
            <div className="flex items-center gap-1 pr-1.5 border-r border-surface-border">
              {Object.entries(NODE_COLORS).map(([colorKey, colors]) => {
                const isActive = data.color === colorKey || (!data.color && colorKey === "neutral")
                return (
                  <button
                    key={colorKey}
                    onClick={() => actions?.updateNodeData(id, { color: colorKey })}
                    className={cn(
                      "w-4 h-4 rounded-full transition-all duration-150 relative flex items-center justify-center border cursor-pointer",
                      isActive ? "scale-110" : "hover:scale-105"
                    )}
                    style={{
                      backgroundColor: colors.fill,
                      borderColor: isActive ? colors.text : "var(--border-default)",
                    }}
                    title={`${colorKey} theme`}
                  />
                )
              })}
            </div>

            {/* Custom Action Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => actions?.duplicateNode(id)}
                className="p-1 rounded-lg hover:bg-subtle text-copy-secondary hover:text-brand transition-all duration-150 cursor-pointer"
                title="Duplicate node"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </button>
              <button
                onClick={() => actions?.deleteNode(id)}
                className="p-1 rounded-lg hover:bg-subtle text-copy-secondary hover:text-error transition-all duration-150 cursor-pointer"
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

      {/* NodeResizer */}
      <NodeResizer
        color="var(--accent-primary)"
        minWidth={80}
        minHeight={80}
        maxWidth={200}
        maxHeight={200}
        isVisible={selected}
        lineClassName="border-brand"
        handleClassName="h-2.5 w-2.5 bg-white border-2 border-brand rounded-md shadow-md"
      />

      {/* Rounded rect background fill */}
      <div 
        className="w-full h-full rounded-2xl border flex items-center justify-center p-4 transition-all duration-200"
        style={{
          backgroundColor: colors.fill,
          borderColor: strokeColor,
          borderWidth: strokeWidth,
        }}
      >
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          className="w-10 h-10 transition-transform duration-200 group-hover:scale-105"
          style={{ color: colors.text }}
          dangerouslySetInnerHTML={{ __html: iconDef.svgContent }}
        />
      </div>

      {/* Double-click editable label at bottom */}
      {isEditing ? (
        <input
          type="text"
          data-nodrag
          data-nopan
          className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-surface border border-surface-border text-center outline-none text-[10px] font-mono text-copy-primary rounded-md px-1.5 py-0.5 cursor-text nodrag nopan z-20"
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
        <div 
          onDoubleClick={handleStartEditing}
          className="absolute -bottom-7 left-1/2 -translate-x-1/2 font-mono text-[10px] text-copy-secondary whitespace-nowrap z-20 text-center bg-base/90 border border-surface-border px-1.5 py-0.5 rounded backdrop-blur-[1px] hover:text-copy-primary hover:border-copy-muted cursor-pointer transition-colors duration-150 select-none"
        >
          {data.label || <span className="opacity-45 italic">unlabeled</span>}
        </div>
      )}

      {/* Handles */}
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
  stickyNote: StickyNoteNode,
  textBlock: TextBlockNode,
  iconNode: IconNodeComponent,
}

// Edge types registry for React Flow
const edgeTypes = {
  customCanvasEdge: CustomCanvasEdge,
}

// 3. Bottom Shape Panel Toolbar
interface ShapePanelProps {
  onDragStart: (event: React.DragEvent, type: "shape" | "stickyNote" | "textBlock" | "iconNode", shape?: NodeShape) => void
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
          onDragStart={(e) => onDragStart(e, "shape", shape)}
          className="p-2 rounded-xl hover:bg-subtle text-copy-secondary hover:text-brand cursor-grab active:cursor-grabbing transition-all duration-200 group relative flex items-center justify-center"
        >
          {shapeIcons[shape]}
          {/* Custom Tooltip */}
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 rounded-lg bg-surface border border-surface-border text-[9px] text-copy-primary font-mono uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-lg">
            {shape}
          </span>
        </div>
      ))}

      {/* Divider */}
      <div className="w-[1px] h-5 bg-surface-border-subtle" />

      {/* 3 New Drag Targets */}
      <div
        draggable
        onDragStart={(e) => onDragStart(e, "stickyNote")}
        className="p-2 rounded-xl hover:bg-subtle text-copy-secondary hover:text-brand cursor-grab active:cursor-grabbing transition-all duration-200 group relative flex items-center justify-center"
      >
        <StickyNote className="w-5 h-5" />
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 rounded-lg bg-surface border border-surface-border text-[9px] text-copy-primary font-mono uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-lg">
          Sticky Note
        </span>
      </div>

      <div
        draggable
        onDragStart={(e) => onDragStart(e, "textBlock")}
        className="p-2 rounded-xl hover:bg-subtle text-copy-secondary hover:text-brand cursor-grab active:cursor-grabbing transition-all duration-200 group relative flex items-center justify-center"
      >
        <Type className="w-5 h-5" />
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 rounded-lg bg-surface border border-surface-border text-[9px] text-copy-primary font-mono uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-lg">
          Text Block
        </span>
      </div>

      <div
        draggable
        onDragStart={(e) => onDragStart(e, "iconNode")}
        className="p-2 rounded-xl hover:bg-subtle text-copy-secondary hover:text-brand cursor-grab active:cursor-grabbing transition-all duration-200 group relative flex items-center justify-center"
      >
        <Grid className="w-5 h-5" />
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 rounded-lg bg-surface border border-surface-border text-[9px] text-copy-primary font-mono uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-lg">
          Icon Node
        </span>
      </div>
    </div>
  )
}

// 4. Collaborative Canvas (inside ReactFlowProvider)
interface CollaborativeCanvasProps {
  onImportTemplate?: (importFn: (template: CanvasTemplate) => void) => void
  isCommentMode?: boolean
}

function CollaborativeCanvas({ onImportTemplate, isCommentMode = false }: CollaborativeCanvasProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const reactFlowInstance = useReactFlow()

  const { user } = useUser()
  const authorName = user?.fullName || user?.username || "Anonymous"

  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } = useLiveblocksFlow<CanvasNode, CanvasEdge>({
    suspense: true,
    nodes: {
      initial: [],
      sync: {
        "*": {
          label: "atomic",
          color: "atomic",
          shape: "atomic",
          fontSize: "atomic",
          textAlign: "atomic",
          bold: "atomic",
          italic: "atomic",
          iconId: "atomic",
          commentText: "atomic",
          commentAuthor: "atomic",
          commentResolved: "atomic",
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
      const prefix = targetNode.type === "canvasNode" ? (targetNode.data.shape || "rectangle") : targetNode.type
      const newId = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
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
      } as CanvasNode
    })

    onNodesChange([
      ...selectionChanges,
      ...duplicatedNodes.map((n) => ({
        type: "add",
        item: n,
      } as unknown as NodeChange<CanvasNode>)),
    ])
  }, [nodes, onNodesChange])

  // Import a template: clear canvas then populate with template nodes + edges
  const importTemplate = useCallback((template: CanvasTemplate) => {
    // Remove all existing nodes (edges are removed automatically with their nodes)
    const removeNodeChanges = nodes.map((n) => ({
      type: "remove",
      id: n.id,
    } as unknown as NodeChange<CanvasNode>))

    const removeEdgeChanges = edges.map((e) => ({
      type: "remove",
      id: e.id,
    } as unknown as EdgeChange<CanvasEdge>))

    if (removeNodeChanges.length > 0) onNodesChange(removeNodeChanges)
    if (removeEdgeChanges.length > 0) onEdgesChange(removeEdgeChanges)

    // Add template nodes and edges after a micro-tick to allow removal to settle
    setTimeout(() => {
      const addNodeChanges = template.nodes.map((n) => ({
        type: "add",
        item: { ...n },
      } as unknown as NodeChange<CanvasNode>))

      const addEdgeChanges = template.edges.map((e) => ({
        type: "add",
        item: { ...e },
      } as unknown as EdgeChange<CanvasEdge>))

      if (addNodeChanges.length > 0) onNodesChange(addNodeChanges)
      if (addEdgeChanges.length > 0) onEdgesChange(addEdgeChanges)

      setTimeout(() => {
        reactFlowInstance.fitView({ duration: 400, padding: 0.15 })
      }, 80)
    }, 50)
  }, [nodes, edges, onNodesChange, onEdgesChange, reactFlowInstance])

  // Register the import function with the parent component
  useEffect(() => {
    if (onImportTemplate) {
      onImportTemplate(importTemplate)
    }
  }, [onImportTemplate, importTemplate])

  // Lifted Clipboard State
  const [clipboard, setClipboard] = useState<ClipboardNode[] | null>(null)

  // Position-aware Paste Function
  const pasteNodes = useCallback((position?: { x: number; y: number }) => {
    if (!clipboard || clipboard.length === 0) return

    // Determine destination coordinates
    let pasteCenter: { x: number; y: number }
    if (position) {
      pasteCenter = position
    } else {
      // Fallback to center of viewport
      const viewport = reactFlowInstance.getViewport()
      pasteCenter = {
        x: -viewport.x / viewport.zoom + window.innerWidth / (2 * viewport.zoom),
        y: -viewport.y / viewport.zoom + window.innerHeight / (2 * viewport.zoom),
      }
    }

    // Calculate center of copied bounding box
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    clipboard.forEach((node) => {
      const w = node.width || 150
      const h = node.height || 80
      if (node.position.x < minX) minX = node.position.x
      if (node.position.y < minY) minY = node.position.y
      if (node.position.x + w > maxX) maxX = node.position.x + w
      if (node.position.y + h > maxY) maxY = node.position.y + h
    })

    const copiedCenter = {
      x: minX + (maxX - minX) / 2,
      y: minY + (maxY - minY) / 2,
    }

    // Deselect currently selected
    const selectionChanges = nodes
      .filter((n) => n.selected)
      .map((n) => ({
        id: n.id,
        type: "select",
        selected: false,
      } as unknown as NodeChange<CanvasNode>))

    const newNodes: CanvasNode[] = clipboard.map((node) => {
      const type = node.type || "canvasNode"
      const id = `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
      
      const offsetX = node.position.x - copiedCenter.x
      const offsetY = node.position.y - copiedCenter.y

      return {
        id,
        type,
        position: {
          x: pasteCenter.x + offsetX,
          y: pasteCenter.y + offsetY,
        },
        data: { ...node.data },
        width: node.width,
        height: node.height,
        selected: true,
      } as CanvasNode
    })

    onNodesChange([
      ...selectionChanges,
      ...newNodes.map((n) => ({
        type: "add",
        item: n,
      } as unknown as NodeChange<CanvasNode>))
    ])
  }, [clipboard, nodes, onNodesChange, reactFlowInstance])

  // Bind viewport and history keyboard shortcuts
  useKeyboardShortcuts({
    reactFlowInstance,
    undo,
    redo,
    nodes,
    addNodes,
    deleteSelectedNodes,
    duplicateSelectedNodes,
    clipboard,
    setClipboard,
    pasteNodes,
  })

  // Handles drag start payload (supports shapes, sticky notes, text blocks, icon nodes)
  const handleDragStart = useCallback((event: React.DragEvent, type: "shape" | "stickyNote" | "textBlock" | "iconNode", shape?: NodeShape) => {
    let width = 150
    let height = 80
    if (type === "shape" && shape) {
      switch (shape) {
        case "rectangle": width = 150; height = 80; break
        case "diamond": width = 120; height = 120; break
        case "circle": width = 80; height = 80; break
        case "pill": width = 120; height = 60; break
        case "cylinder": width = 100; height = 100; break
        case "hexagon": width = 120; height = 100; break
      }
      event.dataTransfer.setData("application/reactflow/shape", shape)
    } else {
      switch (type) {
        case "stickyNote": width = 180; height = 120; break
        case "textBlock": width = 200; height = 60; break
        case "iconNode": width = 100; height = 100; break
      }
    }

    event.dataTransfer.setData("application/reactflow/type", type)
    event.dataTransfer.setData("application/reactflow/width", String(width))
    event.dataTransfer.setData("application/reactflow/height", String(height))
    event.dataTransfer.effectAllowed = "move"
  }, [])

  // Drag over handler
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
  }, [])

  // Drop handler to create nodes (types: shape, stickyNote, textBlock, iconNode)
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      if (!reactFlowWrapper.current) return

      const itemType = event.dataTransfer.getData("application/reactflow/type") as "shape" | "stickyNote" | "textBlock" | "iconNode"
      const shape = event.dataTransfer.getData("application/reactflow/shape") as NodeShape | ""
      const widthStr = event.dataTransfer.getData("application/reactflow/width")
      const heightStr = event.dataTransfer.getData("application/reactflow/height")

      if (!itemType) return

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
      const prefix = itemType === "shape" ? (shape || "node") : itemType
      const id = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`

      const newNode: CanvasNode = {
        id,
        type: itemType === "shape" ? "canvasNode" : itemType,
        position: centerPosition,
        data: {
          label: "",
          ...(itemType === "shape" ? { shape, color: "neutral" } : {}),
          ...(itemType === "stickyNote" ? { color: "yellow", fontSize: "md", textAlign: "left" } : {}),
          ...(itemType === "textBlock" ? { color: "neutral", fontSize: "md", textAlign: "center" } : {}),
          ...(itemType === "iconNode" ? { color: "neutral", iconId: "aws-lambda" } : {}),
        },
        width,
        height,
      } as CanvasNode

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

    const prefix = targetNode.type === "canvasNode" ? (targetNode.data.shape || "rectangle") : targetNode.type
    const newId = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    
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
        y: targetNode.position.y - 45, // Offset above and to the right
      },
      data: { ...targetNode.data },
      width: targetNode.width,
      height: targetNode.height,
      selected: true,
    } as CanvasNode

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

  // Collaborative mutation to update node data properties
  const updateNodeData = useMutation(({ storage }, nodeId: string, partialData: Record<string, unknown>) => {
    const flow = (storage as unknown as LiveObjectLike).get("flow") as LiveObjectLike
    if (!flow) return
    const nodesMap = flow.get("nodes") as LiveObjectLike
    if (!nodesMap) return
    const nodeObj = nodesMap.get(nodeId) as LiveObjectLike
    if (!nodeObj) return
    const dataObj = nodeObj.get("data") as LiveObjectLike
    if (dataObj) {
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
    }
  }, [])

  // Context Menu state
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null)

  const onPaneContextMenu = useCallback((event: React.MouseEvent<Element, MouseEvent> | MouseEvent) => {
    event.preventDefault()
    setMenuPosition({
      x: event.clientX,
      y: event.clientY,
    })
  }, [])

  const handleAddStickyFromMenu = useCallback(() => {
    if (!menuPosition) return
    const position = reactFlowInstance.screenToFlowPosition({
      x: menuPosition.x,
      y: menuPosition.y,
    })
    const id = `sticky_${crypto.randomUUID()}`
    const newNode: CanvasNode = {
      id,
      type: "stickyNote",
      position: { x: position.x - 90, y: position.y - 60 },
      data: {
        label: "",
        color: "yellow",
        fontSize: "md",
        textAlign: "left",
      },
      width: 180,
      height: 120,
    }
    onNodesChange([{ type: "add", item: newNode } as any])
  }, [menuPosition, reactFlowInstance, onNodesChange])

  const handleAddTextBlockFromMenu = useCallback(() => {
    if (!menuPosition) return
    const position = reactFlowInstance.screenToFlowPosition({
      x: menuPosition.x,
      y: menuPosition.y,
    })
    const id = `text_${Date.now()}`
    const newNode: CanvasNode = {
      id,
      type: "textBlock",
      position: { x: position.x - 100, y: position.y - 30 },
      data: {
        label: "",
        color: "neutral",
        fontSize: "md",
        textAlign: "center",
      },
      width: 200,
      height: 60,
    }
    onNodesChange([{ type: "add", item: newNode } as any])
  }, [menuPosition, reactFlowInstance, onNodesChange])

  const handleAddIconNodeFromMenu = useCallback(() => {
    if (!menuPosition) return
    const position = reactFlowInstance.screenToFlowPosition({
      x: menuPosition.x,
      y: menuPosition.y,
    })
    const id = `icon_${crypto.randomUUID()}`
    const newNode: CanvasNode = {
      id,
      type: "iconNode",
      position: { x: position.x - 50, y: position.y - 50 },
      data: {
        label: "",
        color: "neutral",
        iconId: "aws-lambda",
      },
      width: 100,
      height: 100,
    }
    onNodesChange([{ type: "add", item: newNode } as any])
  }, [menuPosition, reactFlowInstance, onNodesChange])

  const handleSelectAll = useCallback(() => {
    const changes = nodes.map(n => ({
      id: n.id,
      type: "select",
      selected: true,
    } as unknown as NodeChange<CanvasNode>))
    onNodesChange(changes)
  }, [nodes, onNodesChange])

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href)
  }, [])

  // Connection-drop-to-create state & refs
  const connectStartRef = useRef<{ nodeId: string; handleId: string | null; handleType: string | null } | null>(null)

  const onConnectStart = useCallback((event: any, { nodeId, handleId, handleType }: any) => {
    connectStartRef.current = { nodeId, handleId, handleType }
  }, [])

  const onConnectEnd = useCallback((event: any) => {
    if (!connectStartRef.current) return

    const target = event.target as HTMLElement
    const isPane = target.classList.contains("react-flow__pane") || target.classList.contains("react-flow__transformationpane")
    
    if (isPane && reactFlowWrapper.current) {
      const { nodeId: sourceId, handleId: sourceHandleId, handleType: sourceHandleType } = connectStartRef.current

      // Calculate position
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })

      const newId = `node_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
      const newNode: CanvasNode = {
        id: newId,
        type: "canvasNode",
        position: {
          x: position.x - 75,
          y: position.y - 30,
        },
        data: {
          label: "",
          shape: "rectangle",
          color: "neutral",
        },
        width: 150,
        height: 60,
      }

      onNodesChange([
        {
          type: "add",
          item: newNode,
        } as unknown as NodeChange<CanvasNode>
      ])

      const edgeId = `edge_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
      const newEdge: CanvasEdge = {
        id: edgeId,
        type: "customCanvasEdge",
        source: sourceHandleType === "source" ? sourceId : newId,
        target: sourceHandleType === "source" ? newId : sourceId,
        sourceHandle: sourceHandleType === "source" ? (sourceHandleId || "r") : "l",
        targetHandle: sourceHandleType === "source" ? "l" : (sourceHandleId || "r"),
        data: {
          directed: true,
        }
      }

      setTimeout(() => {
        onEdgesChange([
          {
            type: "add",
            item: newEdge,
          } as unknown as EdgeChange<CanvasEdge>
        ])
      }, 50)
    }

    connectStartRef.current = null
  }, [reactFlowInstance, onNodesChange, onEdgesChange])

  // Comment Mode Pane Click handler
  const onPaneClick = useCallback((event: React.MouseEvent<Element, MouseEvent> | MouseEvent) => {
    if (!isCommentMode || !reactFlowWrapper.current) return

    const position = reactFlowInstance.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    })

    const id = `comment_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    const newCommentNode: CanvasNode = {
      id,
      type: "stickyNote",
      position: {
        x: position.x - 90,
        y: position.y - 60,
      },
      data: {
        label: "",
        color: "yellow",
        fontSize: "md",
        textAlign: "left",
        commentText: "",
        commentAuthor: authorName,
        commentResolved: false,
      },
      width: 180,
      height: 120,
    }

    onNodesChange([
      {
        type: "add",
        item: newCommentNode,
      } as unknown as NodeChange<CanvasNode>
    ])
  }, [isCommentMode, reactFlowInstance, onNodesChange, authorName])

  return (
    <CanvasActionsContext.Provider value={{ deleteNode, duplicateNode, deleteEdge, updateEdgeData, updateNodeData }}>
      <div 
        ref={reactFlowWrapper} 
        className={cn(
          "w-full h-full relative select-none",
          isCommentMode ? "cursor-comment" : ""
        )}
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
          onPaneContextMenu={onPaneContextMenu}
          onConnectStart={onConnectStart}
          onConnectEnd={onConnectEnd}
          onPaneClick={onPaneClick}
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

        {/* Floating Context Menu */}
        {menuPosition && (
          <CanvasContextMenu
            x={menuPosition.x}
            y={menuPosition.y}
            onClose={() => setMenuPosition(null)}
            onPaste={() => {
              const flowPos = reactFlowInstance.screenToFlowPosition({
                x: menuPosition.x,
                y: menuPosition.y,
              })
              pasteNodes(flowPos)
            }}
            onSelectAll={handleSelectAll}
            onFitView={() => reactFlowInstance.fitView({ duration: 400 })}
            onAddSticky={handleAddStickyFromMenu}
            onAddTextBlock={handleAddTextBlockFromMenu}
            onAddIconNode={handleAddIconNodeFromMenu}
            onZoomIn={() => reactFlowInstance.zoomIn()}
            onZoomOut={() => reactFlowInstance.zoomOut()}
            onCopyLink={handleCopyLink}
            hasClipboardItems={!!clipboard && clipboard.length > 0}
          />
        )}

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
export function Canvas({ roomId, onImportTemplate, isCommentMode = false }: CanvasWrapperProps) {
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
                <CollaborativeCanvas onImportTemplate={onImportTemplate} isCommentMode={isCommentMode} />
              </ReactFlowProvider>
            </ClientSideSuspense>
          </RoomProvider>
        </LiveblocksProvider>
      </CanvasErrorBoundary>
    </div>
  )
}
