"use client"

import { Button } from "@/components/ui/button"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { UserButton } from "@clerk/nextjs"
import { dark } from "@clerk/ui/themes"

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

      {/* Right section: User Profile Menu */}
      <div className="flex items-center justify-end w-9">
        <UserButton
          appearance={{
            theme: dark,
            variables: {
              colorPrimary: "var(--accent-primary)",
              colorBackground: "var(--bg-surface)",
              colorInput: "var(--bg-base)",
              colorForeground: "var(--text-primary)",
              colorMutedForeground: "var(--text-secondary)",
              colorBorder: "var(--border-default)",
              colorPrimaryForeground: "var(--bg-base)",
            },
          }}
        />
      </div>
    </header>
  )
}
