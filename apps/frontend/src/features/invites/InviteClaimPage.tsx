import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../../components/ui/form'
import { Input } from '../../components/ui/input'
import { appShellClass } from '../../ui/layout'
import { claimInvite, fetchInviteByToken } from './api'

const claimSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  actorType: z.enum(['student', 'parent']),
})

type ClaimFormValues = z.infer<typeof claimSchema>

export function InviteClaimPage() {
  const navigate = useNavigate()
  const { token } = useParams<{ token: string }>()
  const [loadingInvite, setLoadingInvite] = useState(true)
  const [inviteValid, setInviteValid] = useState(false)
  const [inviteReason, setInviteReason] = useState<string | null>(null)
  const [inviteStudentName, setInviteStudentName] = useState<string | null>(null)
  const [inviteExpiresAt, setInviteExpiresAt] = useState<string | null>(null)

  const form = useForm<ClaimFormValues>({
    resolver: zodResolver(claimSchema),
    defaultValues: {
      displayName: '',
      email: '',
      actorType: 'student',
    },
  })

  useEffect(() => {
    if (!token) {
      setInviteValid(false)
      setInviteReason('Invite token is missing.')
      setLoadingInvite(false)
      return
    }

    fetchInviteByToken(token)
      .then((result) => {
        setInviteValid(result.valid)
        setInviteReason(result.reason ?? null)
        setInviteStudentName(result.invite?.studentName ?? null)
        setInviteExpiresAt(result.invite?.expiresAt ?? null)
      })
      .catch((error) => {
        setInviteValid(false)
        setInviteReason(error instanceof Error ? error.message : 'Failed to load invite')
      })
      .finally(() => {
        setLoadingInvite(false)
      })
  }, [token])

  const inviteMeta = useMemo(() => {
    if (!inviteExpiresAt) return null
    return new Date(inviteExpiresAt).toLocaleString()
  }, [inviteExpiresAt])

  async function onSubmit(values: ClaimFormValues) {
    if (!token) return
    form.clearErrors('root')
    try {
      const result = await claimInvite(token, values)
      navigate(result.result.nextStepPath)
    } catch (error) {
      form.setError('root', {
        message: error instanceof Error ? error.message : 'Failed to claim invite',
      })
    }
  }

  return (
    <div className={appShellClass()}>
      <main className="mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-10">
        <Card className="mx-auto w-full max-w-xl">
          <CardHeader>
            <p className="font-bold tracking-wide text-cyan-800">Invite Onboarding</p>
            <CardTitle className="mt-1">Join Class</CardTitle>
            <CardDescription className="mt-2">
              Use this invite to connect your student or parent account with the class.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingInvite ? (
              <p className="text-slate-700">Checking invite...</p>
            ) : !inviteValid ? (
              <div className="grid gap-3">
                <p className="text-sm font-semibold text-red-700">
                  {inviteReason ?? 'Invite is not valid.'}
                </p>
                <Link className="font-bold text-cyan-800 underline" to="/">
                  Go to home
                </Link>
              </div>
            ) : (
              <Form {...form}>
                <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
                  <div className="rounded-xl border border-sky-100 bg-sky-50 p-3 text-sm text-slate-700">
                    <p>
                      Target student:{' '}
                      <strong>{inviteStudentName?.trim() || 'Not specified'}</strong>
                    </p>
                    <p>Invite expires: {inviteMeta ?? 'N/A'}</p>
                  </div>

                  <FormField
                    control={form.control}
                    name="actorType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>I am joining as</FormLabel>
                        <div className="flex gap-3">
                          <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border-2 border-sky-200 bg-white px-3">
                            <input
                              type="radio"
                              checked={field.value === 'student'}
                              onChange={() => field.onChange('student')}
                            />
                            Student
                          </label>
                          <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border-2 border-sky-200 bg-white px-3">
                            <input
                              type="radio"
                              checked={field.value === 'parent'}
                              onChange={() => field.onChange('parent')}
                            />
                            Parent
                          </label>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Mariam Ahmed" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="parent@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.formState.errors.root?.message ? (
                    <p className="text-sm text-red-700">{form.formState.errors.root.message}</p>
                  ) : null}

                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Joining...' : 'Join Class'}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
