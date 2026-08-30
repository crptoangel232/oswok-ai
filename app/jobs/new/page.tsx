import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createJob } from '../actions'

export default async function NewJobPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  if (!claimsData?.claims?.sub) redirect('/login')
  const { data: profile } = await supabase.rpc('get_my_profile').maybeSingle()
  if (!profile || profile.role !== 'employer') redirect('/dashboard')
  const params = await searchParams

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-white">
      <div className="mx-auto max-w-2xl">
        <Link href="/jobs" className="text-sm font-semibold text-cyan-300">← Back to jobs</Link>
        <h1 className="mt-4 text-3xl font-bold">Post a job</h1>
        <p className="mt-2 text-slate-400">Describe the work clearly so the right person can find it.</p>
        {params.error ? <div className="mt-5 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">{params.error}</div> : null}

        <form action={createJob} className="mt-7 space-y-5 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div>
            <label htmlFor="title" className="mb-2 block text-sm font-medium">Job title</label>
            <input id="title" name="title" required placeholder="e.g. Social media assistant" className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3" />
          </div>
          <div>
            <label htmlFor="description" className="mb-2 block text-sm font-medium">Description</label>
            <textarea id="description" name="description" required rows={6} placeholder="What needs to be done? Include important requirements and expected output." className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="category" className="mb-2 block text-sm font-medium">Category</label>
              <input id="category" name="category" placeholder="Marketing, cleaning, farming..." className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3" />
            </div>
            <div>
              <label htmlFor="location" className="mb-2 block text-sm font-medium">Location</label>
              <input id="location" name="location" placeholder="Freetown" className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3" />
            </div>
          </div>
          <div>
            <label htmlFor="payAmount" className="mb-2 block text-sm font-medium">Pay amount (SLE)</label>
            <input id="payAmount" name="payAmount" type="number" min="1" step="0.01" required placeholder="500" className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3" />
          </div>
          <button type="submit" className="w-full rounded-xl bg-cyan-300 px-4 py-3 font-semibold text-slate-950">Publish job</button>
        </form>
      </div>
    </main>
  )
}
