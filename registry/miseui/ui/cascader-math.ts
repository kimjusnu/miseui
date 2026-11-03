interface CascaderOption {
  value: string
  label: string
  disabled?: boolean
  children?: readonly CascaderOption[]
  /** Has children that are not here yet; `loadChildren` fetches them when this row is opened. */
  lazy?: boolean
}

type CascaderPath = readonly string[]

type CheckState = "checked" | "mixed" | "unchecked"

interface CascaderColumn {
  level: number
  parent: CascaderOption | null
  parentPath: CascaderPath
  options: readonly CascaderOption[]
}

interface CascaderMatch {
  path: CascaderPath
  labels: readonly string[]
}

const pathKey = (path: CascaderPath) => JSON.stringify(path)
const samePath = (a: CascaderPath, b: CascaderPath) => a.length === b.length && a.every((value, index) => value === b[index])
const isPrefix = (prefix: CascaderPath, path: CascaderPath) => prefix.length <= path.length && prefix.every((value, index) => value === path[index])
const isBranch = (option: CascaderOption) => Boolean(option.lazy) || (option.children?.length ?? 0) > 0

/** Merges lazily loaded children into the tree, so everything else can treat the options as one whole. */
function resolveOptions(options: readonly CascaderOption[], loaded: Readonly<Record<string, readonly CascaderOption[]>>, parent: CascaderPath = []): readonly CascaderOption[] {
  return options.map((option) => {
    const path = [...parent, option.value]
    const children = option.children ?? loaded[pathKey(path)]
    return children ? { ...option, children: resolveOptions(children, loaded, path) } : option
  })
}

/** Walks as far as the path holds. A value that no longer exists stops the walk rather than breaking the panel. */
function optionsOnPath(options: readonly CascaderOption[], path: CascaderPath) {
  const found: CascaderOption[] = []
  let level = options
  for (const value of path) {
    const option = level.find((candidate) => candidate.value === value)
    if (!option) break
    found.push(option)
    level = option.children ?? []
  }
  return found
}

/** Before a lazy parent has loaded, its option is unknown, so the raw value stands in for its label. */
function labelsFor(options: readonly CascaderOption[], path: CascaderPath) {
  const found = optionsOnPath(options, path)
  return path.map((value, index) => found[index]?.label ?? value)
}

function columnsFor(options: readonly CascaderOption[], activePath: CascaderPath): readonly CascaderColumn[] {
  const root: CascaderColumn = { level: 0, parent: null, parentPath: [], options }
  const branches = optionsOnPath(options, activePath).filter(isBranch)
  return [
    root,
    ...branches.map((parent, index) => ({
      level: index + 1,
      parent,
      parentPath: activePath.slice(0, index + 1),
      options: parent.children ?? [],
    })),
  ]
}

/** Leaves under an option. An unloaded lazy option has none yet, so ticking it cannot claim children nobody has seen. */
function leavesOf(option: CascaderOption, path: CascaderPath): readonly CascaderPath[] {
  if (option.disabled) return []
  if (option.children?.length) return option.children.flatMap((child) => leavesOf(child, [...path, child.value]))
  return option.lazy ? [] : [path]
}

function checkStateOf(option: CascaderOption, path: CascaderPath, selected: readonly CascaderPath[]): CheckState {
  const leaves = leavesOf(option, path)
  if (leaves.length === 0) return "unchecked"
  const chosen = leaves.filter((leaf) => selected.some((entry) => samePath(entry, leaf))).length
  if (chosen === 0) return "unchecked"
  return chosen === leaves.length ? "checked" : "mixed"
}

/** Ticks everything under the option, or unticks it if it was already all ticked, which is what a tri-state box promises. */
function toggleLeaves(selected: readonly CascaderPath[], leaves: readonly CascaderPath[]) {
  const without = selected.filter((entry) => !leaves.some((leaf) => samePath(entry, leaf)))
  const allOn = leaves.length > 0 && without.length === selected.length - leaves.length
  return allOn ? without : [...without, ...leaves]
}

function searchLeaves(options: readonly CascaderOption[], query: string): readonly CascaderMatch[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (terms.length === 0) return []
  const walk = (level: readonly CascaderOption[], path: CascaderPath, labels: readonly string[]): readonly CascaderMatch[] =>
    level.flatMap((option) => {
      if (option.disabled) return []
      const nextPath = [...path, option.value]
      const nextLabels = [...labels, option.label]
      if (option.children?.length) return walk(option.children, nextPath, nextLabels)
      if (option.lazy) return []
      // Searches the whole path, so "korea seoul" finds Seoul under Korea and "asia" finds everything beneath it.
      const text = nextLabels.join(" ").toLowerCase()
      return terms.every((term) => text.includes(term)) ? [{ path: nextPath, labels: nextLabels }] : []
    })
  return walk(options, [], [])
}

/** Next enabled row, or null at the end of the column: the list does not wrap, so the edge can be felt. */
function enabledIndex(options: readonly CascaderOption[], from: number, step: 1 | -1) {
  for (let index = from + step; index >= 0 && index < options.length; index += step) {
    if (!options[index].disabled) return index
  }
  return null
}

const firstEnabled = (options: readonly CascaderOption[]) => enabledIndex(options, -1, 1)
const lastEnabled = (options: readonly CascaderOption[]) => enabledIndex(options, options.length, -1)

type TreeKeyAction = "next" | "previous" | "first" | "last" | "expand" | "collapse" | "activate" | "toggle" | "search"

function treeKeyAction(event: Pick<KeyboardEvent, "key" | "ctrlKey" | "metaKey" | "altKey">, multiple: boolean, searchable: boolean): TreeKeyAction | null {
  switch (event.key) {
    case "ArrowDown":
      return "next"
    case "ArrowUp":
      return "previous"
    case "Home":
      return "first"
    case "End":
      return "last"
    case "ArrowRight":
      return "expand"
    case "ArrowLeft":
      return "collapse"
    case "Enter":
      return "activate"
    case " ":
      return multiple ? "toggle" : "activate"
    default:
      // A plain character goes on to the search box, so nobody has to find it before they can type.
      return searchable && event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey ? "search" : null
  }
}

export {
  checkStateOf,
  columnsFor,
  enabledIndex,
  firstEnabled,
  isBranch,
  isPrefix,
  labelsFor,
  lastEnabled,
  leavesOf,
  optionsOnPath,
  pathKey,
  resolveOptions,
  samePath,
  searchLeaves,
  toggleLeaves,
  treeKeyAction,
  type CascaderColumn,
  type CascaderMatch,
  type CascaderOption,
  type CascaderPath,
  type CheckState,
  type TreeKeyAction,
}
