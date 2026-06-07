import { useEffect, useRef } from "react"
import { useReactFlow } from "@xyflow/react"
import { CanvasNode, CanvasNodeData, CanvasNodeType } from "@/types/canvas"

export interface ClipboardNode {
  type: CanvasNodeType
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
  clipboard: ClipboardNode[] | null
  setClipboard: (val: ClipboardNode[] | null) => void
  pasteNodes: (position?: { x: number; y: number }) => void
}

export function useKeyboardShortcuts({
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
}: UseKeyboardShortcutsProps) {
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
          setClipboard(selected.map((n) => ({
            type: n.type || "canvasNode",
            position: { x: n.position.x, y: n.position.y },
            data: { ...n.data },
            width: n.width,
            height: n.height,
          })))
        }
        return
      }

      // 7. Paste: Cmd/Ctrl + V
      if (ctrlKey && keyLower === "v") {
        event.preventDefault()
        if (!clipboard || clipboard.length === 0) return

        // Determine destination canvas coordinates
        let pasteCenter: { x: number; y: number } | undefined = undefined
        if (mouseRef.current) {
          pasteCenter = reactFlowInstance.screenToFlowPosition({
            x: mouseRef.current.clientX,
            y: mouseRef.current.clientY,
          })
        }
        pasteNodes(pasteCenter)
        return
      }

      // 8. Cut: Cmd/Ctrl + X
      if (ctrlKey && keyLower === "x") {
        event.preventDefault()
        const selected = nodes.filter((n) => n.selected)
        if (selected.length > 0) {
          setClipboard(selected.map((n) => ({
            type: n.type || "canvasNode",
            position: { x: n.position.x, y: n.position.y },
            data: { ...n.data },
            width: n.width,
            height: n.height,
          })))
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
  }, [reactFlowInstance, undo, redo, nodes, addNodes, deleteSelectedNodes, duplicateSelectedNodes, clipboard, setClipboard, pasteNodes])
}

