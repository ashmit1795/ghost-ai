"use client"

import { Button } from "@/components/ui/button"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"

interface EditorNavbarProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function EditorNavbar({ isSidebarOpen, onToggleSidebar }: EditorNavbarProps) {
  return (
    <header className="h-14 flex items-center justify-between px-4 bg-surface border-b border-surface-border text-copy-primary select-none z-20 shrink-0">
      {/* Left section: Sidebar toggle button */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          className="text-copy-muted hover:text-copy-primary hover:bg-subtle transition-colors duration-200"
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeftOpen className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Center section: Logo or System Title */}
      <div className="flex items-center gap-1.5 font-sans tracking-wide">
        <span className="text-sm font-light text-copy-muted uppercase tracking-[0.2em]">ghost</span>
        <span className="text-sm font-semibold text-brand uppercase tracking-[0.2em]">AI</span>
        <div className="w-[1px] h-3 bg-surface-border-subtle mx-2" />
        <span className="text-xs font-mono text-copy-faint tracking-tight font-medium">Workspace</span>
      </div>

      {/* Right section: Kept empty as specified */}
      <div className="w-9" />
    </header>
  )
}
