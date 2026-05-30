export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white selection:bg-zinc-800 antialiased">
      <div className="relative group">
        {/* Elegant backdrop glow */}
        <div className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-zinc-700 via-zinc-800 to-zinc-700 opacity-20 blur-2xl transition duration-1000 group-hover:opacity-40" />
        
        {/* Main interactive center container */}
        <div className="relative flex flex-col items-center justify-center px-12 py-8 bg-zinc-900/50 border border-zinc-800/60 rounded-2xl shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-zinc-700/60">
          <h1 className="text-4xl font-extralight tracking-[0.25em] text-zinc-100 uppercase transition-all duration-500 hover:tracking-[0.35em] cursor-default select-none">
            ghost <span className="font-medium text-zinc-400">AI</span>
          </h1>
        </div>
      </div>
    </div>
  );
}
