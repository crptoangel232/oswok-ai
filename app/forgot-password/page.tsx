import Link from 'next/link'
import { requestPasswordReset } from './actions'

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string; sent?: string }> }) {
  const params = await searchParams

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-12 text-white">
      <div className="mx-auto max-w-md">
        <Link href="/login" className="text-sm font-semibold text-cyan-300">OSWOK AI</Link>
        <h1 className="mt-8 text-3xl font-bold">Reset your password.</h1>
        <p className="mt-3 text-slate-400">Enter your account email and we will send a password reset link.</p>
        {params.error ? <div className="mt-5 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">{params.error}</div> : null}
        {params.sent ? <div className="mt-5 rounded-xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-sm text-cyan-100">If an account exists for that email, check its inbox for the reset link.</div> : null}
        <form action={requestPasswordReset} className="mt-7 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
          <div><label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-200">Email</label><input id="email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none placeholder:text-slate-600 focus:border-cyan-300" /></div>
          <button className="w-full rounded-xl bg-cyan-300 px-4 py-3 font-semibold text-slate-950">Send reset link</button>
        </form>
      </div>
    </main>
  )
}
