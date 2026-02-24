import { NavLink, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { signOut } from '../auth/session'

type TeacherTopNavProps = {
  title: string
}

export function TeacherTopNav({ title }: TeacherTopNavProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  async function handleSignOut() {
    try {
      await signOut()
    } catch {
      // Even if sign-out API fails, force return to sign-in screen.
    } finally {
      queryClient.removeQueries({ queryKey: ['auth'] })
      queryClient.removeQueries({ queryKey: ['teacher'] })
      navigate('/signin', { replace: true })
    }
  }

  return (
    <header className="border-b border-sky-100/90 bg-white/85">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-extrabold text-slate-900">{title}</h1>
          <nav className="flex items-center gap-2">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-bold ${
                  isActive ? 'bg-cyan-100 text-cyan-900' : 'text-slate-700 hover:bg-slate-100'
                }`
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/students"
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-bold ${
                  isActive ? 'bg-cyan-100 text-cyan-900' : 'text-slate-700 hover:bg-slate-100'
                }`
              }
            >
              Students
            </NavLink>
            <NavLink
              to="/invites"
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-bold ${
                  isActive ? 'bg-cyan-100 text-cyan-900' : 'text-slate-700 hover:bg-slate-100'
                }`
              }
            >
              Invites
            </NavLink>
          </nav>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="inline-flex min-h-11 cursor-pointer items-center rounded-xl border-2 border-sky-200 bg-white px-4 py-2 font-bold"
        >
          Sign Out
        </button>
      </div>
    </header>
  )
}
