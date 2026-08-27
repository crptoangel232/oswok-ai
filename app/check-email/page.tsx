import Link from 'next/link'

export default function CheckEmailPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-5 py-16 text-white">
      <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
        <p className="text-sm font-semibold text-cyan-300">OSWOK AI</p>
        <h1 className="mt-4 text-2xl font-bold">Check your email</h1>
        <p className="mt-3 text-slate-400">We sent a confirmation link. Confirm your email, then return to Oswok to finish onboarding.</p>
        <Link href="/login" className="mt-7 inline-block rounded-xl bg-white px-5 py-3 font-semibold text-slate-950">Back to sign in</Link>
      </div>
    </main>
  )
}
