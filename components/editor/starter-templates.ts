import { CanvasNode, CanvasEdge, NodeColorKey, NodeShape, CanvasNodeType } from "@/types/canvas"

export interface CanvasTemplate {
  id: string
  name: string
  description: string
  category: string
  nodes: CanvasNode[]
  edges: CanvasEdge[]
}

// Default dimensions per node type
const DEFAULT_NODE_DIMENSIONS: Record<string, { width: number; height: number }> = {
  stickyNote: { width: 180, height: 120 },
  textBlock:  { width: 200, height: 60  },
  iconNode:   { width: 100, height: 100 },
  canvasNode: { width: 150, height: 60  },
}

// Helper to build a canvas node concisely
function node(
  id: string,
  label: string,
  x: number,
  y: number,
  options: {
    type?: CanvasNodeType
    shape?: NodeShape
    color?: string
    width?: number
    height?: number
    fontSize?: "sm" | "md" | "lg" | "xl"
    textAlign?: "left" | "center" | "right"
    bold?: boolean
    italic?: boolean
    iconId?: string
    commentText?: string
    commentAuthor?: string
    commentResolved?: boolean
  } = {}
): CanvasNode {
  const nodeType = options.type ?? "canvasNode"
  const defaultDims = DEFAULT_NODE_DIMENSIONS[nodeType] ?? DEFAULT_NODE_DIMENSIONS.canvasNode
  return {
    id,
    type: nodeType,
    position: { x, y },
    data: {
      label,
      shape: options.shape ?? (nodeType === "canvasNode" ? "rectangle" : undefined),
      color: options.color ?? (nodeType === "stickyNote" ? "yellow" : "neutral"),
      fontSize: options.fontSize,
      textAlign: options.textAlign,
      bold: options.bold,
      italic: options.italic,
      iconId: options.iconId,
      commentText: options.commentText,
      commentAuthor: options.commentAuthor,
      commentResolved: options.commentResolved,
    },
    width: options.width ?? defaultDims.width,
    height: options.height ?? defaultDims.height,
  } as CanvasNode
}

// Helper to build a canvas edge concisely
function edge(
  id: string,
  source: string,
  target: string,
  options: {
    label?: string
    directed?: boolean
    sourceHandle?: string
    targetHandle?: string
  } = {}
): CanvasEdge {
  return {
    id,
    type: "customCanvasEdge",
    source,
    target,
    sourceHandle: options.sourceHandle ?? "r",
    targetHandle: options.targetHandle ?? "l",
    data: {
      label: options.label,
      directed: options.directed ?? true,
    },
  }
}

// ─── TEMPLATE 1: Microservices Architecture ──────────────────────────────────
const microservicesTemplate: CanvasTemplate = {
  id: "microservices",
  name: "Microservices Architecture",
  description: "A typical microservices backend with an API gateway, services, and shared infrastructure.",
  category: "Architecture",
  nodes: [
    // Client tier
    node("client", "Web Client", 20, 200, { shape: "rectangle", color: "neutral", width: 120, height: 50 }),
    node("mobile", "Mobile App", 20, 290, { shape: "rectangle", color: "neutral", width: 120, height: 50 }),

    // Gateway
    node("gateway", "API Gateway", 220, 240, { shape: "hexagon", color: "blue", width: 140, height: 70 }),

    // Services
    node("auth", "Auth Service", 440, 100, { shape: "pill", color: "green", width: 140, height: 50 }),
    node("user", "User Service", 440, 200, { shape: "pill", color: "blue", width: 140, height: 50 }),
    node("order", "Order Service", 440, 300, { shape: "pill", color: "orange", width: 140, height: 50 }),
    node("notify", "Notify Service", 440, 400, { shape: "pill", color: "purple", width: 140, height: 50 }),

    // Message bus
    node("bus", "Message Bus", 650, 250, { shape: "hexagon", color: "teal", width: 130, height: 70 }),

    // Databases
    node("userdb", "User DB", 680, 100, { shape: "cylinder", color: "blue", width: 110, height: 70 }),
    node("orderdb", "Order DB", 680, 400, { shape: "cylinder", color: "orange", width: 110, height: 70 }),
  ],
  edges: [
    edge("e-client-gw", "client", "gateway", { label: "HTTPS" }),
    edge("e-mobile-gw", "mobile", "gateway", { label: "HTTPS" }),
    edge("e-gw-auth", "gateway", "auth", { label: "JWT" }),
    edge("e-gw-user", "gateway", "user"),
    edge("e-gw-order", "gateway", "order"),
    edge("e-order-bus", "order", "bus", { label: "publish" }),
    edge("e-bus-notify", "bus", "notify", { label: "subscribe" }),
    edge("e-user-userdb", "user", "userdb", { sourceHandle: "r", targetHandle: "l" }),
    edge("e-order-orderdb", "order", "orderdb", { sourceHandle: "r", targetHandle: "l" }),
  ],
}

