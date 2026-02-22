import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchTeacherProfile } from './api'
import {
  getAuthSession,
  signInWithEmailCredential,
  signInWithSocial,
  signInWithUsernameCredential,
  signUpWithEmailCredential,
} from './session'
import { appShellClass } from '../../ui/layout'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'

type CredentialsMode = 'email' | 'username'

export function SignInPage() {
  const navigate = useNavigate()
  const [checkingSession, setCheckingSession] = useState(true)
  const [socialLoading, setSocialLoading] = useState<null | 'github' | 'google'>(null)
  const [submittingCredential, setSubmittingCredential] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [credentialsMode, setCredentialsMode] = useState<CredentialsMode>('email')
  const [creatingAccount, setCreatingAccount] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    getAuthSession()
      .then(async (session) => {
        if (!session) return

        const profile = await fetchTeacherProfile()
        navigate(profile ? '/dashboard' : '/onboarding', { replace: true })
      })
      .catch(() => {
        setError('Could not verify existing sign in.')
      })
      .finally(() => {
        setCheckingSession(false)
      })
  }, [navigate])

  async function continueAfterAuth() {
    const profile = await fetchTeacherProfile()
    navigate(profile ? '/dashboard' : '/onboarding', { replace: true })
  }

  async function handleSocial(provider: 'github' | 'google') {
    setError(null)
    setSocialLoading(provider)
    try {
      await signInWithSocial(provider)
    } catch (e) {
      setError(e instanceof Error ? e.message : `Could not start ${provider} sign in.`)
      setSocialLoading(null)
    }
  }

  async function handleCredentialSubmit() {
    setError(null)
    if (!password.trim()) {
      setError('Password is required.')
      return
    }

    setSubmittingCredential(true)
    try {
      if (creatingAccount) {
        if (!name.trim() || !email.trim()) {
          throw new Error('Name and email are required to create an account.')
        }
        await signUpWithEmailCredential({
          name,
          email,
          password,
          username: username.trim() || undefined,
        })
      } else if (credentialsMode === 'email') {
        if (!email.trim()) throw new Error('Email is required.')
        await signInWithEmailCredential({ email, password })
      } else {
        if (!username.trim()) throw new Error('Username is required.')
        await signInWithUsernameCredential({ username, password })
      }

      await continueAfterAuth()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Credential authentication failed.')
    } finally {
      setSubmittingCredential(false)
    }
  }

  return (
    <div className={appShellClass()}>
      <main className="mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-10">
        <Card className="mx-auto w-full max-w-xl">
          <CardHeader>
            <p className="font-bold tracking-wide text-cyan-800">Teacher Sign In</p>
            <CardTitle className="mt-1">Welcome Back</CardTitle>
            <CardDescription className="mt-2">
              Sign in with Google/GitHub or use credentials (email/password or username/password).
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid gap-3">
              <Button
                type="button"
                onClick={() => void handleSocial('google')}
                disabled={checkingSession || socialLoading !== null || submittingCredential}
              >
                {socialLoading === 'google' ? 'Redirecting...' : 'Continue With Google'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => void handleSocial('github')}
                disabled={checkingSession || socialLoading !== null || submittingCredential}
              >
                {socialLoading === 'github' ? 'Redirecting...' : 'Continue With GitHub'}
              </Button>
            </div>

            <div className="my-4 h-px bg-sky-100" />

            <div className="grid gap-3">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCreatingAccount(false)
                    setCredentialsMode('email')
                  }}
                  className={`rounded-lg px-3 py-1.5 text-sm font-bold ${
                    !creatingAccount && credentialsMode === 'email'
                      ? 'bg-cyan-100 text-cyan-900'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  Email + Password
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCreatingAccount(false)
                    setCredentialsMode('username')
                  }}
                  className={`rounded-lg px-3 py-1.5 text-sm font-bold ${
                    !creatingAccount && credentialsMode === 'username'
                      ? 'bg-cyan-100 text-cyan-900'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  Username + Password
                </button>
                <button
                  type="button"
                  onClick={() => setCreatingAccount((prev) => !prev)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-bold ${
                    creatingAccount ? 'bg-cyan-100 text-cyan-900' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {creatingAccount ? 'Creating Account' : 'Create Account'}
                </button>
              </div>

              {creatingAccount ? (
                <Input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Full name"
                  autoComplete="name"
                />
              ) : null}

              {creatingAccount || credentialsMode === 'username' ? (
                <Input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Username"
                  autoComplete="username"
                />
              ) : null}

              {creatingAccount || credentialsMode === 'email' ? (
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="teacher@example.com"
                  autoComplete="email"
                />
              ) : null}

              <div className="grid gap-2">
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Password"
                    autoComplete={creatingAccount ? 'new-password' : 'current-password'}
                    className="pr-24"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-bold text-cyan-800 hover:bg-cyan-100"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <Button
                type="button"
                onClick={() => void handleCredentialSubmit()}
                disabled={checkingSession || socialLoading !== null || submittingCredential}
              >
                {submittingCredential
                  ? 'Please wait...'
                  : creatingAccount
                    ? 'Create Account'
                    : 'Sign In'}
              </Button>
            </div>

            {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}

            <div className="mt-4 text-sm text-slate-600">
              First time here? You will continue to onboarding after sign-in.
            </div>
            <Link className="mt-3 inline-flex font-bold text-cyan-800 underline" to="/">
              Back to landing
            </Link>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
