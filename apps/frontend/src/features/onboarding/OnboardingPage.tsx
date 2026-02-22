import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Navigate, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { getSession } from '../auth/session'
import type { School } from '../auth/types'
import { appShellClass } from '../../ui/layout'
import { createSchool, saveTeacherOnboarding, searchSchools } from './api'
import { gradeOptions } from './grades'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Checkbox } from '../../components/ui/checkbox'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../../components/ui/form'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'

const onboardingSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
  gradeLevels: z.array(z.string()).min(1, 'Select at least one grade level'),
  selectedSchoolId: z.string().optional(),
  newSchoolName: z.string().optional(),
})

type OnboardingFormValues = z.infer<typeof onboardingSchema>

export function OnboardingPage() {
  const navigate = useNavigate()
  const session = getSession()
  const [schoolQuery, setSchoolQuery] = useState('')
  const [schools, setSchools] = useState<School[]>([])
  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      displayName: '',
      gradeLevels: [],
      selectedSchoolId: '',
      newSchoolName: '',
    },
  })

  useEffect(() => {
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const data = await searchSchools(schoolQuery)
        if (!controller.signal.aborted) setSchools(data)
      } catch {
        if (!controller.signal.aborted) setSchools([])
      }
    }, 250)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [schoolQuery])

  if (!session) return <Navigate to="/signin" replace />
  const sessionUserId = session.userId

  async function createSchoolIfNeeded(name?: string): Promise<string | undefined> {
    if (!name?.trim()) return undefined
    const school = await createSchool({
      userId: sessionUserId,
      name: name.trim(),
    })
    return school.id
  }

  async function onSubmit(values: OnboardingFormValues) {
    form.clearErrors('root')

    try {
      const schoolIdFromCreate = await createSchoolIfNeeded(values.newSchoolName)
      await saveTeacherOnboarding({
        userId: sessionUserId,
        displayName: values.displayName.trim(),
        gradeLevels: values.gradeLevels,
        schoolId: (schoolIdFromCreate ?? values.selectedSchoolId) || undefined,
      })
      navigate('/dashboard')
    } catch (error) {
      if (error instanceof Error && error.message.trim()) {
        form.setError('root', { message: error.message })
      } else {
        form.setError('root', {
          message: 'Failed to save onboarding. Please check your data and retry.',
        })
      }
    }
  }

  return (
    <div className={appShellClass()}>
      <main className="mx-auto w-full max-w-7xl px-4 py-8">
        <Card className="mx-auto w-full max-w-3xl">
          <CardHeader>
            <p className="font-bold tracking-wide text-cyan-800">Teacher Onboarding</p>
            <CardTitle className="mt-1">Set Up Your Workspace</CardTitle>
            <CardDescription className="mt-2">
              Add your profile, select grade levels, and pick your school (optional but
              recommended for discoverability).
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form className="grid gap-5" onSubmit={form.handleSubmit(onSubmit)}>
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Ms. Fatima" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gradeLevels"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grade Levels</FormLabel>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {gradeOptions.map((grade) => {
                          const checked = field.value.includes(grade)
                          return (
                            <label
                              key={grade}
                              className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border-2 px-3 font-semibold ${
                                checked
                                  ? 'border-cyan-500 bg-cyan-100 text-cyan-900'
                                  : 'border-sky-100 bg-white text-slate-700'
                              }`}
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(state) => {
                                  const isChecked = state === true
                                  const next = isChecked
                                    ? [...field.value, grade]
                                    : field.value.filter((value) => value !== grade)
                                  field.onChange(next)
                                }}
                              />
                              {grade}
                            </label>
                          )
                        })}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-2">
                  <Label htmlFor="school-search">Search Existing School</Label>
                  <Input
                    id="school-search"
                    placeholder="Type school name..."
                    value={schoolQuery}
                    onChange={(event) => setSchoolQuery(event.target.value)}
                  />
                  <div className="grid max-h-40 gap-2 overflow-y-auto rounded-xl border border-sky-100 bg-white p-2">
                    {schools.length === 0 ? (
                      <p className="text-sm text-slate-500">No schools found yet.</p>
                    ) : (
                      schools.map((school) => (
                        <label
                          key={school.id}
                          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-sky-100 px-3 py-2"
                        >
                          <input
                            type="radio"
                            name="school"
                            checked={form.watch('selectedSchoolId') === school.id}
                            onChange={() => {
                              form.setValue('selectedSchoolId', school.id)
                              form.setValue('newSchoolName', '')
                            }}
                          />
                          <span>
                            {school.name}
                            {school.city || school.country
                              ? ` (${[school.city, school.country].filter(Boolean).join(', ')})`
                              : ''}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="newSchoolName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Add New School (if not listed)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="New school name"
                          {...field}
                          onChange={(event) => {
                            field.onChange(event)
                            if (event.target.value.trim()) {
                              form.setValue('selectedSchoolId', '')
                            }
                          }}
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
                  {form.formState.isSubmitting ? 'Saving...' : 'Finish Onboarding'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