// ─── TEMPLATE 2: CI/CD Pipeline ──────────────────────────────────────────────
const ciCdTemplate: CanvasTemplate = {
  id: "cicd-pipeline",
  name: "CI/CD Pipeline",
  description: "A complete continuous integration and delivery workflow from commit to production.",
  category: "DevOps",
  nodes: [
    node("dev", "Developer", 20, 120, { shape: "circle", color: "neutral", width: 80, height: 80 }),
    node("repo", "Git Repo", 160, 130, { shape: "cylinder", color: "blue", width: 110, height: 60 }),
    node("ci", "CI Build", 330, 130, { shape: "rectangle", color: "teal", width: 130, height: 60 }),
    node("test", "Test Suite", 330, 230, { shape: "diamond", color: "orange", width: 130, height: 90 }),
    node("scan", "Security Scan", 330, 360, { shape: "rectangle", color: "red", width: 130, height: 60 }),
    node("artifact", "Build Artifact", 520, 130, { shape: "cylinder", color: "green", width: 130, height: 60 }),
    node("staging", "Staging Deploy", 520, 250, { shape: "hexagon", color: "purple", width: 130, height: 70 }),
    node("approve", "Manual Approval", 700, 250, { shape: "diamond", color: "orange", width: 140, height: 80 }),
    node("prod", "Production", 880, 250, { shape: "hexagon", color: "green", width: 130, height: 70 }),
    node("monitor", "Monitoring", 880, 130, { shape: "circle", color: "teal", width: 90, height: 90 }),
  ],
  edges: [
    edge("e-dev-repo", "dev", "repo", { label: "git push" }),
    edge("e-repo-ci", "repo", "ci", { label: "trigger" }),
    edge("e-ci-test", "ci", "test", { sourceHandle: "b", targetHandle: "t", label: "run tests" }),
    edge("e-ci-scan", "ci", "scan", { sourceHandle: "b", targetHandle: "t" }),
    edge("e-ci-artifact", "ci", "artifact", { label: "on success" }),
    edge("e-artifact-staging", "artifact", "staging", { sourceHandle: "b", targetHandle: "t" }),
    edge("e-staging-approve", "staging", "approve"),
    edge("e-approve-prod", "approve", "prod", { label: "approved" }),
    edge("e-prod-monitor", "prod", "monitor", { sourceHandle: "t", targetHandle: "b", label: "metrics" }),
  ],
}

// ─── TEMPLATE 3: Event-Driven System ─────────────────────────────────────────
const eventDrivenTemplate: CanvasTemplate = {
  id: "event-driven",
  name: "Event-Driven System",
  description: "An event-sourcing architecture with producers, a message broker, and multiple consumers.",
  category: "Architecture",
  nodes: [
    // Producers
    node("web", "Web App", 20, 80, { shape: "rectangle", color: "blue", width: 130, height: 55 }),
    node("iot", "IoT Sensor", 20, 180, { shape: "rectangle", color: "teal", width: 130, height: 55 }),
    node("mobile2", "Mobile App", 20, 280, { shape: "rectangle", color: "neutral", width: 130, height: 55 }),

    // Broker
    node("kafka", "Kafka Cluster", 260, 170, { shape: "hexagon", color: "orange", width: 150, height: 80 }),

    // Topics
    node("t-orders", "orders topic", 470, 70, { shape: "cylinder", color: "orange", width: 130, height: 55 }),
    node("t-events", "events topic", 470, 170, { shape: "cylinder", color: "teal", width: 130, height: 55 }),
    node("t-alerts", "alerts topic", 470, 280, { shape: "cylinder", color: "red", width: 130, height: 55 }),

    // Consumers
    node("svc-order", "Order Processor", 660, 70, { shape: "pill", color: "orange", width: 145, height: 55 }),
    node("svc-analytics", "Analytics Engine", 660, 170, { shape: "pill", color: "purple", width: 145, height: 55 }),
    node("svc-alert", "Alert Manager", 660, 280, { shape: "pill", color: "red", width: 145, height: 55 }),

    // Storage
    node("store", "Event Store", 840, 170, { shape: "cylinder", color: "blue", width: 120, height: 70 }),
  ],
  edges: [
    edge("e-web-kafka", "web", "kafka"),
    edge("e-iot-kafka", "iot", "kafka"),
    edge("e-mobile-kafka", "mobile2", "kafka"),
    edge("e-kafka-t1", "kafka", "t-orders"),
    edge("e-kafka-t2", "kafka", "t-events"),
    edge("e-kafka-t3", "kafka", "t-alerts"),
    edge("e-t1-svc1", "t-orders", "svc-order"),
    edge("e-t2-svc2", "t-events", "svc-analytics"),
    edge("e-t3-svc3", "t-alerts", "svc-alert"),
    edge("e-svc2-store", "svc-analytics", "store"),
  ],
}

