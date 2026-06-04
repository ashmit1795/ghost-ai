"use client"

import React, { Component, ErrorInfo, ReactNode } from "react"
import { ReactFlow, Background, BackgroundVariant, MiniMap, ConnectionMode } from "@xyflow/react"
import { LiveblocksProvider, RoomProvider, ClientSideSuspense } from "@liveblocks/react/suspense"
import { useLiveblocksFlow, Cursors } from "@liveblocks/react-flow"
import { AlertTriangle, Loader2 } from "lucide-react"

// Import CSS styles for React Flow and Liveblocks
import "@xyflow/react/dist/style.css"
import "@liveblocks/react-ui/styles.css"
import "@liveblocks/react-flow/styles.css"

// Import Canvas types
import { CanvasNode, CanvasEdge } from "@/types/canvas"

interface CanvasWrapperProps {
  roomId: string
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

  public static getDerivedStateFromError(_: Error): ErrorBoundaryState {
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

// 2. Collaborative Canvas (wrapped inside Liveblocks RoomProvider)
function CollaborativeCanvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } = useLiveblocksFlow<CanvasNode, CanvasEdge>({
    suspense: true,
    nodes: {
      initial: [],
    },
    edges: {
      initial: [],
    },
  })

  return (
    <div className="w-full h-full relative select-none">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDelete={onDelete}
        connectionMode={ConnectionMode.Loose}
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
          className="bg-surface! border! border-surface-border! rounded-xl overflow-hidden shadow-lg"
          maskColor="rgba(8, 8, 9, 0.7)"
          nodeColor="#1a1a20"
          nodeStrokeWidth={0}
        />
        <Cursors />
      </ReactFlow>
    </div>
  )
}

// 3. Loading Fallback
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

// 4. Connection Error Fallback
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

// 5. Canvas Root Component
export function Canvas({ roomId }: CanvasWrapperProps) {
  const [errorKey, setErrorKey] = React.useState(0)

  const handleReset = () => {
    setErrorKey((prev) => prev + 1)
  }

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-base">
      <CanvasErrorBoundary key={errorKey} fallback={<CanvasErrorState onReset={handleReset} />}>
        <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
          <RoomProvider 
            id={roomId} 
            initialPresence={{ cursor: null, isThinking: false }}
          >
            <ClientSideSuspense fallback={<CanvasLoadingState />}>
              <CollaborativeCanvas />
            </ClientSideSuspense>
          </RoomProvider>
        </LiveblocksProvider>
      </CanvasErrorBoundary>
    </div>
  )
}
