import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { appShellClass } from '../../ui/layout'
import { TeacherTopNav } from '../dashboard/TeacherTopNav'
import { useProtectedTeacherProfile } from '../auth/queries'
import { teacherTestAttemptsQueryOptions } from './queries'

export function TeacherTestDetailPage() {
  const { testId = '' } = useParams<{ testId: string }>()
  const { isLoading, errorMessage, profile } = useProtectedTeacherProfile()

  const attemptsQuery = useQuery({
    ...teacherTestAttemptsQueryOptions(profile?.workspaceId ?? '', testId),
    enabled: !!profile?.workspaceId && !!testId,
  })

  const testLink = typeof window !== 'undefined' ? `${window.location.origin}/tests/${testId}` : ''

  if (isLoading) {
    return (
      <div className={appShellClass()}>
        <TeacherTopNav title="Test Attempts" />
        <main className="mx-auto w-full max-w-7xl px-4 py-8">
          <p className="font-semibold text-slate-700">Loading...</p>
        </main>
      </div>
    )
  }

  if (errorMessage || !profile) {
    return (
      <div className={appShellClass()}>
        <TeacherTopNav title="Test Attempts" />
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
      <TeacherTopNav title="Test Attempts" />
      <main className="mx-auto w-full max-w-7xl px-4 py-6">
        <section className="rounded-2xl border-2 border-sky-100 bg-white/90 p-4">
          <h2 className="text-xl font-black text-slate-900">
            {attemptsQuery.data?.test.title ?? 'Test'}
          </h2>
          <p className="mt-1 text-slate-700">Share link with parents/students:</p>
          <a className="font-bold text-cyan-800 underline" href={testLink} target="_blank" rel="noreferrer">
            {testLink}
          </a>
        </section>

        <section className="mt-4 rounded-2xl border-2 border-sky-100 bg-white/90 p-4">
          {attemptsQuery.isPending ? <p className="text-slate-700">Loading attempts...</p> : null}
          {attemptsQuery.isError ? (
            <p className="text-sm font-semibold text-red-700">Could not load attempts.</p>
          ) : null}

          <div className="max-h-[28rem] overflow-auto rounded-lg border border-sky-100 bg-slate-50">
            <table className="w-full text-left text-sm">
              <thead className="bg-sky-100 text-slate-700">
                <tr>
                  <th className="px-3 py-2">Child</th>
                  <th className="px-3 py-2">Assignment</th>
                  <th className="px-3 py-2">Attempt</th>
                  <th className="px-3 py-2">Submitted</th>
                  <th className="px-3 py-2">Score</th>
                </tr>
              </thead>
              <tbody>
                {(attemptsQuery.data?.attempts ?? []).map((item) => (
                  <tr key={item.assignmentId} className="border-t border-sky-100">
                    <td className="px-3 py-2">
                      <p className="font-semibold text-slate-900">{item.childName}</p>
                      <p className="text-xs text-slate-600">{item.childEmail}</p>
                    </td>
                    <td className="px-3 py-2 capitalize">{item.assignmentStatus}</td>
                    <td className="px-3 py-2 capitalize">{item.attemptStatus ?? 'not started'}</td>
                    <td className="px-3 py-2">
                      {item.submittedAt ? new Date(item.submittedAt).toLocaleString() : '-'}
                    </td>
                    <td className="px-3 py-2">{item.score ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  )
}
