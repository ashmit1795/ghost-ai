"use client"

import { useState } from "react"
import { EditorNavbar } from "@/components/editor/editor-navbar"
import { ProjectSidebar } from "@/components/editor/project-sidebar"
import { Button } from "@/components/ui/button"
import { Terminal, Sparkles, LayoutGrid } from "lucide-react"

export default function Home() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

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

          {/* Premium Glassmorphic Workspace card */}
          <div className="relative max-w-2xl w-full mx-auto z-10">
            {/* Elegant outer glow */}
            <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-brand/20 via-brand-ai/20 to-brand/20 opacity-30 blur-xl transition duration-1000" />
            
            <div className="relative flex flex-col bg-surface/60 border border-surface-border rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
              {/* Header Badge */}
              <div className="flex items-center gap-2 self-start bg-brand-dim border border-brand/20 rounded-full px-3 py-1 mb-6">
                <Sparkles className="h-3 w-3 text-brand" />
                <span className="text-[10px] font-mono font-semibold tracking-wider text-brand uppercase">Active Canvas</span>
              </div>

              {/* Title & Description */}
              <h1 className="text-3xl font-extralight tracking-wide text-copy-primary mb-3">
                ghost <span className="font-semibold text-brand">AI</span>
              </h1>
              <p className="text-sm text-copy-secondary leading-relaxed mb-6 font-light">
                A real-time collaborative system design workspace. Describe your infrastructure in plain English, map it onto a live visual graph, and generate premium technical specifications effortlessly.
              </p>

              {/* Grid actions / Status */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="flex flex-col gap-2 p-4 bg-elevated/40 border border-surface-border-subtle rounded-2xl">
                  <div className="flex items-center gap-2 text-copy-secondary">
                    <LayoutGrid className="h-4 w-4 text-brand" />
                    <span className="text-xs font-semibold">Sidebar Navigation</span>
                  </div>
                  <p className="text-[11px] text-copy-muted leading-normal">
                    Click the top-left panel icon or use the button below to view active projects and collaborators.
                  </p>
                </div>

                <div className="flex flex-col gap-2 p-4 bg-elevated/40 border border-surface-border-subtle rounded-2xl">
                  <div className="flex items-center gap-2 text-copy-secondary">
                    <Terminal className="h-4 w-4 text-brand-ai-text" />
                    <span className="text-xs font-semibold">AI System Architect</span>
                  </div>
                  <p className="text-[11px] text-copy-muted leading-normal">
                    Describe system requirements using natural language prompts to auto-generate nodes & connections.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={() => setIsSidebarOpen(true)}
                  className="bg-brand hover:bg-brand/80 text-background text-xs font-semibold px-5 h-9 rounded-xl shadow-lg transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
                >
                  Browse Projects
                </Button>
                <Button
                  variant="outline"
                  className="border-surface-border text-copy-secondary hover:text-copy-primary hover:bg-subtle text-xs px-5 h-9 rounded-xl transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
                >
                  Read Documentation
                </Button>
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}
