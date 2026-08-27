import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 px-5 py-12 text-white">
      <section className="mx-auto flex min-h-[80vh] max-w-5xl flex-col justify-center gap-7">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">Oswok AI</p>
          <Link href="/login" className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium">Sign in</Link>
        </div>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">Find trustworthy work. Find trustworthy workers.</h1>
        <p className="max-w-2xl text-lg leading-8 text-slate-400">A WhatsApp-first work coordination platform being built for Sierra Leone, starting in Freetown.</p>
        <div className="flex flex-wrap gap-3">
          <span className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300">Worker platform</span>
          <span className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300">Employer platform</span>
          <span className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300">Admin centre</span>
        </div>
        <Link href="/login" className="w-fit rounded-xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950">Create your Oswok account</Link>
      </section>
    </main>
  )
}
