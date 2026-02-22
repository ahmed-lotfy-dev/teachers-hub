import type { TeacherSession } from './types'

const SESSION_KEY = 'teachers_hub_session'

export function buildUserIdFromEmail(email: string): string {
  const normalized = email.trim().toLowerCase()
  return `teacher_${normalized.replace(/[^a-z0-9]+/g, '_')}`
}

export function getSession(): TeacherSession | null {
  const raw = localStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as TeacherSession
    if (!parsed.userId || !parsed.email) return null
    return parsed
  } catch {
    return null
  }
}

export function setSession(session: TeacherSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY)
}
