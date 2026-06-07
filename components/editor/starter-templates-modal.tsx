"use client"

import { useMemo, useRef, useEffect } from "react"
import { X, Download, Layers } from "lucide-react"
import { cn } from "@/lib/utils"
import { CANVAS_TEMPLATES, CanvasTemplate } from "./starter-templates"
import { CanvasNode, CanvasEdge, NODE_COLORS, NodeColorKey, NodeShape } from "@/types/canvas"

interface StarterTemplatesModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (template: CanvasTemplate) => void
}

// ─── Mini Preview Renderer ────────────────────────────────────────────────────

const PREVIEW_W = 260
const PREVIEW_H = 160
const NODE_PADDING = 8

interface PreviewBounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

function computeBounds(nodes: CanvasNode[]): PreviewBounds {
  if (nodes.length === 0) return { minX: 0, minY: 0, maxX: 300, maxY: 200 }
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const n of nodes) {
    const x = n.position.x
    const y = n.position.y
    const w = n.width ?? 150
    const h = n.height ?? 60
    minX = Math.min(minX, x)
    minY = Math.min(minY, y)
    maxX = Math.max(maxX, x + w)
    maxY = Math.max(maxY, y + h)
  }
  return { minX, minY, maxX, maxY }
}

function getNodeCenter(node: CanvasNode, bounds: PreviewBounds, scale: number, offsetX: number, offsetY: number) {
  const w = node.width ?? 150
  const h = node.height ?? 60
  const cx = (node.position.x + w / 2 - bounds.minX) * scale + NODE_PADDING + offsetX
  const cy = (node.position.y + h / 2 - bounds.minY) * scale + NODE_PADDING + offsetY
  return { cx, cy }
}

function getNodeColors(node: CanvasNode) {
  const colorKey = (node.data.color || "neutral") as NodeColorKey
  return NODE_COLORS[colorKey] || NODE_COLORS.neutral
}

function renderNodeShape(
  node: CanvasNode,
  bounds: PreviewBounds,
  scale: number,
  offsetX: number,
  offsetY: number,
  index: number
) {
  const w = Math.max((node.width ?? 150) * scale, 20)
  const h = Math.max((node.height ?? 60) * scale, 12)
  const x = (node.position.x - bounds.minX) * scale + NODE_PADDING + offsetX
  const y = (node.position.y - bounds.minY) * scale + NODE_PADDING + offsetY
  const shape: NodeShape = node.data.shape ?? "rectangle"
  const colors = getNodeColors(node)

  const fill = colors.fill
  const stroke = colors.text + "80" // semi-transparent stroke

  switch (shape) {
    case "rectangle":
      return (
        <rect
          key={index}
          x={x}
          y={y}
          width={w}
          height={h}
          rx={4}
          fill={fill}
          stroke={stroke}
          strokeWidth={1}
        />
      )
    case "circle":
      return (
        <ellipse
          key={index}
          cx={x + w / 2}
          cy={y + h / 2}
          rx={w / 2}
          ry={h / 2}
          fill={fill}
          stroke={stroke}
          strokeWidth={1}
        />
      )
    case "pill":
      return (
        <rect
          key={index}
          x={x}
          y={y}
          width={w}
          height={h}
          rx={h / 2}
          fill={fill}
          stroke={stroke}
          strokeWidth={1}
        />
      )
    case "diamond": {
      const cx = x + w / 2
      const cy = y + h / 2
      return (
        <path
          key={index}
          d={`M ${cx} ${y} L ${x + w} ${cy} L ${cx} ${y + h} L ${x} ${cy} Z`}
          fill={fill}
          stroke={stroke}
          strokeWidth={1}
        />
      )
    }
    case "hexagon": {
      const hw = w * 0.25
      return (
        <path
          key={index}
          d={`M ${x + hw} ${y} L ${x + w - hw} ${y} L ${x + w} ${y + h / 2} L ${x + w - hw} ${y + h} L ${x + hw} ${y + h} L ${x} ${y + h / 2} Z`}
          fill={fill}
          stroke={stroke}
          strokeWidth={1}
        />
      )
    }
    case "cylinder":
      return (
        <g key={index}>
          <path
            d={`M ${x} ${y + 8} L ${x} ${y + h - 8} A ${w / 2} 5 0 0 0 ${x + w} ${y + h - 8} L ${x + w} ${y + 8} Z`}
            fill={fill}
            stroke={stroke}
            strokeWidth={1}
          />
          <ellipse
            cx={x + w / 2}
            cy={y + 8}
            rx={w / 2}
            ry={5}
            fill={fill}
            stroke={stroke}
            strokeWidth={1}
          />
        </g>
      )
    default:
      return (
        <rect
          key={index}
          x={x}
          y={y}
          width={w}
          height={h}
          rx={4}
          fill={fill}
          stroke={stroke}
          strokeWidth={1}
        />
      )
  }
}

