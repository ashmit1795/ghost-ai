"use client"

import React, { useState, useContext } from "react"
import { useReactFlow, NodeProps, NodeResizer, NodeToolbar, Position } from "@xyflow/react"
import { Bold, Italic, AlignLeft, AlignCenter, AlignRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { CanvasNode, NODE_FONT_SIZES } from "@/types/canvas"
import { CanvasActionsContext } from "./canvas"

export function TextBlockNode({ id, data, selected, width, height }: NodeProps<CanvasNode>) {
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
