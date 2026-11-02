import type * as React from "react"
import { useId } from "react"
import { Check, ChevronRight } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { isBranch, type TreeNode } from "@/registry/miseui/ui/tree-view-math"
import type { TreeSelectionMode, TreeState } from "@/registry/miseui/ui/tree-view-state"
import { cn } from "@/registry/miseui/lib/utils"

type TreeViewVariant = "plain" | "lines" | "compact" | "card"

/** Pixels per level. `lines` indents through its nested lists instead, so the rule can run down the left of each one. */
const INDENT_PX: Record<TreeViewVariant, number> = { plain: 16, lines: 0, compact: 12, card: 16 }

const ROW_CLASS: Record<TreeViewVariant, string> = {
  plain: "min-h-8 rounded-md pr-2 text-sm pointer-coarse:min-h-10",
  lines: "min-h-8 rounded-md pr-2 text-sm pointer-coarse:min-h-10",
  compact: "min-h-7 pr-2 text-[13px] pointer-coarse:min-h-10",
  card: "min-h-10 rounded-md pr-3 text-sm",
}

const SELECTED_CLASS: Record<TreeViewVariant, string> = {
  plain: "bg-accent font-medium",
  lines: "bg-accent font-medium",
  compact: "bg-mise-soft",
  card: "bg-accent font-medium",
}

interface TreeContext {
  variant: TreeViewVariant
  selectionMode: TreeSelectionMode
  spring: boolean
  state: TreeState
  renderLazy?: (node: TreeNode) => React.ReactNode
  loadingLabel: string
}

function GroupList({ context, labelledBy, children }: { context: TreeContext; labelledBy: string; children: React.ReactNode }) {
  const lines = context.variant === "lines"
  const className = cn(lines && "ms-4 border-s ps-1")
  if (!context.spring) return <ul role="group" aria-labelledby={labelledBy} className={className}>{children}</ul>
  return (
    <motion.ul
      role="group"
      aria-labelledby={labelledBy}
      data-slot="tree-view-group"
      className={cn(className, "overflow-hidden")}
      initial={{ height: 0 }}
      animate={{ height: "auto" }}
      exit={{ height: 0 }}
      transition={SPRING_DEFAULT}
    >
      {children}
    </motion.ul>
  )
}

interface TreeRowProps {
  node: TreeNode
  level: number
  labelId: string
  open: boolean
  selected: boolean
  context: TreeContext
}

function TreeRow({ node, level, labelId, open, selected, context }: TreeRowProps) {
  const { variant, selectionMode, state } = context
  const branch = isBranch(node)
  return (
    <div
      data-slot="tree-view-row"
      style={{ paddingInlineStart: (level - 1) * INDENT_PX[variant] }}
      className={cn(
        "flex cursor-default items-center gap-1 select-none",
        "transition-colors duration-(--duration-fast) ease-(--ease-mise) hover:bg-accent/50",
        // Inset, so the clip on an animating group cannot cut it. Scoped to its own li, or a focused parent would ring every row below.
        "[li:focus-visible>&]:ring-[3px] [li:focus-visible>&]:ring-ring/50 [li:focus-visible>&]:ring-inset",
        ROW_CLASS[variant],
        selected && SELECTED_CLASS[variant],
        node.disabled && "cursor-not-allowed opacity-50",
      )}
      onClick={() => state.onRowClick(node)}
    >
      <span
        aria-hidden="true"
        data-slot="tree-view-toggle"
        className={cn("flex w-6 shrink-0 items-center justify-center self-stretch text-muted-foreground pointer-coarse:w-10", !branch && "invisible")}
        onClick={(event) => {
          event.stopPropagation()
          state.toggle(node)
        }}
      >
        <ChevronRight
          className={cn(
            "size-4 transition-transform duration-(--duration-fast) ease-(--ease-mise) motion-reduce:transition-none",
            open && "rotate-90",
          )}
        />
      </span>
      {selectionMode === "multiple" ? (
        <span
          aria-hidden="true"
          data-slot="tree-view-checkbox"
          className={cn("flex size-4 shrink-0 items-center justify-center rounded-sm border border-input", selected && "border-mise bg-mise text-mise-foreground")}
        >
          {selected ? <Check className="size-3" /> : null}
        </span>
      ) : null}
      {node.icon && variant !== "compact" ? <span aria-hidden="true" className="flex shrink-0 text-muted-foreground [&_svg]:size-4">{node.icon}</span> : null}
      <span id={labelId} className="min-w-0 py-1 break-words">{node.label}</span>
    </div>
  )
}

interface TreeItemProps {
  node: TreeNode
  level: number
  position: number
  setSize: number
  context: TreeContext
}

function TreeItem({ node, level, position, setSize, context }: TreeItemProps) {
  const { variant, selectionMode, state } = context
  const labelId = useId()
  const branch = isBranch(node)
  const open = branch && state.openSet.has(node.id)
  const selected = state.selectedList.includes(node.id)
  const pending = open && node.lazy === true && !node.children?.length
  const group = open ? (
    <GroupList key="group" context={context} labelledBy={labelId}>
      {node.children?.map((child, index) => (
        <TreeItem key={child.id} node={child} level={level + 1} position={index + 1} setSize={node.children?.length ?? 0} context={context} />
      ))}
      {pending ? (
        <li role="none" data-slot="tree-view-lazy" style={{ paddingInlineStart: level * INDENT_PX[variant] + 24 }} className="py-1 text-[13px] text-muted-foreground">
          {context.renderLazy?.(node) ?? context.loadingLabel}
        </li>
      ) : null}
    </GroupList>
  ) : null
  return (
    <li
      role="treeitem"
      tabIndex={state.tabStop === node.id ? 0 : -1}
      // Named by its own label; left to itself the name would swallow every row nested inside.
      aria-labelledby={labelId}
      aria-level={level}
      aria-posinset={position}
      aria-setsize={setSize}
      aria-expanded={branch ? open : undefined}
      aria-selected={selectionMode === "none" ? undefined : selected}
      aria-disabled={node.disabled || undefined}
      aria-busy={pending || undefined}
      data-tree-id={node.id}
      className={cn("outline-none", variant === "card" && level === 1 && "rounded-lg border bg-card p-1")}
      onFocus={(event) => {
        if (event.target === event.currentTarget) state.setFocusedId(node.id)
      }}
    >
      <TreeRow node={node} level={level} labelId={labelId} open={open} selected={selected} context={context} />
      {context.spring ? <AnimatePresence initial={false}>{group}</AnimatePresence> : group}
    </li>
  )
}

export { TreeItem, type TreeContext, type TreeViewVariant }