interface TemplateMiniPreviewProps {
  nodes: CanvasNode[]
  edges: CanvasEdge[]
}

function TemplateMiniPreview({ nodes, edges }: TemplateMiniPreviewProps) {
  const bounds = useMemo(() => computeBounds(nodes), [nodes])

  const contentW = bounds.maxX - bounds.minX
  const contentH = bounds.maxY - bounds.minY

  const availW = PREVIEW_W - NODE_PADDING * 2
  const availH = PREVIEW_H - NODE_PADDING * 2

  const scale = Math.min(availW / (contentW || 1), availH / (contentH || 1), 1)

  const scaledW = contentW * scale
  const scaledH = contentH * scale

  const offsetX = (availW - scaledW) / 2
  const offsetY = (availH - scaledH) / 2

  const transform = useMemo(() => ({ scale, offsetX, offsetY }), [scale, offsetX, offsetY])

  // Build a node center map for edge rendering
  const centerMap = useMemo(() => {
    const map: Record<string, { cx: number; cy: number }> = {}
    for (const n of nodes) {
      map[n.id] = getNodeCenter(n, bounds, transform.scale, transform.offsetX, transform.offsetY)
    }
    return map
  }, [nodes, bounds, transform])

  return (
    <svg
      width={PREVIEW_W}
      height={PREVIEW_H}
      viewBox={`0 0 ${PREVIEW_W} ${PREVIEW_H}`}
      className="block"
      aria-hidden="true"
    >
      {/* Subtle dot grid background */}
      <defs>
        <pattern id="preview-grid" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
          <circle cx="0.5" cy="0.5" r="0.5" fill="rgba(240,240,244,0.07)" />
        </pattern>
      </defs>
      <rect width={PREVIEW_W} height={PREVIEW_H} fill="url(#preview-grid)" />

      {/* Edges as simple lines */}
      {edges.map((e, i) => {
        const from = centerMap[e.source]
        const to = centerMap[e.target]
        if (!from || !to) return null
        return (
          <line
            key={i}
            x1={from.cx}
            y1={from.cy}
            x2={to.cx}
            y2={to.cy}
            stroke="rgba(240,240,244,0.2)"
            strokeWidth={1}
          />
        )
      })}

      {/* Nodes */}
      {nodes.map((n, i) => renderNodeShape(n, bounds, scale, offsetX, offsetY, i))}
    </svg>
  )
}

// ─── Category Badge ───────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  Architecture: "bg-blue-900/40 text-blue-300 border-blue-800/50",
  DevOps: "bg-teal-900/40 text-teal-300 border-teal-800/50",
  Flowchart: "bg-orange-900/40 text-orange-300 border-orange-800/50",
  "Org Chart": "bg-purple-900/40 text-purple-300 border-purple-800/50",
  "Mind Map": "bg-pink-900/40 text-pink-300 border-pink-800/50",
}

// ─── Template Card ────────────────────────────────────────────────────────────

interface TemplateCardProps {
  template: CanvasTemplate
  onImport: (template: CanvasTemplate) => void
}

