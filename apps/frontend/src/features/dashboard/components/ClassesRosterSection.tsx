import type {
  ClassroomItem,
  ClassroomStudent,
  WorkspaceStudent,
} from '../../classrooms/api'

type ClassesRosterSectionProps = {
  classes: ClassroomItem[]
  selectedClassId: string
  selectedClass: ClassroomItem | null
  selectedClassStudents: ClassroomStudent[]
  workspaceStudents: WorkspaceStudent[]
  classNameInput: string
  classGradeInput: string
  selectedWorkspaceStudentId: string
  rosterError: string | null
  rosterNote: string | null
  classCreateLoading: boolean
  assignLoading: boolean
  onClassNameChange: (value: string) => void
  onClassGradeChange: (value: string) => void
  onCreateClass: () => void
  onSelectClass: (id: string) => void
  onSelectWorkspaceStudent: (id: string) => void
  onAddStudentToClass: () => void
}

export function ClassesRosterSection({
  classes,
  selectedClassId,
  selectedClass,
  selectedClassStudents,
  workspaceStudents,
  classNameInput,
  classGradeInput,
  selectedWorkspaceStudentId,
  rosterError,
  rosterNote,
  classCreateLoading,
  assignLoading,
  onClassNameChange,
  onClassGradeChange,
  onCreateClass,
  onSelectClass,
  onSelectWorkspaceStudent,
  onAddStudentToClass,
}: ClassesRosterSectionProps) {
  return (
    <section className="rounded-2xl border-2 border-sky-100 bg-white/90 p-4">
      <h3 className="text-lg font-extrabold text-slate-900">Classes & Roster</h3>
      <p className="mt-2 text-slate-700">
        Create classes, then assign existing workspace students to each class.
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <input
          type="text"
          value={classNameInput}
          onChange={(event) => onClassNameChange(event.target.value)}
          placeholder="Class name (e.g. KG Stars)"
          className="min-h-11 rounded-xl border-2 border-sky-200 bg-white px-3 outline-none focus:border-cyan-500"
        />
        <input
          type="text"
          value={classGradeInput}
          onChange={(event) => onClassGradeChange(event.target.value)}
          placeholder="Grade (e.g. KG)"
          className="min-h-11 rounded-xl border-2 border-sky-200 bg-white px-3 outline-none focus:border-cyan-500"
        />
        <button
          type="button"
          onClick={onCreateClass}
          disabled={classCreateLoading}
          className="inline-flex min-h-11 items-center justify-center rounded-xl border-2 border-sky-200 bg-white px-4 py-2 text-base font-bold text-slate-900"
        >
          {classCreateLoading ? 'Creating...' : 'Create Class'}
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
                  onClick={() => onSelectClass(item.id)}
                  className={`rounded-lg border px-3 py-2 text-left ${
                    selectedClassId === item.id
                      ? 'border-cyan-500 bg-cyan-100 text-cyan-900'
                      : 'border-sky-100 bg-white text-slate-800'
                  }`}
                >
                  <p className="font-bold">{item.name}</p>
                  <p className="text-sm">Grade: {item.grade}</p>
                  <p className="text-sm">Students: {item.activeStudentCount}</p>
                </button>
              ))
            )}
          </div>
        </article>

        <article className="rounded-xl border border-sky-100 bg-white p-3">
          <p className="text-sm font-semibold text-slate-600">
            {selectedClass ? `Roster for ${selectedClass.name}` : 'Select a class'}
          </p>

          <div className="mt-3 grid gap-3 md:grid-cols-[1.5fr_auto]">
            <select
              value={selectedWorkspaceStudentId}
              onChange={(event) => onSelectWorkspaceStudent(event.target.value)}
              className="min-h-11 rounded-xl border-2 border-sky-200 bg-white px-3 outline-none focus:border-cyan-500"
            >
              <option value="">Select workspace student</option>
              {workspaceStudents.map((student) => (
                <option key={student.learnerId} value={student.learnerId}>
                  {student.displayName} ({student.email})
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={onAddStudentToClass}
              disabled={assignLoading}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border-2 border-sky-200 bg-white px-4 py-2 text-base font-bold text-slate-900"
            >
              {assignLoading ? 'Adding...' : 'Add Student'}
            </button>
          </div>

          <div className="mt-3 max-h-56 overflow-auto rounded-lg border border-sky-100 bg-slate-50">
            {selectedClassStudents.length ? (
              <table className="w-full text-left text-sm">
                <thead className="bg-sky-100 text-slate-700">
                  <tr>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedClassStudents.map((student) => (
                    <tr key={student.learnerId} className="border-t border-sky-100">
                      <td className="px-3 py-2">{student.displayName}</td>
                      <td className="px-3 py-2">{student.email}</td>
                      <td className="px-3 py-2 capitalize">{student.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="px-3 py-3 text-sm text-slate-600">
                {selectedClass ? 'No students in this class yet.' : 'Choose a class to view roster.'}
              </p>
            )}
          </div>
        </article>
      </div>

      {rosterError ? <p className="mt-3 text-sm font-semibold text-red-700">{rosterError}</p> : null}
      {rosterNote ? <p className="mt-3 text-sm font-semibold text-cyan-900">{rosterNote}</p> : null}
    </section>
  )
}
