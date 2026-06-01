import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-base text-copy-primary p-6 text-center antialiased">
      <div className="relative group max-w-md w-full">
        {/* Backdrop glow */}
        <div className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-brand/10 via-brand-ai/10 to-brand/10 opacity-30 blur-xl" />
        
        {/* Container */}
        <div className="relative flex flex-col items-center justify-center p-8 bg-surface border border-surface-border rounded-2xl shadow-2xl backdrop-blur-xl">
          <h2 className="text-5xl font-extralight tracking-[0.2em] text-brand mb-2 select-none">
            404
          </h2>
          <h3 className="text-lg font-light tracking-wide text-copy-secondary mb-4 uppercase">
            System Node Missing
          </h3>
          <p className="text-copy-muted text-sm mb-8 leading-relaxed">
            The system layout or routing coordinate you are trying to resolve cannot be found in our current workspace model.
          </p>
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-brand px-6 text-sm font-medium text-black transition-all hover:scale-[1.02] active:scale-[0.98] select-none"
          >
            Return to Workspace
          </Link>
        </div>
      </div>
    </div>
  );
}
