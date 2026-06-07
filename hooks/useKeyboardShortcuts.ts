import { useEffect, useRef } from "react"
import { useReactFlow } from "@xyflow/react"
import { CanvasNode, CanvasNodeData } from "@/types/canvas"

interface ClipboardNode {
  type: "canvasNode"
  position: { x: number; y: number }
  data: CanvasNodeData
  width?: number
  height?: number
}

interface UseKeyboardShortcutsProps {
  reactFlowInstance: ReturnType<typeof useReactFlow>
  undo: () => void
  redo: () => void
  nodes: CanvasNode[]
  addNodes: (nodes: CanvasNode[]) => void
  deleteSelectedNodes: () => void
  duplicateSelectedNodes: () => void
}

export function useKeyboardShortcuts({
  reactFlowInstance,
  undo,
  redo,
  nodes,
  addNodes,
  deleteSelectedNodes,
  duplicateSelectedNodes,
}: UseKeyboardShortcutsProps) {
  const clipboardRef = useRef<ClipboardNode[] | null>(null)
  const mouseRef = useRef<{ clientX: number; clientY: number } | null>(null)

  useEffect(() => {
    // Track mouse client coordinates for cursor-based paste position targeting
    const handleMouseMove = (event: MouseEvent) => {
      mouseRef.current = {
        clientX: event.clientX,
        clientY: event.clientY,
      }
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore shortcuts while typing in inputs, textareas, or contentEditable elements
      const target = event.target as HTMLElement
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return
      }

      const isMac = typeof window !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.platform)
      const ctrlKey = isMac ? event.metaKey : event.ctrlKey
      const keyLower = event.key.toLowerCase()

      // 1. Undo: Cmd/Ctrl + Z
      if (ctrlKey && !event.shiftKey && keyLower === "z") {
        event.preventDefault()
        undo()
        return
      }

      // 2. Redo: Cmd/Ctrl + Shift + Z or Cmd/Ctrl + Y
      if (
        (ctrlKey && event.shiftKey && keyLower === "z") ||
        (ctrlKey && keyLower === "y")
      ) {
        event.preventDefault()
        redo()
        return
      }

      // 3. Zoom In: + or =
      if ((event.key === "+" || event.key === "=") && !ctrlKey) {
        event.preventDefault()
        reactFlowInstance.zoomIn()
        return
      }

      // 4. Zoom Out: -
      if (event.key === "-" && !ctrlKey) {
        event.preventDefault()
        reactFlowInstance.zoomOut()
        return
      }

      // 5. Duplicate: Cmd/Ctrl + D
      if (ctrlKey && keyLower === "d") {
        event.preventDefault()
        duplicateSelectedNodes()
        return
      }

      // 6. Copy: Cmd/Ctrl + C
      if (ctrlKey && keyLower === "c") {
        event.preventDefault()
        const selected = nodes.filter((n) => n.selected)
        if (selected.length > 0) {
          clipboardRef.current = selected.map((n) => ({
            type: n.type,
            position: { x: n.position.x, y: n.position.y },
            data: { ...n.data },
            width: n.width,
            height: n.height,
          }))
        }
        return
      }

      // 7. Paste: Cmd/Ctrl + V
      if (ctrlKey && keyLower === "v") {
        event.preventDefault()
        if (!clipboardRef.current || clipboardRef.current.length === 0) return

        const copiedNodes = clipboardRef.current

        // Determine destination canvas coordinates
        let pasteCenter: { x: number; y: number }
        if (mouseRef.current) {
          // Convert screen client coordinates to flow coordinate system
          pasteCenter = reactFlowInstance.screenToFlowPosition({
            x: mouseRef.current.clientX,
            y: mouseRef.current.clientY,
          })
        } else {
          // Fallback to center of the viewport
          const viewport = reactFlowInstance.getViewport()
          pasteCenter = {
            x: -viewport.x / viewport.zoom + window.innerWidth / (2 * viewport.zoom),
            y: -viewport.y / viewport.zoom + window.innerHeight / (2 * viewport.zoom),
          }
        }

        // Calculate center of copied bounding box to align paste properly
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
        copiedNodes.forEach((node) => {
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

        const newNodes: CanvasNode[] = copiedNodes.map((node) => {
          const shape = node.data.shape || "rectangle"
          const id = `${shape}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
          
          // Align copied center to the target paste position
          const offsetX = node.position.x - copiedCenter.x
          const offsetY = node.position.y - copiedCenter.y

          return {
            id,
            type: node.type || "canvasNode",
            position: {
              x: pasteCenter.x + offsetX,
              y: pasteCenter.y + offsetY,
            },
            data: { ...node.data },
            width: node.width,
            height: node.height,
            selected: true,
          }
        })

        addNodes(newNodes)
        return
      }

      // 8. Cut: Cmd/Ctrl + X
      if (ctrlKey && keyLower === "x") {
        event.preventDefault()
        const selected = nodes.filter((n) => n.selected)
        if (selected.length > 0) {
          clipboardRef.current = selected.map((n) => ({
            type: n.type,
            position: { x: n.position.x, y: n.position.y },
            data: { ...n.data },
            width: n.width,
            height: n.height,
          }))
          deleteSelectedNodes()
        }
        return
      }

      // 9. Delete / Backspace
      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault()
        deleteSelectedNodes()
        return
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [reactFlowInstance, undo, redo, nodes, addNodes, deleteSelectedNodes, duplicateSelectedNodes])
}
