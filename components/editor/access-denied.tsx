"use client"

import { ShieldAlert, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function AccessDenied() {
  return (
    <div className="relative flex min-h-screen w-screen flex-col items-center justify-center bg-base p-6 font-sans text-copy-primary antialiased">
      {/* Subtle Grid Background Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{
          backgroundImage: `
            linear-gradient(to right, var(--text-primary) 1px, transparent 1px),
            linear-gradient(to bottom, var(--text-primary) 1px, transparent 1px)
          `,
          backgroundSize: "24px 24px"
        }}
      />

      {/* Abstract background glows */}
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] rounded-full bg-brand/5 opacity-[0.03] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-[600px] h-[600px] rounded-full bg-brand-ai/5 opacity-[0.03] blur-[150px] pointer-events-none" />

      {/* Centered Lock Card */}
      <div className="relative max-w-md w-full mx-auto z-10 animate-in fade-in zoom-in duration-300">
        <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-error/20 via-brand-ai/20 to-error/20 opacity-30 blur-xl transition duration-1000" />
        
        <div className="relative flex flex-col items-center text-center bg-surface/60 border border-surface-border rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
          {/* Lock Icon Wrapper */}
          <div className="h-16 w-16 rounded-full bg-error-dim border border-error/20 flex items-center justify-center mb-6 text-error shadow-lg shadow-error/10 animate-pulse">
            <ShieldAlert className="h-7 w-7" />
          </div>

          {/* Title & Wording */}
          <h1 className="text-2xl font-extralight tracking-wide text-copy-primary mb-3">
            Access <span className="font-semibold text-error">Denied</span>
          </h1>
          <p className="text-sm text-copy-secondary leading-relaxed mb-8 font-light">
            You do not have permission to view this workspace, or this project resource does not exist. Please contact the owner or return to your workspaces dashboard.
          </p>

          {/* Back Action Button */}
          <Link href="/editor" passHref className="w-full">
            <Button
              className="w-full bg-subtle hover:bg-subtle/80 text-copy-primary border border-surface-border text-xs font-semibold px-6 h-10 rounded-xl flex items-center justify-center gap-2 transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
            >
              <ArrowLeft className="h-4 w-4 text-brand" />
              Return to Workspaces
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
