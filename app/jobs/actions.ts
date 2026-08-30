'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`)
}

async function requireUser() {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) redirect('/login?error=Your session has expired. Please sign in again.')
  return { supabase, userId }
}

export async function createJob(formData: FormData) {
  const title = String(formData.get('title') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim()
  const category = String(formData.get('category') ?? '').trim()
  const location = String(formData.get('location') ?? '').trim()
  const payAmount = Number(formData.get('payAmount') ?? 0)

  if (title.length < 3) fail('/jobs/new', 'Enter a job title.')
  if (description.length < 20) fail('/jobs/new', 'Give the job a useful description of at least 20 characters.')
  if (!Number.isFinite(payAmount) || payAmount <= 0) fail('/jobs/new', 'Enter a valid positive pay amount.')

  const { supabase, userId } = await requireUser()
  const { data: profile } = await supabase.rpc('get_my_profile').maybeSingle()
  if (!profile || profile.role !== 'employer') fail('/jobs/new', 'Only employer accounts can post jobs.')

  const { data: job, error } = await supabase
    .from('jobs')
    .insert({
      employer_id: userId,
      title,
      description,
      category: category || null,
      location: location || null,
      pay_amount: payAmount,
      pay_currency: 'SLE',
      status: 'open',
    })
    .select('id')
    .single()

  if (error || !job) fail('/jobs/new', error?.message ?? 'Unable to create this job.')

  revalidatePath('/jobs')
  revalidatePath('/dashboard')
  redirect(`/jobs/${job.id}`)
}

export async function applyToJob(formData: FormData) {
  const jobId = String(formData.get('jobId') ?? '')
  const coverNote = String(formData.get('coverNote') ?? '').trim()
  if (!jobId) fail('/jobs', 'Job not found.')

  const { supabase, userId } = await requireUser()
  const { data: profile } = await supabase.rpc('get_my_profile').maybeSingle()
  if (!profile || profile.role !== 'worker') fail(`/jobs/${jobId}`, 'Only worker accounts can apply for jobs.')

  const { error } = await supabase.from('applications').insert({
    job_id: jobId,
    worker_id: userId,
    cover_note: coverNote || null,
    status: 'pending',
  })

  if (error) {
    if (error.code === '23505') fail(`/jobs/${jobId}`, 'You have already applied for this job.')
    fail(`/jobs/${jobId}`, error.message)
  }

  revalidatePath(`/jobs/${jobId}`)
  revalidatePath('/jobs')
  redirect(`/jobs/${jobId}?applied=1`)
}
