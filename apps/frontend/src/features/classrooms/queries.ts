import { queryOptions } from '@tanstack/react-query'
import {
  listClassrooms,
  listClassroomStudents,
  listWorkspaceStudents,
} from './api'

export function classroomListQueryOptions(workspaceId: string) {
  return queryOptions({
    queryKey: ['classrooms', workspaceId],
    queryFn: () => listClassrooms(workspaceId),
    staleTime: 5 * 60 * 1000,
  })
}

export function workspaceStudentsQueryOptions(workspaceId: string) {
  return queryOptions({
    queryKey: ['workspace-students', workspaceId],
    queryFn: () => listWorkspaceStudents(workspaceId),
    staleTime: 5 * 60 * 1000,
  })
}

export function classroomStudentsQueryOptions(workspaceId: string, classroomId: string) {
  return queryOptions({
    queryKey: ['classroom-students', workspaceId, classroomId],
    queryFn: () => listClassroomStudents({ workspaceId, classroomId }),
    staleTime: 60 * 1000,
  })
}
