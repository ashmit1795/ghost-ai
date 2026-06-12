/* eslint-disable @typescript-eslint/no-explicit-any */
import dns from "dns";
dns.setDefaultResultOrder("ipv4first");

import { logger, task, metadata } from "@trigger.dev/sdk/v3";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { liveblocks } from "../lib/liveblocks-client";
import { LiveObject, LiveMap } from "@liveblocks/node";
import type { CanvasNode, CanvasEdge } from "../types/canvas";

// Ensure custom key mapping for local/worker execution is loaded
if (process.env.GOOGLE_AI_API_KEY && !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
  process.env.GOOGLE_GENERATIVE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
}

export interface DesignAgentPayload {
  prompt: string;
  roomId: string;
  projectName?: string;
  projectDescription?: string;
}

// Structured schema for AI architect recommendations
const ActionSchema = z.object({
  type: z.enum(["add_node", "update_node", "delete_node", "add_edge", "delete_edge"]),
  id: z.string().describe("A unique identifier for the node or edge being created, updated, or deleted"),
  nodeType: z.enum(["canvasNode", "stickyNote", "textBlock", "iconNode"]).optional().describe("Required for add_node"),
  position: z.object({
    x: z.number().describe("X coordinate in pixels"),
    y: z.number().describe("Y coordinate in pixels"),
  }).optional().describe("Required for add_node, optional for update_node"),
  data: z.object({
    label: z.string().optional().describe("Visible text label"),
    color: z.string().optional().describe("Allowed color key based on node type"),
    shape: z.enum(["rectangle", "diamond", "circle", "pill", "cylinder", "hexagon"]).optional().describe("Shape for canvasNode"),
    fontSize: z.enum(["sm", "md", "lg", "xl"]).optional().describe("Font size for textBlock"),
    textAlign: z.enum(["left", "center", "right"]).optional().describe("Text alignment for textBlock"),
    bold: z.boolean().optional().describe("Bold text for textBlock"),
    italic: z.boolean().optional().describe("Italic text for textBlock"),
    iconId: z.string().optional().describe("Valid service icon key for iconNode"),
    directed: z.boolean().optional().describe("For add_edge: directed vs undirected"),
  }).optional().describe("Required for add_node, optional for update_node or add_edge"),
  width: z.number().optional().describe("Explicit width (default: canvasNode=150, stickyNote=180, textBlock=200, iconNode=100)"),
  height: z.number().optional().describe("Explicit height (default: canvasNode=80, stickyNote=120, textBlock=60, iconNode=100)"),
  source: z.string().optional().describe("Required for add_edge (source node ID)"),
  target: z.string().optional().describe("Required for add_edge (target node ID)"),
  animated: z.boolean().optional().describe("Optional for add_edge"),
});

const DesignAgentOutputSchema = z.object({
  actions: z.array(ActionSchema),
  explanation: z.string().describe("A brief explanation of the changes made and the design decisions."),
});

// Helper to update AI agent presence
async function setAiPresence(
  roomId: string,
  presence: { x: number; y: number } | null,
  thinking: boolean
) {
  try {
    await liveblocks.setPresence(roomId, {
      userId: "ai-architect",
      data: {
        cursor: presence,
        thinking,
      },
      userInfo: {
        name: "AI Architect",
        avatar: "https://avatar.vercel.sh/ai-architect",
        color: "#FF990A",
      },
      ttl: 60,
    });
  } catch (err: any) {
    logger.warn("Failed to set AI presence", {
      message: err.message,
      name: err.name,
      cause: err.cause ? {
        message: err.cause.message,
        name: err.cause.name,
        code: err.cause.code,
      } : undefined,
    });
  }
}

