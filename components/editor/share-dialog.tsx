"use client"

import React, { useEffect, useState } from "react"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useProjects } from "@/contexts/project-context"
import { Copy, Check, UserPlus, Trash2, Loader2, Users, Shield } from "lucide-react"

interface Collaborator {
  id: string
  email: string
  name: string | null
  imageUrl: string | null
  createdAt: string
}

export function ShareDialog() {
  const { activeProject, shareOpen, setShareOpen } = useProjects()
  
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [inviteEmail, setInviteEmail] = useState("")
  const [isFetching, setIsFetching] = useState(false)
  const [isInviting, setIsInviting] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [origin, setOrigin] = useState("")

  // Set the window origin safely on the client to prevent SSR reference errors
  useEffect(() => {
    if (typeof window !== "undefined") {
      const currentOrigin = window.location.origin
      // Defer state update to avoid synchronous cascading renders in effect body
      setTimeout(() => {
        setOrigin(currentOrigin)
      }, 0)
    }
  }, [])

  // Fetch collaborators list when dialog opens
  useEffect(() => {
    if (!shareOpen || !activeProject) return

    const controller = new AbortController()
    const currentProjectId = activeProject.id
    let active = true

    const fetchCollaborators = async () => {
      setIsFetching(true)
      setError(null)
      try {
        const res = await fetch(`/api/projects/${currentProjectId}/collaborators`, {
          signal: controller.signal,
        })
        if (!res.ok) {
          throw new Error("Failed to load collaborators")
        }
        const data = await res.json()
        if (active && activeProject.id === currentProjectId) {
          setCollaborators(data)
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          if (err.name === "AbortError") return
          console.error(err)
          if (active && activeProject.id === currentProjectId) {
            setError(err.message || "An error occurred while loading collaborators")
          }
        } else {
          console.error(err)
          if (active && activeProject.id === currentProjectId) {
            setError("An error occurred while loading collaborators")
          }
        }
      } finally {
        if (active && activeProject.id === currentProjectId) {
          setIsFetching(false)
        }
      }
    }

    fetchCollaborators()

    return () => {
      active = false
      controller.abort()
    }
  }, [shareOpen, activeProject])

  // Reset form state on close via dialog open change callback
  const handleOpenChange = (open: boolean) => {
    setShareOpen(open)
    if (!open) {
      setInviteEmail("")
      setError(null)
      setCopied(false)
    }
  }

  if (!activeProject) return null

  const isOwner = activeProject.isOwner

  const handleCopyLink = async () => {
    const link = `${origin}/editor/${activeProject.id}`
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy project URL:", err)
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim() || isInviting) return

    const projectId = activeProject.id
    setIsInviting(true)
    setError(null)

    try {
      const res = await fetch(`/api/projects/${projectId}/collaborators`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to invite collaborator")
      }

      if (activeProject.id === projectId) {
        setCollaborators((prev) => [...prev, data])
        setInviteEmail("")
      }
    } catch (err: unknown) {
      if (activeProject.id === projectId) {
        if (err instanceof Error) {
          setError(err.message || "An error occurred during invitation")
        } else {
          setError("An error occurred during invitation")
        }
      }
      console.error(err)
    } finally {
      if (activeProject.id === projectId) {
        setIsInviting(false)
      }
    }
  }

  const handleRemove = async (id: string) => {
    if (removingId || !window.confirm("Are you sure you want to revoke access for this collaborator? This action is irreversible.")) return

    const projectId = activeProject.id
    setRemovingId(id)
    setError(null)

    try {
      const res = await fetch(`/api/projects/${projectId}/collaborators`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to remove collaborator")
      }

      if (activeProject.id === projectId) {
        setCollaborators((prev) => prev.filter((c) => c.id !== id))
      }
    } catch (err: unknown) {
      if (activeProject.id === projectId) {
        if (err instanceof Error) {
          setError(err.message || "An error occurred during removal")
        } else {
          setError("An error occurred during removal")
        }
      }
      console.error(err)
    } finally {
      if (activeProject.id === projectId) {
        setRemovingId(null)
      }
    }
  }

  return (
    <Dialog open={shareOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="border-surface-border bg-surface text-copy-primary rounded-3xl max-w-md p-6 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <DialogHeader className="shrink-0 mb-2">
          <DialogTitle className="text-lg font-light tracking-wide text-copy-primary flex items-center gap-2">
            Share <span className="font-semibold text-brand">Workspace</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-copy-muted font-light">
            {isOwner
              ? "Manage access levels, copy the visual editor project link, or invite collaborators to model in real-time."
              : "View the list of collaborators with access to this visual design canvas."}
          </DialogDescription>
        </DialogHeader>

        {/* Copy Link Section (Visible to Owners) */}
        {isOwner && (
          <div className="flex flex-col gap-2 shrink-0 mb-4 bg-base p-3 rounded-2xl border border-surface-border-subtle">
            <span className="text-[10px] font-semibold tracking-wider text-copy-secondary uppercase">
              Project Link
            </span>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={`${origin}/editor/${activeProject.id}`}
                className="bg-surface/50 border-surface-border-subtle text-copy-muted focus-visible:border-surface-border rounded-xl h-9 text-[11px] font-mono select-all flex-1"
              />
              <Button
                onClick={handleCopyLink}
                className="bg-brand hover:bg-brand/80 text-background text-xs font-semibold px-4 h-9 rounded-xl flex items-center gap-1.5 transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Add Collaborator Form (Visible to Owners) */}
        {isOwner && (
          <form onSubmit={handleInvite} className="flex flex-col gap-2 shrink-0 mb-4">
            <label htmlFor="invite-email" className="text-[10px] font-semibold tracking-wider text-copy-secondary uppercase">
              Invite by Email
            </label>
            <div className="flex items-center gap-2">
              <Input
                id="invite-email"
                type="email"
                placeholder="collaborator@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                disabled={isInviting}
                required
                className="bg-base border-surface-border-subtle focus-visible:border-brand rounded-xl h-9 text-xs flex-1"
              />
              <Button
                type="submit"
                disabled={isInviting || !inviteEmail.trim()}
                className="bg-brand hover:bg-brand/80 text-background text-xs font-semibold px-4 h-9 rounded-xl flex items-center gap-1.5 transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
              >
                {isInviting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <UserPlus className="h-3.5 w-3.5" />
                )}
                <span>Invite</span>
              </Button>
            </div>
          </form>
        )}

        {/* Error message */}
        {error && (
          <div className="text-xs text-error bg-error-dim border border-error/15 rounded-xl p-3 mb-4 shrink-0 animate-in fade-in duration-200">
            {error}
          </div>
        )}

        {/* Collaborators List (Owners & Collaborators) */}
        <div className="flex-1 flex flex-col min-h-0">
          <span className="text-[10px] font-semibold tracking-wider text-copy-secondary uppercase mb-2 shrink-0">
            Workspace Access
          </span>

          <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 min-h-[120px]">
            {isFetching ? (
              <div className="flex-1 flex flex-col items-center justify-center text-copy-muted gap-2 py-8">
                <Loader2 className="h-5 w-5 animate-spin text-brand" />
                <span className="text-xs font-light">Loading workspace access list...</span>
              </div>
            ) : collaborators.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-copy-faint gap-2 py-8 border border-dashed border-surface-border-subtle rounded-2xl">
                <Users className="h-6 w-6" />
                <span className="text-xs font-light">No collaborators yet</span>
              </div>
            ) : (
              collaborators.map((collab) => (
                <div
                  key={collab.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-elevated/40 border border-surface-border-subtle/50 transition hover:bg-elevated/60"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {collab.imageUrl ? (
                      <Image
                        src={collab.imageUrl}
                        alt={collab.name || collab.email}
                        width={32}
                        height={32}
                        unoptimized
                        className="h-8 w-8 rounded-full border border-surface-border-subtle shrink-0"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-subtle border border-surface-border-subtle flex items-center justify-center text-[10px] font-semibold text-copy-muted uppercase shrink-0">
                        {(collab.name || collab.email).substring(0, 2)}
                      </div>
                    )}

                    <div className="flex flex-col min-w-0">
                      {collab.name ? (
                        <>
                          <span className="text-xs font-medium text-copy-primary truncate">
                            {collab.name}
                          </span>
                          <span className="text-[10px] text-copy-muted truncate">
                            {collab.email}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs font-light text-copy-primary truncate">
                          {collab.email}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Revoke Control (Visible to Owners only) */}
                  {isOwner && (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleRemove(collab.id)}
                      disabled={removingId === collab.id}
                      aria-label="Revoke collaborator access"
                      className="text-copy-muted hover:text-error hover:bg-subtle rounded-lg transition shrink-0"
                    >
                      {removingId === collab.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </Button>
                  )}

                  {/* Read-only collaborator tag */}
                  {!isOwner && (
                    <div className="flex items-center gap-1 text-[9px] text-copy-faint font-mono font-medium opacity-70 px-1.5 py-0.5 bg-subtle border border-surface-border-subtle rounded-md shrink-0 select-none">
                      <Shield className="h-2.5 w-2.5" />
                      <span>Collaborator</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
