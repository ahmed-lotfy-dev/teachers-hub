import { queryOptions } from '@tanstack/react-query'
import { getPublicTest, getTeacherTestAttempts, listTeacherTests } from './api'

export function teacherTestsQueryOptions(workspaceId: string) {
  return queryOptions({
    queryKey: ['teacher-tests', workspaceId],
    queryFn: () => listTeacherTests(workspaceId),
    staleTime: 60 * 1000,
  })
}

export function teacherTestAttemptsQueryOptions(workspaceId: string, testId: string) {
  return queryOptions({
    queryKey: ['teacher-test-attempts', workspaceId, testId],
    queryFn: () => getTeacherTestAttempts({ workspaceId, testId }),
    staleTime: 30 * 1000,
  })
}

export function publicTestQueryOptions(testId: string) {
  return queryOptions({
    queryKey: ['public-test', testId],
    queryFn: () => getPublicTest(testId),
    staleTime: 60 * 1000,
  })
}
