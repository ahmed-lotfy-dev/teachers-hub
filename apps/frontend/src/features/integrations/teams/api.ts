import { resolveApiBase } from '../../../lib/api-base'

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

export type TeamsJoinedTeam = {
  id: string
  displayName: string
  description: string | null
}

export async function listJoinedTeams(payload: {
  workspaceId: string
  accessToken: string
}): Promise<TeamsJoinedTeam[]> {
  const csrfToken = await getCsrfToken()
  const response = await fetch(`${API_BASE}/api/integrations/teams/list`, {
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
    throw new Error(text || 'Failed to load Teams list')
  }

  const data = (await response.json()) as { teams: TeamsJoinedTeam[] }
  return data.teams
}

export async function importTeamsMembers(payload: {
  workspaceId: string
  teamId: string
  accessToken: string
  actorType?: 'student' | 'parent'
}): Promise<{
  importedMembers: number
  createdLearners: number
  linkedExistingLearners: number
  alreadyLinkedInWorkspace: number
  skippedMembers: number
}> {
  const csrfToken = await getCsrfToken()
  const response = await fetch(`${API_BASE}/api/integrations/teams/import`, {
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
    throw new Error(text || 'Failed to import Teams members')
  }

  const data = (await response.json()) as {
    result: {
      importedMembers: number
      createdLearners: number
      linkedExistingLearners: number
      alreadyLinkedInWorkspace: number
      skippedMembers: number
    }
  }

  return data.result
}
