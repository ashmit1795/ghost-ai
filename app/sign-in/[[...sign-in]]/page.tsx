import { SignIn } from "@clerk/nextjs"
import { dark } from "@clerk/ui/themes"
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
            Describe your system in plain English, map it onto a live visual canvas, collaborate in real-time, and generate persistent Markdown specs.
          </p>
        </div>

        {/* Features List */}
        <div className="relative z-10 flex flex-col gap-5 max-w-md">
          <div className="flex gap-3">
            <CheckCircle2 className="h-5 w-5 text-brand shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-copy-primary">AI Architecture Generation</h4>
              <p className="text-xs text-copy-muted mt-1 leading-normal font-light">Generate interactive node graphs from simple natural language prompts.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <CheckCircle2 className="h-5 w-5 text-brand shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-copy-primary">Real-time Canvas Collaboration</h4>
              <p className="text-xs text-copy-muted mt-1 leading-normal font-light">Work seamlessly with teammates using Liveblocks and React Flow.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <CheckCircle2 className="h-5 w-5 text-brand shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-copy-primary">Technical Spec Persistence</h4>
              <p className="text-xs text-copy-muted mt-1 leading-normal font-light">Convert layout graphs to persistent, structured Markdown specifications.</p>
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
            appearance={{
              theme: dark,
              variables: {
                colorPrimary: "var(--accent-primary)",
                colorBackground: "var(--bg-surface)",
                colorInput: "var(--bg-base)",
                colorForeground: "var(--text-primary)",
                colorMutedForeground: "var(--text-secondary)",
                colorBorder: "var(--border-default)",
                colorPrimaryForeground: "var(--bg-base)",
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}
