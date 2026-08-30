import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 px-5 py-12 text-white">
      <section className="mx-auto flex min-h-[80vh] max-w-5xl flex-col justify-center gap-7">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">Oswok AI</p>
          <Link href="/login" className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium">Sign in</Link>
        </div>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">Work should find people, not the other way around.</h1>
        <p className="max-w-2xl text-lg leading-8 text-slate-400">A WhatsApp-first work coordination platform being built for Sierra Leone, starting in Freetown.</p>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/login?role=worker" className="rounded-2xl border border-cyan-300/20 bg-cyan-300/5 p-6 transition hover:border-cyan-300/50 hover:bg-cyan-300/10">
            <p className="text-sm font-semibold text-cyan-300">I am looking for work</p>
            <h2 className="mt-2 text-xl font-bold">Find work</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">Create a worker account, discover opportunities and apply for jobs.</p>
            <span className="mt-5 inline-block rounded-xl bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950">Continue as worker →</span>
          </Link>
          <Link href="/login?role=employer" className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-white/30 hover:bg-white/[0.08]">
            <p className="text-sm font-semibold text-white">I need people for work</p>
            <h2 className="mt-2 text-xl font-bold">Hire people</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">Create an employer account, publish jobs and manage your hiring pipeline.</p>
            <span className="mt-5 inline-block rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold">Continue as employer →</span>
          </Link>
        </div>

        <div className="flex flex-wrap gap-3 text-xs text-slate-500">
          <span>Worker marketplace</span><span>Employer marketplace</span><span>Admin centre</span>
        </div>
      </section>
    </main>
  )
}
