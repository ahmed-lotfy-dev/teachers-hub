import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchTeacherProfile } from '../auth/api'
import { getAuthSession, signOut } from '../auth/session'
import type { TeacherProfile } from '../auth/types'
import { appShellClass } from '../../ui/layout'
import { buildWhatsAppShareUrl } from './whatsapp'
import { generateInvite } from '../invites/api'
import { createTest } from '../tests/api'
import {
  importTeamsMembers,
  listJoinedTeams,
  type TeamsJoinedTeam,
} from '../integrations/teams/api'

type RosterStudent = {
  id: string
  name: string
  email: string
  status: 'pending' | 'invited' | 'claimed'
}

type Classroom = {
  id: string
  name: string
  grade: string
  students: RosterStudent[]
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function DashboardPage() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<TeacherProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [studentName, setStudentName] = useState('')
  const [inviteToken, setInviteToken] = useState('')
  const [inviteExpiresAt, setInviteExpiresAt] = useState<string | null>(null)
  const [inviteMessage, setInviteMessage] = useState(
    "Hello! This is your teacher from Teachers Hub.\n\nPlease use this secure invite link to join class:",
  )
  const [shareNote, setShareNote] = useState<string | null>(null)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [classes, setClasses] = useState<Classroom[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [classNameInput, setClassNameInput] = useState('')
  const [classGradeInput, setClassGradeInput] = useState('')
  const [studentNameInput, setStudentNameInput] = useState('')
  const [studentEmailInput, setStudentEmailInput] = useState('')
  const [csvInput, setCsvInput] = useState('')
  const [rosterError, setRosterError] = useState<string | null>(null)
  const [rosterNote, setRosterNote] = useState<string | null>(null)
  const [testTitle, setTestTitle] = useState('')
  const [testDescription, setTestDescription] = useState('')
  const [testMaxScore, setTestMaxScore] = useState('100')
  const [testTargetLearnerId, setTestTargetLearnerId] = useState('')
  const [testCreateLoading, setTestCreateLoading] = useState(false)
  const [testCreateError, setTestCreateError] = useState<string | null>(null)
  const [testCreateNote, setTestCreateNote] = useState<string | null>(null)
  const [teamsAccessToken, setTeamsAccessToken] = useState('')
  const [teamsList, setTeamsList] = useState<TeamsJoinedTeam[]>([])
  const [selectedTeamsId, setSelectedTeamsId] = useState('')
  const [teamsLoading, setTeamsLoading] = useState(false)
  const [teamsImportLoading, setTeamsImportLoading] = useState(false)
  const [teamsError, setTeamsError] = useState<string | null>(null)
  const [teamsNote, setTeamsNote] = useState<string | null>(null)
  const inviteLink = useMemo(() => {
    const origin =
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
    return inviteToken ? `${origin}/invite/${inviteToken}` : ''
  }, [inviteToken])
  const inviteExpiryLabel = useMemo(() => {
    if (!inviteExpiresAt) return null
    return new Date(inviteExpiresAt).toLocaleString()
  }, [inviteExpiresAt])
  const selectedClass = useMemo(
    () => classes.find((item) => item.id === selectedClassId) ?? null,
    [classes, selectedClassId],
  )

  useEffect(() => {
    getAuthSession()
      .then(async (session) => {
        if (!session) {
          navigate('/signin', { replace: true })
          return
        }

        const data = await fetchTeacherProfile()
        if (!data) {
          navigate('/onboarding', { replace: true })
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

  useEffect(() => {
    if (profile && classes.length === 0) {
      const defaultGrade = profile.gradeLevels[0] ?? 'Grade 1'
      const initialClass: Classroom = {
        id: crypto.randomUUID(),
        name: `${defaultGrade} - A`,
        grade: defaultGrade,
        students: [],
      }
      setClasses([initialClass])
      setSelectedClassId(initialClass.id)
      setClassGradeInput(defaultGrade)
    }
  }, [profile, classes.length])

  async function handleSignOut() {
    try {
      await signOut()
    } catch {
      // Even when sign-out API fails, navigate to signin to prevent stale UI state.
    } finally {
      navigate('/signin', { replace: true })
    }
  }

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
        studentName: studentName.trim() || undefined,
      })
      setInviteToken(created.token)
      setInviteExpiresAt(created.expiresAt)
      setShareNote('Invite link generated. You can copy or share it now.')
    } catch (error) {
      setInviteError(
        error instanceof Error ? error.message : 'Failed to generate invite link',
      )
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

  function createClass() {
    const name = classNameInput.trim()
    const grade = classGradeInput.trim()
    setRosterError(null)
    setRosterNote(null)

    if (!name || !grade) {
      setRosterError('Class name and grade are required.')
      return
    }

    const exists = classes.some(
      (item) => item.name.toLowerCase() === name.toLowerCase() && item.grade === grade,
    )
    if (exists) {
      setRosterError('A class with this name and grade already exists.')
      return
    }

    const created: Classroom = {
      id: crypto.randomUUID(),
      name,
      grade,
      students: [],
    }
    setClasses((prev) => [...prev, created])
    setSelectedClassId(created.id)
    setClassNameInput('')
    setRosterNote('Class created.')
  }

  function addStudentManual() {
    setRosterError(null)
    setRosterNote(null)
    if (!selectedClass) {
      setRosterError('Select a class before adding students.')
      return
    }

    const name = studentNameInput.trim()
    const email = normalizeEmail(studentEmailInput)
    if (!name || !email || !email.includes('@')) {
      setRosterError('Enter a valid student name and email.')
      return
    }

    const duplicate = selectedClass.students.some(
      (student) => normalizeEmail(student.email) === email,
    )
    if (duplicate) {
      setRosterError('Student email already exists in this class.')
      return
    }

    const student: RosterStudent = {
      id: crypto.randomUUID(),
      name,
      email,
      status: 'pending',
    }

    setClasses((prev) =>
      prev.map((item) =>
        item.id === selectedClass.id
          ? { ...item, students: [...item.students, student] }
          : item,
      ),
    )
    setStudentNameInput('')
    setStudentEmailInput('')
    setRosterNote('Student added.')
  }

  function importCsvStudents() {
    setRosterError(null)
    setRosterNote(null)
    if (!selectedClass) {
      setRosterError('Select a class before importing.')
      return
    }

    const lines = csvInput
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
    if (lines.length === 0) {
      setRosterError('Paste CSV rows first. Format: name,email')
      return
    }

    const existingEmails = new Set(
      selectedClass.students.map((student) => normalizeEmail(student.email)),
    )
    const seenInBatch = new Set<string>()
    const toInsert: RosterStudent[] = []

    for (const line of lines) {
      const [rawName, rawEmail] = line.split(',').map((value) => value?.trim() ?? '')
      const email = normalizeEmail(rawEmail)
      if (!rawName || !email || !email.includes('@')) {
        setRosterError(`Invalid CSV row: "${line}"`)
        return
      }
      if (existingEmails.has(email) || seenInBatch.has(email)) {
        setRosterError(`Duplicate email detected: ${email}`)
        return
      }
      seenInBatch.add(email)
      toInsert.push({
        id: crypto.randomUUID(),
        name: rawName,
        email,
        status: 'pending',
      })
    }

    setClasses((prev) =>
      prev.map((item) =>
        item.id === selectedClass.id
          ? { ...item, students: [...item.students, ...toInsert] }
          : item,
      ),
    )
    setCsvInput('')
    setRosterNote(`Imported ${toInsert.length} student(s).`)
  }

  async function handleCreateTest() {
    if (!profile) return
    setTestCreateError(null)
    setTestCreateNote(null)

    const title = testTitle.trim()
    if (!title) {
      setTestCreateError('Test title is required.')
      return
    }

    const parsedMax = Number.parseInt(testMaxScore, 10)
    if (!Number.isFinite(parsedMax) || parsedMax <= 0) {
      setTestCreateError('Max score must be a positive number.')
      return
    }

    setTestCreateLoading(true)
    try {
      const created = await createTest({
        workspaceId: profile.workspaceId,
        title,
        description: testDescription.trim() || undefined,
        maxScore: parsedMax,
        targetLearnerId: testTargetLearnerId.trim() || undefined,
      })
      setTestCreateNote(
        created.targetLearnerId
          ? `Test created for learner ${created.targetLearnerId}.`
          : 'Test created for all learners in your workspace.',
      )
      setTestTitle('')
      setTestDescription('')
    } catch (e) {
      setTestCreateError(e instanceof Error ? e.message : 'Failed to create test')
    } finally {
      setTestCreateLoading(false)
    }
  }

  async function handleLoadTeams() {
    if (!profile) return
    setTeamsError(null)
    setTeamsNote(null)
    setTeamsLoading(true)
    try {
      const teams = await listJoinedTeams({
        workspaceId: profile.workspaceId,
        accessToken: teamsAccessToken.trim(),
      })
      setTeamsList(teams)
      setSelectedTeamsId(teams[0]?.id ?? '')
      setTeamsNote(`Loaded ${teams.length} Teams workspace(s).`)
    } catch (e) {
      setTeamsError(e instanceof Error ? e.message : 'Failed to load Teams')
    } finally {
      setTeamsLoading(false)
    }
  }

  async function handleImportTeamsStudents() {
    if (!profile) return
    setTeamsError(null)
    setTeamsNote(null)

    if (!selectedTeamsId) {
      setTeamsError('Select a Team first.')
      return
    }

    setTeamsImportLoading(true)
    try {
      const result = await importTeamsMembers({
        workspaceId: profile.workspaceId,
        teamId: selectedTeamsId,
        accessToken: teamsAccessToken.trim(),
        actorType: 'student',
      })
      setTeamsNote(
        `Imported ${result.importedMembers} members. Created ${result.createdLearners}, linked existing ${result.linkedExistingLearners}, already linked ${result.alreadyLinkedInWorkspace}, skipped ${result.skippedMembers}.`,
      )
    } catch (e) {
      setTeamsError(e instanceof Error ? e.message : 'Failed to import Teams members')
    } finally {
      setTeamsImportLoading(false)
    }
  }

  return (
    <div className={appShellClass()}>
      <header className="border-b border-sky-100/90 bg-white/85">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3">
          <h1 className="text-xl font-extrabold text-slate-900">Teacher Dashboard</h1>
          <button
            type="button"
            onClick={handleSignOut}
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

        <section className="mt-5 rounded-2xl border-2 border-sky-100 bg-white/90 p-4">
          <h3 className="text-lg font-extrabold text-slate-900">Classes & Roster</h3>
          <p className="mt-2 text-slate-700">
            Build classes, add students manually, or import a CSV list (`name,email`).
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <input
              type="text"
              value={classNameInput}
              onChange={(event) => setClassNameInput(event.target.value)}
              placeholder="Class name (e.g. KG Stars)"
              className="min-h-11 rounded-xl border-2 border-sky-200 bg-white px-3 outline-none focus:border-cyan-500"
            />
            <input
              type="text"
              value={classGradeInput}
              onChange={(event) => setClassGradeInput(event.target.value)}
              placeholder="Grade (e.g. KG)"
              className="min-h-11 rounded-xl border-2 border-sky-200 bg-white px-3 outline-none focus:border-cyan-500"
            />
            <button
              type="button"
              onClick={createClass}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border-2 border-sky-200 bg-white px-4 py-2 text-base font-bold text-slate-900 hover:-translate-y-0.5 transition-transform duration-200"
            >
              Create Class
            </button>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.3fr]">
            <article className="rounded-xl border border-sky-100 bg-sky-50 p-3">
              <p className="text-sm font-semibold text-slate-600">Classes</p>
              <div className="mt-2 grid gap-2">
                {classes.length === 0 ? (
                  <p className="text-sm text-slate-600">No classes yet.</p>
                ) : (
                  classes.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedClassId(item.id)}
                      className={`rounded-lg border px-3 py-2 text-left ${
                        selectedClassId === item.id
                          ? 'border-cyan-500 bg-cyan-100 text-cyan-900'
                          : 'border-sky-100 bg-white text-slate-800'
                      }`}
                    >
                      <p className="font-bold">{item.name}</p>
                      <p className="text-sm">Grade: {item.grade}</p>
                      <p className="text-sm">Students: {item.students.length}</p>
                    </button>
                  ))
                )}
              </div>
            </article>

            <article className="rounded-xl border border-sky-100 bg-white p-3">
              <p className="text-sm font-semibold text-slate-600">
                {selectedClass ? `Roster for ${selectedClass.name}` : 'Select a class'}
              </p>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <input
                  type="text"
                  value={studentNameInput}
                  onChange={(event) => setStudentNameInput(event.target.value)}
                  placeholder="Student name"
                  className="min-h-11 rounded-xl border-2 border-sky-200 bg-white px-3 outline-none focus:border-cyan-500"
                />
                <input
                  type="email"
                  value={studentEmailInput}
                  onChange={(event) => setStudentEmailInput(event.target.value)}
                  placeholder="student@example.com"
                  className="min-h-11 rounded-xl border-2 border-sky-200 bg-white px-3 outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={addStudentManual}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border-2 border-sky-200 bg-white px-4 py-2 text-base font-bold text-slate-900 hover:-translate-y-0.5 transition-transform duration-200"
                >
                  Add Student
                </button>
              </div>

              <div className="mt-3 grid gap-2">
                <textarea
                  value={csvInput}
                  onChange={(event) => setCsvInput(event.target.value)}
                  rows={4}
                  placeholder={'CSV rows, one per line:\nMariam Ahmed,mariam@example.com'}
                  className="w-full rounded-xl border-2 border-sky-200 bg-white px-3 py-2 outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={importCsvStudents}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-linear-to-br from-cyan-300 to-yellow-300 px-4 py-2 text-base font-extrabold text-slate-900 shadow-[0_12px_24px_rgba(23,50,77,0.15)] transition-transform duration-200 hover:-translate-y-0.5"
                >
                  Import CSV
                </button>
              </div>

              <div className="mt-3 max-h-56 overflow-auto rounded-lg border border-sky-100 bg-slate-50">
                {selectedClass?.students.length ? (
                  <table className="w-full text-left text-sm">
                    <thead className="bg-sky-100 text-slate-700">
                      <tr>
                        <th className="px-3 py-2">Name</th>
                        <th className="px-3 py-2">Email</th>
                        <th className="px-3 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedClass.students.map((student) => (
                        <tr key={student.id} className="border-t border-sky-100">
                          <td className="px-3 py-2">{student.name}</td>
                          <td className="px-3 py-2">{student.email}</td>
                          <td className="px-3 py-2 capitalize">{student.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="px-3 py-3 text-sm text-slate-600">
                    {selectedClass
                      ? 'No students in this class yet.'
                      : 'Choose a class to view roster.'}
                  </p>
                )}
              </div>
            </article>
          </div>

          {rosterError ? (
            <p className="mt-3 text-sm font-semibold text-red-700">{rosterError}</p>
          ) : null}
          {rosterNote ? (
            <p className="mt-3 text-sm font-semibold text-cyan-900">{rosterNote}</p>
          ) : null}
        </section>

        <section className="mt-5 rounded-2xl border-2 border-sky-100 bg-white/90 p-4">
          <h3 className="text-lg font-extrabold text-slate-900">
            Create Test (Single Kid)
          </h3>
          <p className="mt-2 text-slate-700">
            Create a test for a single learner by entering their learner ID. Leave it
            empty to create for all learners.
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <input
              type="text"
              value={testTitle}
              onChange={(event) => setTestTitle(event.target.value)}
              placeholder="Test title"
              className="min-h-11 rounded-xl border-2 border-sky-200 bg-white px-3 outline-none focus:border-cyan-500"
            />
            <input
              type="number"
              min={1}
              value={testMaxScore}
              onChange={(event) => setTestMaxScore(event.target.value)}
              placeholder="Max score"
              className="min-h-11 rounded-xl border-2 border-sky-200 bg-white px-3 outline-none focus:border-cyan-500"
            />
            <input
              type="text"
              value={testTargetLearnerId}
              onChange={(event) => setTestTargetLearnerId(event.target.value)}
              placeholder="Target learner ID (optional)"
              className="min-h-11 rounded-xl border-2 border-sky-200 bg-white px-3 outline-none focus:border-cyan-500 md:col-span-2"
            />
            <textarea
              value={testDescription}
              onChange={(event) => setTestDescription(event.target.value)}
              rows={3}
              placeholder="Description (optional)"
              className="w-full rounded-xl border-2 border-sky-200 bg-white px-3 py-2 outline-none focus:border-cyan-500 md:col-span-2"
            />
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={handleCreateTest}
              disabled={testCreateLoading}
              className="inline-flex min-h-11 cursor-pointer items-center rounded-xl bg-linear-to-br from-cyan-300 to-yellow-300 px-4 py-2 text-base font-extrabold text-slate-900 shadow-[0_12px_24px_rgba(23,50,77,0.15)] transition-transform duration-200 hover:-translate-y-0.5"
            >
              {testCreateLoading ? 'Creating Test...' : 'Create Test'}
            </button>
          </div>

          {testCreateError ? (
            <p className="mt-3 text-sm font-semibold text-red-700">{testCreateError}</p>
          ) : null}
          {testCreateNote ? (
            <p className="mt-3 text-sm font-semibold text-cyan-900">{testCreateNote}</p>
          ) : null}
        </section>

        <section className="mt-5 rounded-2xl border-2 border-sky-100 bg-white/90 p-4">
          <h3 className="text-lg font-extrabold text-slate-900">
            Import Students From Microsoft Teams
          </h3>
          <p className="mt-2 text-slate-700">
            Paste a Microsoft Graph access token with Teams read permissions, load your
            Teams list, then import members into this workspace roster.
          </p>

          <div className="mt-4 grid gap-3">
            <textarea
              value={teamsAccessToken}
              onChange={(event) => setTeamsAccessToken(event.target.value)}
              rows={3}
              placeholder="Microsoft Graph access token"
              className="w-full rounded-xl border-2 border-sky-200 bg-white px-3 py-2 outline-none focus:border-cyan-500"
            />
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleLoadTeams}
                disabled={teamsLoading || teamsImportLoading || !teamsAccessToken.trim()}
                className="inline-flex min-h-11 cursor-pointer items-center rounded-xl border-2 border-sky-200 bg-white px-4 py-2 text-base font-bold text-slate-900 hover:-translate-y-0.5 transition-transform duration-200"
              >
                {teamsLoading ? 'Loading Teams...' : 'Load My Teams'}
              </button>
              <button
                type="button"
                onClick={handleImportTeamsStudents}
                disabled={
                  teamsImportLoading ||
                  teamsLoading ||
                  !teamsAccessToken.trim() ||
                  !selectedTeamsId
                }
                className="inline-flex min-h-11 cursor-pointer items-center rounded-xl bg-linear-to-br from-cyan-300 to-yellow-300 px-4 py-2 text-base font-extrabold text-slate-900 shadow-[0_12px_24px_rgba(23,50,77,0.15)] transition-transform duration-200 hover:-translate-y-0.5"
              >
                {teamsImportLoading ? 'Importing...' : 'Import Team Members'}
              </button>
            </div>

            <select
              value={selectedTeamsId}
              onChange={(event) => setSelectedTeamsId(event.target.value)}
              className="min-h-11 rounded-xl border-2 border-sky-200 bg-white px-3 outline-none focus:border-cyan-500"
            >
              <option value="">Select a Team</option>
              {teamsList.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.displayName}
                </option>
              ))}
            </select>
          </div>

          {teamsError ? (
            <p className="mt-3 text-sm font-semibold text-red-700">{teamsError}</p>
          ) : null}
          {teamsNote ? (
            <p className="mt-3 text-sm font-semibold text-cyan-900">{teamsNote}</p>
          ) : null}
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
              disabled={!inviteLink}
              className="inline-flex min-h-11 cursor-pointer items-center rounded-xl bg-linear-to-br from-emerald-300 to-lime-300 px-4 py-2 text-base font-extrabold text-slate-900 shadow-[0_12px_24px_rgba(23,50,77,0.15)] transition-transform duration-200 hover:-translate-y-0.5"
            >
              Share On WhatsApp
            </button>
            <button
              type="button"
              onClick={copyInviteLink}
              disabled={!inviteLink}
              className="inline-flex min-h-11 cursor-pointer items-center rounded-xl border-2 border-sky-200 bg-white px-4 py-2 text-base font-bold text-slate-900 hover:-translate-y-0.5 transition-transform duration-200"
            >
              Copy Link
            </button>
          </div>
          {inviteExpiryLabel ? (
            <p className="mt-3 text-sm font-semibold text-slate-700">
              Expires: {inviteExpiryLabel}
            </p>
          ) : null}

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
