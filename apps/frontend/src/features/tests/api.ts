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

export type TestItem = {
  id: string
  classroomId?: string | null
  targetLearnerId?: string | null
  title: string
  description: string | null
  maxScore: string
  startsAt: string | null
  endsAt: string | null
  canStart: boolean
  attempt: {
    testId: string
    status: string
    startedAt: string
    submittedAt: string | null
    score: string | null
  } | null
}

type ActorType = 'student' | 'parent'

export type TeacherTestItem = {
  id: string
  title: string
  description: string | null
  status: string
  classroomId: string | null
  classroomName: string | null
  classroomGrade: string | null
  questionCountTarget: number
  createdAt: string
}

export type TeacherTestAttemptItem = {
  assignmentId: string
  learnerId: string
  childName: string
  childEmail: string
  assignmentStatus: string
  attemptId: string | null
  attemptStatus: string | null
  startedAt: string | null
  submittedAt: string | null
  score: string | null
}

export type PublicTestInfo = {
  id: string
  title: string
  description: string | null
  status: string
  startsAt: string | null
  endsAt: string | null
  classroomName: string | null
}

export async function listTests(payload: {
  workspaceId: string
  learnerId: string
  actorType: ActorType
}): Promise<TestItem[]> {
  const query = new URLSearchParams(payload).toString()
  const response = await fetch(`${API_BASE}/api/tests?${query}`, {
    credentials: 'include',
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || 'Failed to load tests')
  }
  const data = (await response.json()) as { tests: TestItem[] }
  return data.tests
}

export async function startTest(payload: {
  testId: string
  workspaceId: string
  learnerId: string
  actorType: ActorType
}): Promise<void> {
  const csrfToken = await getCsrfToken()
  const response = await fetch(`${API_BASE}/api/tests/${payload.testId}/start`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
    },
    body: JSON.stringify({
      workspaceId: payload.workspaceId,
      learnerId: payload.learnerId,
      actorType: payload.actorType,
    }),
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || 'Failed to start test')
  }
}

export async function submitTest(payload: {
  testId: string
  workspaceId: string
  learnerId: string
  actorType: ActorType
  score?: number
}): Promise<void> {
  const csrfToken = await getCsrfToken()
  const response = await fetch(`${API_BASE}/api/tests/${payload.testId}/submit`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
    },
    body: JSON.stringify({
      workspaceId: payload.workspaceId,
      learnerId: payload.learnerId,
      actorType: payload.actorType,
      score: payload.score,
    }),
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || 'Failed to submit test')
  }
}

export async function createTest(payload: {
  workspaceId: string
  classroomId: string
  title: string
  description?: string
  maxScore?: number
  startsAt?: string
  endsAt?: string
}): Promise<{
  id: string
  workspaceId: string
  classroomId: string | null
  targetLearnerId: string | null
  title: string
  description: string | null
  maxScore: string
  startsAt: string | null
  endsAt: string | null
}> {
  const csrfToken = await getCsrfToken()
  const response = await fetch(`${API_BASE}/api/tests/create`, {
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
    throw new Error(text || 'Failed to create test')
  }
  const data = (await response.json()) as {
    test: {
      id: string
      workspaceId: string
      classroomId: string | null
      targetLearnerId: string | null
      title: string
      description: string | null
      maxScore: string
      startsAt: string | null
      endsAt: string | null
    }
  }
  return data.test
}

export async function listTeacherTests(workspaceId: string): Promise<TeacherTestItem[]> {
  const query = new URLSearchParams({ workspaceId }).toString()
  const response = await fetch(`${API_BASE}/api/tests/teacher?${query}`, {
    credentials: 'include',
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || 'Failed to load teacher tests')
  }
  const data = (await response.json()) as { tests: TeacherTestItem[] }
  return data.tests
}

export async function publishTest(payload: {
  testId: string
  workspaceId: string
}): Promise<{ assignedStudents: number }> {
  const csrfToken = await getCsrfToken()
  const response = await fetch(`${API_BASE}/api/tests/${payload.testId}/publish`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
    },
    body: JSON.stringify({ workspaceId: payload.workspaceId }),
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || 'Failed to publish test')
  }
  const data = (await response.json()) as {
    assignmentSummary?: { assignedStudents?: number }
  }
  return { assignedStudents: data.assignmentSummary?.assignedStudents ?? 0 }
}

export async function getTeacherTestAttempts(payload: {
  workspaceId: string
  testId: string
}): Promise<{
  test: {
    id: string
    title: string
    status: string
    classroomId: string | null
    classroomName: string | null
  }
  attempts: TeacherTestAttemptItem[]
}> {
  const query = new URLSearchParams({ workspaceId: payload.workspaceId }).toString()
  const response = await fetch(`${API_BASE}/api/tests/${payload.testId}/attempts?${query}`, {
    credentials: 'include',
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || 'Failed to load test attempts')
  }
  return (await response.json()) as {
    test: {
      id: string
      title: string
      status: string
      classroomId: string | null
      classroomName: string | null
    }
    attempts: TeacherTestAttemptItem[]
  }
}

export async function getPublicTest(testId: string): Promise<PublicTestInfo> {
  const response = await fetch(`${API_BASE}/api/tests/public/${testId}`)
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || 'Failed to load test')
  }
  const data = (await response.json()) as { test: PublicTestInfo }
  return data.test
}

export async function startPublicTest(payload: {
  testId: string
  childName: string
}): Promise<{
  id: string
  status: string
  childName: string
}> {
  const csrfToken = await getCsrfToken()
  const response = await fetch(`${API_BASE}/api/tests/public/${payload.testId}/start`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
    },
    body: JSON.stringify({ childName: payload.childName }),
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || 'Failed to start test')
  }
  const data = (await response.json()) as {
    attempt: { id: string; status: string; childName: string }
  }
  return data.attempt
}

export async function submitPublicTest(payload: {
  testId: string
  attemptId: string
  score?: number
}): Promise<void> {
  const csrfToken = await getCsrfToken()
  const response = await fetch(`${API_BASE}/api/tests/public/${payload.testId}/submit`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
    },
    body: JSON.stringify({
      attemptId: payload.attemptId,
      score: payload.score,
    }),
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || 'Failed to submit test')
  }
}
