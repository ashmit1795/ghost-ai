"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { generateSlug } from "@/lib/utils"

export interface Project {
  id: string
  name: string
  description?: string | null
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
  const [projectDescription, setProjectDescription] = useState("")
  const [targetProjectId, setTargetProjectId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Generate unique suffix for slug / room ID
  const [uniqueSuffix, setUniqueSuffix] = useState(() => Math.random().toString(36).substring(2, 7))

  const handleOpenCreate = (open: boolean) => {
    if (open) {
      setUniqueSuffix(Math.random().toString(36).substring(2, 7))
      setProjectName("")
      setProjectDescription("")
    }
    setCreateOpen(open)
  }

  const baseSlug = generateSlug(projectName)
  const projectSlug = projectName.trim() ? `${baseSlug}-${uniqueSuffix}` : ""

  const handleCreateProject = async (name: string, description?: string) => {
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
          description: description?.trim() || null,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to create project")
      }

      const newProject = await res.json()
      
      // Clean up form
      setProjectName("")
      setProjectDescription("")
      setCreateOpen(false)
      
      // Redirect to the new workspace page and refresh
      router.push(`/editor/${newProject.id}`)
      router.refresh()
    } catch (error) {
      console.error("Error creating project:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRenameProject = async (id: string, newName: string, newDescription?: string) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newName.trim(),
          description: newDescription?.trim() || null,
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
          description: updatedProject.description,
        })
      }

      setProjectName("")
      setProjectDescription("")
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

      // If active project is deleted, redirect to /editor
      if (activeProject && activeProject.id === id) {
        router.push("/editor")
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
    projectDescription,
    setProjectDescription,
    projectSlug,
    targetProjectId,
    setTargetProjectId,
    handleCreateProject,
    handleRenameProject,
    handleDeleteProject,
    isLoading,
  }
}
