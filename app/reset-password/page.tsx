import Link from 'next/link'
import { updatePassword } from './actions'

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-12 text-white">
      <div className="mx-auto max-w-md">
        <Link href="/" className="text-sm font-semibold text-cyan-300">OSWOK AI</Link>
        <h1 className="mt-8 text-3xl font-bold">Choose a new password.</h1>
        <p className="mt-3 text-slate-400">Use at least 8 characters. After saving, you will return to your dashboard.</p>
        {params.error ? <div className="mt-5 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">{params.error}</div> : null}
        <form action={updatePassword} className="mt-7 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
          <div><label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-200">New password</label><input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-300" /></div>
          <div><label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-slate-200">Confirm password</label><input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-300" /></div>
          <button className="w-full rounded-xl bg-cyan-300 px-4 py-3 font-semibold text-slate-950">Update password</button>
        </form>
      </div>
    </main>
  )
}
