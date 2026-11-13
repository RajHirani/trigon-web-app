import { QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Placeholder } from '@/app/Placeholder'
import { queryClient } from '@/app/queryClient'
import { MENU } from '@/config/menu'
import ForgotPasswordPage from '@/features/auth/ForgotPasswordPage'
import ResetPasswordPage from '@/features/auth/ResetPasswordPage'
import { RequireAuth } from '@/features/auth/RequireAuth'
import SignInPage from '@/features/auth/SignInPage'
import { AppShell } from '@/features/shell/AppShell'
import { restoreSession } from '@/services/auth/authService'

export default function App() {
  useEffect(() => {
    void restoreSession()
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<SignInPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route element={<RequireAuth />}>
            <Route element={<AppShell />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              {MENU.flatMap((g) => g.items).map((i) => (
                <Route key={i.path} path={i.path} element={<Placeholder title={i.label} />} />
              ))}
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