function TemplateCard({ template, onImport }: TemplateCardProps) {
  const badgeClass = CATEGORY_COLORS[template.category] ?? "bg-neutral-800/40 text-neutral-400 border-neutral-700/50"

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-2xl border border-surface-border bg-elevated overflow-hidden",
        "hover:border-brand/40 hover:shadow-lg hover:shadow-brand/5 transition-all duration-200"
      )}
    >
      {/* Mini Preview */}
      <div
        className="shrink-0 overflow-hidden bg-base"
        style={{ width: PREVIEW_W, height: PREVIEW_H }}
      >
        <TemplateMiniPreview nodes={template.nodes} edges={template.edges} />
      </div>

      {/* Card footer */}
      <div className="flex flex-col gap-2 p-3 border-t border-surface-border">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-copy-primary leading-tight truncate">{template.name}</p>
            <p className="mt-0.5 text-[11px] text-copy-muted leading-snug line-clamp-2">{template.description}</p>
          </div>
          <span
            className={cn(
              "shrink-0 px-2 py-0.5 rounded-md border text-[9px] font-mono uppercase tracking-wider",
              badgeClass
            )}
          >
            {template.category}
          </span>
        </div>

        <button
          id={`import-template-${template.id}`}
          onClick={() => onImport(template)}
          className={cn(
            "w-full flex items-center justify-center gap-1.5 h-7 rounded-lg text-[11px] font-semibold tracking-wide transition-all duration-200",
            "bg-brand/10 text-brand border border-brand/20",
            "hover:bg-brand hover:text-background hover:border-brand hover:shadow-md hover:shadow-brand/20",
            "active:scale-[0.98]"
          )}
        >
          <Download className="h-3 w-3" />
          Use Template
        </button>
      </div>
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export function StarterTemplatesModal({ isOpen, onClose, onImport }: StarterTemplatesModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const previousActiveElementRef = useRef<Element | null>(null)

  // Save focus before opening; move focus into modal on open; restore on close
  useEffect(() => {
    if (isOpen) {
      previousActiveElementRef.current = document.activeElement
      // Defer so the modal has rendered before focusing
      const raf = requestAnimationFrame(() => {
        closeButtonRef.current?.focus()
      })
      return () => cancelAnimationFrame(raf)
    } else {
      const prev = previousActiveElementRef.current
      if (prev && (prev as HTMLElement).focus) {
        ;(prev as HTMLElement).focus()
      }
      previousActiveElementRef.current = null
    }
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [isOpen, onClose])

  // Close on overlay click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose()
  }

  const handleImport = (template: CanvasTemplate) => {
    onImport(template)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Starter Templates"
    >
      <div
        className={cn(
          "relative flex flex-col w-full max-w-5xl max-h-[88vh]",
          "bg-surface border border-surface-border rounded-3xl shadow-2xl shadow-black/40",
          "animate-in zoom-in-95 fade-in duration-200"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center">
              <Layers className="h-4 w-4 text-brand" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-copy-primary tracking-wide">Starter Templates</h2>
              <p className="text-[11px] text-copy-muted mt-0.5">
                Choose a template to begin — it will replace your current canvas.
              </p>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            id="close-templates-modal"
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-subtle text-copy-muted hover:text-copy-primary transition-colors duration-200"
            aria-label="Close templates modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: `repeat(auto-fill, minmax(${PREVIEW_W}px, 1fr))`,
            }}
          >
            {CANVAS_TEMPLATES.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onImport={handleImport}
              />
            ))}
          </div>
        </div>

        {/* Footer hint */}
        <div className="px-6 py-3 border-t border-surface-border shrink-0 flex items-center justify-between">
          <p className="text-[10px] text-copy-faint font-mono">
            {CANVAS_TEMPLATES.length} templates available
          </p>
          <p className="text-[10px] text-copy-faint font-mono">
            Press <kbd className="px-1 py-0.5 rounded bg-subtle border border-surface-border text-copy-muted">Esc</kbd> to close
          </p>
        </div>
      </div>
    </div>
  )
}
