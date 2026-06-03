"use client"

import { useState } from "react"
import { EditorNavbar } from "@/components/editor/editor-navbar"
import { ProjectSidebar } from "@/components/editor/project-sidebar"
import { ProjectDialogs } from "@/components/editor/project-dialogs"
import { Button } from "@/components/ui/button"
import { ProjectProvider, useProjects } from "@/context/project-context"
import { Terminal, Sparkles, LayoutGrid, Plus } from "lucide-react"

function EditorWorkspace() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { activeProject, closeProject, setCreateOpen } = useProjects()

  return (
    <div className="relative flex flex-col h-screen w-screen bg-base overflow-hidden text-copy-primary font-sans antialiased">
      {/* Editor Navbar */}
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 relative flex overflow-hidden">
        
        {/* Floating Project Sidebar */}
        <ProjectSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* System Design Canvas Area */}
        <main className="flex-1 relative bg-base flex items-center justify-center p-6 select-none overflow-hidden">
          
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

          {activeProject ? (
            /* Active Project Workspace View */
            <div className="relative max-w-2xl w-full mx-auto z-10 animate-in fade-in duration-300">
              {/* Elegant outer glow */}
              <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-brand/20 via-brand-ai/20 to-brand/20 opacity-30 blur-xl transition duration-1000" />
              
              <div className="relative flex flex-col bg-surface/60 border border-surface-border rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
                {/* Header Badge */}
                <div className="flex items-center gap-2 self-start bg-brand-dim border border-brand/20 rounded-full px-3 py-1 mb-6">
                  <Sparkles className="h-3 w-3 text-brand" />
                  <span className="text-[10px] font-mono font-semibold tracking-wider text-brand uppercase">
                    Active Room: {activeProject.slug}
                  </span>
                </div>

                {/* Title & Description */}
                <h1 className="text-3xl font-extralight tracking-wide text-copy-primary mb-3">
                  {activeProject.name}
                </h1>
                <p className="text-sm text-copy-secondary leading-relaxed mb-6 font-light">
                  Describe your system in plain English, map it onto a live visual canvas, collaborate in real-time, and generate persistent Markdown specs.
                </p>

                {/* Grid actions / Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  <div className="flex flex-col gap-2 p-4 bg-elevated/40 border border-surface-border-subtle rounded-2xl">
                    <div className="flex items-center gap-2 text-copy-secondary">
                      <LayoutGrid className="h-4 w-4 text-brand" />
                      <span className="text-xs font-semibold">Collaborative Canvas</span>
                    </div>
                    <p className="text-[11px] text-copy-muted leading-normal font-light">
                      This is your live canvas. Drag, drop, link, and resize node elements.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 p-4 bg-elevated/40 border border-surface-border-subtle rounded-2xl">
                    <div className="flex items-center gap-2 text-copy-secondary">
                      <Terminal className="h-4 w-4 text-brand-ai-text" />
                      <span className="text-xs font-semibold">AI System Architect</span>
                    </div>
                    <p className="text-[11px] text-copy-muted leading-normal font-light">
                      AI generation tools will be wired into this active canvas workspace.
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    onClick={closeProject}
                    variant="outline"
                    className="border-surface-border text-copy-secondary hover:text-copy-primary hover:bg-subtle text-xs px-5 h-9 rounded-xl transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
                  >
                    Close Project
                  </Button>
                  <Button
                    variant="outline"
                    disabled={true}
                    aria-disabled="true"
                    title="Documentation coming soon"
                    className="border-surface-border text-copy-secondary hover:text-copy-primary hover:bg-subtle text-xs px-5 h-9 rounded-xl transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
                  >
                    Read Documentation
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* Minimal Card-Free Editor Home Screen (when no project is open) */
            <div className="relative text-center max-w-md mx-auto z-10 flex flex-col items-center gap-4 animate-in fade-in duration-300">
              <h1 className="text-3xl font-extralight tracking-wide text-copy-primary leading-tight">
                Create a project or <span className="font-semibold text-brand">open an existing one</span>
              </h1>
              <p className="text-sm text-copy-secondary leading-relaxed font-light">
                Start a new architecture workspace, or choose a project from the sidebar.
              </p>
              <Button
                onClick={() => setCreateOpen(true)}
                className="mt-2 bg-brand hover:bg-brand/80 text-background text-xs font-semibold px-6 h-10 rounded-xl shadow-lg flex items-center gap-2 transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
              >
                <Plus className="h-4 w-4" />
                New Project
              </Button>
            </div>
          )}

        </main>
      </div>

      {/* Global Dialog Overlays */}
      <ProjectDialogs />
    </div>
  )
}

export default function EditorPage() {
  return (
    <ProjectProvider>
      <EditorWorkspace />
    </ProjectProvider>
  )
}
