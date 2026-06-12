"use client"

import React, { useState, useContext, useRef, useEffect } from "react"
import { useReactFlow, Handle, Position, NodeProps, NodeResizer, NodeToolbar } from "@xyflow/react"
import { Grid } from "lucide-react"
import { cn } from "@/lib/utils"
import { CanvasNode, NODE_COLORS, NodeColorKey, CANVAS_ICONS } from "@/types/canvas"
import { CanvasActionsContext } from "./canvas"

// Helper: blocks all wheel events from propagating to React Flow (which uses native listeners)
export function WheelIsolatedDiv({ className, children, style }: { className?: string; children: React.ReactNode; style?: React.CSSProperties }) {
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

export function IconNodeComponent({ id, data, selected, width, height }: NodeProps<CanvasNode>) {
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
