import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { fetchTeacherProfile } from './api'
import { buildUserIdFromEmail, setSession } from './session'
import { appShellClass } from '../../ui/layout'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../../components/ui/form'
import { Input } from '../../components/ui/input'

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

type SignInFormValues = z.infer<typeof signInSchema>

export function SignInPage() {
  const navigate = useNavigate()
  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '' },
  })

  async function onSubmit(values: SignInFormValues) {
    form.clearErrors('root')

    try {
      const normalizedEmail = values.email.trim().toLowerCase()
      const userId = buildUserIdFromEmail(normalizedEmail)
      setSession({ userId, email: normalizedEmail })
      try {
        const profile = await fetchTeacherProfile(userId)
        navigate(profile ? '/dashboard' : '/onboarding')
      } catch {
        navigate('/onboarding')
      }
    } catch {
      form.setError('root', {
        message: 'Could not continue sign in. Please try again.',
      })
    }
  }

  return (
    <div className={appShellClass()}>
      <main className="mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-10">
        <Card className="mx-auto w-full max-w-xl">
          <CardHeader>
            <p className="font-bold tracking-wide text-cyan-800">Teacher Sign In</p>
            <CardTitle className="mt-1">Welcome Back</CardTitle>
            <CardDescription className="mt-2">
              Continue with your teacher email to access your workspace.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          autoComplete="email"
                          placeholder="teacher@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.formState.errors.root?.message ? (
                  <p className="text-sm text-red-700">{form.formState.errors.root.message}</p>
                ) : null}

                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>
            </Form>

            <div className="mt-4 text-sm text-slate-600">
            First time here? You will continue to onboarding after sign-in.
            </div>
            <Link className="mt-3 inline-flex font-bold text-cyan-800 underline" to="/">
              Back to landing
            </Link>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
