import { Link } from 'react-router-dom'
import { appShellClass } from '../../ui/layout'

const landingFeatures = [
  'Live class-vs-class and in-class challenges',
  'Teacher-first workflow with private workspace',
  'Per-student progress tracking across all grades',
  'School selection in onboarding for future scaling',
]

export function LandingPage() {
  return (
    <div className={appShellClass()}>
      <header className="sticky top-0 z-20 border-b border-sky-100/90 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3">
          <div className="inline-flex items-center gap-2 text-xl font-extrabold">
            <span
              className="h-3.5 w-3.5 rounded-full bg-linear-to-br from-[#ff8f76] to-[#ffd76f]"
              aria-hidden="true"
            />
            <span>Teachers Hub</span>
          </div>
          <Link
            to="/signin"
            className="inline-flex min-h-11 items-center rounded-xl border-2 border-sky-200 bg-white/80 px-4 py-2 font-bold transition-transform duration-200 hover:-translate-y-0.5"
          >
            Sign In
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 pt-8 pb-10">
        <section className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <p className="font-bold tracking-wide text-cyan-800">Teacher-First Launch</p>
            <h1 className="mt-1 text-4xl leading-tight font-black text-slate-900 md:text-5xl">
              Online Testing Platform Built For Teachers, Ready To Scale Later
            </h1>
            <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
              Start with your own workspace today. Add your school details during
              onboarding so other teachers can discover it, and evolve to school-wide
              usage when adoption grows.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/signin"
                className="inline-flex min-h-11 items-center rounded-xl bg-linear-to-br from-cyan-300 to-yellow-300 px-4 py-2 text-base font-extrabold text-slate-900 shadow-[0_12px_24px_rgba(23,50,77,0.15)] transition-transform duration-200 hover:-translate-y-0.5"
              >
                Start As Teacher
              </Link>
              <a
                href="#features"
                className="inline-flex min-h-11 items-center rounded-xl bg-white px-4 py-2 text-base font-bold text-slate-800 shadow-[0_10px_18px_rgba(23,50,77,0.12)]"
              >
                View Features
              </a>
            </div>
          </div>
          <div className="rounded-3xl border-2 border-sky-200 bg-white p-5 shadow-[0_16px_26px_rgba(25,58,90,0.14)]">
            <h2 className="text-xl font-extrabold">Launch Flow</h2>
            <ol className="mt-3 grid gap-2 pl-5 text-slate-700">
              <li>Teacher signs in with email</li>
              <li>Teacher selects grades and school</li>
              <li>System creates teacher workspace</li>
              <li>Teacher starts classes and tests</li>
            </ol>
          </div>
        </section>

        <section id="features" className="mt-6 grid gap-4 md:grid-cols-2">
          {landingFeatures.map((feature) => (
            <article
              key={feature}
              className="rounded-2xl border-2 border-sky-100 bg-white/90 p-4 shadow-[0_12px_20px_rgba(23,50,77,0.1)]"
            >
              <p className="text-lg font-bold text-slate-800">{feature}</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  )
}
