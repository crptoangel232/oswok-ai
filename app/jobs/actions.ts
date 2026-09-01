'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function fail(path: string, message: string): never { redirect(`${path}?error=${encodeURIComponent(message)}`) }

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
  const { supabase } = await requireUser()
  const { data: jobId, error } = await (supabase.rpc as unknown as (functionName: string, args: Record<string, string | number | null>) => Promise<{ data: string | null; error: { message: string } | null }>)('create_my_job', { new_title: title, new_description: description, new_category: category || null, new_location: location || null, new_pay_amount: payAmount })
  if (error || !jobId) fail('/jobs/new', error?.message ?? 'Unable to create this job.')
  revalidatePath('/jobs'); revalidatePath('/dashboard'); redirect(`/jobs/${jobId}`)
}

export async function applyToJob(formData: FormData) {
  const jobId = String(formData.get('jobId') ?? '')
  const coverNote = String(formData.get('coverNote') ?? '').trim()
  if (!jobId) fail('/jobs', 'Job not found.')
  const { supabase } = await requireUser()
  const { data: applicationId, error } = await (supabase.rpc as unknown as (functionName: string, args: Record<string, string | null>) => Promise<{ data: string | null; error: { message: string } | null }>)('apply_to_job', { target_job_id: jobId, new_cover_note: coverNote || null })
  if (error || !applicationId) fail(`/jobs/${jobId}`, error?.message ?? 'Unable to apply for this job.')
  revalidatePath(`/jobs/${jobId}`); revalidatePath('/jobs'); revalidatePath('/dashboard'); redirect(`/jobs/${jobId}?applied=1`)
}

export async function updateApplicationStatus(formData: FormData) {
  const applicationId = String(formData.get('applicationId') ?? '')
  const jobId = String(formData.get('jobId') ?? '')
  const status = String(formData.get('status') ?? '')
  if (!applicationId || !jobId) fail('/jobs', 'Application not found.')
  if (!['pending', 'accepted', 'rejected'].includes(status)) fail(`/jobs/${jobId}/manage`, 'Invalid application status.')
  const { supabase } = await requireUser()
  const { error } = await (supabase.rpc as unknown as (functionName: string, args: Record<string, string>) => Promise<{ data: boolean | null; error: { message: string } | null }>)('update_my_job_application', { target_application_id: applicationId, new_status: status })
  if (error) fail(`/jobs/${jobId}/manage`, error.message)
  revalidatePath(`/jobs/${jobId}`); revalidatePath(`/jobs/${jobId}/manage`); revalidatePath('/dashboard')
  redirect(`/jobs/${jobId}/manage?updated=1`)
}

export async function transitionJobStatus(formData: FormData) {
  const jobId = String(formData.get('jobId') ?? '')
  const status = String(formData.get('status') ?? '')
  if (!jobId) fail('/jobs', 'Job not found.')
  if (!status) fail(`/jobs/${jobId}/manage`, 'Choose a job status.')
  const { supabase } = await requireUser()
  const { error } = await (supabase.rpc as unknown as (functionName: string, args: Record<string, string>) => Promise<{ data: string | null; error: { message: string } | null }>)('transition_my_job_status', { target_job_id: jobId, new_status: status })
  if (error) fail(`/jobs/${jobId}/manage`, error.message)
  revalidatePath(`/jobs/${jobId}`); revalidatePath(`/jobs/${jobId}/manage`); revalidatePath('/jobs'); revalidatePath('/dashboard'); revalidatePath('/matches')
  redirect(`/jobs/${jobId}/manage?updated=1`)
}