// ─── TEMPLATE 4: User Flow / Onboarding ──────────────────────────────────────
const userFlowTemplate: CanvasTemplate = {
  id: "user-onboarding-flow",
  name: "User Onboarding Flow",
  description: "A step-by-step flowchart of the user registration and onboarding journey.",
  category: "Flowchart",
  nodes: [
    node("start", "Start", 250, 20, { shape: "circle", color: "green", width: 80, height: 80 }),
    node("landing", "Landing Page", 210, 160, { shape: "rectangle", color: "neutral", width: 160, height: 55 }),
    node("signup", "Sign Up Form", 210, 270, { shape: "rectangle", color: "blue", width: 160, height: 55 }),
    node("valid", "Validate Input?", 210, 390, { shape: "diamond", color: "orange", width: 160, height: 100 }),
    node("error", "Show Error", 420, 390, { shape: "pill", color: "red", width: 130, height: 55 }),
    node("email", "Send Verify Email", 210, 560, { shape: "rectangle", color: "teal", width: 160, height: 55 }),
    node("verify", "Email Verified?", 210, 670, { shape: "diamond", color: "orange", width: 160, height: 100 }),
    node("resend", "Resend Email", 420, 670, { shape: "pill", color: "purple", width: 130, height: 55 }),
    node("profile", "Profile Setup", 210, 840, { shape: "rectangle", color: "blue", width: 160, height: 55 }),
    node("tour", "Product Tour", 210, 950, { shape: "rectangle", color: "neutral", width: 160, height: 55 }),
    node("dashboard", "Dashboard", 210, 1060, { shape: "hexagon", color: "green", width: 160, height: 70 }),
  ],
  edges: [
    edge("e-start-land", "start", "landing", { sourceHandle: "b", targetHandle: "t" }),
    edge("e-land-signup", "landing", "signup", { sourceHandle: "b", targetHandle: "t" }),
    edge("e-signup-valid", "signup", "valid", { sourceHandle: "b", targetHandle: "t" }),
    edge("e-valid-error", "valid", "error", { label: "no", sourceHandle: "r", targetHandle: "l" }),
    edge("e-error-signup", "error", "signup", { sourceHandle: "t", targetHandle: "r", label: "retry" }),
    edge("e-valid-email", "valid", "email", { label: "yes", sourceHandle: "b", targetHandle: "t" }),
    edge("e-email-verify", "email", "verify", { sourceHandle: "b", targetHandle: "t" }),
    edge("e-verify-resend", "verify", "resend", { label: "no", sourceHandle: "r", targetHandle: "l" }),
    edge("e-verify-profile", "verify", "profile", { label: "yes", sourceHandle: "b", targetHandle: "t" }),
    edge("e-profile-tour", "profile", "tour", { sourceHandle: "b", targetHandle: "t" }),
    edge("e-tour-dash", "tour", "dashboard", { sourceHandle: "b", targetHandle: "t" }),
  ],
}

