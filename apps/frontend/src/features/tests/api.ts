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
