import { useEffect } from "react"
import { useReactFlow } from "@xyflow/react"

interface UseKeyboardShortcutsProps {
  reactFlowInstance: ReturnType<typeof useReactFlow>
  undo: () => void
  redo: () => void
}

export function useKeyboardShortcuts({ reactFlowInstance, undo, redo }: UseKeyboardShortcutsProps) {
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

      // 1. Undo: Cmd/Ctrl + Z
      if (ctrlKey && !event.shiftKey && event.key.toLowerCase() === "z") {
        event.preventDefault()
        undo()
      }

      // 2. Redo: Cmd/Ctrl + Shift + Z or Cmd/Ctrl + Y
      if (
        (ctrlKey && event.shiftKey && event.key.toLowerCase() === "z") ||
        (ctrlKey && event.key.toLowerCase() === "y")
      ) {
        event.preventDefault()
        redo()
      }

      // 3. Zoom In: + or =
      if ((event.key === "+" || event.key === "=") && !ctrlKey) {
        event.preventDefault()
        reactFlowInstance.zoomIn()
      }

      // 4. Zoom Out: -
      if (event.key === "-" && !ctrlKey) {
        event.preventDefault()
        reactFlowInstance.zoomOut()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [reactFlowInstance, undo, redo])
}
