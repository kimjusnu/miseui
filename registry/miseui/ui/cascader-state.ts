import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react"
import {
  isBranch,
  firstEnabled,
  leavesOf,
  optionsOnPath,
  pathKey,
  resolveOptions,
  samePath,
  toggleLeaves,
  type CascaderOption,
  type CascaderPath,
} from "@/registry/miseui/ui/cascader-math"

const NARROW_QUERY = "(max-width: 639px)"
/** Below this an inline panel cannot hold two columns and a part of a third, so it steps instead. */
const INLINE_COLUMNS_MIN_PX = 440

const subscribeToViewport = (notify: () => void) => {
  const query = window.matchMedia(NARROW_QUERY)
  query.addEventListener("change", notify)
  return () => query.removeEventListener("change", notify)
}

function useViewportNarrow() {
  return useSyncExternalStore(subscribeToViewport, () => window.matchMedia(NARROW_QUERY).matches, () => false)
}

/** An inline panel lives in a column of the page, so its own width decides, while a popover can use the whole screen. */
function useContainerNarrow(node: HTMLElement | null) {
  const [narrow, setNarrow] = useState(false)
  useEffect(() => {
    if (!node || typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(([entry]) => setNarrow((entry?.contentRect.width ?? node.clientWidth) < INLINE_COLUMNS_MIN_PX))
    observer.observe(node)
    return () => observer.disconnect()
  }, [node])
  return narrow
}

type LoadChildren = (path: CascaderPath, option: CascaderOption) => Promise<readonly CascaderOption[]>

interface LazyHandlers {
  /** Called with the first enabled child's path when children arrive, for keyboard people who pressed to go in. */
  onLoaded?: (path: CascaderPath, children: readonly CascaderOption[]) => void
}

function useLazyChildren(options: readonly CascaderOption[], loadChildren: LoadChildren | undefined, handlers: LazyHandlers) {
  const [loaded, setLoaded] = useState<Readonly<Record<string, readonly CascaderOption[]>>>({})
  const [loading, setLoading] = useState<readonly string[]>([])
  const [failed, setFailed] = useState<readonly string[]>([])
  const resolved = useMemo(() => resolveOptions(options, loaded), [options, loaded])
  const load = (path: CascaderPath, option: CascaderOption) => {
    const key = pathKey(path)
    if (!loadChildren || loading.includes(key)) return
    setLoading((previous) => [...previous, key])
    setFailed((previous) => previous.filter((entry) => entry !== key))
    loadChildren(path, option)
      .then((children) => {
        setLoaded((previous) => ({ ...previous, [key]: children }))
        handlers.onLoaded?.(path, children)
      })
      .catch(() => setFailed((previous) => [...previous, key]))
      .finally(() => setLoading((previous) => previous.filter((entry) => entry !== key)))
  }
  return { resolved, loading, failed, load }
}

interface SelectionConfig {
  multiple: boolean
  controlled: readonly CascaderPath[] | undefined
  initial: readonly CascaderPath[]
  emit: (next: readonly CascaderPath[]) => void
}

function useSelection({ controlled, initial, emit }: SelectionConfig) {
  const [uncontrolled, setUncontrolled] = useState(initial)
  const selected = controlled ?? uncontrolled
  const update = (next: readonly CascaderPath[]) => {
    setUncontrolled(next)
    emit(next)
  }
  return { selected, update }
}

interface StateConfig extends SelectionConfig {
  options: readonly CascaderOption[]
  loadChildren?: LoadChildren
  inline: boolean
}

/**
 * One tab stop, moved by hand. The tree may sit in a portal that mounts after the first layout effect, so the element
 * is kept in state through a callback ref, and the row is found again after each commit because levels come and go.
 */
function useTreeFocus(activePath: CascaderPath) {
  const [focusPath, setFocusPath] = useState<CascaderPath | null>(null)
  const [tree, setTree] = useState<HTMLElement | null>(null)
  const pendingFocus = useRef(false)
  const focusOn = (path: CascaderPath) => {
    pendingFocus.current = true
    setFocusPath(path)
  }
  useEffect(() => {
    if (!pendingFocus.current || !tree || !focusPath) return
    const key = pathKey(focusPath)
    const row = Array.from(tree.querySelectorAll<HTMLElement>("[role='treeitem']")).find((entry) => entry.dataset.path === key)
    if (!row) return
    pendingFocus.current = false
    row.focus()
    row.scrollIntoView?.({ block: "nearest", inline: "nearest" })
  }, [tree, focusPath, activePath])
  return { focusPath, setFocusPath, focusOn, tree, setTree }
}

function useCascaderState(config: StateConfig) {
  const { multiple, inline, loadChildren } = config
  const [open, setOpenState] = useState(false)
  const [query, setQuery] = useState("")
  const selection = useSelection(config)
  const levels = useLevels(config.options, loadChildren, config.initial[0])
  const { focus, lazy, setActivePath } = levels
  const setOpen = (next: boolean) => {
    setOpenState(next)
    setQuery("")
    const chosen = next ? selection.selected[0] : undefined
    if (next) setActivePath(parentOf(chosen))
    // Tab lands on what was chosen, unless that option has since gone and no row could take the stop.
    const exists = chosen !== undefined && optionsOnPath(lazy.resolved, chosen).length === chosen.length
    focus.setFocusPath(exists ? chosen : null)
  }
  const pick = (path: CascaderPath, option: CascaderOption) => {
    if (option.disabled) return
    if (multiple) {
      selection.update(toggleLeaves(selection.selected, leavesOf(option, path)))
      return
    }
    setActivePath(parentOf(path))
    selection.update(selection.selected[0] && samePath(selection.selected[0], path) && inline ? [] : [path])
    if (!inline) setOpen(false)
  }
  const { activePath, direction, expand, collapseTo } = levels
  return { ...selection, ...lazy, ...focus, open, setOpen, query, setQuery, activePath, direction, expand, collapseTo, pick, multiple }
}

function useLevels(options: readonly CascaderOption[], loadChildren: LoadChildren | undefined, initial: CascaderPath | undefined) {
  const [activePath, setActivePath] = useState<CascaderPath>(() => parentOf(initial))
  const [direction, setDirection] = useState<1 | -1>(1)
  const descendInto = useRef<string | null>(null)
  const focus = useTreeFocus(activePath)
  const lazy = useLazyChildren(options, loadChildren, {
    onLoaded: (path, children) => {
      if (descendInto.current !== pathKey(path)) return
      descendInto.current = null
      const index = firstEnabled(children)
      if (index !== null) focus.focusOn([...path, children[index].value])
    },
  })
  /** `descend` moves focus into the opened level: always from the keyboard, and on phones, where the row pressed is about to leave the screen. */
  const expand = (path: CascaderPath, option: CascaderOption, descend: boolean) => {
    if (option.disabled || !isBranch(option)) return
    setDirection(1)
    setActivePath(path)
    const children = optionsOnPath(lazy.resolved, path).at(-1)?.children
    if (!children) {
      if (descend) descendInto.current = pathKey(path)
      lazy.load(path, option)
      return
    }
    const index = firstEnabled(children)
    if (descend && index !== null) focus.focusOn([...path, children[index].value])
  }
  const collapseTo = (level: number) => {
    if (level <= 0) return
    const parent = activePath.slice(0, level)
    setDirection(-1)
    setActivePath(parent.slice(0, level - 1))
    focus.focusOn(parent)
  }
  return { activePath, setActivePath, direction, focus, lazy, expand, collapseTo }
}

function parentOf(path: CascaderPath | undefined): CascaderPath {
  return path ? path.slice(0, -1) : []
}

type CascaderState = ReturnType<typeof useCascaderState>

export { useCascaderState, useContainerNarrow, useViewportNarrow, type CascaderState, type LoadChildren }
