import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'
import { useId } from 'react'
import { cn } from '@/lib/utils'

const BASE_INPUT =
  'w-full rounded-2xl border border-line bg-surface-2 px-4 py-3 text-sm text-ink placeholder:text-ink-3 ' +
  'transition-colors focus:border-accent/60 focus:outline-none'

interface FieldProps {
  label: string
  hint?: string
  children: ReactNode
  className?: string
  htmlFor?: string
}

export function Field({ label, hint, children, className, htmlFor }: FieldProps) {
  return (
    <label className={cn('block', className)} htmlFor={htmlFor}>
      <span className="mb-2 block text-[13px] font-medium text-ink-2">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-[12px] text-ink-3">{hint}</span>}
    </label>
  )
}

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
}

export function TextInput({ label, hint, className, ...props }: TextInputProps) {
  const id = useId()
  const input = <input id={id} className={cn(BASE_INPUT, className)} {...props} />

  if (!label) return input
  return (
    <Field label={label} hint={hint} htmlFor={id}>
      {input}
    </Field>
  )
}

interface TimeInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
}

export function TimeInput({ label, className, ...props }: TimeInputProps) {
  const id = useId()
  const input = (
    <input
      id={id}
      type="time"
      className={cn(BASE_INPUT, 'tnum [color-scheme:dark]', className)}
      {...props}
    />
  )

  if (!label) return input
  return (
    <Field label={label} htmlFor={id}>
      {input}
    </Field>
  )
}

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
}

export function TextArea({ label, hint, className, ...props }: TextAreaProps) {
  const id = useId()
  const area = (
    <textarea id={id} className={cn(BASE_INPUT, 'min-h-[88px] resize-y', className)} {...props} />
  )

  if (!label) return area
  return (
    <Field label={label} hint={hint} htmlFor={id}>
      {area}
    </Field>
  )
}

interface NumberStepperProps {
  value: number
  onChange: (value: number) => void
  step?: number
  min?: number
  max?: number
  suffix?: string
  label?: string
}

/** Stepper com alvos grandes — digitar número no celular é fricção. */
export function NumberStepper({
  value,
  onChange,
  step = 1,
  min = 0,
  max = 999,
  suffix,
  label,
}: NumberStepperProps) {
  const clampValue = (v: number) => Math.min(max, Math.max(min, Math.round(v * 100) / 100))

  const control = (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(clampValue(value - step))}
        aria-label="Diminuir"
        className="h-11 w-11 shrink-0 rounded-xl bg-surface-3 text-lg font-semibold text-ink transition-colors hover:bg-surface-2 active:scale-95"
      >
        −
      </button>
      <div className="flex-1 rounded-xl bg-surface-2 py-3 text-center">
        <span className="tnum text-base font-semibold text-ink">{value}</span>
        {suffix && <span className="ml-1 text-[13px] text-ink-3">{suffix}</span>}
      </div>
      <button
        onClick={() => onChange(clampValue(value + step))}
        aria-label="Aumentar"
        className="h-11 w-11 shrink-0 rounded-xl bg-surface-3 text-lg font-semibold text-ink transition-colors hover:bg-surface-2 active:scale-95"
      >
        +
      </button>
    </div>
  )

  if (!label) return control
  return <Field label={label}>{control}</Field>
}
