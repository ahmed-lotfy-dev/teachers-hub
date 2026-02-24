import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { appShellClass } from '../../ui/layout'
import { createTest, publishTest } from '../tests/api'
import { TeacherTopNav } from './TeacherTopNav'
import { useProtectedTeacherProfile } from '../auth/queries'
import { classroomListQueryOptions } from '../classrooms/queries'
import { teacherTestsQueryOptions } from '../tests/queries'

export function DashboardPage() {
  const { isLoading, errorMessage, profile } = useProtectedTeacherProfile()
  const queryClient = useQueryClient()

  const [testTitle, setTestTitle] = useState('')
  const [testDescription, setTestDescription] = useState('')
  const [testMaxScore, setTestMaxScore] = useState('100')
  const [selectedClassroomId, setSelectedClassroomId] = useState('')
  const [testCreateLoading, setTestCreateLoading] = useState(false)
  const [testCreateError, setTestCreateError] = useState<string | null>(null)
  const [testCreateNote, setTestCreateNote] = useState<string | null>(null)
  const classroomQuery = useQuery({
    ...classroomListQueryOptions(profile?.workspaceId ?? ''),
    enabled: !!profile?.workspaceId,
  })
  const teacherTestsQuery = useQuery({
    ...teacherTestsQueryOptions(profile?.workspaceId ?? ''),
    enabled: !!profile?.workspaceId,
  })
  const publishMutation = useMutation({
    mutationFn: (input: { testId: string; workspaceId: string }) => publishTest(input),
  })

  useEffect(() => {
    if (!selectedClassroomId && classroomQuery.data && classroomQuery.data.length > 0) {
      setSelectedClassroomId(classroomQuery.data[0].id)
    }
  }, [selectedClassroomId, classroomQuery.data])

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
    if (!selectedClassroomId) {
      setTestCreateError('Select a classroom before creating a test.')
      return
    }

    const selectedClassroom = classroomQuery.data?.find(
      (classroom) => classroom.id === selectedClassroomId,
    )
    if (!selectedClassroom) {
      setTestCreateError('Selected classroom is invalid. Refresh and try again.')
      return
    }

    setTestCreateLoading(true)
    try {
      const created = await createTest({
        workspaceId: profile.workspaceId,
        classroomId: selectedClassroomId,
        title,
        description: testDescription.trim() || undefined,
        maxScore: parsedMax,
      })
      setTestCreateNote(
        `Test "${created.title}" created for class ${selectedClassroom.name} (${selectedClassroom.grade}).`,
      )
      await queryClient.invalidateQueries({ queryKey: ['teacher-tests', profile.workspaceId] })
      setTestTitle('')
      setTestDescription('')
    } catch (e) {
      setTestCreateError(e instanceof Error ? e.message : 'Failed to create test')
    } finally {
      setTestCreateLoading(false)
    }
  }

  async function handlePublishTest(testId: string) {
    if (!profile) return
    setTestCreateError(null)
    setTestCreateNote(null)

    try {
      const result = await publishMutation.mutateAsync({
        testId,
        workspaceId: profile.workspaceId,
      })
      await queryClient.invalidateQueries({ queryKey: ['teacher-tests', profile.workspaceId] })
      setTestCreateNote(`Published test and assigned ${result.assignedStudents} student(s).`)
    } catch (error) {
      setTestCreateError(error instanceof Error ? error.message : 'Failed to publish test')
    }
  }

  if (isLoading) {
    return (
      <div className={appShellClass()}>
        <TeacherTopNav title="Teacher Dashboard" />
        <main className="mx-auto w-full max-w-7xl px-4 py-8">
          <p className="font-semibold text-slate-700">Loading dashboard...</p>
        </main>
      </div>
    )
  }

  if (errorMessage || !profile) {
    return (
      <div className={appShellClass()}>
        <TeacherTopNav title="Teacher Dashboard" />
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
      <TeacherTopNav title="Teacher Dashboard" />

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
            <p className="mt-1 text-slate-700">Manage students via the Students tab.</p>
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
          <h3 className="text-lg font-extrabold text-slate-900">Create Classroom Test</h3>
          <p className="mt-2 text-slate-700">
            A published test is assigned to all active students in the selected class.
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <select
              value={selectedClassroomId}
              onChange={(event) => setSelectedClassroomId(event.target.value)}
              className="min-h-11 rounded-xl border-2 border-sky-200 bg-white px-3 outline-none focus:border-cyan-500"
            >
              <option value="">Select class</option>
              {(classroomQuery.data ?? []).map((classroom) => (
                <option key={classroom.id} value={classroom.id}>
                  {classroom.name} ({classroom.grade}) - {classroom.activeStudentCount} students
                </option>
              ))}
            </select>
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
            <textarea
              value={testDescription}
              onChange={(event) => setTestDescription(event.target.value)}
              rows={3}
              placeholder="Description (optional)"
              className="w-full rounded-xl border-2 border-sky-200 bg-white px-3 py-2 outline-none focus:border-cyan-500 md:col-span-2"
            />
          </div>
          {classroomQuery.isError ? (
            <p className="mt-2 text-sm font-semibold text-red-700">
              Could not load classes. Go to Students tab and create one.
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleCreateTest}
              disabled={testCreateLoading || (classroomQuery.data?.length ?? 0) === 0}
              className="inline-flex min-h-11 cursor-pointer items-center rounded-xl bg-linear-to-br from-cyan-300 to-yellow-300 px-4 py-2 text-base font-extrabold text-slate-900 shadow-[0_12px_24px_rgba(23,50,77,0.15)] transition-transform duration-200 hover:-translate-y-0.5"
            >
              {testCreateLoading ? 'Creating Test...' : 'Create Test'}
            </button>
            <Link
              to="/students"
              className="inline-flex min-h-11 items-center rounded-xl border-2 border-sky-200 bg-white px-4 py-2 text-base font-bold text-slate-900"
            >
              Go To Students Tab
            </Link>
          </div>

          {testCreateError ? (
            <p className="mt-3 text-sm font-semibold text-red-700">{testCreateError}</p>
          ) : null}
          {testCreateNote ? (
            <p className="mt-3 text-sm font-semibold text-cyan-900">{testCreateNote}</p>
          ) : null}
        </section>

        <section className="mt-5 rounded-2xl border-2 border-sky-100 bg-white/90 p-4">
          <h3 className="text-lg font-extrabold text-slate-900">Classroom Tests</h3>
          <p className="mt-2 text-slate-700">
            Publish draft tests to assign them to all active students in that class.
          </p>
          <div className="mt-3 grid gap-3">
            {(teacherTestsQuery.data ?? []).map((test) => (
              <article
                key={test.id}
                className="rounded-xl border border-sky-100 bg-slate-50 p-3"
              >
                <p className="font-bold text-slate-900">{test.title}</p>
                <p className="text-sm text-slate-700">
                  {test.classroomName ? `${test.classroomName} (${test.classroomGrade})` : 'No class'}
                </p>
                <p className="text-sm text-slate-700">Status: {test.status}</p>
                {test.status !== 'published' ? (
                  <button
                    type="button"
                    onClick={() => handlePublishTest(test.id)}
                    disabled={publishMutation.isPending}
                    className="mt-2 inline-flex min-h-10 items-center rounded-lg border-2 border-sky-200 bg-white px-3 text-sm font-bold text-slate-900"
                  >
                    {publishMutation.isPending ? 'Publishing...' : 'Publish'}
                  </button>
                ) : null}
                <div className="mt-2">
                  <Link
                    to={`/dashboard/tests/${test.id}`}
                    className="inline-flex min-h-10 items-center rounded-lg border-2 border-sky-200 bg-white px-3 text-sm font-bold text-slate-900"
                  >
                    Open Test Page
                  </Link>
                </div>
              </article>
            ))}
            {!teacherTestsQuery.data?.length ? (
              <p className="text-sm font-semibold text-slate-600">No tests yet.</p>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  )
}
