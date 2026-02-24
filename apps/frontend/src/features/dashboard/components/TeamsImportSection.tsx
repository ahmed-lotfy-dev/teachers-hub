import type { TeamsJoinedTeam } from '../../integrations/teams/api'

type TeamsImportSectionProps = {
  teamsAccessToken: string
  teamsList: TeamsJoinedTeam[]
  selectedTeamsId: string
  teamsLoading: boolean
  teamsImportLoading: boolean
  teamsError: string | null
  teamsNote: string | null
  onAccessTokenChange: (value: string) => void
  onSelectTeam: (value: string) => void
  onLoadTeams: () => void
  onImportTeamsMembers: () => void
}

export function TeamsImportSection({
  teamsAccessToken,
  teamsList,
  selectedTeamsId,
  teamsLoading,
  teamsImportLoading,
  teamsError,
  teamsNote,
  onAccessTokenChange,
  onSelectTeam,
  onLoadTeams,
  onImportTeamsMembers,
}: TeamsImportSectionProps) {
  return (
    <section className="mt-5 rounded-2xl border-2 border-sky-100 bg-white/90 p-4">
      <h3 className="text-lg font-extrabold text-slate-900">Import Students From Microsoft Teams</h3>
      <p className="mt-2 text-slate-700">
        Paste a Microsoft Graph access token with Teams read permissions, load your Teams list,
        then import members into this workspace roster.
      </p>

      <div className="mt-4 grid gap-3">
        <textarea
          value={teamsAccessToken}
          onChange={(event) => onAccessTokenChange(event.target.value)}
          rows={3}
          placeholder="Microsoft Graph access token"
          className="w-full rounded-xl border-2 border-sky-200 bg-white px-3 py-2 outline-none focus:border-cyan-500"
        />
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onLoadTeams}
            disabled={teamsLoading || teamsImportLoading || !teamsAccessToken.trim()}
            className="inline-flex min-h-11 cursor-pointer items-center rounded-xl border-2 border-sky-200 bg-white px-4 py-2 text-base font-bold text-slate-900"
          >
            {teamsLoading ? 'Loading Teams...' : 'Load My Teams'}
          </button>
          <button
            type="button"
            onClick={onImportTeamsMembers}
            disabled={
              teamsImportLoading || teamsLoading || !teamsAccessToken.trim() || !selectedTeamsId
            }
            className="inline-flex min-h-11 cursor-pointer items-center rounded-xl bg-linear-to-br from-cyan-300 to-yellow-300 px-4 py-2 text-base font-extrabold text-slate-900"
          >
            {teamsImportLoading ? 'Importing...' : 'Import Team Members'}
          </button>
        </div>

        <select
          value={selectedTeamsId}
          onChange={(event) => onSelectTeam(event.target.value)}
          className="min-h-11 rounded-xl border-2 border-sky-200 bg-white px-3 outline-none focus:border-cyan-500"
        >
          <option value="">Select a Team</option>
          {teamsList.map((team) => (
            <option key={team.id} value={team.id}>
              {team.displayName}
            </option>
          ))}
        </select>
      </div>

      {teamsError ? <p className="mt-3 text-sm font-semibold text-red-700">{teamsError}</p> : null}
      {teamsNote ? <p className="mt-3 text-sm font-semibold text-cyan-900">{teamsNote}</p> : null}
    </section>
  )
}
