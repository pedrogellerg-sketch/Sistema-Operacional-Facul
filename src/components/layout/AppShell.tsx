import type { ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Apple, BarChart3, CalendarDays, Dumbbell, GraduationCap, Home, Zap } from 'lucide-react'

import { cn } from '@/lib/utils'

const TABS = [
  { to: '/', label: 'Hoje', icon: Home },
  { to: '/amanha', label: 'Amanhã', icon: CalendarDays },
  { to: '/agora', label: 'Agora', icon: Zap, highlight: true },
  { to: '/treino', label: 'Treino', icon: Dumbbell },
  { to: '/progresso', label: 'Progresso', icon: BarChart3 },
] as const

/** Abas secundárias — acessíveis pelo desktop e por atalhos nas telas. */
const DESKTOP_EXTRA = [
  { to: '/estudos', label: 'Estudos', icon: GraduationCap },
  { to: '/comida', label: 'Alimentação', icon: Apple },
] as const

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const { pathname } = useLocation()
  // O modo execução é imersivo: sem navegação competindo com a tarefa.
  const immersive = pathname.startsWith('/agora')

  if (immersive) return <>{children}</>

  return (
    <div className="min-h-dvh bg-base">
      <DesktopNav />

      <main className="mx-auto w-full max-w-2xl px-4 pt-4 pb-28 lg:max-w-3xl lg:pl-[248px] lg:pb-10">
        {children}
      </main>

      <BottomNav />
    </div>
  )
}

function BottomNav() {
  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line-soft bg-base/85 backdrop-blur-xl lg:hidden">
      <div className="mx-auto flex max-w-2xl items-stretch justify-around px-2 pt-1.5 pb-1">
        {TABS.map(({ to, label, icon: Icon, ...rest }) => {
          const highlight = 'highlight' in rest && rest.highlight

          return (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-1 py-2 transition-colors',
                  highlight
                    ? 'text-accent'
                    : isActive
                      ? 'text-ink'
                      : 'text-ink-3 hover:text-ink-2',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      'flex h-8 w-12 items-center justify-center rounded-xl transition-colors',
                      highlight && 'bg-accent text-accent-ink',
                      !highlight && isActive && 'bg-surface-2',
                    )}
                  >
                    <Icon size={19} strokeWidth={isActive || highlight ? 2.4 : 2} />
                  </span>
                  <span className="text-[10px] font-medium tracking-wide">{label}</span>
                </>
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}

function DesktopNav() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-56 flex-col border-r border-line-soft bg-surface/40 px-4 py-6 lg:flex">
      <div className="mb-8 px-2">
        <p className="text-[11px] font-semibold tracking-[0.2em] text-ink-3 uppercase">Sistema</p>
        <p className="text-xl font-bold tracking-tight text-ink">Fernando</p>
      </div>

      <nav className="flex flex-col gap-1">
        {[...TABS, ...DESKTOP_EXTRA].map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-surface-2 text-ink'
                  : 'text-ink-3 hover:bg-surface-2/60 hover:text-ink-2',
              )
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto px-2">
        <NavLink
          to="/rotina"
          className="block rounded-2xl border border-line-soft bg-surface-2/60 px-3 py-3 text-[13px] text-ink-3 transition-colors hover:text-ink-2"
        >
          Ajustar rotina e matérias
        </NavLink>
      </div>
    </aside>
  )
}
