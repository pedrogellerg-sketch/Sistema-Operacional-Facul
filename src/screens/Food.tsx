import { useState } from 'react'
import { AlertTriangle, Check, Package, Pencil, Plus, ShoppingCart, Trash2 } from 'lucide-react'

import type { MealPlan } from '@/types'
import { Button, IconButton } from '@/components/ui/Button'
import { Card, SectionTitle } from '@/components/ui/Card'
import { Segmented } from '@/components/ui/Chip'
import { Sheet } from '@/components/ui/Sheet'
import { TextArea, TextInput, TimeInput } from '@/components/ui/Field'
import { PageHeader } from '@/components/layout/PageHeader'

import { useAppStore } from '@/store/appStore'
import { useDayLog, useMissingEssentials } from '@/store/selectors'
import { QUICK_SHOPPING_SUGGESTIONS } from '@/data/nutrition'
import { cn, plural } from '@/lib/utils'

type Tab = 'hoje' | 'estoque' | 'compras'

/**
 * Alimentação sem virar app de nutrição: marcar o que comeu, saber o que tem
 * em casa e o que falta comprar. Três abas, nenhuma contagem de caloria.
 */
export function Food() {
  const [tab, setTab] = useState<Tab>('hoje')
  const missing = useMissingEssentials()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alimentação"
        subtitle="Comer direito é o que sustenta treino e estudo."
      />

      {missing.length > 0 && (
        <Card variant="flat" className="flex items-start gap-3 border-warn/20 py-3.5">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-warn" />
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-semibold text-ink">
              {plural(missing.length, 'item base em falta', 'itens base em falta')}
            </p>
            <p className="mt-0.5 text-[12.5px] text-ink-2">
              {missing.map((m) => m.name).join(', ')}
            </p>
          </div>
        </Card>
      )}

      <Segmented
        value={tab}
        options={[
          { value: 'hoje', label: 'Hoje' },
          { value: 'estoque', label: 'Estoque' },
          { value: 'compras', label: 'Compras' },
        ]}
        onChange={setTab}
      />

      {tab === 'hoje' && <TodayMeals />}
      {tab === 'estoque' && <Pantry />}
      {tab === 'compras' && <Shopping />}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────

function TodayMeals() {
  const meals = useAppStore((s) => s.meals)
  const toggleMeal = useAppStore((s) => s.toggleMeal)
  const updateMeal = useAppStore((s) => s.updateMeal)
  const log = useDayLog()

  const [editing, setEditing] = useState<MealPlan | null>(null)
  const [draft, setDraft] = useState({ description: '', time: '' })

  const enabled = meals.filter((m) => m.enabled)
  const done = enabled.filter((m) => log?.meals[m.slot]).length

  const openEditor = (meal: MealPlan) => {
    setEditing(meal)
    setDraft({ description: meal.description, time: meal.time })
  }

  return (
    <div className="space-y-3">
      <SectionTitle hint={`${done} de ${enabled.length} refeições marcadas`}>
        Refeições de hoje
      </SectionTitle>

      <div className="space-y-2">
        {meals.map((meal) => {
          const checked = log?.meals[meal.slot] ?? false

          return (
            <Card
              key={meal.slot}
              className={cn('flex items-center gap-3 p-3.5', !meal.enabled && 'opacity-45')}
            >
              <button
                onClick={() => toggleMeal(meal.slot)}
                aria-label={`Marcar ${meal.label}`}
                disabled={!meal.enabled}
                className={cn(
                  'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition-colors',
                  checked
                    ? 'border-transparent bg-ok/15 text-ok'
                    : 'border-line bg-surface-2 text-ink-3 hover:border-ink-3',
                )}
              >
                <Check size={19} />
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <p
                    className={cn(
                      'truncate text-[14.5px] font-semibold',
                      checked ? 'text-ink-3' : 'text-ink',
                    )}
                  >
                    {meal.label}
                  </p>
                  <span className="tnum shrink-0 text-[11.5px] text-ink-3">{meal.time}</span>
                </div>
                <p className="mt-0.5 truncate text-[12.5px] text-ink-2">{meal.description}</p>
              </div>

              <IconButton label={`Editar ${meal.label}`} onClick={() => openEditor(meal)}>
                <Pencil size={15} />
              </IconButton>
            </Card>
          )
        })}
      </div>

      <Sheet
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?.label}
        description="O que você come nessa refeição, do seu jeito."
        footer={
          <Button
            variant="primary"
            size="lg"
            full
            onClick={() => {
              if (editing) updateMeal(editing.slot, { ...draft })
              setEditing(null)
            }}
          >
            Salvar
          </Button>
        }
      >
        {editing && (
          <div className="space-y-4">
            <TextArea
              label="O que comer"
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              placeholder="Ex.: 3 ovos, pão integral, banana"
            />
            <TimeInput
              label="Horário"
              value={draft.time}
              onChange={(e) => setDraft((d) => ({ ...d, time: e.target.value }))}
            />
            <div className="rounded-2xl border border-line-soft bg-surface-2 px-4 py-3">
              <button
                onClick={() => {
                  updateMeal(editing.slot, { enabled: !editing.enabled })
                  setEditing({ ...editing, enabled: !editing.enabled })
                }}
                className="flex w-full items-center justify-between text-left"
              >
                <span className="text-[13.5px] text-ink-2">
                  {editing.enabled ? 'Refeição ativa' : 'Refeição desativada'}
                </span>
                <span className="text-[13px] font-semibold text-accent">
                  {editing.enabled ? 'Desativar' : 'Ativar'}
                </span>
              </button>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────

function Pantry() {
  const pantry = useAppStore((s) => s.pantry)
  const togglePantryItem = useAppStore((s) => s.togglePantryItem)
  const addPantryItem = useAppStore((s) => s.addPantryItem)
  const removePantryItem = useAppStore((s) => s.removePantryItem)
  const addMissing = useAppStore((s) => s.addMissingEssentialsToShopping)

  const [name, setName] = useState('')
  const [essential, setEssential] = useState(false)
  const [feedback, setFeedback] = useState('')

  const missing = pantry.filter((p) => p.essential && !p.inStock)

  return (
    <div className="space-y-3">
      <SectionTitle hint="Toque para marcar o que tem e o que acabou">Estoque da casa</SectionTitle>

      {missing.length > 0 && (
        <Button
          variant="outline"
          size="md"
          full
          icon={<ShoppingCart size={16} />}
          onClick={() => {
            const added = addMissing()
            setFeedback(
              added > 0
                ? `${plural(added, 'item adicionado', 'itens adicionados')} à lista de compras.`
                : 'Já estavam na lista.',
            )
          }}
        >
          Jogar itens em falta na lista
        </Button>
      )}

      {feedback && <p className="px-1 text-[12.5px] text-accent">{feedback}</p>}

      <Card className="p-2">
        <ul className="divide-y divide-line-soft">
          {pantry.map((item) => (
            <li key={item.id} className="flex items-center gap-3 px-2 py-2.5">
              <button
                onClick={() => togglePantryItem(item.id)}
                aria-label={`${item.name}: ${item.inStock ? 'tem em casa' : 'acabou'}`}
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors',
                  item.inStock
                    ? 'border-transparent bg-ok/12 text-ok'
                    : 'border-warn/30 bg-warn/10 text-warn',
                )}
              >
                {item.inStock ? <Check size={16} /> : <Package size={15} />}
              </button>

              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    'truncate text-[14px] font-medium',
                    item.inStock ? 'text-ink' : 'text-ink-2',
                  )}
                >
                  {item.name}
                </p>
                <p className="text-[11.5px] text-ink-3">
                  {item.essential ? 'Item base' : 'Complementar'} ·{' '}
                  {item.inStock ? 'em casa' : 'acabou'}
                </p>
              </div>

              <IconButton
                label={`Remover ${item.name}`}
                onClick={() => removePantryItem(item.id)}
                className="h-9 w-9"
              >
                <Trash2 size={14} />
              </IconButton>
            </li>
          ))}
        </ul>
      </Card>

      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (!name.trim()) return
          addPantryItem(name, essential)
          setName('')
          setEssential(false)
        }}
      >
        <div className="flex gap-2">
          <TextInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Adicionar alimento"
            className="flex-1"
          />
          <Button type="submit" variant="secondary" size="md" disabled={!name.trim()}>
            <Plus size={18} />
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setEssential((v) => !v)}
          className="flex items-center gap-2 px-1 text-[12.5px] text-ink-3 transition-colors hover:text-ink-2"
        >
          <span
            className={cn(
              'flex h-4 w-4 items-center justify-center rounded border transition-colors',
              essential ? 'border-transparent bg-accent text-accent-ink' : 'border-line',
            )}
          >
            {essential && <Check size={11} />}
          </span>
          Marcar como item base (avisa quando acabar)
        </button>
      </form>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────

