import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Cronômetro regressivo baseado em timestamp (não em contagem de ticks), para
 * continuar correto quando o navegador suspende o timer em segundo plano.
 */
export function useTimer(totalSeconds: number) {
  const [remaining, setRemaining] = useState(totalSeconds)
  const [running, setRunning] = useState(false)
  const deadlineRef = useRef<number | null>(null)

  // Trocar de passo redefine o cronômetro.
  useEffect(() => {
    setRemaining(totalSeconds)
    setRunning(false)
    deadlineRef.current = null
  }, [totalSeconds])

  useEffect(() => {
    if (!running) return

    const tick = () => {
      if (deadlineRef.current == null) return
      const left = Math.max(0, Math.round((deadlineRef.current - Date.now()) / 1000))
      setRemaining(left)
      if (left === 0) setRunning(false)
    }

    const interval = setInterval(tick, 500)
    const onVisible = () => document.visibilityState === 'visible' && tick()
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [running])

  const start = useCallback(() => {
    deadlineRef.current = Date.now() + remaining * 1000
    setRunning(true)
  }, [remaining])

  const pause = useCallback(() => {
    setRunning(false)
    deadlineRef.current = null
  }, [])

  const reset = useCallback(() => {
    setRunning(false)
    deadlineRef.current = null
    setRemaining(totalSeconds)
  }, [totalSeconds])

  const toggle = useCallback(() => (running ? pause() : start()), [running, pause, start])

  const elapsed = totalSeconds - remaining
  const progress = totalSeconds > 0 ? (elapsed / totalSeconds) * 100 : 0

  return { remaining, running, start, pause, reset, toggle, progress, elapsed }
}

/** Segundos → 'MM:SS'. */
export function formatSeconds(total: number): string {
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
