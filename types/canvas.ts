import { Node, Edge } from "@xyflow/react"

export type NodeShape = "rectangle" | "diamond" | "circle" | "pill" | "cylinder" | "hexagon"

// New node variant types
export type CanvasNodeType =
  | "canvasNode"       // existing shape node
  | "stickyNote"       // free-form sticky note / comment
  | "textBlock"        // annotation text, no border
  | "iconNode"         // service icon + label

// Extended CanvasNodeData (add optional fields; existing fields stay)
export interface CanvasNodeData extends Record<string, unknown> {
  label: string
  color?: string          // existing (for canvasNode / iconNode)
  shape?: NodeShape       // existing (for canvasNode)

  // sticky / text properties
  fontSize?: "sm" | "md" | "lg" | "xl"
  textAlign?: "left" | "center" | "right"
  bold?: boolean
  italic?: boolean

  // icon node properties
  iconId?: string         // key into CANVAS_ICONS registry

  // comment / annotation properties
  commentText?: string    // body of comment thread
  commentAuthor?: string  // display name of author
  commentResolved?: boolean
}

export type CanvasNode = Node<CanvasNodeData, CanvasNodeType>

export interface CanvasEdgeData extends Record<string, unknown> {
  label?: string
  directed?: boolean
  controlX?: number | null
  controlY?: number | null
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

// Lighter, more saturated background fills for sticky note legibility in dark mode
export const STICKY_COLORS = {
  yellow: { fill: "#FEF9C3", border: "#FDE047", text: "#713F12" }, // yellow 100/300/800
  green: { fill: "#DCFCE7", border: "#86EFAC", text: "#14532D" },  // green 100/300/900
  blue: { fill: "#E0F2FE", border: "#7DD3FC", text: "#0C4A6E" },   // sky 100/300/900
  pink: { fill: "#FCE7F3", border: "#F9A8D4", text: "#701A75" },   // pink 100/300/900
  orange: { fill: "#FFEDD5", border: "#FDBA74", text: "#7C2D12" }, // orange 100/300/900
} as const

export type StickyColorKey = keyof typeof STICKY_COLORS

export const NODE_FONT_SIZES = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
  xl: "text-lg",
} as const

export interface CanvasIconDef {
  id: string
  label: string
  category: "cloud" | "database" | "network" | "compute" | "devops" | "messaging" | "security" | "client"
  svgContent: string
}