function Shopping() {
  const shopping = useAppStore((s) => s.shopping)
  const addShoppingItem = useAppStore((s) => s.addShoppingItem)
  const toggleShoppingItem = useAppStore((s) => s.toggleShoppingItem)
  const removeShoppingItem = useAppStore((s) => s.removeShoppingItem)
  const clearDone = useAppStore((s) => s.clearDoneShopping)

  const [name, setName] = useState('')

  const pending = shopping.filter((i) => !i.done)
  const done = shopping.filter((i) => i.done)

  return (
    <div className="space-y-3">
      <SectionTitle
        hint={`${pending.length} para comprar`}
        action={
          done.length > 0 ? (
            <button
              onClick={clearDone}
              className="text-[12px] font-medium text-ink-3 transition-colors hover:text-ink-2"
            >
              Limpar comprados
            </button>
          ) : undefined
        }
      >
        Lista de compras
      </SectionTitle>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (!name.trim()) return
          addShoppingItem(name)
          setName('')
        }}
      >
        <TextInput
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Adicionar item"
          className="flex-1"
        />
        <Button type="submit" variant="secondary" size="md" disabled={!name.trim()}>
          <Plus size={18} />
        </Button>
      </form>

      {/* Atalhos: o que mais se compra, a um toque. */}
      <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1">
        {QUICK_SHOPPING_SUGGESTIONS.filter(
          (s) => !shopping.some((i) => !i.done && i.name.toLowerCase() === s.toLowerCase()),
        ).map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => addShoppingItem(suggestion)}
            className="shrink-0 rounded-full border border-line-soft bg-surface-2 px-3 py-1.5 text-[12px] text-ink-2 transition-colors hover:border-line hover:text-ink"
          >
            + {suggestion}
          </button>
        ))}
      </div>

      {shopping.length === 0 ? (
        <Card variant="flat" className="py-8 text-center">
          <ShoppingCart size={22} className="mx-auto mb-2 text-ink-3" />
          <p className="text-[13px] text-ink-3">Lista vazia. Adicione o que está faltando.</p>
        </Card>
      ) : (
        <Card className="p-2">
          <ul className="divide-y divide-line-soft">
            {[...pending, ...done].map((item) => (
              <li key={item.id} className="flex items-center gap-3 px-2 py-2.5">
                <button
                  onClick={() => toggleShoppingItem(item.id)}
                  aria-label={`Marcar ${item.name}`}
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-colors',
                    item.done
                      ? 'border-transparent bg-accent text-accent-ink'
                      : 'border-line bg-transparent',
                  )}
                >
                  {item.done && <Check size={14} />}
                </button>

                <span
                  className={cn(
                    'min-w-0 flex-1 truncate text-[14px]',
                    item.done ? 'text-ink-3 line-through' : 'text-ink',
                  )}
                >
                  {item.name}
                </span>

                <IconButton
                  label={`Remover ${item.name}`}
                  onClick={() => removeShoppingItem(item.id)}
                  className="h-8 w-8"
                >
                  <Trash2 size={14} />
                </IconButton>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
