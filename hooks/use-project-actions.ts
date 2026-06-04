"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { generateSlug } from "@/lib/utils"

export interface Project {
  id: string
  name: string
  slug: string
  isOwner: boolean
}

export function useProjectActions(
  activeProject: Project | null,
  setActiveProject: (project: Project | null) => void
) {
  const router = useRouter()
  
  // Dialog open states
  const [createOpen, setCreateOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  // Form states
  const [projectName, setProjectName] = useState("")
  const [targetProjectId, setTargetProjectId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Generate unique suffix for slug / room ID
  const [uniqueSuffix, setUniqueSuffix] = useState(() => Math.random().toString(36).substring(2, 7))

  const handleOpenCreate = (open: boolean) => {
    if (open) {
      setUniqueSuffix(Math.random().toString(36).substring(2, 7))
      setProjectName("")
    }
    setCreateOpen(open)
  }

  const baseSlug = generateSlug(projectName)
  const projectSlug = projectName.trim() ? `${baseSlug}-${uniqueSuffix}` : ""

  const handleCreateProject = async (name: string) => {
    setIsLoading(true)
    const computedRoomId = projectSlug || `${generateSlug(name)}-${uniqueSuffix}`
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: computedRoomId,
          name: name.trim(),
        }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to create project")
      }

      const newProject = await res.json()
      
      // Update active project (navigate to new workspace)
      setActiveProject({
        id: newProject.id,
        name: newProject.name,
        slug: newProject.id, // Align slug with immutable project ID
        isOwner: true,
      })

      // Clean up form
      setProjectName("")
      setCreateOpen(false)
      
      // Refresh page data
      router.refresh()
    } catch (error) {
      console.error("Error creating project:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRenameProject = async (id: string, newName: string) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newName.trim(),
        }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to rename project")
      }

      const updatedProject = await res.json()

      // If active project is renamed, update active project state
      if (activeProject && activeProject.id === id) {
        setActiveProject({
          ...activeProject,
          name: updatedProject.name,
        })
      }

      setProjectName("")
      setTargetProjectId(null)
      setRenameOpen(false)
      
      router.refresh()
    } catch (error) {
      console.error("Error renaming project:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteProject = async (id: string) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to delete project")
      }

      // If active project is deleted, redirect to /editor (clear active project)
      if (activeProject && activeProject.id === id) {
        setActiveProject(null)
      }

      setTargetProjectId(null)
      setDeleteOpen(false)
      
      router.refresh()
    } catch (error) {
      console.error("Error deleting project:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    createOpen,
    setCreateOpen: handleOpenCreate,
    renameOpen,
    setRenameOpen,
    deleteOpen,
    setDeleteOpen,
    projectName,
    setProjectName,
    projectSlug,
    targetProjectId,
    setTargetProjectId,
    handleCreateProject,
    handleRenameProject,
    handleDeleteProject,
    isLoading,
  }
}
