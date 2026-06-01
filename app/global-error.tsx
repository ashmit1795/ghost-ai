'use client';

export const dynamic = 'force-dynamic';

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-white p-6 text-center antialiased">
        <div className="max-w-md p-8 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl">
          <h2 className="text-2xl font-light tracking-wide mb-4">Something went wrong</h2>
          <p className="text-zinc-400 text-sm mb-6 font-mono break-all">
            {error.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => unstable_retry()}
            className="px-6 py-2 bg-zinc-800 text-zinc-200 border border-zinc-700 rounded-lg text-sm transition hover:bg-zinc-700 hover:text-white"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
