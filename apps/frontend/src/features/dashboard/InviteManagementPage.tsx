import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { appShellClass } from '../../ui/layout'
import { buildWhatsAppShareUrl } from './whatsapp'
import { generateInvite } from '../invites/api'
import { TeacherTopNav } from './TeacherTopNav'
import { WhatsAppInviteSection } from './components/WhatsAppInviteSection'
import { useProtectedTeacherProfile } from '../auth/queries'

export function InviteManagementPage() {
  const { isLoading, errorMessage, profile } = useProtectedTeacherProfile()

  const [studentName, setStudentName] = useState('')
  const [inviteToken, setInviteToken] = useState('')
  const [inviteExpiresAt, setInviteExpiresAt] = useState<string | null>(null)
  const [inviteMessage, setInviteMessage] = useState(
    'Hello! This is your teacher from Teachers Hub.\n\nPlease use this secure invite link to join class:',
  )
  const [shareNote, setShareNote] = useState<string | null>(null)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)

  const inviteLink = useMemo(() => {
    const origin =
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
    return inviteToken ? `${origin}/invite/${inviteToken}` : ''
  }, [inviteToken])

  const inviteExpiryLabel = useMemo(() => {
    if (!inviteExpiresAt) return null
    return new Date(inviteExpiresAt).toLocaleString()
  }, [inviteExpiresAt])

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
        studentName: studentName.trim() || undefined,
      })
      setInviteToken(created.token)
      setInviteExpiresAt(created.expiresAt)
      setShareNote('Invite link generated. You can copy or share it now.')
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Failed to generate invite link')
    } finally {
      setInviteLoading(false)
    }
  }

  async function copyInviteLink() {
    if (!inviteLink) {
      setShareNote('Generate an invite link first.')
      return
    }

    try {
      await navigator.clipboard.writeText(inviteLink)
      setShareNote('Invite link copied to clipboard.')
    } catch {
      setShareNote('Could not copy automatically. Please copy the link manually.')
    }
  }

  if (isLoading) {
    return (
      <div className={appShellClass()}>
        <TeacherTopNav title="Invite Management" />
        <main className="mx-auto w-full max-w-7xl px-4 py-8">
          <p className="font-semibold text-slate-700">Loading invites tab...</p>
        </main>
      </div>
    )
  }

  if (errorMessage || !profile) {
    return (
      <div className={appShellClass()}>
        <TeacherTopNav title="Invite Management" />
        <main className="mx-auto w-full max-w-7xl px-4 py-8">
          <p className="font-semibold text-red-700">{errorMessage ?? 'No profile found.'}</p>
          <Link className="mt-3 inline-flex font-bold text-cyan-800 underline" to="/onboarding">
            Go to onboarding
          </Link>
        </main>
      </div>
    )
  }

  return (
    <div className={appShellClass()}>
      <TeacherTopNav title="Invite Management" />

      <main className="mx-auto w-full max-w-7xl px-4 py-6">
        <section className="rounded-2xl border-2 border-amber-100 bg-amber-50/70 p-4 text-slate-800">
          <p className="text-sm font-semibold">Invite Scope</p>
          <p className="mt-1 text-sm">
            Invites are currently workspace-level. In Teachers Hub today, workspace is not the same
            as an individual class section.
          </p>
        </section>

        <WhatsAppInviteSection
          studentName={studentName}
          inviteMessage={inviteMessage}
          inviteLink={inviteLink}
          inviteExpiryLabel={inviteExpiryLabel}
          inviteLoading={inviteLoading}
          inviteError={inviteError}
          shareNote={shareNote}
          onStudentNameChange={setStudentName}
          onInviteMessageChange={setInviteMessage}
          onGenerateInvite={generateInviteLink}
          onShareWhatsApp={shareInviteOnWhatsApp}
          onCopyInvite={copyInviteLink}
        />
      </main>
    </div>
  )
}
