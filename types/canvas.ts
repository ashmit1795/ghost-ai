import { Node, Edge } from "@xyflow/react"

export type NodeShape = "rectangle" | "diamond" | "circle" | "pill" | "cylinder" | "hexagon"

export interface CanvasNodeData extends Record<string, unknown> {
  label: string
  color?: string
  shape?: NodeShape
}

export type CanvasNode = Node<CanvasNodeData, "canvasNode">

export interface CanvasEdgeData extends Record<string, unknown> {
  label?: string
  directed?: boolean
  controlX?: number
  controlY?: number
}

export type CanvasEdge = Edge<CanvasEdgeData, "customCanvasEdge">

// Casing aliases to support both styles
export type canvasNode = CanvasNode
export type canvasEdge = CanvasEdge

export const NODE_SHAPES = [
  "rectangle",
  "diamond",
  "circle",
  "pill",
  "cylinder",
  "hexagon",
] as const

export const NODE_COLORS = {
  neutral: { fill: "#1F1F1F", text: "#EDEDED" },
  blue: { fill: "#10233D", text: "#52A8FF" },
  purple: { fill: "#2E1938", text: "#BF7AF0" },
  orange: { fill: "#331B00", text: "#FF990A" },
  red: { fill: "#3C1618", text: "#FF6166" },
  pink: { fill: "#3A1726", text: "#F75F8F" },
  green: { fill: "#0F2E18", text: "#62C073" },
  teal: { fill: "#062822", text: "#0AC7B4" },
} as const

export type NodeColorKey = keyof typeof NODE_COLORS
