import Link from 'next/link'
import { login, signup } from './actions'

type Role = 'worker' | 'employer'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; role?: string }> }) {
  const params = await searchParams
  const role: Role = params.role === 'employer' ? 'employer' : 'worker'
  const isEmployer = role === 'employer'

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-12 text-white">
      <div className="mx-auto max-w-md">
        <div className="mb-8">
          <Link href="/" className="text-sm font-semibold text-cyan-300">OSWOK AI</Link>
          <h1 className="mt-6 text-3xl font-bold tracking-tight">{isEmployer ? 'Hire trusted people.' : 'Find trusted work.'}</h1>
          <p className="mt-3 text-slate-400">Choose your Oswok path, then sign in or create your account.</p>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3">
          <Link href="/login?role=worker" className={`rounded-2xl border p-4 ${!isEmployer ? 'border-cyan-300 bg-cyan-300/10' : 'border-white/10 bg-white/5'}`}>
            <p className="text-sm font-semibold">Worker</p>
            <p className="mt-1 text-xs text-slate-400">Find and apply for work</p>
          </Link>
          <Link href="/login?role=employer" className={`rounded-2xl border p-4 ${isEmployer ? 'border-cyan-300 bg-cyan-300/10' : 'border-white/10 bg-white/5'}`}>
            <p className="text-sm font-semibold">Hirer</p>
            <p className="mt-1 text-xs text-slate-400">Post and manage jobs</p>
          </Link>
        </div>

        {params.error ? <div className="mb-5 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">{params.error}</div> : null}

        <form className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5 shadow-2xl">
          <input type="hidden" name="role" value={role} />
          {isEmployer ? (
            <div className="rounded-xl border border-cyan-300/20 bg-cyan-300/5 p-4 text-sm text-cyan-100">You are entering Oswok as a <strong>hirer</strong>. After onboarding, you can post a job and manage applicants.</div>
          ) : (
            <div className="rounded-xl border border-cyan-300/20 bg-cyan-300/5 p-4 text-sm text-cyan-100">You are entering Oswok as a <strong>worker</strong>. After onboarding, you can browse jobs and apply.</div>
          )}
          <div><label htmlFor="fullName" className="mb-2 block text-sm font-medium text-slate-200">Full name</label><input id="fullName" name="fullName" type="text" autoComplete="name" placeholder="Your full name" className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none placeholder:text-slate-600 focus:border-cyan-300" /></div>
          <div><label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-200">Email</label><input id="email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none placeholder:text-slate-600 focus:border-cyan-300" /></div>
          <div><label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-200">Password</label><input id="password" name="password" type="password" autoComplete="current-password" minLength={8} required placeholder="At least 8 characters" className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none placeholder:text-slate-600 focus:border-cyan-300" /></div>
          <div className="text-right"><Link href="/forgot-password" className="text-sm font-medium text-cyan-300 hover:text-cyan-200">Forgot password?</Link></div>
          <div className="grid gap-3 pt-2 sm:grid-cols-2"><button formAction={login} className="rounded-xl bg-white px-4 py-3 font-semibold text-slate-950">Sign in</button><button formAction={signup} className="rounded-xl bg-cyan-300 px-4 py-3 font-semibold text-slate-950">Create account</button></div>
        </form>
        <p className="mt-5 text-xs leading-5 text-slate-500">{isEmployer ? 'Hirers publish jobs. Workers see published jobs and can apply.' : 'Workers see published jobs and can apply from the job page.'}</p>
      </div>
    </main>
  )
}
