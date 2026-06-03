"use client"

import React, { createContext, useContext, useState } from "react"

export interface Project {
  id: string;
  name: string;
  slug: string;
  isOwner: boolean;
}

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
  projectSlug: string;
  targetProjectId: string | null;
  setTargetProjectId: (id: string | null) => void;
  
  // Actions
  handleCreateProject: (name: string) => Promise<void>;
  handleRenameProject: (id: string, newName: string) => Promise<void>;
  handleDeleteProject: (id: string) => Promise<void>;
  
  // Loading State
  isLoading: boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined)

const INITIAL_PROJECTS: Project[] = [
  { id: "1", name: "Global Checkout Orchestration", slug: "global-checkout-orchestration", isOwner: true },
  { id: "2", name: "Edge Identity Gateway", slug: "edge-identity-gateway", isOwner: true },
  { id: "3", name: "Real-Time Telemetry Mesh", slug: "real-time-telemetry-mesh", isOwner: false },
  { id: "4", name: "Durable Ingestion Engine", slug: "durable-ingestion-engine", isOwner: false },
]

export const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // remove non-alphanumeric except spaces/hyphens
    .replace(/[\s_]+/g, "-")      // replace spaces/underscores with hyphens
    .replace(/-+/g, "-")          // remove duplicate hyphens
    .replace(/^-+|-+$/g, "")      // trim hyphens from start/end
}

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS)
  const [activeProject, setActiveProject] = useState<Project | null>(null)
  
  // Dialog states
  const [createOpen, setCreateOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  
  // Form/Target states
  const [projectName, setProjectName] = useState("")
  const [targetProjectId, setTargetProjectId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const projectSlug = generateSlug(projectName)

  const openProject = (id: string) => {
    const project = projects.find((p) => p.id === id)
    if (project) {
      setActiveProject(project)
    }
  }

  const closeProject = () => {
    setActiveProject(null)
  }

  const handleCreateProject = async (name: string) => {
    setIsLoading(true)
    // Simulate minor async transition
    await new Promise((resolve) => setTimeout(resolve, 600))
    
    const newProject: Project = {
      id: Math.random().toString(36).substring(2, 9),
      name: name.trim(),
      slug: generateSlug(name),
      isOwner: true,
    }
    
    setProjects((prev) => [...prev, newProject])
    setActiveProject(newProject)
    setProjectName("")
    setCreateOpen(false)
    setIsLoading(false)
  }

  const handleRenameProject = async (id: string, newName: string) => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 600))
    
    const updatedName = newName.trim()
    const updatedSlug = generateSlug(updatedName)
    
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name: updatedName, slug: updatedSlug } : p))
    )
    
    // Update active project if it was renamed
    setActiveProject((prev) =>
      prev && prev.id === id ? { ...prev, name: updatedName, slug: updatedSlug } : prev
    )
    
    setProjectName("")
    setTargetProjectId(null)
    setRenameOpen(false)
    setIsLoading(false)
  }

  const handleDeleteProject = async (id: string) => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 600))
    
    setProjects((prev) => prev.filter((p) => p.id !== id))
    
    // Close active project if it was deleted
    setActiveProject((prev) => (prev && prev.id === id ? null : prev))
    
    setTargetProjectId(null)
    setDeleteOpen(false)
    setIsLoading(false)
  }

  return (
    <ProjectContext.Provider
      value={{
        projects,
        activeProject,
        openProject,
        closeProject,
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
        handleCreateProject,
        handleRenameProject,
        handleDeleteProject,
        isLoading,
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
