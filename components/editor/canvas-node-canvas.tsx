"use client"

import React, { useState, useContext } from "react"
import { useReactFlow, Handle, Position, NodeProps, NodeResizer, NodeToolbar } from "@xyflow/react"
import { cn } from "@/lib/utils"
import { CanvasNode, NODE_COLORS, NODE_SHAPES, NodeColorKey } from "@/types/canvas"
import { CanvasActionsContext } from "./canvas"

export function CanvasNodeComponent({ id, data, selected, width, height }: NodeProps<CanvasNode>) {
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

      {/* Connection Handles: Top, Right, Bottom, Left */}
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
