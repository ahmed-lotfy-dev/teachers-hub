type WhatsAppInviteSectionProps = {
  studentName: string
  inviteMessage: string
  inviteLink: string
  inviteExpiryLabel: string | null
  inviteLoading: boolean
  inviteError: string | null
  shareNote: string | null
  onStudentNameChange: (value: string) => void
  onInviteMessageChange: (value: string) => void
  onGenerateInvite: () => void
  onShareWhatsApp: () => void
  onCopyInvite: () => void
}

export function WhatsAppInviteSection({
  studentName,
  inviteMessage,
  inviteLink,
  inviteExpiryLabel,
  inviteLoading,
  inviteError,
  shareNote,
  onStudentNameChange,
  onInviteMessageChange,
  onGenerateInvite,
  onShareWhatsApp,
  onCopyInvite,
}: WhatsAppInviteSectionProps) {
  return (
    <section className="mt-5 rounded-2xl border-2 border-sky-100 bg-white/90 p-4">
      <h3 className="text-lg font-extrabold text-slate-900">Share Invite On WhatsApp</h3>
      <p className="mt-2 text-slate-700">
        Invite link is generated automatically. Edit your message, then share from your own WhatsApp
        account.
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="font-semibold text-slate-700">Student Name (optional)</span>
          <input
            type="text"
            value={studentName}
            onChange={(event) => onStudentNameChange(event.target.value)}
            placeholder="Mariam Ahmed"
            className="min-h-11 rounded-xl border-2 border-sky-200 bg-white px-3 outline-none focus:border-cyan-500"
          />
        </label>

        <label className="grid gap-2 md:col-span-2">
          <span className="font-semibold text-slate-700">Invite Message</span>
          <textarea
            value={inviteMessage}
            onChange={(event) => onInviteMessageChange(event.target.value)}
            rows={4}
            className="w-full rounded-xl border-2 border-sky-200 bg-white px-3 py-2 outline-none focus:border-cyan-500"
          />
        </label>

        <div className="grid gap-2 md:col-span-2">
          <span className="font-semibold text-slate-700">Generated Invite Link</span>
          <div className="rounded-xl border-2 border-sky-200 bg-slate-50 px-3 py-2 break-all text-sm text-slate-800">
            {inviteLink || 'No invite generated yet.'}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onGenerateInvite}
          disabled={inviteLoading}
          className="inline-flex min-h-11 cursor-pointer items-center rounded-xl border-2 border-sky-200 bg-white px-4 py-2 text-base font-bold text-slate-900"
        >
          {inviteLoading ? 'Generating...' : 'Generate New Link'}
        </button>
        <button
          type="button"
          onClick={onShareWhatsApp}
          disabled={!inviteLink}
          className="inline-flex min-h-11 cursor-pointer items-center rounded-xl bg-linear-to-br from-emerald-300 to-lime-300 px-4 py-2 text-base font-extrabold text-slate-900"
        >
          Share On WhatsApp
        </button>
        <button
          type="button"
          onClick={onCopyInvite}
          disabled={!inviteLink}
          className="inline-flex min-h-11 cursor-pointer items-center rounded-xl border-2 border-sky-200 bg-white px-4 py-2 text-base font-bold text-slate-900"
        >
          Copy Link
        </button>
      </div>

      {inviteExpiryLabel ? (
        <p className="mt-3 text-sm font-semibold text-slate-700">Expires: {inviteExpiryLabel}</p>
      ) : null}
      {inviteError ? <p className="mt-3 text-sm font-semibold text-red-700">{inviteError}</p> : null}
      {shareNote ? <p className="mt-3 text-sm font-semibold text-cyan-900">{shareNote}</p> : null}
    </section>
  )
}
