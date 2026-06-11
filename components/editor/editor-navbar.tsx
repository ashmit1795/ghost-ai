"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { PanelLeftClose, PanelLeftOpen, Share2, Sparkles, LayoutTemplate, MessageSquare, Loader2, Check, AlertTriangle } from "lucide-react"
import { UserButton } from "@clerk/nextjs"
import { clerkAppearance } from "@/lib/clerk-theme"
import { Project } from "@/hooks/use-project-actions"
import { cn } from "@/lib/utils"
import { useProjects } from "@/contexts/project-context"
import { SaveStatus } from "@/hooks/useCanvasAutosave"

interface EditorNavbarProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  activeProject?: Project | null;
  isAiSidebarOpen?: boolean;
  onToggleAiSidebar?: () => void;
  onOpenTemplates?: () => void;
  isCommentMode?: boolean;
  onToggleCommentMode?: () => void;
  saveStatus?: SaveStatus;
}

export function EditorNavbar({
  isSidebarOpen,
  onToggleSidebar,
  activeProject = null,
  isAiSidebarOpen = false,
  onToggleAiSidebar,
  onOpenTemplates,
  isCommentMode = false,
  onToggleCommentMode,
  saveStatus = "idle",
}: EditorNavbarProps) {
  const { setShareOpen } = useProjects()
  const [localStatus, setLocalStatus] = useState<SaveStatus>("idle")
  const [prevStatus, setPrevStatus] = useState<SaveStatus>("idle")

  if (saveStatus !== prevStatus) {
    setPrevStatus(saveStatus)
    setLocalStatus(saveStatus)
  }

  useEffect(() => {
    if (saveStatus === "saved") {
      const timer = setTimeout(() => {
        setLocalStatus("idle")
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [saveStatus])
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

      {/* Center section: Logo or Active Project Name */}
      <div className="flex items-center gap-1.5 font-sans tracking-wide">
        <span className="text-sm font-light text-copy-muted uppercase tracking-[0.2em]">ghost</span>
        <span className="text-sm font-semibold text-brand uppercase tracking-[0.2em]">AI</span>
        {activeProject ? (
          <>
            <div className="w-[1px] h-3 bg-surface-border-subtle mx-2" />
            <span className="text-xs font-mono text-copy-secondary font-medium truncate max-w-[180px]" title={activeProject.name}>
              {activeProject.name}
            </span>
          </>
        ) : (
          <>
            <div className="w-[1px] h-3 bg-surface-border-subtle mx-2" />
            <span className="text-xs font-mono text-copy-faint tracking-tight font-medium">Workspace</span>
          </>
        )}
      </div>

      {/* Right section: Actions + User Profile */}
      <div className="flex items-center gap-3">
        {activeProject && (
          <>
            {/* Templates Button */}
            <Button
              id="open-templates-modal"
              variant="ghost"
              size="icon-sm"
              onClick={onOpenTemplates}
              className="h-8 w-8 text-copy-muted hover:text-copy-primary hover:bg-subtle rounded-lg transition-colors duration-200"
              aria-label="Open starter templates"
              title="Starter Templates"
            >
              <LayoutTemplate className="h-4 w-4" />
            </Button>

            {/* Comment Mode Toggle */}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onToggleCommentMode}
              className={cn(
                "h-8 w-8 text-copy-muted hover:text-copy-primary hover:bg-subtle rounded-lg transition-colors duration-200",
                isCommentMode && "text-brand bg-brand/10 hover:bg-brand/20"
              )}
              aria-label={isCommentMode ? "Deactivate comment mode" : "Activate comment mode"}
              title="Comment Mode"
            >
              <MessageSquare className="h-4 w-4" />
            </Button>

            {/* Save Status Indicator */}
            {localStatus !== "idle" && (
              <div className="flex items-center gap-1.5 px-2 animate-in fade-in duration-300">
                {localStatus === "saving" && (
                  <>
                    <Loader2 className="h-3 w-3 text-copy-muted animate-spin" />
                    <span className="text-[10px] font-medium text-copy-muted">Saving…</span>
                  </>
                )}
                {localStatus === "saved" && (
                  <>
                    <Check className="h-3 w-3 text-brand" />
                    <span className="text-[10px] font-medium text-copy-muted">Saved</span>
                  </>
                )}
                {localStatus === "error" && (
                  <>
                    <AlertTriangle className="h-3 w-3 text-error animate-pulse" />
                    <span className="text-[10px] font-medium text-error">Save failed</span>
                  </>
                )}
              </div>
            )}

            {/* Share Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShareOpen(true)}
              className="h-8 border-surface-border hover:bg-subtle text-xs px-3 rounded-lg flex items-center gap-1.5 text-copy-secondary hover:text-copy-primary transition-all duration-200 font-medium"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>Share</span>
            </Button>
            
            {/* AI Toggle Button */}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onToggleAiSidebar}
              className={cn(
                "h-8 w-8 text-copy-muted hover:text-copy-primary hover:bg-subtle rounded-lg transition-colors duration-200",
                isAiSidebarOpen && "text-brand-ai-text bg-brand-ai/15"
              )}
              aria-label={isAiSidebarOpen ? "Close AI Sidebar" : "Open AI Sidebar"}
              aria-pressed={isAiSidebarOpen}
            >
              <Sparkles className="h-4 w-4" />
            </Button>
          </>
        )}
        {!activeProject && (
          <>
            <div className="w-[1px] h-4 bg-surface-border-subtle mx-1" />
            <div className="flex items-center justify-end w-9">
              <UserButton
                appearance={clerkAppearance}
              />
            </div>
          </>
        )}
      </div>
    </header>
  )
}
