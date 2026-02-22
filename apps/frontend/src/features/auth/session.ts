import { resolveApiBase } from '../../lib/api-base'

const API_BASE = resolveApiBase()

export type AuthSession = {
  user: {
    id: string
    email: string
    name?: string | null
  }
}

type AuthSessionResponse = {
  user: AuthSession['user']
} | null

type BetterAuthErrorResponse = {
  message?: string
  error?: string
}

async function parseErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const data = (await response.json()) as BetterAuthErrorResponse
    return data.message || data.error || fallback
  } catch {
    return fallback
  }
}

export async function getAuthSession(): Promise<AuthSession | null> {
  const response = await fetch(`${API_BASE}/api/auth/get-session`, {
    method: 'GET',
    credentials: 'include',
  })

  if (response.status === 401) return null
  if (!response.ok) {
    throw new Error('Failed to resolve auth session')
  }

  const data = (await response.json()) as AuthSessionResponse
  if (!data?.user?.id || !data.user.email) return null

  return { user: data.user }
}

export async function signInWithSocial(provider: 'github' | 'google'): Promise<void> {
  const callbackURL =
    typeof window !== 'undefined'
      ? `${window.location.origin}/signin`
      : 'http://localhost:3000/signin'

  const response = await fetch(`${API_BASE}/api/auth/sign-in/social`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      provider,
      callbackURL,
    }),
  })

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, `Failed to start ${provider} sign in`))
  }

  const data = (await response.json()) as { url?: string; redirect?: boolean }
  if (!data.url) {
    throw new Error('Missing sign-in redirect URL')
  }

  window.location.assign(data.url)
}

export async function signInWithEmailCredential(input: {
  email: string
  password: string
}): Promise<void> {
  const response = await fetch(`${API_BASE}/api/auth/sign-in/email`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: input.email.trim().toLowerCase(),
      password: input.password,
    }),
  })

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, 'Email sign in failed'))
  }
}

export async function signInWithUsernameCredential(input: {
  username: string
  password: string
}): Promise<void> {
  const response = await fetch(`${API_BASE}/api/auth/sign-in/username`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: input.username.trim(),
      password: input.password,
    }),
  })

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, 'Username sign in failed'))
  }
}

export async function signUpWithEmailCredential(input: {
  name: string
  email: string
  password: string
  username?: string
}): Promise<void> {
  const response = await fetch(`${API_BASE}/api/auth/sign-up/email`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      password: input.password,
      ...(input.username?.trim()
        ? {
            username: input.username.trim(),
            displayUsername: input.username.trim(),
          }
        : {}),
    }),
  })

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, 'Account creation failed'))
  }
}

export async function signOut(): Promise<void> {
  const response = await fetch(`${API_BASE}/api/auth/sign-out`, {
    method: 'POST',
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('Failed to sign out')
  }
}