// ─── TEMPLATE 5: Org Chart ────────────────────────────────────────────────────
const orgChartTemplate: CanvasTemplate = {
  id: "org-chart",
  name: "Engineering Org Chart",
  description: "A hierarchical organization chart for an engineering department.",
  category: "Org Chart",
  nodes: [
    // C-Level
    node("cto", "CTO", 360, 20, { shape: "rectangle", color: "blue", width: 140, height: 55 }),

    // VPs
    node("vp-eng", "VP Engineering", 140, 140, { shape: "rectangle", color: "teal", width: 155, height: 55 }),
    node("vp-product", "VP Product", 360, 140, { shape: "rectangle", color: "purple", width: 155, height: 55 }),
    node("vp-infra", "VP Infra", 590, 140, { shape: "rectangle", color: "orange", width: 155, height: 55 }),

    // Teams
    node("t-frontend", "Frontend Team", 20, 280, { shape: "pill", color: "teal", width: 140, height: 50 }),
    node("t-backend", "Backend Team", 175, 280, { shape: "pill", color: "teal", width: 140, height: 50 }),
    node("t-design", "Design Team", 330, 280, { shape: "pill", color: "purple", width: 140, height: 50 }),
    node("t-pm", "Product Mgmt", 490, 280, { shape: "pill", color: "purple", width: 140, height: 50 }),
    node("t-devops", "DevOps Team", 565, 280, { shape: "pill", color: "orange", width: 140, height: 50 }),
    node("t-sre", "SRE Team", 720, 280, { shape: "pill", color: "orange", width: 140, height: 50 }),
  ],
  edges: [
    edge("e-cto-vpe", "cto", "vp-eng", { sourceHandle: "b", targetHandle: "t", directed: false }),
    edge("e-cto-vpp", "cto", "vp-product", { sourceHandle: "b", targetHandle: "t", directed: false }),
    edge("e-cto-vpi", "cto", "vp-infra", { sourceHandle: "b", targetHandle: "t", directed: false }),
    edge("e-vpe-fe", "vp-eng", "t-frontend", { sourceHandle: "b", targetHandle: "t", directed: false }),
    edge("e-vpe-be", "vp-eng", "t-backend", { sourceHandle: "b", targetHandle: "t", directed: false }),
    edge("e-vpp-design", "vp-product", "t-design", { sourceHandle: "b", targetHandle: "t", directed: false }),
    edge("e-vpp-pm", "vp-product", "t-pm", { sourceHandle: "b", targetHandle: "t", directed: false }),
    edge("e-vpi-devops", "vp-infra", "t-devops", { sourceHandle: "b", targetHandle: "t", directed: false }),
    edge("e-vpi-sre", "vp-infra", "t-sre", { sourceHandle: "b", targetHandle: "t", directed: false }),
  ],
}

