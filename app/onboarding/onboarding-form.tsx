'use client'

import { useState } from 'react'
import { completeOnboarding } from './actions'

type Role = 'worker' | 'employer'

export default function OnboardingForm({ defaultName, initialRole = 'worker' }: { defaultName: string; initialRole?: Role }) {
  const [role, setRole] = useState<Role>(initialRole)

  return (
    <form action={completeOnboarding} className="space-y-5 rounded-2xl border border-white/10 bg-white/5 p-6">
      <div>
        <p className="mb-3 text-sm font-medium">Choose your Oswok account</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={() => setRole('worker')} className={`rounded-xl border p-4 text-left ${role === 'worker' ? 'border-cyan-300 bg-cyan-300/10' : 'border-white/10 bg-slate-900'}`}>
            <span className="block text-xs uppercase tracking-wide text-cyan-300">Worker</span>
            <span className="mt-1 block font-semibold">I want to find work</span>
            <span className="mt-1 block text-xs text-slate-400">Browse jobs and apply.</span>
          </button>
          <button type="button" onClick={() => setRole('employer')} className={`rounded-xl border p-4 text-left ${role === 'employer' ? 'border-cyan-300 bg-cyan-300/10' : 'border-white/10 bg-slate-900'}`}>
            <span className="block text-xs uppercase tracking-wide text-cyan-300">Employer</span>
            <span className="mt-1 block font-semibold">I want to hire people</span>
            <span className="mt-1 block text-xs text-slate-400">Post jobs and hire workers.</span>
          </button>
        </div>
        <input type="hidden" name="role" value={role} />
      </div>

      <div>
        <label htmlFor="fullName" className="mb-2 block text-sm font-medium">Full name</label>
        <input id="fullName" name="fullName" defaultValue={defaultName} required className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3" />
      </div>

      <div>
        <label htmlFor="phone" className="mb-2 block text-sm font-medium">Phone number</label>
        <input id="phone" name="phone" type="tel" placeholder="+232 ..." className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3" />
      </div>

      <div>
        <label htmlFor="location" className="mb-2 block text-sm font-medium">Location</label>
        <input id="location" name="location" required placeholder="Freetown, Bo, Kenema..." className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3" />
      </div>

      {role === 'employer' ? (
        <>
          <div>
            <label htmlFor="organisationName" className="mb-2 block text-sm font-medium">Business or organisation name</label>
            <input id="organisationName" name="organisationName" required className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3" />
          </div>
          <div>
            <label htmlFor="organisationType" className="mb-2 block text-sm font-medium">Organisation type</label>
            <input id="organisationType" name="organisationType" placeholder="Business, NGO, individual, etc." className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3" />
          </div>
        </>
      ) : null}

      <button type="submit" className="w-full rounded-xl bg-cyan-300 px-4 py-3 font-semibold text-slate-950">Continue as {role}</button>
    </form>
  )
}
