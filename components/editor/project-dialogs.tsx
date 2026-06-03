"use client"

import React, { useEffect, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useProjects } from "@/context/project-context"
import { AlertTriangle } from "lucide-react"

export function ProjectDialogs() {
  const {
    createOpen,
    setCreateOpen,
    renameOpen,
    setRenameOpen,
    deleteOpen,
    setDeleteOpen,
    
    projectName,
    setProjectName,
    projectSlug,
    targetProjectId,
    setTargetProjectId,
    
    projects,
    handleCreateProject,
    handleRenameProject,
    handleDeleteProject,
    isLoading,
  } = useProjects()

  const renameInputRef = useRef<HTMLInputElement>(null)

  // Find the target project details for pre-filling and rendering metadata
  const targetProject = projects.find((p) => p.id === targetProjectId)

  // Populate form with current project name when opening rename dialog
  useEffect(() => {
    if (renameOpen && targetProject) {
      setProjectName(targetProject.name)
      // Focus input helper
      setTimeout(() => {
        renameInputRef.current?.focus()
        renameInputRef.current?.select()
      }, 50)
    } else if (!createOpen && !renameOpen) {
      setProjectName("")
    }
  }, [renameOpen, createOpen, targetProject, setProjectName])

  // Handle submissions
  const onCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!projectName.trim() || isLoading) return
    handleCreateProject(projectName)
  }

  const onRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!projectName.trim() || !targetProjectId || isLoading) return
    handleRenameProject(targetProjectId, projectName)
  }

  const onDeleteSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetProjectId || isLoading) return
    handleDeleteProject(targetProjectId)
  }

  return (
    <>
      {/* 1. Create Project Dialog */}
      <Dialog open={createOpen} onOpenChange={(open) => !isLoading && setCreateOpen(open)}>
        <DialogContent className="border-surface-border bg-surface text-copy-primary rounded-3xl max-w-sm p-6 shadow-2xl">
          <form onSubmit={onCreateSubmit} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-light tracking-wide text-copy-primary">
                Create a <span className="font-semibold text-brand">new project</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-copy-muted font-light">
                Give your system design workspace a name.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3 my-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="create-project-name" className="text-[11px] font-semibold tracking-wider text-copy-secondary uppercase">
                  Project Name
                </label>
                <Input
                  id="create-project-name"
                  placeholder="e.g. Serverless API Gateways"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  disabled={isLoading}
                  required
                  className="bg-base border-surface-border-subtle focus-visible:border-brand rounded-xl h-9 text-xs"
                />
              </div>

              {/* Live slug preview */}
              {projectName.trim() && (
                <div className="rounded-xl bg-base border border-surface-border-subtle p-3 text-[11px] font-mono text-copy-muted break-all">
                  <span className="text-copy-faint">Slug:</span>{" "}
                  <span className="text-brand font-semibold">{projectSlug}</span>
                </div>
              )}
            </div>

            <DialogFooter className="flex sm:flex-row gap-2 mt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setCreateOpen(false)}
                disabled={isLoading}
                className="text-xs text-copy-secondary hover:bg-subtle rounded-xl px-4 h-9"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !projectName.trim()}
                className="text-xs font-semibold bg-brand hover:bg-brand/80 text-background rounded-xl px-5 h-9"
              >
                {isLoading ? "Creating..." : "Create Project"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 2. Rename Project Dialog */}
      <Dialog open={renameOpen} onOpenChange={(open) => !isLoading && setRenameOpen(open)}>
        <DialogContent className="border-surface-border bg-surface text-copy-primary rounded-3xl max-w-sm p-6 shadow-2xl">
          <form onSubmit={onRenameSubmit} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-light tracking-wide text-copy-primary">
                Rename <span className="font-semibold text-brand">project</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-copy-muted font-light">
                Renaming: <span className="text-copy-secondary font-medium">{targetProject?.name}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3 my-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="rename-project-name" className="text-[11px] font-semibold tracking-wider text-copy-secondary uppercase">
                  New Project Name
                </label>
                <Input
                  ref={renameInputRef}
                  id="rename-project-name"
                  placeholder="Enter project name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  disabled={isLoading}
                  required
                  className="bg-base border-surface-border-subtle focus-visible:border-brand rounded-xl h-9 text-xs"
                />
              </div>

              {projectName.trim() && (
                <div className="rounded-xl bg-base border border-surface-border-subtle p-3 text-[11px] font-mono text-copy-muted break-all">
                  <span className="text-copy-faint">New Slug:</span>{" "}
                  <span className="text-brand font-semibold">{projectSlug}</span>
                </div>
              )}
            </div>

            <DialogFooter className="flex sm:flex-row gap-2 mt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setRenameOpen(false)
                  setTargetProjectId(null)
                }}
                disabled={isLoading}
                className="text-xs text-copy-secondary hover:bg-subtle rounded-xl px-4 h-9"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !projectName.trim() || projectName.trim() === targetProject?.name}
                className="text-xs font-semibold bg-brand hover:bg-brand/80 text-background rounded-xl px-5 h-9"
              >
                {isLoading ? "Saving..." : "Rename Project"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 3. Delete Project Dialog */}
      <Dialog open={deleteOpen} onOpenChange={(open) => !isLoading && setDeleteOpen(open)}>
        <DialogContent className="border-error/20 bg-surface text-copy-primary rounded-3xl max-w-sm p-6 shadow-2xl">
          <form onSubmit={onDeleteSubmit} className="flex flex-col gap-4">
            <DialogHeader>
              <div className="flex items-center gap-2 text-error mb-1">
                <AlertTriangle className="h-5 w-5" />
                <DialogTitle className="text-lg font-semibold tracking-wide">
                  Delete Project
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-copy-muted font-light leading-relaxed">
                Are you sure you want to delete <span className="text-copy-secondary font-medium font-semibold">{targetProject?.name}</span>? This action is permanent and cannot be undone.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="flex sm:flex-row gap-2 mt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setDeleteOpen(false)
                  setTargetProjectId(null)
                }}
                disabled={isLoading}
                className="text-xs text-copy-secondary hover:bg-subtle rounded-xl px-4 h-9"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                variant="destructive"
                className="text-xs font-semibold bg-error hover:bg-error/80 text-foreground rounded-xl px-5 h-9"
              >
                {isLoading ? "Deleting..." : "Delete Project"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
