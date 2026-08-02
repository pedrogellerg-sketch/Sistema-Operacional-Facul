import { useEffect, useState } from 'react'
import { nowMinutes, todayISO } from '@/lib/date'

/**
 * Relógio que avança de minuto em minuto e mantém a data corrente.
 *
 * Alinha o primeiro tick à virada do minuto para o "agora" não ficar até 59s
 * atrasado, e revalida quando a aba volta ao foco — em PWA o timer é congelado
 * enquanto o app está em segundo plano.
 */
export function useClock() {
  const [minutes, setMinutes] = useState(() => nowMinutes())
  const [date, setDate] = useState(() => todayISO())

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined

    const sync = () => {
      setMinutes(nowMinutes())
      setDate(todayISO())
    }

    const msToNextMinute = (60 - new Date().getSeconds()) * 1000
    const timeout = setTimeout(() => {
      sync()
      interval = setInterval(sync, 60_000)
    }, msToNextMinute)

    const onVisible = () => {
      if (document.visibilityState === 'visible') sync()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)

    return () => {
      clearTimeout(timeout)
      if (interval) clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [])

  return { minutes, date }
}
