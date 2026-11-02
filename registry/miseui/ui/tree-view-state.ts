import type * as React from "react"
import { useMemo, useRef, useState } from "react"
import {
  containsNode,
  expandableSiblings,
  flattenVisible,
  isBranch,
  treeMove,
  typeaheadMatch,
  type TreeNode,
  type VisibleNode,
} from "@/registry/miseui/ui/tree-view-math"

type TreeSelectionMode = "none" | "single" | "multiple"

const TYPEAHEAD_RESET_MS = 500

interface TreeStateOptions {
  nodes: readonly TreeNode[]
  selectionMode: TreeSelectionMode
  expanded?: readonly string[]
  defaultExpanded: readonly string[]
  onExpandedChange?: (expanded: string[], change: { id: string; expanded: boolean }) => void
  selected?: readonly string[]
  defaultSelected: readonly string[]
  onSelectedChange?: (selected: string[]) => void
}

function useTreeOpenState({ expanded, defaultExpanded, onExpandedChange }: Pick<TreeStateOptions, "expanded" | "defaultExpanded" | "onExpandedChange">) {
  const [uncontrolled, setUncontrolled] = useState(defaultExpanded)
  const list = expanded ?? uncontrolled
  const openSet = useMemo(() => new Set(list), [list])
  const setOpen = (id: string, open: boolean) => {
    if (openSet.has(id) === open) return
    const next = open ? [...list, id] : list.filter((entry) => entry !== id)
    setUncontrolled(next)
    onExpandedChange?.(next, { id, expanded: open })
  }
  /** All at once: called one by one in a loop, each call would overwrite the last from the same stale list. */
  const openMany = (ids: readonly string[]) => {
    const added = ids.filter((id) => !openSet.has(id))
    if (added.length === 0) return
    const next = [...list, ...added]
    setUncontrolled(next)
    added.forEach((id) => onExpandedChange?.(next, { id, expanded: true }))
  }
  return { openSet, setOpen, openMany }
}

function useTreeSelection({ selected, defaultSelected, onSelectedChange, selectionMode }: Pick<TreeStateOptions, "selected" | "defaultSelected" | "onSelectedChange" | "selectionMode">) {
  const [uncontrolled, setUncontrolled] = useState(defaultSelected)
  const list = selected ?? uncontrolled
  const select = (id: string) => {
    if (selectionMode === "none") return
    const toggled = list.includes(id) ? list.filter((entry) => entry !== id) : [...list, id]
    const next = selectionMode === "single" ? [id] : toggled
    setUncontrolled(next)
    onSelectedChange?.(next)
  }
  return { selectedList: list, select }
}

function useTreeTypeahead(jump: (query: string) => void) {
  const buffer = useRef("")
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  return (character: string) => {
    clearTimeout(timer.current)
    buffer.current += character
    jump(buffer.current)
    timer.current = setTimeout(() => {
      buffer.current = ""
    }, TYPEAHEAD_RESET_MS)
  }
}

interface TreeKeyContext {
  visible: readonly VisibleNode[]
  openSet: ReadonlySet<string>
  focusRow: (id: string) => void
  setOpen: (id: string, open: boolean) => void
  openMany: (ids: readonly string[]) => void
  activate: (node: TreeNode) => void
  typeahead: (character: string) => void
}

function treeKeyDown(event: React.KeyboardEvent, { visible, openSet, focusRow, setOpen, openMany, activate, typeahead }: TreeKeyContext) {
  const target = event.target as HTMLElement
  const current = target.dataset.treeId
  // Keys inside a lazy slot or a row's own control are not for the tree.
  if (!current || target.getAttribute("role") !== "treeitem") return
  const entry = visible.find((candidate) => candidate.node.id === current)
  if (!entry) return
  const move = treeMove(event.key, visible, current, openSet)
  const printable = event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey
  if (!move && !printable && event.key !== "Enter") return
  event.preventDefault()
  if (move?.focus) focusRow(move.focus)
  if (move?.expand) setOpen(move.expand, true)
  if (move?.collapse) setOpen(move.collapse, false)
  if (move) return
  if (event.key === "Enter" || event.key === " ") activate(entry.node)
  else if (event.key === "*") openMany(expandableSiblings(visible, current))
  else typeahead(event.key)
}

function useTreeState(options: TreeStateOptions, rootRef: React.RefObject<HTMLUListElement | null>) {
  const { nodes, selectionMode } = options
  const { openSet, setOpen, openMany } = useTreeOpenState(options)
  const { selectedList, select } = useTreeSelection(options)
  const visible = useMemo(() => flattenVisible(nodes, openSet), [nodes, openSet])
  const [focusedId, setFocusedId] = useState<string | null>(null)
  // Falls back to the first row when the focused one was collapsed away from outside, so the tree never loses its tab stop.
  const tabStop = visible.some((entry) => entry.node.id === focusedId) ? focusedId : (visible[0]?.node.id ?? null)
  const focusRow = (id: string) => {
    setFocusedId(id)
    const rows = rootRef.current?.querySelectorAll<HTMLElement>("[role='treeitem']") ?? []
    Array.from(rows).find((element) => element.dataset.treeId === id)?.focus()
  }
  const toggle = (node: TreeNode) => {
    const open = openSet.has(node.id)
    // Closing a branch around the focused row would drop focus on the body.
    if (open && focusedId && containsNode(node, focusedId)) focusRow(node.id)
    setOpen(node.id, !open)
  }
  const activate = (node: TreeNode) => {
    if (selectionMode !== "none") {
      if (!node.disabled) select(node.id)
    } else if (isBranch(node)) toggle(node)
  }
  const onRowClick = (node: TreeNode) => {
    setFocusedId(node.id)
    if (selectionMode !== "none" && !node.disabled) select(node.id)
    if (selectionMode !== "multiple" && isBranch(node)) toggle(node)
  }
  const typeahead = useTreeTypeahead((query) => {
    const match = typeaheadMatch(visible, query, tabStop ?? "")
    if (match) focusRow(match)
  })
  const onKeyDown = (event: React.KeyboardEvent) => treeKeyDown(event, { visible, openSet, focusRow, setOpen, openMany, activate, typeahead })
  return { visible, openSet, selectedList, tabStop, toggle, onRowClick, onKeyDown, setFocusedId }
}

type TreeState = ReturnType<typeof useTreeState>

export { useTreeState, type TreeSelectionMode, type TreeState }
