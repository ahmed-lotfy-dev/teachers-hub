import type { School } from '../auth/types'
import { resolveApiBase } from '../../lib/api-base'

const API_BASE = resolveApiBase()
let csrfTokenCache: string | null = null

async function getCsrfToken(): Promise<string> {
  if (csrfTokenCache) return csrfTokenCache

  const response = await fetch(`${API_BASE}/api/csrf`, {
    method: 'GET',
    credentials: 'include',
  })
  if (!response.ok) throw new Error('Failed to initialize security token')

  const data = (await response.json()) as { csrfToken?: string }
  if (!data.csrfToken) throw new Error('Missing security token')

  csrfTokenCache = data.csrfToken
  return data.csrfToken
}

export async function searchSchools(query: string): Promise<School[]> {
  const q = query.trim()
  const url = q
    ? `${API_BASE}/api/onboarding/schools?q=${encodeURIComponent(q)}`
    : `${API_BASE}/api/onboarding/schools`

  const response = await fetch(url, { credentials: 'include' })
  if (!response.ok) throw new Error('Failed to load schools')
  const data = (await response.json()) as { schools: School[] }
  return data.schools
}

export async function createSchool(payload: {
  name: string
}): Promise<School> {
  const csrfToken = await getCsrfToken()
  const response = await fetch(`${API_BASE}/api/onboarding/schools`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'Could not create school')
  }
  const data = (await response.json()) as { school: School }
  return data.school
}

export async function saveTeacherOnboarding(payload: {
  displayName: string
  gradeLevels: string[]
  schoolId?: string
}): Promise<void> {
  const csrfToken = await getCsrfToken()
  const response = await fetch(`${API_BASE}/api/onboarding/teacher`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'Failed onboarding')
  }
}
