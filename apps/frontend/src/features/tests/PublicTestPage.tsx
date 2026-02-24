import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { appShellClass } from '../../ui/layout'
import { publicTestQueryOptions } from './queries'
import { startPublicTest, submitPublicTest } from './api'

export function PublicTestPage() {
  const { testId = '' } = useParams<{ testId: string }>()
  const testQuery = useQuery({
    ...publicTestQueryOptions(testId),
    enabled: !!testId,
  })

  const [childName, setChildName] = useState('')
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const startMutation = useMutation({
    mutationFn: (name: string) => startPublicTest({ testId, childName: name }),
  })
  const submitMutation = useMutation({
    mutationFn: (id: string) => submitPublicTest({ testId, attemptId: id }),
  })

  async function handleStart() {
    setError(null)
    setNote(null)

    const name = childName.trim()
    if (!name) {
      setError('Please enter child name.')
      return
    }

    try {
      const attempt = await startMutation.mutateAsync(name)
      setAttemptId(attempt.id)
      setNote(`Started for ${attempt.childName}. You can now submit when done.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start test')
    }
  }

  async function handleSubmit() {
    if (!attemptId) return
    setError(null)
    setNote(null)

    try {
      await submitMutation.mutateAsync(attemptId)
      setNote('Test submitted successfully. Teacher can now see it on dashboard.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit test')
    }
  }

  return (
    <div className={appShellClass()}>
      <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-10">
        <section className="rounded-2xl border-2 border-sky-100 bg-white/95 p-5">
          <h1 className="text-2xl font-black text-slate-900">Start Test</h1>
          {testQuery.data ? (
            <>
              <p className="mt-2 text-slate-700">{testQuery.data.title}</p>
              <p className="text-sm text-slate-600">
                Class: {testQuery.data.classroomName ?? 'Classroom'}
              </p>
              {testQuery.data.description ? (
                <p className="mt-1 text-sm text-slate-600">{testQuery.data.description}</p>
              ) : null}
            </>
          ) : null}

          {testQuery.isPending ? <p className="mt-3 text-slate-700">Loading test...</p> : null}
          {testQuery.isError ? (
            <p className="mt-3 text-sm font-semibold text-red-700">Test link is invalid or expired.</p>
          ) : null}

          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
            <input
              type="text"
              value={childName}
              onChange={(event) => setChildName(event.target.value)}
              placeholder="Type child name"
              className="min-h-11 rounded-xl border-2 border-sky-200 bg-white px-3 outline-none focus:border-cyan-500"
            />
            <button
              type="button"
              onClick={handleStart}
              disabled={startMutation.isPending || !testQuery.data}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-linear-to-br from-cyan-300 to-yellow-300 px-4 py-2 font-extrabold text-slate-900"
            >
              {startMutation.isPending ? 'Starting...' : 'Start'}
            </button>
          </div>

          <div className="mt-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!attemptId || submitMutation.isPending}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border-2 border-sky-200 bg-white px-4 py-2 font-bold text-slate-900"
            >
              {submitMutation.isPending ? 'Submitting...' : 'Submit Test'}
            </button>
          </div>

          {error ? <p className="mt-3 text-sm font-semibold text-red-700">{error}</p> : null}
          {note ? <p className="mt-3 text-sm font-semibold text-cyan-900">{note}</p> : null}

          <Link className="mt-4 inline-flex font-bold text-cyan-800 underline" to="/">
            Back to home
          </Link>
        </section>
      </main>
    </div>
  )
}
