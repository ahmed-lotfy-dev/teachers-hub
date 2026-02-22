import type { TeacherProfile } from './types'
import { resolveApiBase } from '../../lib/api-base'

const API_BASE = resolveApiBase()

export async function fetchTeacherProfile(
  userId: string,
): Promise<TeacherProfile | null> {
  const response = await fetch(`${API_BASE}/api/onboarding/teacher/${userId}`)
  if (!response.ok) throw new Error('Failed to load profile')
  const data = (await response.json()) as { profile: TeacherProfile | null }
  return data.profile
}
