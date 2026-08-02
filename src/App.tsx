import { Navigate, Route, Routes } from 'react-router-dom'

import { AppShell } from '@/components/layout/AppShell'
import { Food } from '@/screens/Food'
import { FocusMode } from '@/screens/FocusMode'
import { Onboarding } from '@/screens/Onboarding'
import { Progress } from '@/screens/Progress'
import { Routine } from '@/screens/Routine'
import { SettingsScreen } from '@/screens/Settings'
import { Study } from '@/screens/Study'
import { Today } from '@/screens/Today'
import { Workout } from '@/screens/Workout'
import { useAppStore } from '@/store/appStore'

export default function App() {
  const onboarded = useAppStore((s) => s.profile.onboarded)

  // Antes do onboarding não há rota alguma: o app tem uma porta só.
  if (!onboarded) return <Onboarding />

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Today />} />
        <Route path="/agora" element={<FocusMode />} />
        <Route path="/estudos" element={<Study />} />
        <Route path="/treino" element={<Workout />} />
        <Route path="/comida" element={<Food />} />
        <Route path="/progresso" element={<Progress />} />
        <Route path="/rotina" element={<Routine />} />
        <Route path="/ajustes" element={<SettingsScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  )
}
