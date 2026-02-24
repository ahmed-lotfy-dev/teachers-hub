import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { appShellClass } from '../../ui/layout'
import {
  importTeamsMembers,
  listJoinedTeams,
  type TeamsJoinedTeam,
} from '../integrations/teams/api'
import { TeacherTopNav } from './TeacherTopNav'
import { ClassesRosterSection } from './components/ClassesRosterSection'
import { TeamsImportSection } from './components/TeamsImportSection'
import { useProtectedTeacherProfile } from '../auth/queries'
import {
  assignStudentToClassroom,
  createClassroom,
} from '../classrooms/api'
import {
  classroomListQueryOptions,
  classroomStudentsQueryOptions,
  workspaceStudentsQueryOptions,
} from '../classrooms/queries'

export function ChildrenPage() {
  const { isLoading, errorMessage, profile } = useProtectedTeacherProfile()
  const queryClient = useQueryClient()

  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [classNameInput, setClassNameInput] = useState('')
  const [classGradeInput, setClassGradeInput] = useState('')
  const [selectedWorkspaceStudentId, setSelectedWorkspaceStudentId] = useState('')
  const [rosterError, setRosterError] = useState<string | null>(null)
  const [rosterNote, setRosterNote] = useState<string | null>(null)

  const [teamsAccessToken, setTeamsAccessToken] = useState('')
  const [teamsList, setTeamsList] = useState<TeamsJoinedTeam[]>([])
  const [selectedTeamsId, setSelectedTeamsId] = useState('')
  const [teamsLoading, setTeamsLoading] = useState(false)
  const [teamsImportLoading, setTeamsImportLoading] = useState(false)
  const [teamsError, setTeamsError] = useState<string | null>(null)
  const [teamsNote, setTeamsNote] = useState<string | null>(null)

  const classesQuery = useQuery({
    ...classroomListQueryOptions(profile?.workspaceId ?? ''),
    enabled: !!profile?.workspaceId,
  })

  const workspaceStudentsQuery = useQuery({
    ...workspaceStudentsQueryOptions(profile?.workspaceId ?? ''),
    enabled: !!profile?.workspaceId,
  })

  const classroomStudentsQuery = useQuery({
    ...classroomStudentsQueryOptions(profile?.workspaceId ?? '', selectedClassId),
    enabled: !!profile?.workspaceId && !!selectedClassId,
  })

  const createClassMutation = useMutation({
    mutationFn: (input: { workspaceId: string; name: string; grade: string }) =>
      createClassroom(input),
  })

  const assignStudentMutation = useMutation({
    mutationFn: (input: { workspaceId: string; classroomId: string; learnerId: string }) =>
      assignStudentToClassroom(input),
  })

  const selectedClass = useMemo(
    () => classesQuery.data?.find((item) => item.id === selectedClassId) ?? null,
    [classesQuery.data, selectedClassId],
  )

  useEffect(() => {
    if (!selectedClassId && classesQuery.data && classesQuery.data.length > 0) {
      setSelectedClassId(classesQuery.data[0].id)
      if (!classGradeInput) {
        setClassGradeInput(classesQuery.data[0].grade)
      }
    }
  }, [selectedClassId, classesQuery.data, classGradeInput])

  useEffect(() => {
    if (!classGradeInput && profile?.gradeLevels[0]) {
      setClassGradeInput(profile.gradeLevels[0])
    }
  }, [profile?.gradeLevels, classGradeInput])

  async function handleCreateClass() {
    if (!profile) return
    setRosterError(null)
    setRosterNote(null)

    const name = classNameInput.trim()
    const grade = classGradeInput.trim()
    if (!name || !grade) {
      setRosterError('Class name and grade are required.')
      return
    }

    try {
      const created = await createClassMutation.mutateAsync({
        workspaceId: profile.workspaceId,
        name,
        grade,
      })
      await queryClient.invalidateQueries({ queryKey: ['classrooms', profile.workspaceId] })
      setSelectedClassId(created.id)
      setClassNameInput('')
      setRosterNote('Class created.')
    } catch (error) {
      setRosterError(error instanceof Error ? error.message : 'Could not create class')
    }
  }

  async function handleAddStudentToClass() {
    if (!profile) return
    setRosterError(null)
    setRosterNote(null)

    if (!selectedClassId) {
      setRosterError('Select a class before adding students.')
      return
    }
    if (!selectedWorkspaceStudentId) {
      setRosterError('Select a workspace student first.')
      return
    }

    try {
      await assignStudentMutation.mutateAsync({
        workspaceId: profile.workspaceId,
        classroomId: selectedClassId,
        learnerId: selectedWorkspaceStudentId,
      })
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['classroom-students', profile.workspaceId, selectedClassId],
        }),
        queryClient.invalidateQueries({
          queryKey: ['classrooms', profile.workspaceId],
        }),
      ])
      setRosterNote('Student assigned to class.')
      setSelectedWorkspaceStudentId('')
    } catch (error) {
      setRosterError(error instanceof Error ? error.message : 'Could not add student')
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
    } catch (err) {
      setTeamsError(err instanceof Error ? err.message : 'Failed to load Teams')
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
      await queryClient.invalidateQueries({ queryKey: ['workspace-students', profile.workspaceId] })
      setTeamsNote(
        `Imported ${result.importedMembers} members. Created ${result.createdLearners}, linked existing ${result.linkedExistingLearners}, already linked ${result.alreadyLinkedInWorkspace}, skipped ${result.skippedMembers}.`,
      )
    } catch (err) {
      setTeamsError(err instanceof Error ? err.message : 'Failed to import Teams members')
    } finally {
      setTeamsImportLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className={appShellClass()}>
        <TeacherTopNav title="Students Management" />
        <main className="mx-auto w-full max-w-7xl px-4 py-8">
          <p className="font-semibold text-slate-700">Loading students tab...</p>
        </main>
      </div>
    )
  }

  if (errorMessage || !profile) {
    return (
      <div className={appShellClass()}>
        <TeacherTopNav title="Students Management" />
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
      <TeacherTopNav title="Students Management" />

      <main className="mx-auto w-full max-w-7xl px-4 py-6">
        <ClassesRosterSection
          classes={classesQuery.data ?? []}
          selectedClassId={selectedClassId}
          selectedClass={selectedClass}
          selectedClassStudents={classroomStudentsQuery.data ?? []}
          workspaceStudents={workspaceStudentsQuery.data ?? []}
          classNameInput={classNameInput}
          classGradeInput={classGradeInput}
          selectedWorkspaceStudentId={selectedWorkspaceStudentId}
          rosterError={rosterError}
          rosterNote={rosterNote}
          classCreateLoading={createClassMutation.isPending}
          assignLoading={assignStudentMutation.isPending}
          onClassNameChange={setClassNameInput}
          onClassGradeChange={setClassGradeInput}
          onCreateClass={handleCreateClass}
          onSelectClass={setSelectedClassId}
          onSelectWorkspaceStudent={setSelectedWorkspaceStudentId}
          onAddStudentToClass={handleAddStudentToClass}
        />

        <TeamsImportSection
          teamsAccessToken={teamsAccessToken}
          teamsList={teamsList}
          selectedTeamsId={selectedTeamsId}
          teamsLoading={teamsLoading}
          teamsImportLoading={teamsImportLoading}
          teamsError={teamsError}
          teamsNote={teamsNote}
          onAccessTokenChange={setTeamsAccessToken}
          onSelectTeam={setSelectedTeamsId}
          onLoadTeams={handleLoadTeams}
          onImportTeamsMembers={handleImportTeamsStudents}
        />
      </main>
    </div>
  )
}
