import { useCallback, useId, useRef, useState } from "react"
import { Archive, Trash2 } from "lucide-react"
import { ActionBar, ActionBarAction, type ActionBarPosition, type ActionBarVariant } from "@/registry/miseui/ui/action-bar"
import { Checkbox } from "@/registry/miseui/ui/checkbox"

const FILES = ["budget-2027.xlsx", "q3-review.pdf", "offsite-photos.zip"] as const
const ALL_BUT_LAST = FILES.slice(0, 2)
const VARIANTS: readonly ActionBarVariant[] = ["floating", "docked", "inline", "compact"]

function Rows({ selected, onToggle }: { selected: readonly string[]; onToggle: (file: string) => void }) {
  const baseId = useId()
  return (
    <ul className="grid">
      {FILES.map((file, index) => {
        const id = `${baseId}-${index}`
        return (
          <li key={file} className="flex min-w-0 items-center gap-3 py-1 pointer-coarse:py-2">
            <Checkbox id={id} checked={selected.includes(file)} onCheckedChange={() => onToggle(file)} />
            <label htmlFor={id} className="min-w-0 truncate text-sm">
              {file}
            </label>
          </li>
        )
      })}
    </ul>
  )
}

function useFiles(initial: readonly string[]) {
  const [selected, setSelected] = useState(initial)
  const clear = useCallback(() => setSelected([]), [])
  const toggle = (file: string) =>
    setSelected((current) => (current.includes(file) ? current.filter((entry) => entry !== file) : [...current, file]))
  return { selected, clear, toggle }
}

interface PickerProps {
  label: string
  variant: ActionBarVariant
  position?: ActionBarPosition
  effect?: "spring"
  initial?: readonly string[]
}

function Picker({ label, variant, position, effect, initial = ALL_BUT_LAST }: PickerProps) {
  const { selected, clear, toggle } = useFiles(initial)
  // Six bars share this page, and Escape in one list should not empty the others.
  const scopeRef = useRef<HTMLDivElement>(null)
  const bar = (
    <ActionBar
      variant={variant}
      position={position}
      effect={effect}
      count={selected.length}
      onClear={clear}
      escapeScopeRef={scopeRef}
      label={`${label} actions`}
    >
      <ActionBarAction icon={<Archive aria-hidden="true" />}>Archive</ActionBarAction>
      <ActionBarAction icon={<Trash2 aria-hidden="true" />} tone="destructive">
        Delete
      </ActionBarAction>
    </ActionBar>
  )
  return (
    <div ref={scopeRef} className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      {variant === "inline" ? (
        <>
          {selected.length === 0 ? <p className="flex h-11 items-center px-3 text-sm text-muted-foreground">Select files to act on them</p> : null}
          {bar}
          <Rows selected={selected} onToggle={toggle} />
        </>
      ) : (
        <>
          <Rows selected={selected} onToggle={toggle} />
          {bar}
        </>
      )}
    </div>
  )
}

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      {VARIANTS.map((variant) => (
        <Picker key={variant} label={variant} variant={variant} position="inline" />
      ))}
      <Picker label="spring effect, inline" variant="inline" effect="spring" />
      <Picker label="spring effect, fixed to the screen" variant="floating" effect="spring" initial={[]} />
    </div>
  )
}
