import { useState } from 'react'
import { ArrowRight, Check } from 'lucide-react'

import type { Weekday } from '@/types'
import { Button } from '@/components/ui/Button'
import { WeekdayPicker } from '@/components/ui/Chip'
import { NumberStepper, TextInput, TimeInput } from '@/components/ui/Field'
import { useAppStore } from '@/store/appStore'
import { WEEKDAY_LETTER } from '@/lib/date'
import { cn } from '@/lib/utils'

/**
 * Onboarding em 4 passos. Cada tela pede uma coisa só e todas têm resposta
 * padrão — o usuário pode atravessar tocando "continuar" e ajustar depois.
 */
export function Onboarding() {
  const completeOnboarding = useAppStore((s) => s.completeOnboarding)

  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [afternoonClassDays, setAfternoonClassDays] = useState<Weekday[]>([2, 4])
  const [workoutDays, setWorkoutDays] = useState<Weekday[]>([1, 2, 3, 5])
  const [schoolStart, setSchoolStart] = useState('07:00')
  const [schoolEnd, setSchoolEnd] = useState('12:20')
  const [wakeTime, setWakeTime] = useState('06:10')
  const [sleepTime, setSleepTime] = useState('23:00')
  const [weight, setWeight] = useState(70)

  const steps = [
    {
      title: 'Como te chamam?',
      description: 'O sistema é seu. Vamos personalizar.',
      content: (
        <TextInput
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Seu primeiro nome"
          autoFocus
        />
      ),
    },
    {
      title: 'Como é sua escola?',
      description: 'Horários de entrada e saída num dia normal.',
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <TimeInput
              label="Entrada"
              value={schoolStart}
              onChange={(e) => setSchoolStart(e.target.value)}
            />
            <TimeInput
              label="Saída"
              value={schoolEnd}
              onChange={(e) => setSchoolEnd(e.target.value)}
            />
          </div>

          <div>
            <p className="mb-2 text-[13px] font-medium text-ink-2">Dias com aula à tarde</p>
            <WeekdayPicker
              value={afternoonClassDays}
              onChange={(d) => setAfternoonClassDays(d as Weekday[])}
              labels={WEEKDAY_LETTER}
            />
            <p className="mt-2 text-[12px] text-ink-3">
              Nesses dias o estudo vai para a noite, num bloco só.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'Quando você treina?',
      description: 'Escolha os dias. Dá para mudar depois.',
      content: (
        <div className="space-y-4">
          <WeekdayPicker
            value={workoutDays}
            onChange={(d) => setWorkoutDays(d as Weekday[])}
            labels={WEEKDAY_LETTER}
          />
          <NumberStepper
            label="Seu peso hoje (para acompanhar o ganho)"
            value={weight}
            onChange={setWeight}
            step={0.5}
            min={30}
            max={200}
            suffix="kg"
          />
        </div>
      ),
    },
    {
      title: 'Acordar e dormir',
      description: 'Sono é parte do plano, não sobra dele.',
      content: (
        <div className="grid grid-cols-2 gap-3">
          <TimeInput label="Acordar" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} />
          <TimeInput label="Dormir" value={sleepTime} onChange={(e) => setSleepTime(e.target.value)} />
        </div>
      ),
    },
  ]

  const isLast = step === steps.length - 1
  const current = steps[step]

  const handleNext = () => {
    if (!isLast) {
      setStep((s) => s + 1)
      return
    }
    completeOnboarding({
      name,
      afternoonClassDays,
      workoutDays,
      wakeTime,
      sleepTime,
      schoolStart,
      schoolEnd,
      weightKg: weight,
    })
  }

  return (
    <div className="flex min-h-dvh flex-col bg-base">
      {/* ── Marca ───────────────────────────────────────── */}
      <div className="safe-top mx-auto w-full max-w-md px-6 pt-8">
        <p className="text-[11px] font-bold tracking-[0.22em] text-ink-3 uppercase">Sistema</p>
        <p className="text-[22px] leading-none font-bold tracking-tight text-ink">Fernando</p>

        <div className="mt-6 flex gap-1.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-1 flex-1 rounded-full transition-colors duration-300',
                i <= step ? 'bg-accent' : 'bg-surface-3',
              )}
            />
          ))}
        </div>
      </div>

      {/* ── Passo ───────────────────────────────────────── */}
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-10">
        <div key={step} className="animate-in-up">
          <h1 className="text-[32px] leading-[1.1] font-bold tracking-tight text-ink">
            {current.title}
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{current.description}</p>
          <div className="mt-7">{current.content}</div>
        </div>
      </div>

      {/* ── Ações ───────────────────────────────────────── */}
      <div className="safe-bottom mx-auto w-full max-w-md space-y-2 px-6 pb-6">
        <Button
          variant="primary"
          size="lg"
          full
          onClick={handleNext}
          icon={isLast ? <Check size={19} /> : <ArrowRight size={18} />}
        >
          {isLast ? 'Montar meu sistema' : 'Continuar'}
        </Button>

        {step > 0 && (
          <Button variant="ghost" size="md" full onClick={() => setStep((s) => s - 1)}>
            Voltar
          </Button>
        )}
      </div>
    </div>
  )
}
