import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#050507] text-[#F4F4F6] flex flex-col items-center justify-center px-6 text-center">
      <p className="font-mono-tech text-xs text-emerald-400 mb-3">404 · Sector Not Found</p>
      <h1 className="font-display font-bold text-3xl sm:text-5xl tracking-tight mb-4">
        Coordinates Out of Bounds
      </h1>
      <p className="text-sm text-zinc-400 max-w-md mb-6">
        The requested portfolio route does not exist. Return to the main WebGL showcase.
      </p>
      <Link
        href="/"
        className="px-5 py-2.5 rounded-lg bg-white text-zinc-950 text-sm font-semibold hover:bg-zinc-200 transition-colors"
      >
        Return to Portfolio
      </Link>
    </main>
  );
}
