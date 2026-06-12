"use client"

import React, { Component, ErrorInfo, ReactNode, useRef, useCallback, useState, useEffect } from "react"
import { ReactFlow, Background, BackgroundVariant, MiniMap, ConnectionMode, ReactFlowProvider, useReactFlow, NodeChange, EdgeChange, MarkerType } from "@xyflow/react"
import { LiveblocksProvider, RoomProvider, ClientSideSuspense, useMutation, useUndo, useRedo, useOthers, useUpdateMyPresence } from "@liveblocks/react/suspense"
import { useLiveblocksFlow } from "@liveblocks/react-flow"
import { LiveObject, LiveMap } from "@liveblocks/client"
import { AlertTriangle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"
import { useUser, UserButton } from "@clerk/nextjs"
import { clerkAppearance } from "@/lib/clerk-theme"
import { useCanvasAutosave, SaveStatus } from "@/hooks/useCanvasAutosave"

// Import CSS styles for React Flow and Liveblocks
import "@xyflow/react/dist/style.css"
import "@liveblocks/react-ui/styles.css"
import "@liveblocks/react-flow/styles.css"

// Import Canvas types, constants and extracted components
import { CanvasNode, CanvasEdge, NodeShape, CanvasNodeType } from "@/types/canvas"
import "@/liveblocks.config"
import { CanvasTemplate } from "./starter-templates"
import { CustomCanvasEdge } from "./custom-edge"
import { CanvasControls } from "./canvas-controls"
import { CanvasContextMenu } from "./canvas-context-menu"
import { ClipboardNode } from "@/hooks/useKeyboardShortcuts"

// Extracted Canvas Components
import { CanvasNodeComponent } from "./canvas-node-canvas"
import { StickyNoteNode } from "./canvas-node-sticky"
import { TextBlockNode } from "./canvas-node-text"
import { IconNodeComponent } from "./canvas-node-icon"
import { ShapePanel } from "./canvas-shape-panel"
import { CanvasAvatar, CustomCursors } from "./canvas-cursors"

function getInitials(name?: string) {
  if (!name) return "?"
  return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
}

interface CanvasWrapperProps {
  roomId: string
  onImportTemplate?: (importFn: (template: CanvasTemplate) => void) => void
  isCommentMode?: boolean
  onCommentPlaced?: () => void
  isAiSidebarOpen?: boolean
  onSaveStatusChange?: (status: SaveStatus) => void
}

// 1. Error Boundary Component
interface ErrorBoundaryProps {
  children?: ReactNode
  fallback: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

class CanvasErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
  }

  public static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in collaborative canvas:", error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback
    }

    return this.props.children
  }
}

interface CanvasActionsContextType {
  deleteNode: (id: string) => void
  duplicateNode: (id: string) => void
  deleteEdge: (id: string) => void
  updateEdgeData: (id: string, partialData: Record<string, unknown>) => void
  updateNodeData: (id: string, partialData: Record<string, unknown>) => void
}
export const CanvasActionsContext = React.createContext<CanvasActionsContextType | null>(null)

// Node types registry for React Flow
const nodeTypes = {
  canvasNode: CanvasNodeComponent,
  stickyNote: StickyNoteNode,
  textBlock: TextBlockNode,
  iconNode: IconNodeComponent,
}

// Edge types registry for React Flow
const edgeTypes = {
  customCanvasEdge: CustomCanvasEdge,
}

// 4. Collaborative Canvas (inside ReactFlowProvider)
interface CollaborativeCanvasProps {
  projectId: string
  onImportTemplate?: (importFn: (template: CanvasTemplate) => void) => void
  isCommentMode?: boolean
  onCommentPlaced?: () => void
  isAiSidebarOpen?: boolean
  onSaveStatusChange?: (status: SaveStatus) => void
}

