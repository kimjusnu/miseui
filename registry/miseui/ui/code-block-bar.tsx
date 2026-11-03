import type * as React from "react"
import { useRef } from "react"
import { WrapText } from "lucide-react"
import { Clipboard } from "@/registry/miseui/ui/clipboard"
import { cn } from "@/registry/miseui/lib/utils"

const ICON_BUTTON_CLASS = [
  "inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none pointer-coarse:size-10",
  "transition-colors duration-(--duration-fast) ease-(--ease-mise) hover:bg-foreground/5 hover:text-foreground",
  "focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-pressed:bg-foreground/5 aria-pressed:text-foreground",
]

function CodeActions({ value, wrap, onWrap }: { value: string; wrap: boolean; onWrap: () => void }) {
  return (
    <div className="flex shrink-0 items-center">
      <button type="button" aria-label="Wrap lines" aria-pressed={wrap} className={cn(ICON_BUTTON_CLASS)} onClick={onWrap}>
        <WrapText aria-hidden="true" className="size-4" />
      </button>
      <Clipboard value={value} label="Copy code" />
    </div>
  )
}

interface FileTabsProps {
  names: readonly string[]
  active: number
  baseId: string
  onActive: (index: number) => void
}

function FileTabs({ names, active, baseId, onActive }: FileTabsProps) {
  const refs = useRef<Array<HTMLButtonElement | null>>([])
  const onKeyDown = (event: React.KeyboardEvent) => {
    const last = names.length - 1
    const targets: Record<string, number> = {
      ArrowRight: active === last ? 0 : active + 1,
      ArrowLeft: active === 0 ? last : active - 1,
      Home: 0,
      End: last,
    }
    const next = targets[event.key]
    if (next === undefined) return
    event.preventDefault()
    onActive(next)
    refs.current[next]?.focus()
  }
  return (
    <div role="tablist" aria-label="Files" className="flex min-w-0 flex-1 overflow-x-auto" onKeyDown={onKeyDown}>
      {names.map((name, index) => (
        <button
          key={name}
          ref={(node) => {
            refs.current[index] = node
          }}
          type="button"
          role="tab"
          id={`${baseId}-tab-${index}`}
          aria-selected={index === active}
          aria-controls={`${baseId}-panel`}
          tabIndex={index === active ? 0 : -1}
          onClick={() => onActive(index)}
          className={cn(
            "relative h-10 shrink-0 px-3 font-mono text-[13px] whitespace-nowrap outline-none",
            "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset",
            "transition-colors duration-(--duration-fast) ease-(--ease-mise)",
            index === active
              ? "text-foreground after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {name}
        </button>
      ))}
    </div>
  )
}

export { CodeActions, FileTabs }
