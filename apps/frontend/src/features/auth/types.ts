export type School = {
  id: string
  name: string
  city?: string | null
  country?: string | null
}

export type TeacherProfile = {
  userId: string
  workspaceId: string
  displayName: string
  schoolId?: string | null
  schoolName?: string | null
  gradeLevels: string[]
  onboardedAt?: string | null
}
