'use client'

import { useState } from 'react'
import { completeOnboarding } from './actions'

export default function OnboardingForm({ defaultName }: { defaultName: string }) {
  const [role, setRole] = useState<'worker' | 'employer'>('worker')

  return (
    <form action={completeOnboarding} className="space-y-5 rounded-2xl border border-white/10 bg-white/5 p-6">
      <div>
        <label htmlFor="role" className="mb-2 block text-sm font-medium">I want to</label>
        <select id="role" name="role" value={role} onChange={(e) => setRole(e.target.value as 'worker' | 'employer')} className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3">
          <option value="worker">Find work</option>
          <option value="employer">Hire people</option>
        </select>
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

      <button type="submit" className="w-full rounded-xl bg-cyan-300 px-4 py-3 font-semibold text-slate-950">Continue to Oswok</button>
    </form>
  )
}
