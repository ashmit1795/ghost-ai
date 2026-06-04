"use client"

import React, { createContext, useContext, useState } from "react"
import { useProjectActions, Project } from "@/hooks/use-project-actions"
import { generateSlug } from "@/lib/utils"

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
}: {
  children: React.ReactNode
  initialProjects: Project[]
}) {
  const [activeProject, setActiveProject] = useState<Project | null>(null)
  const actions = useProjectActions(activeProject, setActiveProject)

  const openProject = (id: string) => {
    const project = initialProjects.find((p) => p.id === id)
    if (project) {
      setActiveProject(project)
    }
  }

  const closeProject = () => {
    setActiveProject(null)
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
