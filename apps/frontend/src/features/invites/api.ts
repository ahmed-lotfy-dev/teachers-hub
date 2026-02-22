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

export type InviteDetails = {
  workspaceId: string
  studentName?: string | null
  expiresAt: string
  claimedAt?: string | null
}

export async function generateInvite(payload: {
  workspaceId: string
  studentName?: string
}): Promise<{ token: string; claimPath: string; expiresAt: string }> {
  const csrfToken = await getCsrfToken()
  const response = await fetch(`${API_BASE}/api/invites`, {
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
    throw new Error(text || 'Failed to generate invite')
  }

  const data = (await response.json()) as {
    invite: { token: string; claimPath: string; expiresAt: string }
  }
  return data.invite
}

export async function fetchInviteByToken(token: string): Promise<{
  valid: boolean
  reason?: string
  invite?: InviteDetails
}> {
  const response = await fetch(`${API_BASE}/api/invites/${token}`, {
    credentials: 'include',
  })

  if (!response.ok && response.status !== 404) {
    const text = await response.text()
    throw new Error(text || 'Failed to load invite')
  }
  return (await response.json()) as {
    valid: boolean
    reason?: string
    invite?: InviteDetails
  }
}

export async function claimInvite(
  token: string,
  payload: {
    email: string
    displayName: string
    actorType: 'student' | 'parent'
  },
): Promise<{
  result: {
    status: 'linked_existing' | 'created_new'
    learnerId: string
    workspaceId: string
    nextStepPath: string
  }
}> {
  const csrfToken = await getCsrfToken()
  const response = await fetch(`${API_BASE}/api/invites/${token}/claim`, {
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
    throw new Error(text || 'Failed to claim invite')
  }

  return (await response.json()) as {
    result: {
      status: 'linked_existing' | 'created_new'
      learnerId: string
      workspaceId: string
      nextStepPath: string
    }
  }
}
