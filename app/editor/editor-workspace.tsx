"use client"

import { useState, useRef, useCallback } from "react"
import { EditorNavbar } from "@/components/editor/editor-navbar"
import { ProjectSidebar } from "@/components/editor/project-sidebar"
import { ProjectDialogs } from "@/components/editor/project-dialogs"
import { Button } from "@/components/ui/button"
import { ProjectProvider, useProjects, Project } from "@/contexts/project-context"
import { Sparkles, LayoutGrid, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Canvas } from "@/components/editor/canvas"
import { StarterTemplatesModal } from "@/components/editor/starter-templates-modal"
import { CanvasTemplate } from "@/components/editor/starter-templates"

function EditorWorkspaceContent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(true)
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false)
  const { activeProject, setCreateOpen } = useProjects()

  // Holds the import function registered by CollaborativeCanvas
  const importTemplateFnRef = useRef<((template: CanvasTemplate) => void) | null>(null)

  const handleRegisterImport = useCallback((fn: (template: CanvasTemplate) => void) => {
    importTemplateFnRef.current = fn
  }, [])

  const handleImportTemplate = useCallback((template: CanvasTemplate) => {
    importTemplateFnRef.current?.(template)
  }, [])

  return (
    <div className="relative flex flex-col h-screen w-screen bg-base overflow-hidden text-copy-primary font-sans antialiased">
      {/* Editor Navbar */}
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        activeProject={activeProject}
        isAiSidebarOpen={isAiSidebarOpen}
        onToggleAiSidebar={() => setIsAiSidebarOpen((prev) => !prev)}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 relative flex overflow-hidden">
        
        {/* Floating Project Sidebar */}
        <ProjectSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Central Canvas and Right AI Sidebar Wrapper */}
        <div className="flex-1 flex overflow-hidden bg-base">
          {/* System Design Canvas Area */}
          <main className={cn(
            "flex-1 relative bg-base select-none overflow-hidden",
            activeProject ? "p-0" : "flex items-center justify-center p-6"
          )}>
            
            {!activeProject && (
              <>
                {/* Subtle Grid Background Pattern */}
                <div 
                  className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                  style={{
                    backgroundImage: `
                      linear-gradient(to right, var(--text-primary) 1px, transparent 1px),
                      linear-gradient(to bottom, var(--text-primary) 1px, transparent 1px)
                    `,
                    backgroundSize: "24px 24px"
                  }}
                />

                {/* Abstract background glows */}
                <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] rounded-full bg-brand/5 opacity-[0.03] blur-[120px] pointer-events-none" />
                <div className="absolute bottom-1/4 right-1/3 w-[600px] h-[600px] rounded-full bg-brand-ai/5 opacity-[0.03] blur-[150px] pointer-events-none" />
              </>
            )}

            {activeProject ? (
              <Canvas
                roomId={activeProject.id}
                onImportTemplate={handleRegisterImport}
              />
            ) : (
              /* Minimal Card-Free Editor Home Screen (when no project is open) */
              <div className="relative text-center max-w-md mx-auto z-10 flex flex-col items-center gap-4 animate-in fade-in duration-300">
                <h1 className="text-3xl font-extralight tracking-wide text-copy-primary leading-tight">
                  Design your next <span className="font-semibold text-brand">system architecture</span>
                </h1>
                <p className="text-sm text-copy-secondary leading-relaxed font-light">
                  Start a new design sandbox, or choose a workspace from the sidebar to begin collaborative modeling.
                </p>
                <Button
                  onClick={() => setCreateOpen(true)}
                  className="mt-2 bg-brand hover:bg-brand/80 text-background text-xs font-semibold px-6 h-10 rounded-xl shadow-lg flex items-center gap-2 transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Plus className="h-4 w-4" />
                  Initialize Workspace
                </Button>
              </div>
            )}

          </main>

          {/* Right AI Sidebar placeholder */}
          {activeProject && (
            <aside
              className={cn(
                "w-80 border-l border-surface-border bg-surface flex flex-col transition-all duration-300 ease-in-out shrink-0 select-none",
                isAiSidebarOpen ? "translate-x-0 w-80" : "translate-x-full w-0 border-l-0 overflow-hidden"
              )}
            >
              <div className="h-14 flex items-center justify-between px-4 border-b border-surface-border shrink-0">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-brand-ai-text" />
                  <h2 className="text-sm font-semibold tracking-wider text-copy-primary uppercase">AI Copilot</h2>
                </div>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <div className="h-12 w-12 rounded-full bg-brand-ai/15 border border-brand-ai/20 flex items-center justify-center mb-4">
                  <Sparkles className="h-5 w-5 text-brand-ai-text" />
                </div>
                <h3 className="text-xs font-semibold text-copy-secondary mb-1">AI Assistant</h3>
                <p className="text-[11px] text-copy-faint leading-relaxed max-w-[200px]">
                  Ghost AI chat sidebar will render here. Describe your system requirements or prompt architectural changes.
                </p>
              </div>
            </aside>
          )}
        </div>
      </div>

      {/* Global Dialog Overlays */}
      <ProjectDialogs />

      {/* Starter Templates Modal */}
      <StarterTemplatesModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onImport={handleImportTemplate}
      />
    </div>
  )
}

export function EditorWorkspace({ 
  initialProjects,
  activeProjectId,
}: { 
  initialProjects: Project[]
  activeProjectId?: string
}) {
  return (
    <ProjectProvider initialProjects={initialProjects} activeProjectId={activeProjectId}>
      <EditorWorkspaceContent />
    </ProjectProvider>
  )
}
