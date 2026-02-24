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

export type ClassroomItem = {
  id: string
  name: string
  grade: string
  createdAt: string
  activeStudentCount: number
}

export type WorkspaceStudent = {
  learnerId: string
  displayName: string
  email: string
}

export type ClassroomStudent = WorkspaceStudent & {
  status: string
}

export async function listClassrooms(workspaceId: string): Promise<ClassroomItem[]> {
  const query = new URLSearchParams({ workspaceId }).toString()
  const response = await fetch(`${API_BASE}/api/classrooms?${query}`, {
    credentials: 'include',
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || 'Failed to load classrooms')
  }
  const data = (await response.json()) as { classrooms: ClassroomItem[] }
  return data.classrooms
}

export async function createClassroom(payload: {
  workspaceId: string
  name: string
  grade: string
}): Promise<ClassroomItem> {
  const csrfToken = await getCsrfToken()
  const response = await fetch(`${API_BASE}/api/classrooms/create`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
    },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || 'Failed to create classroom')
  }
  const data = (await response.json()) as { classroom: ClassroomItem }
  return data.classroom
}

export async function listWorkspaceStudents(workspaceId: string): Promise<WorkspaceStudent[]> {
  const query = new URLSearchParams({ workspaceId }).toString()
  const response = await fetch(`${API_BASE}/api/classrooms/workspace-students?${query}`, {
    credentials: 'include',
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || 'Failed to load workspace students')
  }
  const data = (await response.json()) as { students: WorkspaceStudent[] }
  return data.students
}

export async function listClassroomStudents(payload: {
  workspaceId: string
  classroomId: string
}): Promise<ClassroomStudent[]> {
  const query = new URLSearchParams({ workspaceId: payload.workspaceId }).toString()
  const response = await fetch(
    `${API_BASE}/api/classrooms/${payload.classroomId}/students?${query}`,
    {
      credentials: 'include',
    },
  )
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || 'Failed to load classroom students')
  }
  const data = (await response.json()) as { students: ClassroomStudent[] }
  return data.students
}

export async function assignStudentToClassroom(payload: {
  workspaceId: string
  classroomId: string
  learnerId: string
}): Promise<void> {
  const csrfToken = await getCsrfToken()
  const response = await fetch(`${API_BASE}/api/classrooms/${payload.classroomId}/students`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
    },
    body: JSON.stringify({
      workspaceId: payload.workspaceId,
      learnerId: payload.learnerId,
    }),
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || 'Failed to add student to classroom')
  }
}
