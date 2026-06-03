import { SignIn } from "@clerk/nextjs"
import { clerkAppearance } from "@/lib/clerk-theme"
import { CheckCircle2 } from "lucide-react"

export default function SignInPage() {
  return (
    <div className="min-h-screen flex bg-base text-copy-primary font-sans antialiased">
      {/* Left panel - Info Panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-surface border-r border-surface-border relative overflow-hidden select-none">
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02] pointer-events-none" 
          style={{
            backgroundImage: `
              linear-gradient(to right, var(--text-primary) 1px, transparent 1px),
              linear-gradient(to bottom, var(--text-primary) 1px, transparent 1px)
            `,
            backgroundSize: "20px 20px"
          }}
        />
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] rounded-full bg-brand/5 opacity-20 blur-[80px] pointer-events-none" />

        {/* Logo and Tagline */}
        <div className="relative z-10">
          <div className="flex items-center gap-1.5 font-sans tracking-wide mb-8">
            <span className="text-xl font-light text-copy-muted uppercase tracking-[0.2em]">ghost</span>
            <span className="text-xl font-semibold text-brand uppercase tracking-[0.2em]">AI</span>
          </div>
          <h2 className="text-4xl font-extralight tracking-wide leading-tight mb-4">
            Real-time collaborative <span className="font-medium text-brand">system design</span> workspace.
          </h2>
          <p className="text-copy-secondary max-w-md font-light leading-relaxed">
            Design, simulate, and document your system architecture in real-time. Describe your infrastructure in plain English, collaborate live with your engineering team, and generate comprehensive Markdown specifications automatically.
          </p>
        </div>

        {/* Features List */}
        <div className="relative z-10 flex flex-col gap-5 max-w-md">
          <div className="flex gap-3">
            <CheckCircle2 className="h-5 w-5 text-brand shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-copy-primary">AI Architecture Generation</h4>
              <p className="text-xs text-copy-muted mt-1 leading-normal font-light">Generate interactive node graphs and layouts from simple natural language prompts.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <CheckCircle2 className="h-5 w-5 text-brand shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-copy-primary">Real-time Canvas Collaboration</h4>
              <p className="text-xs text-copy-muted mt-1 leading-normal font-light">Work seamlessly with your team using real-time cursors, presence indicators, and state sync.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <CheckCircle2 className="h-5 w-5 text-brand shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-copy-primary">Technical Spec Persistence</h4>
              <p className="text-xs text-copy-muted mt-1 leading-normal font-light">Compile your canvas layouts into persistent, production-ready technical specifications.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-xs text-copy-faint">
          © {new Date().getFullYear()} ghost AI. All rights reserved.
        </div>
      </div>

      {/* Right panel - Clerk Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative">
        <div className="absolute inset-0 opacity-[0.01] pointer-events-none" 
          style={{
            backgroundImage: `
              linear-gradient(to right, var(--text-primary) 1px, transparent 1px),
              linear-gradient(to bottom, var(--text-primary) 1px, transparent 1px)
            `,
            backgroundSize: "24px 24px"
          }}
        />
        
        <div className="relative z-10">
          <SignIn 
            appearance={clerkAppearance}
          />
        </div>
      </div>
    </div>
  )
}