export const CANVAS_ICONS: CanvasIconDef[] = [
  // AWS Icons
  {
    id: "aws-lambda",
    label: "AWS Lambda",
    category: "compute",
    svgContent: '<path d="M8 18l4-12 4 12" />'
  },
  {
    id: "aws-s3",
    label: "AWS S3",
    category: "cloud",
    svgContent: '<path d="M12 2L3 7v10l9 5 9-5V7L12 2zm0 18.5V12.7M3 7l9 5 9-5" />'
  },
  {
    id: "aws-ec2",
    label: "AWS EC2",
    category: "compute",
    svgContent: '<path d="M4 4h16v4H4V4zm0 6h16v4H4v-4zm0 6h16v4H4v-4z M7 6h2M7 12h2M7 18h2" />'
  },
  {
    id: "aws-rds",
    label: "AWS RDS",
    category: "database",
    svgContent: '<path d="M12 3c-4.4 0-8 1.3-8 3v3c0 1.7 3.6 3 8 3s8-1.3 8-3V6c0-1.7-3.6-3-8-3zm0 6c-4.4 0-8 1.3-8 3v3c0 1.7 3.6 3 8 3s8-1.3 8-3v-3c0-1.7-3.6-3-8-3z" />'
  },
  {
    id: "aws-sqs",
    label: "AWS SQS",
    category: "messaging",
    svgContent: '<path d="M3 8h18M3 16h18M5 8v8M10 8v8M15 8v8M20 8v8" />'
  },
  {
    id: "aws-sns",
    label: "AWS SNS",
    category: "messaging",
    svgContent: '<path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />'
  },
  {
    id: "aws-cloudfront",
    label: "AWS CloudFront",
    category: "network",
    svgContent: '<path d="M12 2a10 10 0 100 20 10 10 0 000-20zM2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />'
  },
  {
    id: "aws-elb",
    label: "AWS ELB",
    category: "network",
    svgContent: '<path d="M12 3v5M5 13v8M19 13v8M12 8a7 7 0 00-7 5M12 8a7 7 0 017 5" />'
  },
  // GCP Icons
  {
    id: "gcp-cloudrun",
    label: "GCP Cloud Run",
    category: "compute",
    svgContent: '<path d="M12 2L2 22h20L12 2zm0 4l7 12H5l7-12z" />'
  },
  {
    id: "gcp-bigquery",
    label: "GCP BigQuery",
    category: "database",
    svgContent: '<path d="M4 4h16v16H4V4zm4 4h8M8 12h8M8 16h8" />'
  },
  {
    id: "gcp-pubsub",
    label: "GCP Pub/Sub",
    category: "messaging",
    svgContent: '<path d="M12 2a3 3 0 100 6 3 3 0 000-6zm-7 11a3 3 0 100 6 3 3 0 000-6zm14 0a3 3 0 100 6 3 3 0 000-6zM12 8l-6 5M12 8l6 5" />'
  },
  {
    id: "gcp-storage",
    label: "GCP Cloud Storage",
    category: "cloud",
    svgContent: '<path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 13a3 3 0 100-6 3 3 0 000 6z" />'
  },
  // Azure Icons
  {
    id: "azure-functions",
    label: "Azure Functions",
    category: "compute",
    svgContent: '<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />'
  },
  {
    id: "azure-cosmosdb",
    label: "Azure Cosmos DB",
    category: "database",
    svgContent: '<path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 6a6 6 0 100 12 6 6 0 000-12z" />'
  },
  {
    id: "azure-eventhub",
    label: "Azure Event Hub",
    category: "messaging",
    svgContent: '<path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 15a5 5 0 110-10 5 5 0 010 10z" />'
  },
  {
    id: "azure-blob",
    label: "Azure Blob Storage",
    category: "cloud",
    svgContent: '<path d="M12 2c-5.5 0-10 4.5-10 10s4.5 10 10 10 10-4.5 10-10-4.5-10-10-10zm-2 14.5v-9l6 4.5-6 4.5z" />'
  },
  // Databases
  {
    id: "db-postgresql",
    label: "PostgreSQL",
    category: "database",
    svgContent: '<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />'
  },
  {
    id: "db-redis",
    label: "Redis",
    category: "database",
    svgContent: '<path d="M3 5h18M3 12h18M3 19h18 M3 5v14M21 5v14" />'
  },
  {
    id: "db-mongodb",
    label: "MongoDB",
    category: "database",
    svgContent: '<path d="M12 2C9 6 7 10 7 14c0 3 2.5 6 5 6s5-3 5-6c0-4-2-8-5-12z" />'
  },
  // Messaging & Compute
  {
    id: "messaging-kafka",
    label: "Apache Kafka",
    category: "messaging",
    svgContent: '<path d="M4 12h16 M12 4v16 M8 8l8 8 M8 16l8-8" />'
  },
  {
    id: "messaging-rabbitmq",
    label: "RabbitMQ",
    category: "messaging",
    svgContent: '<path d="M9 3v8M15 3v8M12 9v11M5 12h14" />'
  },
  {
    id: "net-nginx",
    label: "Nginx",
    category: "network",
    svgContent: '<path d="M12 2L2 12l10 10 10-10L12 2zm0 4l6 6-6 6-6-6 6-6z" />'
  },
  // DevOps
  {
    id: "ops-docker",
    label: "Docker",
    category: "devops",
    svgContent: '<path d="M2 12h20M2 8h20M2 16h20M6 4v16M12 4v16M18 4v16" />'
  },
  {
    id: "ops-kubernetes",
    label: "Kubernetes",
    category: "devops",
    svgContent: '<path d="M12 2l8.3 4v8L12 22l-8.3-8v-8zM12 6.5L6.5 12l5.5 5.5 5.5-5.5L12 6.5z" />'
  },
  {
    id: "ops-github",
    label: "GitHub",
    category: "devops",
    svgContent: '<path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" />'
  },
  {
    id: "ops-terraform",
    label: "Terraform",
    category: "devops",
    svgContent: '<path d="M4 4h7v7H4V4zm9 0h7v7h-7V4zm-9 9h7v7H4v-7zm9 0h7v7h-7v-7z" />'
  },
  // Clients
  {
    id: "client-browser",
    label: "Web Browser",
    category: "client",
    svgContent: '<path d="M3 4h18a2 2 0 012 2v12a2 2 0 01-2 2H3a2 2 0 01-2-2V6a2 2 0 012-2zm0 4h18" />'
  },
  {
    id: "client-mobile",
    label: "Mobile Device",
    category: "client",
    svgContent: '<path d="M6 2h12a2 2 0 012 2v16a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2zm6 17h.01" />'
  },
  // APIs
  {
    id: "api-rest",
    label: "REST API",
    category: "network",
    svgContent: '<path d="M17 3L21 7L17 11 M21 7H3 M7 21L3 17L7 13 M3 17H21" />'
  },
  {
    id: "api-graphql",
    label: "GraphQL API",
    category: "network",
    svgContent: '<path d="M12 2L2 8v8l10 6 10-6V8L12 2zm0 3.8l6.8 4-6.8 4-6.8-4 6.8-4z" />'
  },
  {
    id: "api-grpc",
    label: "gRPC API",
    category: "network",
    svgContent: '<path d="M12 3v18M3 12h18M5 5l14 14M5 19L19 5" />'
  },
  // Security
  {
    id: "security-shield",
    label: "Security Shield",
    category: "security",
    svgContent: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />'
  }
]