// ─── TEMPLATE 6: Mind Map ─────────────────────────────────────────────────────
const mindMapTemplate: CanvasTemplate = {
  id: "mind-map",
  name: "Product Roadmap Mind Map",
  description: "A mind map structure for planning a product roadmap with initiatives and tasks.",
  category: "Mind Map",
  nodes: [
    // Core
    node("core", "Product Roadmap", 360, 260, { shape: "circle", color: "blue", width: 150, height: 150 }),

    // Q branches
    node("q1", "Q1 Launch", 100, 100, { shape: "hexagon", color: "green", width: 140, height: 65 }),
    node("q2", "Q2 Growth", 600, 100, { shape: "hexagon", color: "teal", width: 140, height: 65 }),
    node("q3", "Q3 Scale", 100, 420, { shape: "hexagon", color: "orange", width: 140, height: 65 }),
    node("q4", "Q4 Enterprise", 600, 420, { shape: "hexagon", color: "purple", width: 140, height: 65 }),

    // Q1 children
    node("q1-a", "Auth & Onboarding", -80, 30, { shape: "pill", color: "green", width: 155, height: 50 }),
    node("q1-b", "Core Editor", -80, 110, { shape: "pill", color: "green", width: 155, height: 50 }),
    node("q1-c", "Basic Sharing", -80, 190, { shape: "pill", color: "green", width: 155, height: 50 }),

    // Q2 children
    node("q2-a", "AI Copilot", 770, 30, { shape: "pill", color: "teal", width: 155, height: 50 }),
    node("q2-b", "Templates", 770, 110, { shape: "pill", color: "teal", width: 155, height: 50 }),
    node("q2-c", "Analytics", 770, 190, { shape: "pill", color: "teal", width: 155, height: 50 }),

    // Q3 children
    node("q3-a", "Performance", -80, 360, { shape: "pill", color: "orange", width: 155, height: 50 }),
    node("q3-b", "Integrations", -80, 440, { shape: "pill", color: "orange", width: 155, height: 50 }),

    // Q4 children
    node("q4-a", "SSO / SAML", 770, 360, { shape: "pill", color: "purple", width: 155, height: 50 }),
    node("q4-b", "Org Mgmt", 770, 440, { shape: "pill", color: "purple", width: 155, height: 50 }),
    node("q4-c", "Audit Logs", 770, 520, { shape: "pill", color: "purple", width: 155, height: 50 }),
  ],
  edges: [
    edge("e-core-q1", "core", "q1", { directed: false }),
    edge("e-core-q2", "core", "q2", { directed: false }),
    edge("e-core-q3", "core", "q3", { directed: false }),
    edge("e-core-q4", "core", "q4", { directed: false }),
    edge("e-q1-a", "q1", "q1-a", { directed: false, sourceHandle: "l", targetHandle: "r" }),
    edge("e-q1-b", "q1", "q1-b", { directed: false, sourceHandle: "l", targetHandle: "r" }),
    edge("e-q1-c", "q1", "q1-c", { directed: false, sourceHandle: "l", targetHandle: "r" }),
    edge("e-q2-a", "q2", "q2-a", { directed: false, sourceHandle: "r", targetHandle: "l" }),
    edge("e-q2-b", "q2", "q2-b", { directed: false, sourceHandle: "r", targetHandle: "l" }),
    edge("e-q2-c", "q2", "q2-c", { directed: false, sourceHandle: "r", targetHandle: "l" }),
    edge("e-q3-a", "q3", "q3-a", { directed: false, sourceHandle: "l", targetHandle: "r" }),
    edge("e-q3-b", "q3", "q3-b", { directed: false, sourceHandle: "l", targetHandle: "r" }),
    edge("e-q4-a", "q4", "q4-a", { directed: false, sourceHandle: "r", targetHandle: "l" }),
    edge("e-q4-b", "q4", "q4-b", { directed: false, sourceHandle: "r", targetHandle: "l" }),
    edge("e-q4-c", "q4", "q4-c", { directed: false, sourceHandle: "r", targetHandle: "l" }),
  ],
}

// ─── TEMPLATE 7: Data Pipeline ────────────────────────────────────────────────
const dataPipelineTemplate: CanvasTemplate = {
  id: "data-pipeline",
  name: "Data Pipeline",
  description: "An end-to-end analytics data pipeline from ingestion through transformation to serving.",
  category: "Architecture",
  nodes: [
    // Sources
    node("src-app", "App Events", 20, 60, { shape: "rectangle", color: "neutral", width: 130, height: 50 }),
    node("src-db", "Prod DB", 20, 160, { shape: "cylinder", color: "blue", width: 130, height: 65 }),
    node("src-api", "3rd Party API", 20, 270, { shape: "rectangle", color: "neutral", width: 130, height: 50 }),

    // Ingestion
    node("ingest", "Kafka Ingest", 220, 165, { shape: "hexagon", color: "orange", width: 140, height: 70 }),

    // Processing
    node("stream", "Stream Processor", 420, 80, { shape: "rectangle", color: "teal", width: 150, height: 55 }),
    node("batch", "Batch ETL", 420, 200, { shape: "rectangle", color: "purple", width: 150, height: 55 }),
    node("ml", "ML Feature Eng.", 420, 320, { shape: "rectangle", color: "pink", width: 150, height: 55 }),

    // Storage
    node("datalake", "Data Lake", 640, 80, { shape: "cylinder", color: "teal", width: 130, height: 65 }),
    node("warehouse", "Data Warehouse", 640, 200, { shape: "cylinder", color: "purple", width: 130, height: 65 }),
    node("featurestore", "Feature Store", 640, 330, { shape: "cylinder", color: "pink", width: 130, height: 65 }),

    // Serving
    node("bi", "BI Dashboard", 840, 80, { shape: "rectangle", color: "green", width: 140, height: 55 }),
    node("api2", "Analytics API", 840, 200, { shape: "pill", color: "blue", width: 140, height: 55 }),
    node("model", "ML Model", 840, 330, { shape: "hexagon", color: "pink", width: 140, height: 65 }),
  ],
  edges: [
    edge("e-app-ing", "src-app", "ingest"),
    edge("e-db-ing", "src-db", "ingest"),
    edge("e-api-ing", "src-api", "ingest"),
    edge("e-ing-stream", "ingest", "stream"),
    edge("e-ing-batch", "ingest", "batch"),
    edge("e-ing-ml", "ingest", "ml"),
    edge("e-stream-lake", "stream", "datalake"),
    edge("e-batch-wh", "batch", "warehouse"),
    edge("e-ml-fs", "ml", "featurestore"),
    edge("e-lake-bi", "datalake", "bi"),
    edge("e-wh-api", "warehouse", "api2"),
    edge("e-fs-model", "featurestore", "model"),
  ],
}

