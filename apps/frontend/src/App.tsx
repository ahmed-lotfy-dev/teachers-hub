import { Navigate, Route, Routes } from 'react-router-dom'
import { SignInPage } from './features/auth/SignInPage'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { LandingPage } from './features/landing/LandingPage'
import { OnboardingPage } from './features/onboarding/OnboardingPage'
import { InviteClaimPage } from './features/invites/InviteClaimPage'
import { TestEntryPage } from './features/tests/TestEntryPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/invite/:token" element={<InviteClaimPage />} />
      <Route path="/tests" element={<TestEntryPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
