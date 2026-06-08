"use client"

import React from "react"
import { useReactFlow, useViewport } from "@xyflow/react"
import { useUndo, useRedo, useCanUndo, useCanRedo } from "@liveblocks/react/suspense"
import { Undo2, Redo2, Minus, Plus, Maximize2 } from "lucide-react"

export function CanvasControls() {
  const { zoomIn, zoomOut, zoomTo, fitView } = useReactFlow()
  const { zoom } = useViewport()
  
  const undo = useUndo()
  const redo = useRedo()
  const canUndo = useCanUndo()
  const canRedo = useCanRedo()
  
  const zoomPercentage = Math.round(zoom * 100)
  
  return (
    <div className="absolute bottom-[5.5rem] right-4 md:bottom-6 md:right-6 z-50 flex items-center gap-2 bg-surface/90 backdrop-blur-md border border-surface-border p-1.5 rounded-xl shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200">
      {/* Collaborative History Group */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => undo()}
          disabled={!canUndo}
          aria-label="Undo last collaborative action"
          className="p-1.5 rounded-lg hover:bg-subtle text-copy-secondary hover:text-copy-primary disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-copy-secondary transition-all duration-150 flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => redo()}
          disabled={!canRedo}
          aria-label="Redo last reverted action"
          className="p-1.5 rounded-lg hover:bg-subtle text-copy-secondary hover:text-copy-primary disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-copy-secondary transition-all duration-150 flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Vertical Divider */}
      <div className="w-px h-4 bg-surface-border" aria-hidden="true" />

      {/* Viewport Zoom & Fit Group */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => zoomOut()}
          aria-label="Zoom out canvas view"
          className="p-1.5 rounded-lg hover:bg-subtle text-copy-secondary hover:text-copy-primary transition-all duration-150 flex items-center justify-center cursor-pointer"
          title="Zoom Out"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        
        <button
          onClick={() => zoomTo(1, { duration: 300 })}
          aria-label={`Current zoom is ${zoomPercentage} percent. Reset zoom to 100 percent`}
          className="px-1.5 text-[10px] font-mono font-semibold text-copy-muted hover:text-copy-primary transition-colors duration-150 cursor-pointer min-w-[40px] text-center"
          title="Reset Zoom to 100%"
        >
          {zoomPercentage}%
        </button>

        <button
          onClick={() => zoomIn()}
          aria-label="Zoom in canvas view"
          className="p-1.5 rounded-lg hover:bg-subtle text-copy-secondary hover:text-copy-primary transition-all duration-150 flex items-center justify-center cursor-pointer"
          title="Zoom In"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => fitView({ padding: 0.2, duration: 400 })}
          aria-label="Fit canvas view to show all elements"
          className="p-1.5 rounded-lg hover:bg-subtle text-copy-secondary hover:text-copy-primary transition-all duration-150 flex items-center justify-center cursor-pointer"
          title="Fit View"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
