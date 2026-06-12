"use client"

import React from "react"
import { StickyNote, Type, Grid } from "lucide-react"
import { cn } from "@/lib/utils"
import { NodeShape, NODE_SHAPES } from "@/types/canvas"

interface ShapePanelProps {
  onDragStart: (event: React.DragEvent, type: "shape" | "stickyNote" | "textBlock" | "iconNode", shape?: NodeShape) => void
}

export function ShapePanel({ onDragStart }: ShapePanelProps) {
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
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-surface/90 backdrop-blur-md border border-surface-border px-3 py-1.5 md:px-4 md:py-2 rounded-2xl shadow-2xl flex flex-wrap items-center justify-center gap-2 md:gap-3 z-30 animate-in slide-in-from-bottom-5 duration-300 max-w-[calc(100vw-2rem)] md:max-w-none animate-in fade-in">
      <div className="hidden md:block text-[10px] font-mono text-copy-muted pr-3 border-r border-surface-border select-none uppercase tracking-wider">
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
      <div className="hidden md:block w-[1px] h-5 bg-surface-border-subtle" />

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
