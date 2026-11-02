import type * as React from "react"

interface TreeNode {
  id: string
  label: string
  icon?: React.ReactNode
  children?: readonly TreeNode[]
  /** Has children that are not loaded yet. Expanding it fires onExpandedChange; pass `children` once you have them. */
  lazy?: boolean
  disabled?: boolean
}

interface VisibleNode {
  node: TreeNode
  level: number
  parentId: string | null
  position: number
  setSize: number
}

type TreeMove = { focus?: string; expand?: string; collapse?: string }

const isBranch = (node: TreeNode) => node.lazy === true || (node.children?.length ?? 0) > 0

/** Depth first, only through open branches: the same order the rows have on screen and the arrow keys walk. */
function flattenVisible(
  nodes: readonly TreeNode[],
  expanded: ReadonlySet<string>,
  level = 1,
  parentId: string | null = null,
): readonly VisibleNode[] {
  return nodes.flatMap((node, index) => {
    const entry = { node, level, parentId, position: index + 1, setSize: nodes.length }
    const open = expanded.has(node.id) && node.children
    return [entry, ...(open ? flattenVisible(node.children ?? [], expanded, level + 1, node.id) : [])]
  })
}

/** What each key does in the WAI-ARIA tree pattern. Null when the key is not a tree key. */
function treeMove(key: string, visible: readonly VisibleNode[], current: string, expanded: ReadonlySet<string>): TreeMove | null {
  const index = visible.findIndex((entry) => entry.node.id === current)
  if (index === -1) return null
  const entry = visible[index]
  const open = expanded.has(current)
  const branch = isBranch(entry.node)
  const moves: Record<string, () => TreeMove> = {
    ArrowDown: () => ({ focus: visible[index + 1]?.node.id }),
    ArrowUp: () => ({ focus: visible[index - 1]?.node.id }),
    Home: () => ({ focus: visible[0]?.node.id }),
    End: () => ({ focus: visible[visible.length - 1]?.node.id }),
    ArrowRight: () => {
      if (!branch) return {}
      if (!open) return { expand: current }
      const child = visible[index + 1]
      return child?.parentId === current ? { focus: child.node.id } : {}
    },
    ArrowLeft: () => {
      if (branch && open) return { collapse: current }
      return entry.parentId ? { focus: entry.parentId } : {}
    },
  }
  return moves[key]?.() ?? null
}

/** Starts after the current row, so one letter pressed again walks through every match. */
function typeaheadMatch(visible: readonly VisibleNode[], query: string, current: string) {
  const index = visible.findIndex((entry) => entry.node.id === current)
  const repeated = [...query].every((character) => character === query[0])
  const needle = (repeated ? query[0] : query).toLowerCase()
  const start = repeated ? index + 1 : Math.max(index, 0)
  const rotated = [...visible.slice(start), ...visible.slice(0, start)]
  return rotated.find((entry) => entry.node.label.toLowerCase().startsWith(needle))?.node.id ?? null
}

/** The `*` key: every branch at the same level under the same parent. */
function expandableSiblings(visible: readonly VisibleNode[], current: string) {
  const entry = visible.find((candidate) => candidate.node.id === current)
  if (!entry) return []
  return visible
    .filter((candidate) => candidate.parentId === entry.parentId && isBranch(candidate.node))
    .map((candidate) => candidate.node.id)
}

function containsNode(node: TreeNode, id: string): boolean {
  return (node.children ?? []).some((child) => child.id === id || containsNode(child, id))
}

export {
  containsNode,
  expandableSiblings,
  flattenVisible,
  isBranch,
  treeMove,
  typeaheadMatch,
  type TreeMove,
  type TreeNode,
  type VisibleNode,
}
