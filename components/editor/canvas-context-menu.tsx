"use client"

import React, { useEffect, useRef } from "react"
import { Clipboard, Maximize, ZoomIn, ZoomOut, Link, StickyNote, Type, BoxSelect } from "lucide-react"
import { cn } from "@/lib/utils"

interface CanvasContextMenuProps {
  x: number
  y: number
  onClose: () => void
  onPaste: () => void
  onSelectAll: () => void
  onFitView: () => void
  onAddSticky: () => void
  onAddTextBlock: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onCopyLink: () => void
  hasClipboardItems?: boolean
}

export function CanvasContextMenu({
  x,
  y,
  onClose,
  onPaste,
  onSelectAll,
  onFitView,
  onAddSticky,
  onAddTextBlock,
  onZoomIn,
  onZoomOut,
  onCopyLink,
  hasClipboardItems = false,
}: CanvasContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [onClose])

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose()
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [onClose])

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[180px] bg-surface/95 backdrop-blur-md border border-surface-border rounded-2xl shadow-2xl p-1.5 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100 select-none text-copy-primary"
      style={{
        top: y,
        left: x,
      }}
      onContextMenu={(e) => e.preventDefault()}
      onWheel={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => {
          onAddSticky()
          onClose()
        }}
        className="flex items-center gap-2.5 px-3 py-2 text-xs text-copy-secondary hover:text-copy-primary hover:bg-subtle rounded-xl transition-all duration-150 text-left w-full cursor-pointer"
      >
        <StickyNote className="h-3.5 w-3.5 text-copy-muted" />
        <span>Add Sticky Note</span>
      </button>

      <button
        onClick={() => {
          onAddTextBlock()
          onClose()
        }}
        className="flex items-center gap-2.5 px-3 py-2 text-xs text-copy-secondary hover:text-copy-primary hover:bg-subtle rounded-xl transition-all duration-150 text-left w-full cursor-pointer"
      >
        <Type className="h-3.5 w-3.5 text-copy-muted" />
        <span>Add Text Block</span>
      </button>

      <div className="h-[1px] bg-surface-border-subtle my-1" />

      <button
        onClick={() => {
          onPaste()
          onClose()
        }}
        disabled={!hasClipboardItems}
        className={cn(
          "flex items-center justify-between px-3 py-2 text-xs rounded-xl transition-all duration-150 text-left w-full cursor-pointer",
          hasClipboardItems 
            ? "text-copy-secondary hover:text-copy-primary hover:bg-subtle" 
            : "text-copy-faint opacity-50 cursor-not-allowed"
        )}
      >
        <div className="flex items-center gap-2.5">
          <Clipboard className="h-3.5 w-3.5" />
          <span>Paste</span>
        </div>
        <span className="text-[10px] font-mono text-copy-faint">Ctrl+V</span>
      </button>

      <button
        onClick={() => {
          onSelectAll()
          onClose()
        }}
        className="flex items-center justify-between px-3 py-2 text-xs text-copy-secondary hover:text-copy-primary hover:bg-subtle rounded-xl transition-all duration-150 text-left w-full cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <BoxSelect className="h-3.5 w-3.5 text-copy-muted" />
          <span>Select All</span>
        </div>
        <span className="text-[10px] font-mono text-copy-faint">Ctrl+A</span>
      </button>

      <div className="h-[1px] bg-surface-border-subtle my-1" />

      <button
        onClick={() => {
          onFitView()
          onClose()
        }}
        className="flex items-center justify-between px-3 py-2 text-xs text-copy-secondary hover:text-copy-primary hover:bg-subtle rounded-xl transition-all duration-150 text-left w-full cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <Maximize className="h-3.5 w-3.5 text-copy-muted" />
          <span>Fit View</span>
        </div>
        <span className="text-[10px] font-mono text-copy-faint">F</span>
      </button>

      <button
        onClick={() => {
          onZoomIn()
          onClose()
        }}
        className="flex items-center justify-between px-3 py-2 text-xs text-copy-secondary hover:text-copy-primary hover:bg-subtle rounded-xl transition-all duration-150 text-left w-full cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <ZoomIn className="h-3.5 w-3.5 text-copy-muted" />
          <span>Zoom In</span>
        </div>
        <span className="text-[10px] font-mono text-copy-faint">+</span>
      </button>

      <button
        onClick={() => {
          onZoomOut()
          onClose()
        }}
        className="flex items-center justify-between px-3 py-2 text-xs text-copy-secondary hover:text-copy-primary hover:bg-subtle rounded-xl transition-all duration-150 text-left w-full cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <ZoomOut className="h-3.5 w-3.5 text-copy-muted" />
          <span>Zoom Out</span>
        </div>
        <span className="text-[10px] font-mono text-copy-faint">-</span>
      </button>

      <div className="h-[1px] bg-surface-border-subtle my-1" />

      <button
        onClick={() => {
          onCopyLink()
          onClose()
        }}
        className="flex items-center gap-2.5 px-3 py-2 text-xs text-copy-secondary hover:text-copy-primary hover:bg-subtle rounded-xl transition-all duration-150 text-left w-full cursor-pointer"
      >
        <Link className="h-3.5 w-3.5 text-copy-muted" />
        <span>Copy Canvas Link</span>
      </button>
    </div>
  )
}
