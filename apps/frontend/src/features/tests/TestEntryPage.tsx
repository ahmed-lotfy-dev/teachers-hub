import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { appShellClass } from '../../ui/layout'
import { listTests, startTest, submitTest, type TestItem } from './api'

export function TestEntryPage() {
  const [params] = useSearchParams()
  const workspaceId = params.get('workspaceId')
  const learnerId = params.get('learnerId')
  const actorType = (params.get('actorType') as 'student' | 'parent' | null) ?? 'student'
  const [tests, setTests] = useState<TestItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyTestId, setBusyTestId] = useState<string | null>(null)

  const canActAsStudent = actorType === 'student'

  const queryContext = useMemo(() => {
    if (!workspaceId || !learnerId) return null
    return { workspaceId, learnerId, actorType }
  }, [workspaceId, learnerId, actorType])

  async function loadTests() {
    if (!queryContext) {
      setError('Missing workspace or learner context.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const data = await listTests(queryContext)
      setTests(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load tests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadTests()
  }, [queryContext])

  async function handleStart(testId: string) {
    if (!queryContext) return
    setBusyTestId(testId)
    try {
      await startTest({ ...queryContext, testId })
      await loadTests()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start test')
    } finally {
      setBusyTestId(null)
    }
  }

  async function handleSubmit(testId: string) {
    if (!queryContext) return
    setBusyTestId(testId)
    try {
      await submitTest({
        ...queryContext,
        testId,
        score: Math.floor(Math.random() * 41) + 60,
      })
      await loadTests()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit test')
    } finally {
      setBusyTestId(null)
    }
  }

  return (
    <div className={appShellClass()}>
      <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-10">
        <Card className="mx-auto w-full max-w-3xl">
          <CardHeader>
            <p className="font-bold tracking-wide text-cyan-800">Tests</p>
            <CardTitle className="mt-1">You Are In</CardTitle>
            <CardDescription className="mt-2">
              Invite claim succeeded. You can now access test activities.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="rounded-xl border border-sky-100 bg-sky-50 p-3 text-sm text-slate-700">
              <p>Workspace: {workspaceId ?? 'N/A'}</p>
              <p>Learner: {learnerId ?? 'N/A'}</p>
              <p>Role: {actorType}</p>
            </div>

            {loading ? <p className="text-slate-700">Loading tests...</p> : null}
            {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : null}

            {!loading && tests.length === 0 ? (
              <p className="text-slate-700">No tests found yet.</p>
            ) : null}

            <div className="grid gap-3">
              {tests.map((test) => (
                <article
                  key={test.id}
                  className="rounded-xl border border-sky-100 bg-white p-4 shadow-[0_4px_12px_rgba(23,50,77,0.08)]"
                >
                  <h3 className="text-lg font-extrabold text-slate-900">{test.title}</h3>
                  <p className="mt-1 text-slate-700">
                    {test.description || 'No description'}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">Max score: {test.maxScore}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Attempt status: {test.attempt?.status ?? 'not started'}
                  </p>
                  {test.attempt?.submittedAt ? (
                    <p className="mt-1 text-sm text-emerald-700">
                      Submitted. Score: {test.attempt.score ?? 'N/A'}
                    </p>
                  ) : null}

                  {canActAsStudent ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {test.attempt?.status !== 'started' &&
                      test.attempt?.status !== 'submitted' ? (
                        <Button
                          onClick={() => handleStart(test.id)}
                          disabled={busyTestId === test.id || !test.canStart}
                        >
                          {busyTestId === test.id ? 'Starting...' : 'Start Test'}
                        </Button>
                      ) : null}

                      {test.attempt?.status === 'started' ? (
                        <Button
                          variant="secondary"
                          onClick={() => handleSubmit(test.id)}
                          disabled={busyTestId === test.id}
                        >
                          {busyTestId === test.id ? 'Submitting...' : 'Submit Test'}
                        </Button>
                      ) : null}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm font-semibold text-slate-600">
                      Parent accounts can review status but cannot start/submit tests.
                    </p>
                  )}
                </article>
              ))}
            </div>

            <Link className="font-bold text-cyan-800 underline" to="/">
              Back to Home
            </Link>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