function CollaborativeCanvas({
  projectId,
  onImportTemplate,
  isCommentMode = false,
  onCommentPlaced,
  isAiSidebarOpen = false,
  onSaveStatusChange,
}: CollaborativeCanvasProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const reactFlowInstance = useReactFlow()

  const { user } = useUser()
  const authorName = user?.fullName || user?.username || "Anonymous"

  const others = useOthers()
  const updateMyPresence = useUpdateMyPresence()
  const currentClerkUserId = user?.id

  // Filter out any connection belonging to the current user (e.g. self or other tabs of self)
  const collaborators = others.filter((other) => other.id !== currentClerkUserId)

  // Cursor move handler
  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!reactFlowWrapper.current) return

    const position = reactFlowInstance.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    })
    updateMyPresence({ cursor: position })
  }, [reactFlowInstance, updateMyPresence])

  const handleMouseLeave = useCallback(() => {
    updateMyPresence({ cursor: null })
  }, [updateMyPresence])

  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } = useLiveblocksFlow<CanvasNode, CanvasEdge>({
    suspense: true,
    nodes: {
      initial: [],
      sync: {
        "*": {
          label: "atomic",
          color: "atomic",
          shape: "atomic",
          fontSize: "atomic",
          textAlign: "atomic",
          bold: "atomic",
          italic: "atomic",
          iconId: "atomic",
          commentText: "atomic",
          commentAuthor: "atomic",
          commentResolved: "atomic",
        }
      }
    },
    edges: {
      initial: [],
      sync: {
        "*": {
          label: "atomic",
          directed: "atomic",
          controlX: "atomic",
          controlY: "atomic",
        }
      }
    },
  })

  // --- Canvas Autosave & Load Guard Implementation ---
  const didAttemptLoad = useRef(false)
  const [isRestoring, setIsRestoring] = useState(false)

  // Collaborative mutation to restore a saved canvas snapshot into Liveblocks storage
  const restoreCanvas = useMutation(({ storage }: any, restoredNodes: CanvasNode[], restoredEdges: CanvasEdge[]) => {
    let flow = storage.get("flow")
    if (!flow) {
      flow = new LiveObject({
        nodes: new LiveMap(),
        edges: new LiveMap(),
      })
      storage.set("flow", flow)
    }

    const nodesMap = flow.get("nodes")
    const edgesMap = flow.get("edges")

    if (nodesMap) {
      nodesMap.clear()
      for (const node of restoredNodes) {
        nodesMap.set(
          node.id,
          new LiveObject({
            id: node.id,
            type: node.type,
            position: new LiveObject(node.position),
            data: new LiveObject(node.data as any),
            width: node.width,
            height: node.height,
            selected: node.selected,
          })
        )
      }
    }

    if (edgesMap) {
      edgesMap.clear()
      for (const edge of restoredEdges) {
        edgesMap.set(
          edge.id,
          new LiveObject({
            id: edge.id,
            type: edge.type,
            source: edge.source,
            target: edge.target,
            data: edge.data ? new LiveObject(edge.data as any) : undefined,
            selected: edge.selected,
            animated: edge.animated,
          })
        )
      }
    }
  }, [])

  // Load guard (empty-room check)
  useEffect(() => {
    if (didAttemptLoad.current) return

    const isEmpty = nodes.length === 0 && edges.length === 0
    if (!isEmpty) {
      didAttemptLoad.current = true
      return
    }

    didAttemptLoad.current = true
    setIsRestoring(true)

    async function loadCanvas() {
      try {
        const res = await fetch(`/api/projects/${projectId}/canvas`)
        if (!res.ok) throw new Error("Failed to fetch canvas")
        const data = await res.json()
        if (data && data.canvas) {
          const { nodes: restoredNodes, edges: restoredEdges } = data.canvas
          if (restoredNodes && restoredEdges) {
            restoreCanvas(restoredNodes, restoredEdges)
          }
        }
      } catch (err) {
        console.error("Failed to load canvas from snapshot:", err)
      } finally {
        setIsRestoring(false)
      }
    }

    loadCanvas()
  }, [projectId, nodes.length, edges.length, restoreCanvas])

  // Wire autosave hook
  const { saveStatus } = useCanvasAutosave({
    projectId,
    nodes,
    edges,
    enabled: !isRestoring && didAttemptLoad.current,
  })

  // Notify parent component of saveStatus changes
  useEffect(() => {
    if (onSaveStatusChange) {
      onSaveStatusChange(saveStatus)
    }
  }, [saveStatus, onSaveStatusChange])

  const undo = useUndo()
  const redo = useRedo()

  const addNodes = useCallback((newNodes: CanvasNode[]) => {
    const selectionChanges = nodes
      .filter((n) => n.selected)
      .map((n) => ({
        id: n.id,
        type: "select",
        selected: false,
      } as unknown as NodeChange<CanvasNode>))

    onNodesChange([
      ...selectionChanges,
      ...newNodes.map((n) => ({
        type: "add",
        item: n,
      } as unknown as NodeChange<CanvasNode>)),
    ])
  }, [nodes, onNodesChange])

  const deleteSelectedNodes = useCallback(() => {
    const selectedNodes = nodes.filter((n) => n.selected)
    if (selectedNodes.length > 0) {
      reactFlowInstance.deleteElements({ nodes: selectedNodes })
    }
  }, [nodes, reactFlowInstance])

  const duplicateSelectedNodes = useCallback(() => {
    const selectedNodes = nodes.filter((n) => n.selected)
    if (selectedNodes.length === 0) return

    const selectionChanges = nodes
      .filter((n) => n.selected)
      .map((n) => ({
        id: n.id,
        type: "select",
        selected: false,
      } as unknown as NodeChange<CanvasNode>))

    const duplicatedNodes = selectedNodes.map((targetNode) => {
      const prefix = targetNode.type === "canvasNode" ? (targetNode.data.shape || "rectangle") : targetNode.type
      const newId = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
      return {
        id: newId,
        type: targetNode.type,
        position: {
          x: targetNode.position.x + 30,
          y: targetNode.position.y - 45,
        },
        data: { ...targetNode.data },
        width: targetNode.width,
        height: targetNode.height,
        selected: true,
      } as CanvasNode
    })

    onNodesChange([
      ...selectionChanges,
      ...duplicatedNodes.map((n) => ({
        type: "add",
        item: n,
      } as unknown as NodeChange<CanvasNode>)),
    ])
  }, [nodes, onNodesChange])

  // Import a template: clear canvas then populate with template nodes + edges
  const importTemplate = useCallback((template: CanvasTemplate) => {
    // Remove all existing nodes (edges are removed automatically with their nodes)
    const removeNodeChanges = nodes.map((n) => ({
      type: "remove",
      id: n.id,
    } as unknown as NodeChange<CanvasNode>))

    const removeEdgeChanges = edges.map((e) => ({
      type: "remove",
      id: e.id,
    } as unknown as EdgeChange<CanvasEdge>))

    if (removeNodeChanges.length > 0) onNodesChange(removeNodeChanges)
    if (removeEdgeChanges.length > 0) onEdgesChange(removeEdgeChanges)

    // Add template nodes and edges after a micro-tick to allow removal to settle
    setTimeout(() => {
      const addNodeChanges = template.nodes.map((n) => ({
        type: "add",
        item: { ...n },
      } as unknown as NodeChange<CanvasNode>))

      const addEdgeChanges = template.edges.map((e) => ({
        type: "add",
        item: { ...e },
      } as unknown as EdgeChange<CanvasEdge>))

      if (addNodeChanges.length > 0) onNodesChange(addNodeChanges)
      if (addEdgeChanges.length > 0) onEdgesChange(addEdgeChanges)

      setTimeout(() => {
        reactFlowInstance.fitView({ duration: 400, padding: 0.15 })
      }, 80)
    }, 50)
  }, [nodes, edges, onNodesChange, onEdgesChange, reactFlowInstance])

  // Register the import function with the parent component
  useEffect(() => {
    if (onImportTemplate) {
      onImportTemplate(importTemplate)
    }
  }, [onImportTemplate, importTemplate])

  // Lifted Clipboard State
  const [clipboard, setClipboard] = useState<ClipboardNode[] | null>(null)

  // Position-aware Paste Function
  const pasteNodes = useCallback((position?: { x: number; y: number }) => {
    if (!clipboard || clipboard.length === 0) return

    // Determine destination coordinates
    let pasteCenter: { x: number; y: number }
    if (position) {
      pasteCenter = position
    } else {
      // Fallback to center of viewport
      const viewport = reactFlowInstance.getViewport()
      pasteCenter = {
        x: -viewport.x / viewport.zoom + window.innerWidth / (2 * viewport.zoom),
        y: -viewport.y / viewport.zoom + window.innerHeight / (2 * viewport.zoom),
      }
    }

    // Calculate center of copied bounding box
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    clipboard.forEach((node) => {
      const w = node.width || 150
      const h = node.height || 80
      if (node.position.x < minX) minX = node.position.x
      if (node.position.y < minY) minY = node.position.y
      if (node.position.x + w > maxX) maxX = node.position.x + w
      if (node.position.y + h > maxY) maxY = node.position.y + h
    })

    const copiedCenter = {
      x: minX + (maxX - minX) / 2,
      y: minY + (maxY - minY) / 2,
    }

    // Deselect currently selected
    const selectionChanges = nodes
      .filter((n) => n.selected)
      .map((n) => ({
        id: n.id,
        type: "select",
        selected: false,
      } as unknown as NodeChange<CanvasNode>))

    const newNodes: CanvasNode[] = clipboard.map((node) => {
      const type = node.type || "canvasNode"
      const id = `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
      
      const offsetX = node.position.x - copiedCenter.x
      const offsetY = node.position.y - copiedCenter.y

      return {
        id,
        type,
        position: {
          x: pasteCenter.x + offsetX,
          y: pasteCenter.y + offsetY,
        },
        data: { ...node.data },
        width: node.width,
        height: node.height,
        selected: true,
      } as CanvasNode
    })

    onNodesChange([
      ...selectionChanges,
      ...newNodes.map((n) => ({
        type: "add",
        item: n,
      } as unknown as NodeChange<CanvasNode>))
    ])
  }, [clipboard, nodes, onNodesChange, reactFlowInstance])

  // Bind viewport and history keyboard shortcuts
  useKeyboardShortcuts({
    reactFlowInstance,
    undo,
    redo,
    nodes,
    addNodes,
    deleteSelectedNodes,
    duplicateSelectedNodes,
    clipboard,
    setClipboard,
    pasteNodes,
  })

  // Handles drag start payload (supports shapes, sticky notes, text blocks, icon nodes)
  const handleDragStart = useCallback((event: React.DragEvent, type: "shape" | "stickyNote" | "textBlock" | "iconNode", shape?: NodeShape) => {
    let width = 150
    let height = 80
    if (type === "shape" && shape) {
      switch (shape) {
        case "rectangle": width = 150; height = 80; break
        case "diamond": width = 120; height = 120; break
        case "circle": width = 80; height = 80; break
        case "pill": width = 120; height = 60; break
        case "cylinder": width = 100; height = 100; break
        case "hexagon": width = 120; height = 100; break
      }
      event.dataTransfer.setData("application/reactflow/shape", shape)
    } else {
      switch (type) {
        case "stickyNote": width = 180; height = 120; break
        case "textBlock": width = 200; height = 60; break
        case "iconNode": width = 100; height = 100; break
      }
    }

    event.dataTransfer.setData("application/reactflow/type", type)
    event.dataTransfer.setData("application/reactflow/width", String(width))
    event.dataTransfer.setData("application/reactflow/height", String(height))
    event.dataTransfer.effectAllowed = "move"
  }, [])

  // Drag over handler
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
  }, [])

  // Drop handler to create nodes (types: shape, stickyNote, textBlock, iconNode)
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      if (!reactFlowWrapper.current) return

      const itemType = event.dataTransfer.getData("application/reactflow/type") as "shape" | "stickyNote" | "textBlock" | "iconNode"
      const shape = event.dataTransfer.getData("application/reactflow/shape") as NodeShape | ""
      const widthStr = event.dataTransfer.getData("application/reactflow/width")
      const heightStr = event.dataTransfer.getData("application/reactflow/height")

      if (!itemType) return

      const width = parseInt(widthStr, 10) || 150
      const height = parseInt(heightStr, 10) || 80

      // Convert screen client coordinates to flow coordinates
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })

      // Center the node on drop coordinates
      const centerPosition = {
        x: position.x - width / 2,
        y: position.y - height / 2,
      }

      // Generate node ID
      const prefix = itemType === "shape" ? (shape || "node") : itemType
      const id = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`

      const newNode: CanvasNode = {
        id,
        type: itemType === "shape" ? "canvasNode" : itemType,
        position: centerPosition,
        data: {
          label: "",
          ...(itemType === "shape" ? { shape, color: "neutral" } : {}),
          ...(itemType === "stickyNote" ? { color: "yellow", fontSize: "md", textAlign: "left" } : {}),
          ...(itemType === "textBlock" ? { color: "neutral", fontSize: "md", textAlign: "center" } : {}),
          ...(itemType === "iconNode" ? { color: "neutral", iconId: "aws-lambda" } : {}),
        },
        width,
        height,
      } as CanvasNode

      onNodesChange([
        {
          type: "add",
          item: newNode,
        } as unknown as NodeChange<CanvasNode>,
      ])
    },
    [reactFlowInstance, onNodesChange]
  )

  const deleteNode = useCallback((id: string) => {
    const targetNode = nodes.find((n) => n.id === id)
    if (targetNode) {
      reactFlowInstance.deleteElements({ nodes: [targetNode] })
    }
  }, [nodes, reactFlowInstance])

  const duplicateNode = useCallback((id: string) => {
    const targetNode = nodes.find((n) => n.id === id)
    if (!targetNode) return

    const prefix = targetNode.type === "canvasNode" ? (targetNode.data.shape || "rectangle") : targetNode.type
    const newId = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    
    // Deselect other currently selected nodes locally to transfer focus to the clone
    const selectionChanges = nodes
      .filter((n) => n.selected)
      .map((n) => ({
        id: n.id,
        type: "select",
        selected: false,
      } as unknown as NodeChange<CanvasNode>))

    const duplicatedNode: CanvasNode = {
      id: newId,
      type: targetNode.type,
      position: {
        x: targetNode.position.x + 30,
        y: targetNode.position.y - 45, // Offset above and to the right
      },
      data: { ...targetNode.data },
      width: targetNode.width,
      height: targetNode.height,
      selected: true,
    } as CanvasNode

    onNodesChange([
      ...selectionChanges,
      {
        type: "add",
        item: duplicatedNode,
      } as unknown as NodeChange<CanvasNode>,
    ])
  }, [nodes, onNodesChange])

  const deleteEdge = useCallback((id: string) => {
    const targetEdge = edges.find((e) => e.id === id)
    if (targetEdge) {
      onDelete({ nodes: [], edges: [targetEdge] })
    }
  }, [edges, onDelete])

  const updateEdgeData = useMutation(({ storage }: any, edgeId: string, partialData: Record<string, unknown>) => {
    const flow = storage.get("flow")
    if (!flow) return
    const edgesMap = flow.get("edges")
    if (!edgesMap) return
    const edgeObj = edgesMap.get(edgeId)
    if (!edgeObj) return
    const dataObj = edgeObj.get("data")
    if (dataObj) {
      for (const [key, val] of Object.entries(partialData)) {
        if (val === undefined || val === null) {
          dataObj.delete(key)
        } else {
          dataObj.set(key, val as any)
        }
      }
    }
  }, [])

  // Collaborative mutation to update node data properties
  const updateNodeData = useMutation(({ storage }: any, nodeId: string, partialData: Record<string, unknown>) => {
    const flow = storage.get("flow")
    if (!flow) return
    const nodesMap = flow.get("nodes")
    if (!nodesMap) return
    const nodeObj = nodesMap.get(nodeId)
    if (!nodeObj) return
    const dataObj = nodeObj.get("data")
    if (dataObj) {
      for (const [key, val] of Object.entries(partialData)) {
        if (val === undefined || val === null) {
          dataObj.delete(key)
        } else {
          dataObj.set(key, val as any)
        }
      }
    }
  }, [])

  // Context Menu state
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null)

  const onPaneContextMenu = useCallback((event: React.MouseEvent<Element, MouseEvent> | MouseEvent) => {
    event.preventDefault()
    setMenuPosition({
      x: event.clientX,
      y: event.clientY,
    })
  }, [])

  const handleAddStickyFromMenu = useCallback(() => {
    if (!menuPosition) return
    const position = reactFlowInstance.screenToFlowPosition({
      x: menuPosition.x,
      y: menuPosition.y,
    })
    const id = `sticky_${crypto.randomUUID()}`
    const newNode: CanvasNode = {
      id,
      type: "stickyNote",
      position: { x: position.x - 90, y: position.y - 60 },
      data: {
        label: "",
        color: "yellow",
        fontSize: "md",
        textAlign: "left",
      },
      width: 180,
      height: 120,
    }
    onNodesChange([{ type: "add", item: newNode } as any])
  }, [menuPosition, reactFlowInstance, onNodesChange])

  const handleAddTextBlockFromMenu = useCallback(() => {
    if (!menuPosition) return
    const position = reactFlowInstance.screenToFlowPosition({
      x: menuPosition.x,
      y: menuPosition.y,
    })
    const id = `text_${Date.now()}`
    const newNode: CanvasNode = {
      id,
      type: "textBlock",
      position: { x: position.x - 100, y: position.y - 30 },
      data: {
        label: "",
        color: "neutral",
        fontSize: "md",
        textAlign: "center",
      },
      width: 200,
      height: 60,
    }
    onNodesChange([{ type: "add", item: newNode } as any])
  }, [menuPosition, reactFlowInstance, onNodesChange])

  const handleAddIconNodeFromMenu = useCallback(() => {
    if (!menuPosition) return
    const position = reactFlowInstance.screenToFlowPosition({
      x: menuPosition.x,
      y: menuPosition.y,
    })
    const id = `icon_${crypto.randomUUID()}`
    const newNode: CanvasNode = {
      id,
      type: "iconNode",
      position: { x: position.x - 50, y: position.y - 50 },
      data: {
        label: "",
        color: "neutral",
        iconId: "aws-lambda",
      },
      width: 100,
      height: 100,
    }
    onNodesChange([{ type: "add", item: newNode } as any])
  }, [menuPosition, reactFlowInstance, onNodesChange])

  const handleSelectAll = useCallback(() => {
    const changes = nodes.map(n => ({
      id: n.id,
      type: "select",
      selected: true,
    } as unknown as NodeChange<CanvasNode>))
    onNodesChange(changes)
  }, [nodes, onNodesChange])

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href)
  }, [])

  // Connection-drop-to-create state & refs
  const connectStartRef = useRef<{ nodeId: string; handleId: string | null; handleType: string | null } | null>(null)

  const onConnectStart = useCallback((event: any, { nodeId, handleId, handleType }: any) => {
    connectStartRef.current = { nodeId, handleId, handleType }
  }, [])

  const onConnectEnd = useCallback((event: any) => {
    if (!connectStartRef.current) return

    const target = event.target as HTMLElement
    const isPane = target.classList.contains("react-flow__pane") || target.classList.contains("react-flow__transformationpane")
    
    if (isPane && reactFlowWrapper.current) {
      const { nodeId: sourceId, handleId: sourceHandleId, handleType: sourceHandleType } = connectStartRef.current

      // Calculate position
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })

      const newId = `node_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
      const newNode: CanvasNode = {
        id: newId,
        type: "canvasNode",
        position: {
          x: position.x - 75,
          y: position.y - 30,
        },
        data: {
          label: "",
          shape: "rectangle",
          color: "neutral",
        },
        width: 150,
        height: 60,
      }

      onNodesChange([
        {
          type: "add",
          item: newNode,
        } as unknown as NodeChange<CanvasNode>
      ])

      const edgeId = `edge_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
      const newEdge: CanvasEdge = {
        id: edgeId,
        type: "customCanvasEdge",
        source: sourceHandleType === "source" ? sourceId : newId,
        target: sourceHandleType === "source" ? newId : sourceId,
        sourceHandle: sourceHandleType === "source" ? (sourceHandleId || "r") : "l",
        targetHandle: sourceHandleType === "source" ? "l" : (sourceHandleId || "r"),
        data: {
          directed: true,
        }
      }

      setTimeout(() => {
        onEdgesChange([
          {
            type: "add",
            item: newEdge,
          } as unknown as EdgeChange<CanvasEdge>
        ])
      }, 50)
    }

    connectStartRef.current = null
  }, [reactFlowInstance, onNodesChange, onEdgesChange])

  // Comment Mode Pane Click handler
  const onPaneClick = useCallback((event: React.MouseEvent<Element, MouseEvent> | MouseEvent) => {
    if (!isCommentMode || !reactFlowWrapper.current) return

    const position = reactFlowInstance.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    })

    const id = `comment_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    const newCommentNode: CanvasNode = {
      id,
      type: "stickyNote",
      position: {
        x: position.x - 90,
        y: position.y - 60,
      },
      data: {
        label: "",
        color: "yellow",
        fontSize: "md",
        textAlign: "left",
        commentText: "",
        commentAuthor: authorName,
        commentResolved: false,
      },
      width: 180,
      height: 120,
    }

    onNodesChange([
      {
        type: "add",
        item: newCommentNode,
      } as unknown as NodeChange<CanvasNode>
    ])

    // Turn off comment mode after successfully dropping a comment box
    onCommentPlaced?.()
  }, [isCommentMode, reactFlowInstance, onNodesChange, authorName, onCommentPlaced])

  return (
    <CanvasActionsContext.Provider value={{ deleteNode, duplicateNode, deleteEdge, updateEdgeData, updateNodeData }}>
      <div 
        ref={reactFlowWrapper} 
        className={cn(
          "w-full h-full relative select-none",
          isCommentMode ? "cursor-comment" : ""
        )}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDelete={onDelete}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onPaneContextMenu={onPaneContextMenu}
          onConnectStart={onConnectStart}
          onConnectEnd={onConnectEnd}
          onPaneClick={onPaneClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          defaultEdgeOptions={{
            type: "customCanvasEdge",
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 16,
              height: 16,
              color: "var(--border-default)",
            }
          }}
          connectionMode={ConnectionMode.Loose}
          zoomOnDoubleClick={false}
          fitView
          className="bg-base"
        >
          <Background 
            variant={BackgroundVariant.Dots} 
            color="rgba(240, 240, 244, 0.15)" 
            gap={24} 
            size={1} 
          />
          <MiniMap
            position="bottom-left"
            className="!bg-surface !border !border-surface-border rounded-xl overflow-hidden shadow-lg hidden lg:block"
            maskColor="rgba(8, 8, 9, 0.7)"
            nodeColor="#1a1a20"
            nodeStrokeWidth={0}
          />
          <CustomCursors />
        </ReactFlow>

        {/* Floating Context Menu */}
        {menuPosition && (
          <CanvasContextMenu
            x={menuPosition.x}
            y={menuPosition.y}
            onClose={() => setMenuPosition(null)}
            onPaste={() => {
              const flowPos = reactFlowInstance.screenToFlowPosition({
                x: menuPosition.x,
                y: menuPosition.y,
              })
              pasteNodes(flowPos)
            }}
            onSelectAll={handleSelectAll}
            onFitView={() => reactFlowInstance.fitView({ duration: 400 })}
            onAddSticky={handleAddStickyFromMenu}
            onAddTextBlock={handleAddTextBlockFromMenu}
            onAddIconNode={handleAddIconNodeFromMenu}
            onZoomIn={() => reactFlowInstance.zoomIn()}
            onZoomOut={() => reactFlowInstance.zoomOut()}
            onCopyLink={handleCopyLink}
            hasClipboardItems={!!clipboard && clipboard.length > 0}
          />
        )}

        {/* Floating Presence Avatar Group */}
        <div 
          className={cn(
            "absolute top-4 transition-all duration-300 ease-in-out z-20 flex items-center gap-2 bg-surface/90 backdrop-blur-md border border-surface-border p-1.5 rounded-xl shadow-2xl",
            isAiSidebarOpen ? "right-[21rem]" : "right-4"
          )}
        >
          {/* Collaborators Stack */}
          {collaborators.length > 0 && (
            <div className="flex items-center -space-x-2 pr-1 select-none">
              {collaborators.slice(0, 5).map(({ connectionId, info }) => {
                const name = info?.name || "Collaborator"
                const avatar = info?.avatar
                const initials = getInitials(name)

                return (
                  <CanvasAvatar
                    key={connectionId}
                    name={name}
                    avatar={avatar}
                    initials={initials}
                  />
                )
              })}              
              {/* Overflow Chip */}
              {collaborators.length > 5 && (
                <div 
                  className="h-8 w-8 rounded-full border-2 border-surface bg-subtle flex items-center justify-center text-[10px] font-bold text-brand shadow-inner animate-in zoom-in duration-200"
                  title={`${collaborators.length - 5} more collaborators`}
                >
                  +{collaborators.length - 5}
                </div>
              )}
            </div>
          )}

          {/* Divider - only when collaborators exist */}
          {collaborators.length > 0 && (
            <div className="w-px h-5 bg-surface-border-subtle" />
          )}

          {/* Current User Button */}
          <div className="flex items-center justify-center h-8 w-8 overflow-hidden rounded-full bg-subtle">
            <UserButton appearance={clerkAppearance} />
          </div>
        </div>

        {/* Floating Pill Toolbar */}
        <ShapePanel onDragStart={handleDragStart} />

        {/* Floating Zoom & History Controls */}
        <CanvasControls />
      </div>
    </CanvasActionsContext.Provider>
  )
}

// 5. Loading Fallback
function CanvasLoadingState() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-base text-copy-primary z-50">
      <div className="flex flex-col items-center gap-4 animate-in fade-in duration-300">
        <Loader2 className="h-8 w-8 text-brand animate-spin" />
        <p className="text-xs font-mono text-copy-muted tracking-wider uppercase">
          Initializing Canvas Session...
        </p>
      </div>
    </div>
  )
}

// 6. Connection Error Fallback
function CanvasErrorState({ onReset }: { onReset: () => void }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-base text-copy-primary p-6 z-50">
      <div className="max-w-sm text-center flex flex-col items-center gap-4 animate-in fade-in duration-300">
        <div className="h-12 w-12 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive mb-2 shadow-lg shadow-destructive/5">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-medium tracking-wide text-copy-primary">
          Connection Issue
        </h3>
        <p className="text-xs text-copy-secondary leading-relaxed font-light">
          Unable to establish a collaborative canvas session. This could be due to network changes or room initialization issues.
        </p>
        <button
          onClick={onReset}
          className="mt-2 bg-destructive hover:bg-destructive/80 text-destructive-foreground text-xs font-semibold px-6 h-10 rounded-xl shadow-lg transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
        >
          Try Reconnecting
        </button>
      </div>
    </div>
  )
}

// 7. Canvas Root Component
export function Canvas({ roomId, onImportTemplate, isCommentMode = false, onCommentPlaced, isAiSidebarOpen = false, onSaveStatusChange }: CanvasWrapperProps) {
  const [errorKey, setErrorKey] = useState(0)

  const handleReset = () => {
    setErrorKey((prev) => prev + 1)
  }

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-base">
      <CanvasErrorBoundary key={errorKey} fallback={<CanvasErrorState onReset={handleReset} />}>
        <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
          <RoomProvider 
            id={roomId} 
            initialPresence={{ cursor: null, thinking: false }}
            initialStorage={{
              flow: new LiveObject({
                nodes: new LiveMap(),
                edges: new LiveMap(),
              })
            }}
          >
            <ClientSideSuspense fallback={<CanvasLoadingState />}>
              <ReactFlowProvider>
                <CollaborativeCanvas
                  projectId={roomId}
                  onImportTemplate={onImportTemplate}
                  isCommentMode={isCommentMode}
                  onCommentPlaced={onCommentPlaced}
                  isAiSidebarOpen={isAiSidebarOpen}
                  onSaveStatusChange={onSaveStatusChange}
                />
              </ReactFlowProvider>
            </ClientSideSuspense>
          </RoomProvider>
        </LiveblocksProvider>
      </CanvasErrorBoundary>
    </div>
  )
}
