"use client"

import React, { createContext, useContext, useState } from "react"
import { useProjectActions, Project } from "@/hooks/use-project-actions"
import { generateSlug } from "@/lib/utils"
import { useRouter } from "next/navigation"

interface ProjectContextType {
  projects: Project[];
  activeProject: Project | null;
  openProject: (id: string) => void;
  closeProject: () => void;
  
  // Dialog Open States
  createOpen: boolean;
  setCreateOpen: (open: boolean) => void;
  renameOpen: boolean;
  setRenameOpen: (open: boolean) => void;
  deleteOpen: boolean;
  setDeleteOpen: (open: boolean) => void;
  shareOpen: boolean;
  setShareOpen: (open: boolean) => void;
  
  // Form State
  projectName: string;
  setProjectName: (name: string) => void;
  projectDescription: string;
  setProjectDescription: (description: string) => void;
  projectSlug: string;
  targetProjectId: string | null;
  setTargetProjectId: (id: string | null) => void;
  
  // Actions
  handleCreateProject: (name: string, description?: string) => Promise<void>;
  handleRenameProject: (id: string, newName: string, newDescription?: string) => Promise<void>;
  handleDeleteProject: (id: string) => Promise<void>;
  
  // Loading State
  isLoading: boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined)

export { generateSlug }
export type { Project }

export function ProjectProvider({
  children,
  initialProjects,
  activeProjectId,
}: {
  children: React.ReactNode
  initialProjects: Project[]
  activeProjectId?: string
}) {
  const router = useRouter()
  const [prevActiveProjectId, setPrevActiveProjectId] = useState(activeProjectId)
  const [prevInitialProjects, setPrevInitialProjects] = useState(initialProjects)
  const [shareOpen, setShareOpen] = useState(false)
  const [activeProject, setActiveProject] = useState<Project | null>(() => {
    if (activeProjectId) {
      return initialProjects.find((p) => p.id === activeProjectId) || null
    }
    return null
  })

  // Synchronize state directly in render when page routes change or new initialProjects load
  if (activeProjectId !== prevActiveProjectId || initialProjects !== prevInitialProjects) {
    setPrevActiveProjectId(activeProjectId)
    setPrevInitialProjects(initialProjects)
    const project = activeProjectId
      ? initialProjects.find((p) => p.id === activeProjectId) || null
      : null
    setActiveProject(project)
  }

  const actions = useProjectActions(activeProject, setActiveProject)

  const openProject = (id: string) => {
    router.push(`/editor/${id}`)
  }

  const closeProject = () => {
    router.push("/editor")
  }

  return (
    <ProjectContext.Provider
      value={{
        projects: initialProjects,
        activeProject,
        openProject,
        closeProject,
        shareOpen,
        setShareOpen,
        ...actions,
      }}
    >
      {children}
    </ProjectContext.Provider>
  )
}

export function useProjects() {
  const context = useContext(ProjectContext)
  if (context === undefined) {
    throw new Error("useProjects must be used within a ProjectProvider")
  }
  return context
}
