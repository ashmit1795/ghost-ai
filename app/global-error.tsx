'use client';

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-base text-copy-primary p-6 text-center antialiased">
        <div className="relative max-w-md w-full">
          {/* Backdrop glow */}
          <div className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-error/10 via-brand-ai/10 to-error/10 opacity-30 blur-xl" />
          
          {/* Container */}
          <div className="relative flex flex-col items-center justify-center p-8 bg-surface border border-surface-border rounded-3xl shadow-2xl backdrop-blur-xl">
            <h2 className="text-5xl font-extralight tracking-[0.2em] text-error mb-2 select-none">
              500
            </h2>
            <h3 className="text-lg font-light tracking-wide text-copy-secondary mb-4 uppercase">
              System Failure Intercepted
            </h3>
            <p className="text-copy-muted text-xs leading-relaxed mb-6 font-mono break-all max-h-32 overflow-y-auto w-full p-3 bg-base border border-surface-border-subtle rounded-xl text-left">
              {error.message || 'An unexpected runtime exception occurred.'}
            </p>
            <button
              onClick={() => unstable_retry()}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-brand px-6 text-sm font-semibold text-black transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              Re-initialize Session
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
