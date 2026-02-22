import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchTeacherProfile } from '../auth/api'
import { clearSession, getSession } from '../auth/session'
import type { TeacherProfile } from '../auth/types'
import { appShellClass } from '../../ui/layout'
import { buildWhatsAppShareUrl } from './whatsapp'
import { generateInvite } from '../invites/api'

export function DashboardPage() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<TeacherProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [studentName, setStudentName] = useState('')
  const [inviteToken, setInviteToken] = useState('')
  const [inviteMessage, setInviteMessage] = useState(
    "Hello! This is your teacher from Teachers Hub.\n\nPlease use this secure invite link to join class:",
  )
  const [shareNote, setShareNote] = useState<string | null>(null)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const inviteLink = useMemo(() => {
    const origin =
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
    return inviteToken ? `${origin}/invite/${inviteToken}` : ''
  }, [inviteToken])

  useEffect(() => {
    const session = getSession()
    if (!session) {
      navigate('/signin')
      return
    }

    fetchTeacherProfile(session.userId)
      .then((data) => {
        if (!data) {
          navigate('/onboarding')
          return
        }
        setProfile(data)
      })
      .catch(() => {
        setError('Could not load dashboard data.')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [navigate])

  if (loading) {
    return (
      <div className={appShellClass()}>
        <main className="mx-auto w-full max-w-7xl px-4 py-8">
          <p className="font-semibold text-slate-700">Loading dashboard...</p>
        </main>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className={appShellClass()}>
        <main className="mx-auto w-full max-w-7xl px-4 py-8">
          <p className="font-semibold text-red-700">{error ?? 'No profile found.'}</p>
          <Link className="mt-3 inline-flex font-bold text-cyan-800 underline" to="/onboarding">
            Go to onboarding
          </Link>
        </main>
      </div>
    )
  }

  function shareInviteOnWhatsApp() {
    if (!inviteLink) {
      setShareNote('Generate an invite link first.')
      return
    }

    const targetName = studentName.trim() || 'your child'
    const message =
      `${inviteMessage.trim()}\n` +
      `${inviteLink}\n\n` +
      `Student: ${targetName}\n` +
      `If you have any issue opening the link, please reply here.`

    const shareUrl = buildWhatsAppShareUrl(message)
    window.open(shareUrl, '_blank', 'noopener,noreferrer')
    setShareNote('Opened WhatsApp share. Please send from your own account.')
  }

  async function generateInviteLink() {
    if (!profile) return

    setInviteError(null)
    setShareNote(null)
    setInviteLoading(true)
    try {
      const created = await generateInvite({
        workspaceId: profile.workspaceId,
        teacherUserId: profile.userId,
        studentName: studentName.trim() || undefined,
      })
      setInviteToken(created.token)
    } catch (error) {
      setInviteError(
        error instanceof Error ? error.message : 'Failed to generate invite link',
      )
    } finally {
      setInviteLoading(false)
    }
  }

  return (
    <div className={appShellClass()}>
      <header className="border-b border-sky-100/90 bg-white/85">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3">
          <h1 className="text-xl font-extrabold text-slate-900">Teacher Dashboard</h1>
          <button
            type="button"
            onClick={() => {
              clearSession()
              navigate('/signin')
            }}
            className="inline-flex min-h-11 cursor-pointer items-center rounded-xl border-2 border-sky-200 bg-white px-4 py-2 font-bold"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6">
        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border-2 border-sky-100 bg-white/90 p-4">
            <p className="text-sm font-semibold text-slate-500">Teacher</p>
            <h2 className="mt-1 text-xl font-black text-slate-900">{profile.displayName}</h2>
            <p className="mt-1 text-slate-700">{profile.userId}</p>
          </article>
          <article className="rounded-2xl border-2 border-sky-100 bg-white/90 p-4">
            <p className="text-sm font-semibold text-slate-500">Workspace</p>
            <h2 className="mt-1 text-xl font-black text-slate-900">{profile.workspaceId}</h2>
            <p className="mt-1 text-slate-700">Type: Teacher Workspace</p>
          </article>
          <article className="rounded-2xl border-2 border-sky-100 bg-white/90 p-4">
            <p className="text-sm font-semibold text-slate-500">School Data</p>
            <h2 className="mt-1 text-xl font-black text-slate-900">
              {profile.schoolName ?? 'No school selected'}
            </h2>
            <p className="mt-1 text-slate-700">Can be used for future school mode</p>
          </article>
        </section>

        <section className="mt-5 rounded-2xl border-2 border-sky-100 bg-white/90 p-4">
          <h3 className="text-lg font-extrabold text-slate-900">Your Grade Coverage</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {profile.gradeLevels.map((grade) => (
              <span
                key={grade}
                className="inline-flex min-h-9 items-center rounded-lg bg-cyan-100 px-3 text-sm font-bold text-cyan-900"
              >
                {grade}
              </span>
            ))}
          </div>
        </section>

        <section className="mt-5 grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border-2 border-sky-100 bg-white/90 p-4">
            <h4 className="font-extrabold text-slate-900">Classes</h4>
            <p className="mt-2 text-slate-700">Create and manage your classes.</p>
          </article>
          <article className="rounded-2xl border-2 border-sky-100 bg-white/90 p-4">
            <h4 className="font-extrabold text-slate-900">Live Tests</h4>
            <p className="mt-2 text-slate-700">
              Run WebSocket assessments with real-time participation.
            </p>
          </article>
          <article className="rounded-2xl border-2 border-sky-100 bg-white/90 p-4">
            <h4 className="font-extrabold text-slate-900">Progress</h4>
            <p className="mt-2 text-slate-700">
              Track student growth and share outcomes with parents.
            </p>
          </article>
        </section>

        <section className="mt-5 rounded-2xl border-2 border-sky-100 bg-white/90 p-4">
          <h3 className="text-lg font-extrabold text-slate-900">
            Share Invite On WhatsApp
          </h3>
          <p className="mt-2 text-slate-700">
            Invite link is generated automatically. Edit your message, then share from
            your own WhatsApp account.
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="font-semibold text-slate-700">Student Name (optional)</span>
              <input
                type="text"
                value={studentName}
                onChange={(event) => setStudentName(event.target.value)}
                placeholder="Mariam Ahmed"
                className="min-h-11 rounded-xl border-2 border-sky-200 bg-white px-3 outline-none focus:border-cyan-500"
              />
            </label>

            <label className="grid gap-2 md:col-span-2">
              <span className="font-semibold text-slate-700">Invite Message</span>
              <textarea
                value={inviteMessage}
                onChange={(event) => setInviteMessage(event.target.value)}
                rows={4}
                className="w-full rounded-xl border-2 border-sky-200 bg-white px-3 py-2 outline-none focus:border-cyan-500"
              />
            </label>

            <div className="grid gap-2 md:col-span-2">
              <span className="font-semibold text-slate-700">Generated Invite Link</span>
              <div className="rounded-xl border-2 border-sky-200 bg-slate-50 px-3 py-2 break-all text-sm text-slate-800">
                {inviteLink || 'No invite generated yet.'}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={generateInviteLink}
              disabled={inviteLoading}
              className="inline-flex min-h-11 cursor-pointer items-center rounded-xl border-2 border-sky-200 bg-white px-4 py-2 text-base font-bold text-slate-900 hover:-translate-y-0.5 transition-transform duration-200"
            >
              {inviteLoading ? 'Generating...' : 'Generate New Link'}
            </button>
            <button
              type="button"
              onClick={shareInviteOnWhatsApp}
              className="inline-flex min-h-11 cursor-pointer items-center rounded-xl bg-linear-to-br from-emerald-300 to-lime-300 px-4 py-2 text-base font-extrabold text-slate-900 shadow-[0_12px_24px_rgba(23,50,77,0.15)] transition-transform duration-200 hover:-translate-y-0.5"
            >
              Share On WhatsApp
            </button>
          </div>

          {inviteError ? (
            <p className="mt-3 text-sm font-semibold text-red-700">{inviteError}</p>
          ) : null}
          {shareNote ? (
            <p className="mt-3 text-sm font-semibold text-cyan-900">{shareNote}</p>
          ) : null}
        </section>
      </main>
    </div>
  )
}
