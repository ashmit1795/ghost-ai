"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
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
  const [activeProject, setActiveProject] = useState<Project | null>(() => {
    if (activeProjectId) {
      return initialProjects.find((p) => p.id === activeProjectId) || null
    }
    return null
  })

  // Synchronize state when page routes change or new initialProjects load
  useEffect(() => {
    if (activeProjectId) {
      const project = initialProjects.find((p) => p.id === activeProjectId)
      setActiveProject(project || null)
    } else {
      setActiveProject(null)
    }
  }, [activeProjectId, initialProjects])

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