// ─── TEMPLATE 8: Three-Tier Web App ──────────────────────────────────────────
const threeTierTemplate: CanvasTemplate = {
  id: "three-tier-web",
  name: "Three-Tier Web Application",
  description: "Classic presentation, logic, and data tiers for a scalable web application.",
  category: "Architecture",
  nodes: [
    // Tier 0 - DNS / CDN
    node("dns", "DNS / CDN", 260, 20, { shape: "hexagon", color: "neutral", width: 140, height: 60 }),

    // Tier 1 - Presentation
    node("lb", "Load Balancer", 260, 140, { shape: "diamond", color: "blue", width: 150, height: 90 }),
    node("web1", "Web Server 1", 80, 310, { shape: "rectangle", color: "blue", width: 140, height: 55 }),
    node("web2", "Web Server 2", 260, 310, { shape: "rectangle", color: "blue", width: 140, height: 55 }),
    node("web3", "Web Server 3", 440, 310, { shape: "rectangle", color: "blue", width: 140, height: 55 }),

    // Tier 2 - Application
    node("app-lb", "App Load Balancer", 260, 430, { shape: "diamond", color: "purple", width: 160, height: 90 }),
    node("app1", "App Server 1", 80, 600, { shape: "rectangle", color: "purple", width: 140, height: 55 }),
    node("app2", "App Server 2", 260, 600, { shape: "rectangle", color: "purple", width: 140, height: 55 }),
    node("cache", "Redis Cache", 460, 600, { shape: "cylinder", color: "red", width: 120, height: 65 }),

    // Tier 3 - Data
    node("primary", "Primary DB", 130, 750, { shape: "cylinder", color: "green", width: 140, height: 70 }),
    node("replica", "Read Replica", 360, 750, { shape: "cylinder", color: "teal", width: 140, height: 70 }),
    node("backup", "Backup Store", 260, 880, { shape: "cylinder", color: "neutral", width: 140, height: 65 }),
  ],
  edges: [
    edge("e-dns-lb", "dns", "lb", { sourceHandle: "b", targetHandle: "t" }),
    edge("e-lb-w1", "lb", "web1", { sourceHandle: "b", targetHandle: "t" }),
    edge("e-lb-w2", "lb", "web2", { sourceHandle: "b", targetHandle: "t" }),
    edge("e-lb-w3", "lb", "web3", { sourceHandle: "b", targetHandle: "t" }),
    edge("e-w1-alb", "web1", "app-lb", { sourceHandle: "b", targetHandle: "t" }),
    edge("e-w2-alb", "web2", "app-lb", { sourceHandle: "b", targetHandle: "t" }),
    edge("e-w3-alb", "web3", "app-lb", { sourceHandle: "b", targetHandle: "t" }),
    edge("e-alb-a1", "app-lb", "app1", { sourceHandle: "b", targetHandle: "t" }),
    edge("e-alb-a2", "app-lb", "app2", { sourceHandle: "b", targetHandle: "t" }),
    edge("e-alb-cache", "app-lb", "cache", { sourceHandle: "r", targetHandle: "t", label: "read" }),
    edge("e-a1-primary", "app1", "primary", { sourceHandle: "b", targetHandle: "t" }),
    edge("e-a2-primary", "app2", "primary", { sourceHandle: "b", targetHandle: "t" }),
    edge("e-primary-replica", "primary", "replica", { directed: false, sourceHandle: "r", targetHandle: "l", label: "replicate" }),
    edge("e-primary-backup", "primary", "backup", { sourceHandle: "b", targetHandle: "t", label: "snapshot" }),
  ],
}

