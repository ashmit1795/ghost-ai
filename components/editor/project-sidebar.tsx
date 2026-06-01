"use client"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FolderOpen, Plus, Users, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProjectSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectSidebar({ isOpen, onClose }: ProjectSidebarProps) {
  return (
    <>
      {/* Backdrop overlay for dismissing the sidebar */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300 ease-in-out z-30",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Floating sidebar panel */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 w-80 bg-surface border-r border-surface-border shadow-2xl flex flex-col transition-transform duration-300 ease-in-out z-40 select-none",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header section */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-surface-border shrink-0">
          <h2 className="text-sm font-semibold tracking-wider text-copy-primary uppercase">Projects</h2>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Close sidebar"
            className="text-copy-muted hover:text-copy-primary hover:bg-subtle transition-colors duration-200"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation & Content tabs */}
        <div className="flex-1 flex flex-col min-h-0 p-4">
          <Tabs defaultValue="my-projects" className="flex-1 flex flex-col min-h-0">
            {/* Tabs List with sleek dark recessed track layout */}
            <TabsList className="!flex !w-full !h-9 !p-1 !bg-base !border !border-surface-border-subtle !rounded-xl mb-4">
              <TabsTrigger 
                value="my-projects" 
                className="!rounded-lg !text-xs !font-medium transition-all duration-200 !h-full data-active:!bg-subtle data-active:!text-copy-primary data-active:!shadow-md text-copy-muted hover:text-copy-secondary"
              >
                My Projects
              </TabsTrigger>
              <TabsTrigger 
                value="shared" 
                className="!rounded-lg !text-xs !font-medium transition-all duration-200 !h-full data-active:!bg-subtle data-active:!text-copy-primary data-active:!shadow-md text-copy-muted hover:text-copy-secondary"
              >
                Shared
              </TabsTrigger>
            </TabsList>


            {/* My Projects tab panel */}
            <TabsContent value="my-projects" className="flex-1 flex flex-col items-center justify-center p-6 text-center focus-visible:outline-none">
              <div className="flex flex-col items-center justify-center max-w-[200px]">
                <div className="h-12 w-12 rounded-full bg-subtle border border-surface-border-subtle flex items-center justify-center mb-4 transition-all duration-500 hover:scale-105">
                  <FolderOpen className="h-5 w-5 text-copy-faint" />
                </div>
                <h3 className="text-xs font-semibold text-copy-secondary mb-1">No active projects</h3>
                <p className="text-[11px] text-copy-faint leading-relaxed">
                  Create a new project using the button below to start designing your system architecture.
                </p>
              </div>
            </TabsContent>

            {/* Shared tab panel */}
            <TabsContent value="shared" className="flex-1 flex flex-col items-center justify-center p-6 text-center focus-visible:outline-none">
              <div className="flex flex-col items-center justify-center max-w-[200px]">
                <div className="h-12 w-12 rounded-full bg-subtle border border-surface-border-subtle flex items-center justify-center mb-4 transition-all duration-500 hover:scale-105">
                  <Users className="h-5 w-5 text-copy-faint" />
                </div>
                <h3 className="text-xs font-semibold text-copy-secondary mb-1">No shared designs</h3>
                <p className="text-[11px] text-copy-faint leading-relaxed">
                  Projects shared with you by other collaborators will appear in this tab.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sticky footer with Full-width action button */}
        <div className="p-4 border-t border-surface-border bg-surface shrink-0">
          <Button
            variant="default"
            size="lg"
            className="w-full flex items-center justify-center gap-2 text-xs font-semibold tracking-wide bg-brand hover:bg-brand/80 text-background rounded-xl h-9"
          >
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </aside>
    </>
  )
}
