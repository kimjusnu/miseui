import type * as React from "react"
import { useRef } from "react"
import { useReducedMotion } from "motion/react"
import { TreeItem, type TreeContext, type TreeViewVariant } from "@/registry/miseui/ui/tree-view-item"
import type { TreeNode } from "@/registry/miseui/ui/tree-view-math"
import { useTreeState, type TreeSelectionMode } from "@/registry/miseui/ui/tree-view-state"
import { cn } from "@/registry/miseui/lib/utils"

type TreeViewEffect = "spring"

const ROOT_CLASS: Record<TreeViewVariant, string> = {
  plain: "gap-1",
  lines: "gap-1",
  compact: "",
  card: "gap-2",
}

type RootAttributes = Omit<React.ComponentProps<"ul">, "children" | "role" | "onKeyDown">

interface TreeViewProps extends RootAttributes {
  nodes: readonly TreeNode[]
  /** `plain` indented rows, `lines` guide rules, `compact` dense rows with no icons, `card` each top level on its own surface. */
  variant?: TreeViewVariant
  /** `spring` opens and closes branches with a height spring that a second press can reverse. */
  effect?: TreeViewEffect
  /** `none` is for navigation: a press only opens and closes. */
  selectionMode?: TreeSelectionMode
  expanded?: readonly string[]
  defaultExpanded?: readonly string[]
  /** Also where lazy children start: load them when `change.expanded` is true, then pass them in `nodes`. */
  onExpandedChange?: (expanded: string[], change: { id: string; expanded: boolean }) => void
  selected?: readonly string[]
  defaultSelected?: readonly string[]
  onSelectedChange?: (selected: string[]) => void
  /** What a `lazy` node shows while its children are on the way, such as a spinner. */
  renderLazy?: (node: TreeNode) => React.ReactNode
  /** Used when `renderLazy` is not given. */
  loadingLabel?: string
}

const EMPTY: readonly string[] = []

function TreeView({
  nodes,
  variant = "plain",
  effect,
  selectionMode = "none",
  expanded,
  defaultExpanded = EMPTY,
  onExpandedChange,
  selected,
  defaultSelected = EMPTY,
  onSelectedChange,
  renderLazy,
  loadingLabel = "Loading",
  className,
  ...props
}: TreeViewProps) {
  const rootRef = useRef<HTMLUListElement>(null)
  const reduceMotion = useReducedMotion() ?? false
  const state = useTreeState({ nodes, selectionMode, expanded, defaultExpanded, onExpandedChange, selected, defaultSelected, onSelectedChange }, rootRef)
  const context: TreeContext = { variant, selectionMode, spring: effect === "spring" && !reduceMotion, state, renderLazy, loadingLabel }
  return (
    <ul
      ref={rootRef}
      role="tree"
      aria-multiselectable={selectionMode === "multiple" || undefined}
      data-slot="tree-view"
      data-variant={variant}
      data-effect={effect}
      className={cn("grid min-w-0", ROOT_CLASS[variant], className)}
      onKeyDown={state.onKeyDown}
      {...props}
    >
      {nodes.map((node, index) => (
        <TreeItem key={node.id} node={node} level={1} position={index + 1} setSize={nodes.length} context={context} />
      ))}
    </ul>
  )
}

export { TreeView, type TreeViewProps, type TreeNode, type TreeViewVariant, type TreeViewEffect, type TreeSelectionMode }
