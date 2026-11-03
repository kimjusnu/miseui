import type * as React from "react"
import { Check, ChevronRight, Minus } from "lucide-react"
import { ROW_BASE_CLASS, ROW_CLASS, type CascaderVariant } from "@/registry/miseui/ui/cascader-classes"
import {
  checkStateOf,
  enabledIndex,
  firstEnabled,
  isBranch,
  isPrefix,
  lastEnabled,
  pathKey,
  samePath,
  treeKeyAction,
  type CascaderColumn,
  type CascaderOption,
  type CascaderPath,
  type CheckState,
} from "@/registry/miseui/ui/cascader-math"
import type { CascaderState } from "@/registry/miseui/ui/cascader-state"
import { Spinner } from "@/registry/miseui/ui/spinner"
import { cn } from "@/registry/miseui/lib/utils"

function CheckMark({ state, onToggle }: { state: CheckState; onToggle: (event: React.MouseEvent) => void }) {
  return (
    // A wider press area than the box: the row itself opens a level, so a near miss must not do that instead.
    <span data-slot="cascader-check" className="-m-2 flex size-8 shrink-0 items-center justify-center pointer-coarse:size-10" onClick={onToggle}>
      <span
        className={cn(
          "flex size-4 items-center justify-center rounded-sm border border-input",
          state !== "unchecked" && "border-mise bg-mise text-mise-foreground",
        )}
      >
        {state === "checked" ? <Check aria-hidden="true" className="size-3" /> : null}
        {state === "mixed" ? <Minus aria-hidden="true" className="size-3" /> : null}
      </span>
    </span>
  )
}

interface RowProps {
  state: CascaderState
  column: CascaderColumn
  option: CascaderOption
  index: number
  variant: CascaderVariant
  searchable: boolean
  stepped: boolean
  isFirstFocusable: boolean
  focusSearch: () => void
}

function useRowKeys({ state, column, option, index, searchable, focusSearch }: RowProps, path: CascaderPath) {
  const go = (next: number | null) => {
    if (next !== null) state.focusOn([...column.parentPath, column.options[next].value])
  }
  return (event: React.KeyboardEvent) => {
    const action = treeKeyAction(event, state.multiple, searchable)
    if (!action) return
    // A search key must fall through, so the character lands in the box that is about to take focus.
    if (action === "search") return focusSearch()
    event.preventDefault()
    if (action === "next") go(enabledIndex(column.options, index, 1))
    if (action === "previous") go(enabledIndex(column.options, index, -1))
    if (action === "first") go(firstEnabled(column.options))
    if (action === "last") go(lastEnabled(column.options))
    if (action === "expand") state.expand(path, option, true)
    if (action === "collapse") state.collapseTo(column.level)
    if (action === "toggle") state.pick(path, option)
    if (action !== "activate") return
    if (isBranch(option)) state.expand(path, option, true)
    else state.pick(path, option)
  }
}

function rowFacts({ state, column, option, isFirstFocusable }: RowProps) {
  const path = [...column.parentPath, option.value]
  const branch = isBranch(option)
  return {
    path,
    branch,
    expanded: branch && isPrefix(path, state.activePath),
    check: state.multiple ? checkStateOf(option, path, state.selected) : null,
    selected: !state.multiple && state.selected.some((entry) => samePath(entry, path)),
    focused: state.focusPath ? samePath(state.focusPath, path) : isFirstFocusable,
    isLoading: state.loading.includes(pathKey(path)),
  }
}

function CascaderRow(props: RowProps) {
  const { state, column, option, index, variant, stepped } = props
  const { path, branch, expanded, check, selected, focused, isLoading } = rowFacts(props)
  const onKeyDown = useRowKeys(props, path)
  const ariaChecked = check === null ? undefined : check === "mixed" ? "mixed" : check === "checked"
  return (
    <div
      role="treeitem"
      data-path={pathKey(path)}
      data-active={expanded ? "true" : "false"}
      aria-level={column.level + 1}
      aria-setsize={column.options.length}
      aria-posinset={index + 1}
      aria-expanded={branch ? expanded : undefined}
      aria-selected={state.multiple ? undefined : selected}
      aria-checked={ariaChecked}
      aria-busy={isLoading || undefined}
      aria-disabled={option.disabled || undefined}
      tabIndex={focused ? 0 : -1}
      className={cn(ROW_BASE_CLASS, ROW_CLASS[variant])}
      onClick={() => {
        state.setFocusPath(path)
        if (branch) state.expand(path, option, stepped)
        else state.pick(path, option)
      }}
      onKeyDown={onKeyDown}
    >
      {check !== null ? (
        <CheckMark
          state={check}
          onToggle={(event) => {
            event.stopPropagation()
            state.pick(path, option)
          }}
        />
      ) : null}
      <span className={cn("min-w-0 flex-1 wrap-anywhere", selected && "font-medium")}>{option.label}</span>
      {isLoading ? (
        <span aria-hidden="true" className="flex shrink-0">
          <Spinner size="sm" label="" />
        </span>
      ) : null}
      {branch && !isLoading ? <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" /> : null}
      {selected ? <Check aria-hidden="true" className="size-4 shrink-0" /> : null}
    </div>
  )
}

export { CascaderRow }
