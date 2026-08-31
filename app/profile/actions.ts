'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function fail(message: string): never {
  redirect(`/profile?error=${encodeURIComponent(message)}`)
}

export async function updateWorkerProfile(formData: FormData) {
  const fullName = String(formData.get('fullName') ?? '').trim()
  const location = String(formData.get('location') ?? '').trim()
  const bio = String(formData.get('bio') ?? '').trim()
  const availability = String(formData.get('availability') ?? '').trim()
  const hourlyRate = Number(formData.get('hourlyRate') ?? 0)
  const experienceYears = Number(formData.get('experienceYears') ?? 0)
  const skillIds = [...new Set(formData.getAll('skillIds').map(String).filter(Boolean))]

  if (fullName.length < 2) fail('Enter your full name.')
  if (!Number.isFinite(hourlyRate) || hourlyRate < 0) fail('Enter a valid hourly rate.')
  if (!Number.isFinite(experienceYears) || experienceYears < 0) fail('Enter valid years of experience.')

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) redirect('/login?error=Your session has expired. Please sign in again.')

  const { data: profile } = await supabase.rpc('get_my_profile').maybeSingle()
  if (!profile) redirect('/onboarding')
  if (profile.role !== 'worker') fail('Only worker accounts can edit a worker profile.')

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ full_name: fullName, location: location || null, bio: bio || null, updated_at: new Date().toISOString() })
    .eq('id', userId)
  if (profileError) fail(profileError.message)

  const { error: workerError } = await supabase
    .from('worker_profiles')
    .upsert({ user_id: userId, availability: availability || null, hourly_rate: hourlyRate, experience_years: experienceYears, updated_at: new Date().toISOString() })
  if (workerError) fail(workerError.message)

  const { error: deleteSkillsError } = await supabase.from('worker_skills').delete().eq('worker_id', userId)
  if (deleteSkillsError) fail(deleteSkillsError.message)

  if (skillIds.length) {
    const { data: validSkills } = await supabase.from('skills').select('id').in('id', skillIds)
    const validSkillIds = (validSkills ?? []).map((skill) => skill.id)
    if (validSkillIds.length) {
      const { error: skillError } = await supabase.from('worker_skills').insert(validSkillIds.map((skillId) => ({ worker_id: userId, skill_id: skillId })))
      if (skillError) fail(skillError.message)
    }
  }

  revalidatePath('/profile')
  revalidatePath('/dashboard')
  revalidatePath('/jobs')
  redirect('/profile?saved=1')
}
