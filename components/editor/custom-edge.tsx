"use client"

import React, { useState, useContext, useRef, useEffect } from "react"
import { BaseEdge, EdgeProps, EdgeLabelRenderer, useReactFlow, getSmoothStepPath, MarkerType } from "@xyflow/react"
import { cn } from "@/lib/utils"
import { CanvasEdge } from "@/types/canvas"

// Import CanvasActionsContext from canvas.tsx
import { CanvasActionsContext } from "./canvas"

export function CustomCanvasEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
  selected,
}: EdgeProps<CanvasEdge>) {
  const actions = useContext(CanvasActionsContext)
  const reactFlow = useReactFlow()
  const dragHandleRef = useRef<HTMLDivElement>(null)

  const [isEditing, setIsEditing] = useState(false)
  const [labelText, setLabelText] = useState(data?.label || "")

  // Sync local labelText when data?.label changes from other collaborators
  useEffect(() => {
    if (!isEditing) {
      setLabelText(data?.label || "")
    }
  }, [data?.label, isEditing])

  // 1. Calculate path coordinates using hybrid routing:
  // - Untouched / Default: right-angled smoothstep path
  // - Dragged / Customized: quadratic bezier curve
  const isCustomPath =
    data?.controlX !== undefined &&
    data?.controlY !== undefined &&
    data?.controlX !== null &&
    data?.controlY !== null

  let path = ""
  let labelX = 0
  let labelY = 0
  let cx = 0
  let cy = 0

  if (!isCustomPath) {
    const [smoothPath, sx, sy] = getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    })
    path = smoothPath
    labelX = sx
    labelY = sy
    cx = sx
    cy = sy
  } else {
    cx = data.controlX!
    cy = data.controlY!
    path = `M ${sourceX},${sourceY} Q ${cx},${cy} ${targetX},${targetY}`
    // Quadratic Bezier midpoint formula (t = 0.5)
    labelX = 0.25 * sourceX + 0.5 * cx + 0.25 * targetX
    labelY = 0.25 * sourceY + 0.5 * cy + 0.25 * targetY
  }

  // 2. Drag handle logic for mouse adjustments
  const handlePointerDown = (event: React.PointerEvent) => {
    // Only start dragging for primary mouse input
    if (event.pointerType !== "mouse" || event.button !== 0) {
      return
    }

    event.stopPropagation()
    event.preventDefault() // Prevent canvas panning

    const onPointerMove = (e: PointerEvent) => {
      const flowPos = reactFlow.screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      })
      actions?.updateEdgeData(id, {
        controlX: flowPos.x,
        controlY: flowPos.y,
      })
    }

    const onPointerUp = () => {
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerup", onPointerUp)
    }

    window.addEventListener("pointermove", onPointerMove)
    window.addEventListener("pointerup", onPointerUp)
  }

  // 3. Save label handler
  const handleSaveLabel = () => {
    setIsEditing(false)
    const trimmed = labelText.trim()
    actions?.updateEdgeData(id, { label: trimmed })
  }

  const isDirected = data?.directed !== false

  // Create a default markerEnd config if none is supplied or if we want to dynamically color it
  let resolvedMarkerEnd = undefined
  if (isDirected) {
    const color = selected ? "var(--accent-primary)" : "var(--border-default)"
    if (typeof markerEnd === "object" && markerEnd !== null) {
      resolvedMarkerEnd = {
        ...(markerEnd as any),
        color,
      }
    } else if (typeof markerEnd === "string") {
      resolvedMarkerEnd = markerEnd
    } else {
      resolvedMarkerEnd = {
        type: MarkerType.ArrowClosed,
        width: 16,
        height: 16,
        color,
      }
    }
  }

  return (
    <>
      {/* Visual Edge Path with optional Marker Arrow */}
      <g
        onDoubleClick={(e) => {
          e.stopPropagation()
          setLabelText(data?.label || "")
          setIsEditing(true)
        }}
      >
        <BaseEdge
          path={path}
          style={{
            ...style,
            stroke: selected ? "var(--accent-primary)" : "var(--border-default)",
            strokeWidth: selected ? 2 : 1.5,
            transition: "stroke 0.15s ease",
          }}
          markerEnd={resolvedMarkerEnd}
        />
        {/* Invisible thick path to make selection and double-clicking easy */}
        <path
          d={path}
          fill="none"
          stroke="transparent"
          strokeWidth={15}
          className="cursor-pointer pointer-events-auto"
        />
      </g>

      {/* HTML Overlays (Drag Handle, Toolbar, Labels) inside EdgeLabelRenderer */}
      <EdgeLabelRenderer>
        {/* A. Draggable Path Control Handle */}
        {selected && (
          <div
            ref={dragHandleRef}
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${cx}px,${cy}px)`,
              pointerEvents: "all",
            }}
            className="nodrag nopan z-30"
            onPointerDown={handlePointerDown}
          >
            <div
              className="w-3.5 h-3.5 rounded-full bg-brand border-2 border-white shadow-lg cursor-grab active:cursor-grabbing hover:scale-115 transition-transform"
              title="Drag to adjust path"
            />
          </div>
        )}

        {/* B. Inline Label Editor / Badge */}
        {isEditing ? (
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
            }}
            className="nodrag nopan z-40"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="text"
              value={labelText}
              onChange={(e) => setLabelText(e.target.value)}
              onBlur={handleSaveLabel}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveLabel()
                if (e.key === "Escape") {
                  setLabelText(data?.label || "")
                  setIsEditing(false)
                }
              }}
              className="bg-surface border border-surface-border text-copy-primary rounded-xl px-2.5 py-1 text-xs outline-none focus:ring-1 focus:ring-brand w-28 text-center cursor-text select-text shadow-xl"
              autoFocus
            />
          </div>
        ) : (
          data?.label ? (
            <div
              style={{
                position: "absolute",
                transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                pointerEvents: "all",
              }}
              className="nodrag nopan z-20"
              onDoubleClick={(e) => {
                e.stopPropagation()
                setLabelText(data.label || "")
                setIsEditing(true)
              }}
            >
              <div className="bg-surface/90 backdrop-blur-sm border border-surface-border text-copy-primary rounded-full px-2.5 py-1 text-[10px] font-medium tracking-wide shadow-md cursor-pointer hover:border-brand transition-colors">
                {data.label}
              </div>
            </div>
          ) : (
            selected && (
              <div
                style={{
                  position: "absolute",
                  transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                  pointerEvents: "all",
                }}
                className="nodrag nopan z-20 opacity-50 hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation()
                  setLabelText("")
                  setIsEditing(true)
                }}
              >
                <div className="bg-surface/60 border border-dashed border-surface-border text-copy-muted rounded-full px-2.5 py-0.5 text-[9px] font-mono cursor-pointer uppercase tracking-wider">
                  Add Label
                </div>
              </div>
            )
          )
        )}

        {/* C. Floating Customization Toolbar */}
        {selected && !isEditing && (
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -100%) translate(${labelX}px,${labelY - 14}px)`,
              pointerEvents: "all",
            }}
            className="nodrag nopan z-30 animate-in fade-in zoom-in-95 duration-150"
            onKeyDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-1.5 bg-surface/95 backdrop-blur-md border border-surface-border shadow-2xl rounded-xl p-1">
              {/* Directed vs Undirected Mode Toggle */}
              <button
                onClick={() => actions?.updateEdgeData(id, { directed: !isDirected })}
                className={cn(
                  "p-1 rounded-lg hover:bg-subtle text-copy-secondary transition-all duration-150 flex items-center justify-center",
                  isDirected ? "text-brand hover:text-brand" : "hover:text-brand"
                )}
                title={isDirected ? "Change to simple undirected line" : "Change to directed arrow"}
              >
                {isDirected ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                )}
              </button>

              {/* Reset Path (if path is customized) */}
              {isCustomPath && (
                <button
                  onClick={() => actions?.updateEdgeData(id, { controlX: null, controlY: null })}
                  className="p-1 rounded-lg hover:bg-subtle text-copy-secondary hover:text-brand transition-all duration-150 flex items-center justify-center"
                  title="Reset edge path to default style"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                  </svg>
                </button>
              )}

              {/* Delete Edge */}
              <button
                onClick={() => actions?.deleteEdge(id)}
                className="p-1 rounded-lg hover:bg-subtle text-copy-secondary hover:text-error transition-all duration-150 flex items-center justify-center"
                title="Delete connection"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
                  <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  )
}