export const designAgentTask = task({
  id: "design-agent",
  run: async (payload: DesignAgentPayload) => {
    const { prompt, roomId, projectName, projectDescription } = payload;
    logger.log("Design agent task run started", { prompt, roomId, projectName, projectDescription });

    // Step 1: Initialize metadata and presence
    metadata.set("progressMessage", "Initializing AI Architect...");
    await setAiPresence(roomId, { x: 50, y: 50 }, true);

    try {
      // Step 2: Retrieve current canvas state from Liveblocks storage
      metadata.set("progressMessage", "Retrieving canvas blueprint...");
      await setAiPresence(roomId, { x: 120, y: 80 }, true);

      let currentNodes: CanvasNode[] = [];
      let currentEdges: CanvasEdge[] = [];

      // Fetch storage root to read current nodes/edges
      const rootDoc = (await liveblocks.getStorageDocument(roomId)) as any;
      if (rootDoc && rootDoc.flow) {
        const flow = rootDoc.flow as any;
        if (flow.nodes) {
          currentNodes = Object.values(flow.nodes);
        }
        if (flow.edges) {
          currentEdges = Object.values(flow.edges);
        }
      }

      logger.log("Current canvas snapshot retrieved", {
        nodeCount: currentNodes.length,
        edgeCount: currentEdges.length,
      });

      // Step 3: Prompt Gemini to analyze and output mutations
      metadata.set("progressMessage", "Generating canvas architecture layout...");
      await setAiPresence(roomId, { x: 200, y: 180 }, true);

      const systemInstruction = `You are a professional system architecture and DevOps diagram designer called "AI Architect".
Your task is to analyze the user's prompt and generate a set of actions (add_node, update_node, delete_node, add_edge, delete_edge) to modify a collaborative React Flow system diagram.

Allowed Node Types & Data Properties:
1. canvasNode (standard shape node):
   - width: 150 (default), height: 80 (default)
   - data.label: text label inside the node
   - data.color: "neutral" (dark gray), "blue", "purple", "orange", "red", "pink", "green", "teal"
   - data.shape: "rectangle", "diamond" (decision/condition), "circle" (event/start/end), "pill", "cylinder" (database/storage), "hexagon"
2. stickyNote (note/comment):
   - width: 180 (default), height: 120 (default)
   - data.label: text body
   - data.color: "yellow", "green", "blue", "pink", "orange" (lighter, readable fills)
3. textBlock (annotation/label text without borders):
   - width: 200 (default), height: 60 (default)
   - data.label: text label
   - data.color: "neutral", "blue", "purple", "orange", "red"
   - data.fontSize: "sm", "md", "lg", "xl" (default "md")
   - data.textAlign: "left", "center", "right"
   - data.bold: boolean
   - data.italic: boolean
4. iconNode (service icon node):
   - width: 100 (default), height: 100 (default)
   - data.label: text label underneath the icon
   - data.color: "neutral", "blue", "purple", "orange", "red", "pink", "green", "teal"
   - data.iconId: key from the allowed list of service icons:
     [AWS Icons]
     - "aws-lambda": AWS Lambda function (compute)
     - "aws-s3": AWS S3 bucket (storage/cloud)
     - "aws-ec2": AWS EC2 instance (compute)
     - "aws-rds": AWS RDS database (database)
     - "aws-sqs": AWS SQS queue (messaging)
     - "aws-sns": AWS SNS topic (messaging)
     - "aws-cloudfront": AWS CloudFront CDN (network)
     - "aws-elb": AWS ELB load balancer (network)
     [GCP Icons]
     - "gcp-cloudrun": GCP Cloud Run (compute)
     - "gcp-bigquery": GCP BigQuery (database)
     - "gcp-pubsub": GCP Pub/Sub (messaging)
     - "gcp-storage": GCP Cloud Storage (storage/cloud)
     [Azure Icons]
     - "azure-functions": Azure Functions (compute)
     - "azure-cosmosdb": Azure Cosmos DB (database)
     - "azure-eventhub": Azure Event Hub (messaging)
     - "azure-blob": Azure Blob Storage (storage/cloud)
     [Generic Databases]
     - "db-postgresql": PostgreSQL Database (database)
     - "db-redis": Redis Cache (database)
     - "db-mongodb": MongoDB Database (database)
     [Other Services]
     - "messaging-kafka": Apache Kafka (messaging)
     - "messaging-rabbitmq": RabbitMQ (messaging)
     - "net-nginx": Nginx Server (network)
     - "ops-docker": Docker Container (devops)
     - "ops-kubernetes": Kubernetes (devops)
     - "ops-github": GitHub Repository (devops)
     - "ops-terraform": Terraform (devops)
     - "client-browser": Web Browser / UI (client)
     - "client-mobile": Mobile App / Device (client)
     - "api-rest": REST API Gateway (network)
     - "api-graphql": GraphQL API (network)
     - "api-grpc": gRPC API (network)
     - "security-shield": Security Shield / WAF (security)

Allowed Edge Types & Data:
- Type is always "customCanvasEdge"
- data.label: text label on the line (optional)
- data.directed: true (directed arrow, default) or false (undirected connection line)
- animated: boolean (whether the flow dots animate)

Layout and Spacing Rules:
- Layout must be extremely clean.
- Place nodes side-by-side or stacked top-to-bottom.
- Separate adjacent nodes by 150px to 300px so they do not overlap.
  - Horizontally: add 200px-250px to X coordinates.
  - Vertically: add 150px-200px to Y coordinates.
- If the canvas already contains nodes, check their positions and add new nodes adjacent to them. Do not overlap existing nodes!

MANDATORY GENERATION RULES:
- You MUST generate at least 5 actions for any non-trivial architecture request.
- For pipeline/workflow prompts (CI/CD, data pipeline, event flow): generate at least 6 nodes + 5 edges = 11 actions minimum.
- For database/storage prompts: at least 4 nodes + 3 edges.
- NEVER return just 1 node for any prompt that describes a system, pipeline, or workflow.
- If unsure, generate MORE nodes rather than fewer. A richer diagram is always better.

EXAMPLE — If the user asks: "Design a simple REST API backend":
You MUST return at minimum 5-8 actions like:
{
  "actions": [
    { "type": "add_node", "id": "client_1", "nodeType": "iconNode", "position": {"x": 50, "y": 200}, "data": { "label": "Web Browser", "iconId": "client-browser", "color": "blue" } },
    { "type": "add_node", "id": "api_gateway_1", "nodeType": "iconNode", "position": {"x": 300, "y": 200}, "data": { "label": "REST API Gateway", "iconId": "api-rest", "color": "green" } },
    { "type": "add_node", "id": "app_server_1", "nodeType": "canvasNode", "position": {"x": 550, "y": 200}, "data": { "label": "App Server", "color": "neutral", "shape": "rectangle" }, "width": 150, "height": 80 },
    { "type": "add_node", "id": "db_1", "nodeType": "iconNode", "position": {"x": 800, "y": 200}, "data": { "label": "PostgreSQL DB", "iconId": "db-postgresql", "color": "teal" } },
    { "type": "add_edge", "id": "e_client_api", "source": "client_1", "target": "api_gateway_1", "data": { "label": "HTTP Request", "directed": true }, "animated": true },
    { "type": "add_edge", "id": "e_api_server", "source": "api_gateway_1", "target": "app_server_1", "data": { "label": "Route", "directed": true }, "animated": false },
    { "type": "add_edge", "id": "e_server_db", "source": "app_server_1", "target": "db_1", "data": { "label": "Query", "directed": true }, "animated": false }
  ],
  "explanation": "Created a 3-tier REST API backend: Browser → API Gateway → App Server → PostgreSQL DB with animated request flow."
}`;

      const userPromptBlock = `
Project Context:
- Project Name: "${projectName || "Unnamed Project"}"
- Project Description: "${projectDescription || "No description provided"}"

Current Canvas State:
- Existing Nodes (${currentNodes.length}): ${currentNodes.length === 0 ? "Empty canvas" : JSON.stringify(currentNodes.map(n => ({ id: n.id, type: n.type, label: (n.data as any)?.label, position: n.position })))}
- Existing Edges (${currentEdges.length}): ${currentEdges.length === 0 ? "No edges" : JSON.stringify(currentEdges.map(e => ({ id: e.id, source: e.source, target: e.target })))}

User Request: "${prompt}"

Remember: Generate a complete, professional, multi-node diagram. Minimum 5 actions for any architecture request.
`;

      const geminiModel = google("gemini-2.5-pro");
      const { object } = await generateObject({
        model: geminiModel,
        schema: DesignAgentOutputSchema,
        system: systemInstruction,
        prompt: userPromptBlock,
      });

      logger.log("Gemini mutations planned successfully", {
        actionCount: object.actions.length,
        explanation: object.explanation,
      });

      // Build effective node ID set (existing + to-be-added)
      const existingNodeIds = new Set(currentNodes.map(n => n.id));
      const actionNodeIds = new Set(
        object.actions
          .filter(a => a.type === "add_node")
          .map(a => a.id)
      );
      const allNodeIds = new Set([...existingNodeIds, ...actionNodeIds]);

      // Filter out edges with invalid source/target node references
      const validatedActions = object.actions.filter(action => {
        if (action.type === "add_edge") {
          const hasSource = allNodeIds.has(action.source || "");
          const hasTarget = allNodeIds.has(action.target || "");
          if (!hasSource || !hasTarget) {
            logger.warn("Dropping edge with invalid node reference", {
              edgeId: action.id,
              source: action.source,
              target: action.target,
              reason: !hasSource ? "source node missing" : "target node missing",
            });
            return false;
          }
        }
        return true;
      });

      // Cap maximum actions to prevent runaway mutations
      const MAX_ACTIONS = 60;
      if (validatedActions.length > MAX_ACTIONS) {
        logger.warn(`Action count ${validatedActions.length} exceeds cap. Truncating to ${MAX_ACTIONS}.`);
        validatedActions.splice(MAX_ACTIONS);
      }

      // Separate actions by type for progressive mutations
      const nodeActions = validatedActions.filter(
        a => a.type === "add_node" || a.type === "update_node" || a.type === "delete_node"
      );
      const edgeActions = validatedActions.filter(
        a => a.type === "add_edge" || a.type === "delete_edge"
      );

      // PHASE 1: Apply all node additions/modifications first
      if (nodeActions.length > 0) {
        metadata.set("progressMessage", `Adding/Updating ${nodeActions.length} nodes...`);

        // Track AI cursor to the first new node's actual position
        const firstNewNode = nodeActions.find(a => a.type === "add_node" && a.position);
        if (firstNewNode && firstNewNode.position) {
          await setAiPresence(roomId, firstNewNode.position, true);
        }

        await liveblocks.mutateStorage(roomId, ({ root }) => {
          const rootAny = root as any;
          let flow = rootAny.get("flow");
          if (!flow) {
            flow = new LiveObject({
              nodes: new LiveMap(),
              edges: new LiveMap(),
            });
            rootAny.set("flow", flow);
          }

          const nodesMap = flow.get("nodes");
          const edgesMap = flow.get("edges");

          for (const act of nodeActions) {
            switch (act.type) {
              case "add_node": {
                const defaultWidth =
                  act.nodeType === "canvasNode"
                    ? 150
                    : act.nodeType === "stickyNote"
                    ? 180
                    : act.nodeType === "textBlock"
                    ? 200
                    : 100;
                const defaultHeight =
                  act.nodeType === "canvasNode"
                    ? 80
                    : act.nodeType === "stickyNote"
                    ? 120
                    : act.nodeType === "textBlock"
                    ? 60
                    : 100;

                const nodeObj = new LiveObject({
                  id: act.id,
                  type: act.nodeType,
                  position: new LiveObject(act.position),
                  data: new LiveObject({
                    label: act.data?.label || "",
                    color: act.data?.color || "neutral",
                    shape: act.data?.shape,
                    fontSize: act.data?.fontSize,
                    textAlign: act.data?.textAlign,
                    bold: act.data?.bold,
                    italic: act.data?.italic,
                    iconId: act.data?.iconId,
                  } as any),
                  width: act.width ?? defaultWidth,
                  height: act.height ?? defaultHeight,
                  selected: false,
                } as any);

                nodesMap.set(act.id, nodeObj);
                break;
              }
              case "update_node": {
                const nodeObj = nodesMap.get(act.id) as any;
                if (nodeObj) {
                  if (act.position) {
                    const posObj = nodeObj.get("position") as any;
                    if (posObj) {
                      if (act.position.x !== undefined) posObj.set("x", act.position.x);
                      if (act.position.y !== undefined) posObj.set("y", act.position.y);
                    } else {
                      nodeObj.set("position", new LiveObject(act.position));
                    }
                  }
                  if (act.data) {
                    const dataObj = nodeObj.get("data") as any;
                    if (dataObj) {
                      for (const [k, v] of Object.entries(act.data)) {
                        if (v !== undefined) {
                          dataObj.set(k, v);
                        }
                      }
                    }
                  }
                  if (act.width !== undefined) nodeObj.set("width", act.width);
                  if (act.height !== undefined) nodeObj.set("height", act.height);
                }
                break;
              }
              case "delete_node": {
                nodesMap.delete(act.id);
                // Clean up dangling edges source/target references
                for (const [edgeId, edgeObj] of edgesMap.entries()) {
                  const eObj = edgeObj as any;
                  if (eObj.get("source") === act.id || eObj.get("target") === act.id) {
                    edgesMap.delete(edgeId);
                  }
                }
                break;
              }
            }
          }
        });
      }

      // Small pause (300ms) to allow React Flow to render nodes, creating a "drawing" effect
      if (nodeActions.length > 0 && edgeActions.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // PHASE 2: Apply all edge additions/modifications second
      if (edgeActions.length > 0) {
        metadata.set("progressMessage", `Connecting ${edgeActions.length} edges...`);

        // Move cursor to the centroid of newly created nodes
        const newNodesWithPos = nodeActions.filter(a => a.type === "add_node" && a.position);
        if (newNodesWithPos.length > 0) {
          const centroid = {
            x: newNodesWithPos.reduce((sum, p) => sum + p.position!.x, 0) / newNodesWithPos.length,
            y: newNodesWithPos.reduce((sum, p) => sum + p.position!.y, 0) / newNodesWithPos.length,
          };
          await setAiPresence(roomId, centroid, true);
        }

        await liveblocks.mutateStorage(roomId, ({ root }) => {
          const rootAny = root as any;
          let flow = rootAny.get("flow");
          if (!flow) {
            flow = new LiveObject({
              nodes: new LiveMap(),
              edges: new LiveMap(),
            });
            rootAny.set("flow", flow);
          }

          const edgesMap = flow.get("edges");

          for (const act of edgeActions) {
            switch (act.type) {
              case "add_edge": {
                const edgeObj = new LiveObject({
                  id: act.id,
                  type: "customCanvasEdge",
                  source: act.source,
                  target: act.target,
                  data: new LiveObject({
                    label: act.data?.label || "",
                    directed: act.data?.directed !== false,
                    controlX: null,
                    controlY: null,
                  } as any),
                  selected: false,
                  animated: act.animated ?? false,
                } as any);
                edgesMap.set(act.id, edgeObj);
                break;
              }
              case "delete_edge": {
                edgesMap.delete(act.id);
                break;
              }
            }
          }
        });
      }

      // Step 5: Wrap up task and clear presence
      metadata.set("progressMessage", "Design finalized!");
      await setAiPresence(roomId, null, false);

      return {
        success: true,
        actionsApplied: validatedActions.length,
        explanation: object.explanation,
      };
    } catch (error: any) {
      logger.error("Error running design agent logic", {
        message: error.message,
        name: error.name,
        cause: error.cause ? {
          message: error.cause.message,
          name: error.cause.name,
          code: error.cause.code,
          stack: error.cause.stack,
        } : undefined,
        stack: error.stack,
      });
      metadata.set("progressMessage", "Task failed.");
      await setAiPresence(roomId, null, false);
      return {
        success: false,
        error: error.message || "An unexpected error occurred during execution.",
      };
    }
  },
});
