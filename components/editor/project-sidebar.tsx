"use client"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FolderOpen, Plus, Users, X, Edit2, Trash2, Shield } from "lucide-react"
import { cn } from "@/lib/utils"
import { useProjects } from "@/contexts/project-context"

interface ProjectSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectSidebar({ isOpen, onClose }: ProjectSidebarProps) {
  const {
    projects,
    activeProject,
    openProject,
    setCreateOpen,
    setRenameOpen,
    setDeleteOpen,
    setTargetProjectId,
  } = useProjects()

  // Separate owned projects from collaborator projects
  const myProjects = projects.filter((p) => p.isOwner)
  const sharedProjects = projects.filter((p) => !p.isOwner)

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
        inert={!isOpen}
      >
        {/* Header section */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-surface-border shrink-0">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-brand" />
            <h2 className="text-sm font-semibold tracking-wider text-copy-primary uppercase">Workspaces</h2>
          </div>
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
          <Tabs defaultValue="my-workspaces" className="flex-1 flex flex-col min-h-0">
            {/* Tabs List with sleek dark recessed track layout */}
            <TabsList className="!flex !w-full !h-9 !p-1 !bg-base !border !border-surface-border-subtle !rounded-xl mb-4">
              <TabsTrigger 
                value="my-workspaces" 
                className="!rounded-lg !text-xs !font-medium transition-all duration-200 !h-full data-active:!bg-subtle data-active:!text-copy-primary data-active:!shadow-md text-copy-muted hover:text-copy-secondary"
              >
                My Workspaces ({myProjects.length})
              </TabsTrigger>
              <TabsTrigger 
                value="shared" 
                className="!rounded-lg !text-xs !font-medium transition-all duration-200 !h-full data-active:!bg-subtle data-active:!text-copy-primary data-active:!shadow-md text-copy-muted hover:text-copy-secondary"
              >
                Shared with Me ({sharedProjects.length})
              </TabsTrigger>
            </TabsList>

            {/* My Projects tab panel */}
            <TabsContent value="my-workspaces" className="flex-1 flex flex-col min-h-0 focus-visible:outline-none">
              {myProjects.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                  <div className="h-12 w-12 rounded-full bg-subtle border border-surface-border-subtle flex items-center justify-center mb-4">
                    <FolderOpen className="h-5 w-5 text-copy-faint" />
                  </div>
                  <h3 className="text-xs font-semibold text-copy-secondary mb-1">No workspaces found</h3>
                  <p className="text-[11px] text-copy-faint leading-relaxed max-w-[200px]">
                    Initialize a new workspace using the button below to start modeling your cloud architecture.
                  </p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-1">
                  {myProjects.map((project) => (
                    <div
                      key={project.id}
                      className={cn(
                        "group relative flex items-center justify-between p-2.5 rounded-xl hover:bg-subtle transition duration-200 cursor-pointer border border-transparent",
                        activeProject?.id === project.id ? "bg-subtle/40 border-surface-border-subtle" : ""
                      )}
                    >
                      <button
                        onClick={() => {
                          openProject(project.id)
                          onClose()
                        }}
                        className={cn(
                          "flex-1 text-left text-xs truncate pr-2 font-light transition-colors",
                          activeProject?.id === project.id ? "text-brand font-semibold" : "text-copy-primary hover:text-brand"
                        )}
                      >
                        {project.name}
                      </button>

                      {/* Hover action controls for owned projects */}
                      <div className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 flex items-center gap-1 transition-opacity duration-200 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={(e) => {
                            e.stopPropagation()
                            setTargetProjectId(project.id)
                            setRenameOpen(true)
                          }}
                          aria-label="Rename Workspace"
                          className="text-copy-muted hover:text-brand hover:bg-elevated rounded-lg transition"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={(e) => {
                            e.stopPropagation()
                            setTargetProjectId(project.id)
                            setDeleteOpen(true)
                          }}
                          aria-label="Deprovision Workspace"
                          className="text-copy-muted hover:text-error hover:bg-elevated rounded-lg transition"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Shared tab panel */}
            <TabsContent value="shared" className="flex-1 flex flex-col min-h-0 focus-visible:outline-none">
              {sharedProjects.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                  <div className="h-12 w-12 rounded-full bg-subtle border border-surface-border-subtle flex items-center justify-center mb-4">
                    <Users className="h-5 w-5 text-copy-faint" />
                  </div>
                  <h3 className="text-xs font-semibold text-copy-secondary mb-1">No shared collaborations</h3>
                  <p className="text-[11px] text-copy-faint leading-relaxed max-w-[200px]">
                    Workspaces shared with you by teammates and organization members will be listed here.
                  </p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-1">
                  {sharedProjects.map((project) => (
                    <div
                      key={project.id}
                      className={cn(
                        "group relative flex items-center justify-between p-2.5 rounded-xl hover:bg-subtle transition duration-200 cursor-pointer border border-transparent",
                        activeProject?.id === project.id ? "bg-subtle/40 border-surface-border-subtle" : ""
                      )}
                    >
                      <button
                        onClick={() => {
                          openProject(project.id)
                          onClose()
                        }}
                        className={cn(
                          "flex-1 text-left text-xs truncate pr-2 font-light transition-colors flex items-center gap-1.5",
                          activeProject?.id === project.id ? "text-brand font-semibold" : "text-copy-primary hover:text-brand"
                        )}
                      >
                        <Shield className="h-3 w-3 text-copy-faint shrink-0" />
                        <span className="truncate">{project.name}</span>
                      </button>

                      {/* Actions hidden for shared collaborator projects */}
                      <span className="text-[9px] text-copy-faint font-mono font-medium opacity-70 px-1.5 py-0.5 bg-subtle border border-surface-border-subtle rounded-md shrink-0">
                        Collaborator
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sticky footer with Full-width action button */}
        <div className="p-4 border-t border-surface-border bg-surface shrink-0">
          <Button
            onClick={() => setCreateOpen(true)}
            variant="default"
            size="lg"
            className="w-full flex items-center justify-center gap-2 text-xs font-semibold tracking-wide bg-brand hover:bg-brand/80 text-background rounded-xl h-9"
          >
            <Plus className="h-4 w-4" />
            Initialize Workspace
          </Button>
        </div>
      </aside>
    </>
  )
}
