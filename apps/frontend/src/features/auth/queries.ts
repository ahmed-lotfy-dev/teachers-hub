import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { fetchTeacherProfile } from './api'
import { getAuthSession } from './session'

export const authSessionQueryOptions = queryOptions({
  queryKey: ['auth', 'session'],
  queryFn: getAuthSession,
  staleTime: 5 * 60 * 1000,
})

export const teacherProfileQueryOptions = queryOptions({
  queryKey: ['teacher', 'profile'],
  queryFn: fetchTeacherProfile,
  staleTime: 5 * 60 * 1000,
})

export function useProtectedTeacherProfile() {
  const navigate = useNavigate()

  const sessionQuery = useQuery(authSessionQueryOptions)
  const profileQuery = useQuery({
    ...teacherProfileQueryOptions,
    enabled: !!sessionQuery.data,
  })

  useEffect(() => {
    if (sessionQuery.status === 'success' && !sessionQuery.data) {
      navigate('/signin', { replace: true })
      return
    }

    if (
      sessionQuery.status === 'success' &&
      sessionQuery.data &&
      profileQuery.status === 'success' &&
      !profileQuery.data
    ) {
      navigate('/onboarding', { replace: true })
    }
  }, [
    navigate,
    sessionQuery.status,
    sessionQuery.data,
    profileQuery.status,
    profileQuery.data,
  ])

  const isRedirecting =
    (sessionQuery.status === 'success' && !sessionQuery.data) ||
    (sessionQuery.status === 'success' &&
      !!sessionQuery.data &&
      profileQuery.status === 'success' &&
      !profileQuery.data)

  const isLoading =
    sessionQuery.isPending || (!!sessionQuery.data && profileQuery.isPending) || isRedirecting

  const errorMessage =
    sessionQuery.isError || profileQuery.isError ? 'Could not load teacher data.' : null

  return {
    isLoading,
    errorMessage,
    profile: profileQuery.data ?? null,
  }
}
