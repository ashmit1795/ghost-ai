import { useEffect, useRef, useState, useCallback } from "react"
import { CanvasNode, CanvasEdge } from "@/types/canvas"

export type SaveStatus = "idle" | "saving" | "saved" | "error"

interface UseCanvasAutosaveOptions {
  projectId: string
  nodes: CanvasNode[]
  edges: CanvasEdge[]
  enabled?: boolean
}

interface UseCanvasAutosaveReturn {
  saveStatus: SaveStatus
}

export function useCanvasAutosave({
  projectId,
  nodes,
  edges,
  enabled = true,
}: UseCanvasAutosaveOptions): UseCanvasAutosaveReturn {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasInitialized = useRef(false)
  const isDirtyRef = useRef(false)

  const stateRef = useRef({ nodes, edges })
  useEffect(() => {
    stateRef.current = { nodes, edges }
  }, [nodes, edges])

  const saveCanvas = useCallback(async (nodesToSave: CanvasNode[], edgesToSave: CanvasEdge[]) => {
    setSaveStatus("saving")
    try {
      const res = await fetch(`/api/projects/${projectId}/canvas`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nodes: nodesToSave, edges: edgesToSave }),
      })

      if (!res.ok) {
        throw new Error(`Save failed: ${res.statusText}`)
      }

      isDirtyRef.current = false
      setSaveStatus("saved")
    } catch (error) {
      console.error("Error autosaving canvas:", error)
      setSaveStatus("error")
    }
  }, [projectId])

  // Watch for changes to nodes and edges
  useEffect(() => {
    if (!enabled) {
      // If disabled, cancel any pending save and clear dirty flag
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      isDirtyRef.current = false
      setSaveStatus("idle")
      return
    }

    if (!hasInitialized.current) {
      hasInitialized.current = true
      return
    }

    // Mark as dirty and set saving status since a change occurred while enabled
    isDirtyRef.current = true
    setSaveStatus("saving")

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      saveCanvas(stateRef.current.nodes, stateRef.current.edges)
    }, 2500)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [nodes, edges, enabled, saveCanvas])

  // Flush pending changes on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (isDirtyRef.current) {
        // Run fire-and-forget save fetch on SPA navigation/unmount
        saveCanvas(stateRef.current.nodes, stateRef.current.edges).catch((err) => {
          console.error("Failed to flush canvas on hook unmount:", err)
        })
      }
    }
  }, [saveCanvas])

  // beforeunload handler for tab closure/page reload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isDirtyRef.current) {
        const { nodes: nodesToSave, edges: edgesToSave } = stateRef.current
        fetch(`/api/projects/${projectId}/canvas`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ nodes: nodesToSave, edges: edgesToSave }),
          keepalive: true,
        }).catch((err) => {
          console.error("Failed to flush canvas during unload:", err)
        })
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [projectId])

  return { saveStatus }
}