// ─── TEMPLATE 9: Cloud Serverless Architecture (AWS) ──────────────────────────
const cloudArchitectureTemplate: CanvasTemplate = {
  id: "cloud-aws-architecture",
  name: "AWS Serverless Architecture",
  description: "A serverless cloud infrastructure built using AWS Lambda, S3, RDS and CloudFront service icons.",
  category: "Architecture",
  nodes: [
    node("dns", "Web Client", -120, 150, { type: "iconNode", iconId: "client-browser", color: "neutral" }),
    node("cdn", "CloudFront CDN", 50, 150, { type: "iconNode", iconId: "aws-cloudfront", color: "blue" }),
    node("alb", "Application ELB", 220, 150, { type: "iconNode", iconId: "aws-elb", color: "blue" }),
    node("lambda-write", "Write Lambda", 390, 50, { type: "iconNode", iconId: "aws-lambda", color: "orange" }),
    node("lambda-read", "Read Lambda", 390, 250, { type: "iconNode", iconId: "aws-lambda", color: "orange" }),
    node("s3", "S3 Bucket", 560, 50, { type: "iconNode", iconId: "aws-s3", color: "green" }),
    node("rds", "RDS Database", 560, 250, { type: "iconNode", iconId: "aws-rds", color: "green" }),
  ],
  edges: [
    edge("e-dns-cdn", "dns", "cdn"),
    edge("e-cdn-alb", "cdn", "alb"),
    edge("e-alb-lw", "alb", "lambda-write", { sourceHandle: "r", targetHandle: "l" }),
    edge("e-alb-lr", "alb", "lambda-read", { sourceHandle: "r", targetHandle: "l" }),
    edge("e-lw-s3", "lambda-write", "s3"),
    edge("e-lw-rds", "lambda-write", "rds"),
    edge("e-lr-rds", "lambda-read", "rds"),
  ],
}

// ─── TEMPLATE 10: Annotated Architecture Spec with Comments ─────────────────
const annotatedDesignTemplate: CanvasTemplate = {
  id: "annotated-design",
  name: "Annotated Specs with Comments",
  description: "A system diagram showing how to annotate architectures using sticky notes, text blocks, and comment threads.",
  category: "Architecture",
  nodes: [
    // Header Annotation
    node("title", "Core Checkout Pipeline Specs", 120, -60, { type: "textBlock", fontSize: "xl", bold: true, color: "blue", width: 350, height: 40 }),
    
    // Architecture Elements
    node("gw", "API Gateway", 20, 100, { shape: "hexagon", color: "blue" }),
    node("auth", "Auth Checker", 200, 20, { shape: "pill", color: "green" }),
    node("order", "Order Processor", 200, 180, { shape: "pill", color: "orange" }),
    
    // Sticky Notes
    node("sticky-note", "Check out rules:\n- Rate limit per client IP\n- Validate tokens locally via Auth Service.", 10, 260, { type: "stickyNote", color: "yellow", fontSize: "sm" }),
    
    // Comments (Resolved & Unresolved)
    node("comment-active", "", 420, 180, { 
      type: "stickyNote", 
      color: "pink", 
      fontSize: "sm", 
      commentText: "Do we need a Redis cache for order processing?", 
      commentAuthor: "Ashmit", 
      commentResolved: false 
    }),
    node("comment-resolved", "", -180, 20, { 
      type: "stickyNote", 
      color: "green", 
      fontSize: "sm", 
      commentText: "JWT public key rotation verified.", 
      commentAuthor: "Collab", 
      commentResolved: true 
    }),
  ],
  edges: [
    edge("e-gw-auth", "gw", "auth", { sourceHandle: "t", targetHandle: "l" }),
    edge("e-gw-order", "gw", "order", { sourceHandle: "b", targetHandle: "l" }),
    edge("e-comment-active-order", "comment-active", "order", { sourceHandle: "l", targetHandle: "r", label: "discussion" }),
    edge("e-comment-res-auth", "comment-resolved", "auth", { sourceHandle: "r", targetHandle: "l" }),
  ],
}

export const CANVAS_TEMPLATES: CanvasTemplate[] = [
  microservicesTemplate,
  ciCdTemplate,
  eventDrivenTemplate,
  userFlowTemplate,
  orgChartTemplate,
  mindMapTemplate,
  dataPipelineTemplate,
  threeTierTemplate,
  cloudArchitectureTemplate,
  annotatedDesignTemplate,
]
