"use client"

import React, { useState, useContext } from "react"
import { useReactFlow, Handle, Position, NodeProps, NodeResizer, NodeToolbar } from "@xyflow/react"
import { Bold, Italic, AlignLeft, AlignCenter, AlignRight, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { CanvasNode, STICKY_COLORS, StickyColorKey, NODE_FONT_SIZES } from "@/types/canvas"
import { CanvasActionsContext } from "./canvas"

function getInitials(name?: string) {
  if (!name) return "?"
  return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
}

export function StickyNoteNode({ id, data, selected, width, height }: NodeProps<CanvasNode>) {
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
