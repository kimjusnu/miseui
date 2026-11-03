import type * as React from "react"
import { useId, useState } from "react"
import { Check, Search } from "lucide-react"
import { ROW_BASE_CLASS, ROW_CLASS, LIST_HEIGHT_CLASS, type CascaderVariant } from "@/registry/miseui/ui/cascader-classes"
import { optionsOnPath, samePath, searchLeaves, type CascaderMatch } from "@/registry/miseui/ui/cascader-math"
import type { CascaderState } from "@/registry/miseui/ui/cascader-state"
import { cn } from "@/registry/miseui/lib/utils"

interface SearchProps {
  state: CascaderState
  variant: CascaderVariant
  placeholder: string
  emptyText: string
  inputRef: React.RefObject<HTMLInputElement | null>
}

function ResultRow({ match, id, active, selected, variant, onPick, onHover }: { match: CascaderMatch; id: string; active: boolean; selected: boolean; variant: CascaderVariant; onPick: () => void; onHover: () => void }) {
  const parents = match.labels.slice(0, -1).join(" / ")
  return (
    <div id={id} role="option" aria-selected={selected} data-active={active ? "true" : "false"} className={cn(ROW_BASE_CLASS, ROW_CLASS[variant])} onClick={onPick} onPointerMove={onHover}>
      <span className="min-w-0 flex-1 wrap-anywhere">
        {parents ? <span className="text-muted-foreground">{parents} / </span> : null}
        <span className={selected ? "font-medium" : undefined}>{match.labels[match.labels.length - 1]}</span>
      </span>
      {selected ? <Check aria-hidden="true" className="size-4 shrink-0" /> : null}
    </div>
  )
}

function useSearchKeys(state: CascaderState, results: readonly CascaderMatch[], activeIndex: number, setActiveIndex: (index: number) => void, pickMatch: (match: CascaderMatch) => void) {
  return (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return
    if (event.key === "Escape" && state.query !== "") {
      // The first Escape only empties the box, or a slip would throw away the whole panel.
      event.preventDefault()
      event.stopPropagation()
      state.setQuery("")
      return
    }
    if (state.query === "") {
      if (event.key === "ArrowDown") {
        event.preventDefault()
        const root = state.tree?.querySelector<HTMLElement>("[role='treeitem'][tabindex='0']")
        root?.focus()
      }
      return
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault()
      const step = event.key === "ArrowDown" ? 1 : -1
      setActiveIndex(Math.min(results.length - 1, Math.max(0, activeIndex + step)))
    }
    if (event.key === "Enter" && results[activeIndex]) {
      event.preventDefault()
      pickMatch(results[activeIndex])
    }
  }
}

interface ResultsProps {
  state: CascaderState
  variant: CascaderVariant
  listId: string
  label: string
  emptyText: string
  results: readonly CascaderMatch[]
  activeIndex: number
  onPick: (match: CascaderMatch) => void
  onHover: (index: number) => void
}

function ResultsList({ state, variant, listId, label, emptyText, results, activeIndex, onPick, onHover }: ResultsProps) {
  return (
    // Wider than one column, because a whole path has to fit where a single name did.
    <div id={listId} role="listbox" aria-label={label} aria-multiselectable={state.multiple || undefined} data-slot="cascader-results" className={cn("grid min-w-64 gap-px p-1", LIST_HEIGHT_CLASS)}>
      {results.length === 0 ? <p className="px-2 py-2 text-[13px] text-muted-foreground">{emptyText}</p> : null}
      {results.map((match, index) => (
        <ResultRow
          key={match.path.join("/")}
          id={`${listId}-${index}`}
          match={match}
          variant={variant}
          active={index === activeIndex}
          selected={state.selected.some((entry) => samePath(entry, match.path))}
          onPick={() => onPick(match)}
          onHover={() => onHover(index)}
        />
      ))}
    </div>
  )
}

function SearchBox({ state, variant, placeholder, emptyText, inputRef }: SearchProps) {
  const listId = useId()
  const [activeRaw, setActiveIndex] = useState(0)
  const results = state.query === "" ? [] : searchLeaves(state.resolved, state.query)
  const activeIndex = Math.min(activeRaw, Math.max(0, results.length - 1))
  const pickMatch = (match: CascaderMatch) => {
    const option = optionsOnPath(state.resolved, match.path).at(-1)
    if (option) state.pick(match.path, option)
  }
  const onKeyDown = useSearchKeys(state, results, activeIndex, setActiveIndex, pickMatch)
  return (
    <>
      <div className="flex items-center gap-2 border-b px-3">
        <Search aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
        <input
          ref={inputRef}
          role="combobox"
          aria-label={placeholder}
          aria-expanded={state.query !== ""}
          aria-controls={state.query !== "" ? listId : undefined}
          aria-autocomplete="list"
          aria-activedescendant={results.length > 0 ? `${listId}-${activeIndex}` : undefined}
          autoComplete="off"
          placeholder={placeholder}
          value={state.query}
          className="h-10 w-full min-w-24 bg-transparent text-base outline-none placeholder:text-muted-foreground md:text-sm"
          onChange={(event) => {
            state.setQuery(event.target.value)
            setActiveIndex(0)
          }}
          onKeyDown={onKeyDown}
        />
      </div>
      {state.query === "" ? null : (
        <ResultsList state={state} variant={variant} listId={listId} label={placeholder} emptyText={emptyText} results={results} activeIndex={activeIndex} onPick={pickMatch} onHover={setActiveIndex} />
      )}
    </>
  )
}

export { SearchBox }
