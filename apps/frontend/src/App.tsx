import { Navigate, Route, Routes } from 'react-router-dom'
import { SignInPage } from './features/auth/SignInPage'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { ChildrenPage } from './features/dashboard/ChildrenPage'
import { InviteManagementPage } from './features/dashboard/InviteManagementPage'
import { LandingPage } from './features/landing/LandingPage'
import { OnboardingPage } from './features/onboarding/OnboardingPage'
import { InviteClaimPage } from './features/invites/InviteClaimPage'
import { TestEntryPage } from './features/tests/TestEntryPage'
import { PublicTestPage } from './features/tests/PublicTestPage'
import { TeacherTestDetailPage } from './features/tests/TeacherTestDetailPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/students" element={<ChildrenPage />} />
      <Route path="/children" element={<Navigate to="/students" replace />} />
      <Route path="/invites" element={<InviteManagementPage />} />
      <Route path="/invite/:token" element={<InviteClaimPage />} />
      <Route path="/dashboard/tests/:testId" element={<TeacherTestDetailPage />} />
      <Route path="/tests/:testId" element={<PublicTestPage />} />
      <Route path="/tests" element={<TestEntryPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
