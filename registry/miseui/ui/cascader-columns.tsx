import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { ChevronLeft } from "lucide-react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { COLUMN_WIDTH_CLASS, LIST_HEIGHT_CLASS, type CascaderVariant } from "@/registry/miseui/ui/cascader-classes"
import { columnsFor, firstEnabled, pathKey, type CascaderColumn } from "@/registry/miseui/ui/cascader-math"
import { CascaderRow } from "@/registry/miseui/ui/cascader-row"
import type { CascaderState } from "@/registry/miseui/ui/cascader-state"
import { cn } from "@/registry/miseui/lib/utils"

/** Far enough to read as a move between levels, close enough to stay one surface. Material's shared axis uses 30 px. */
const AXIS_OFFSET_PX = 24
const INSTANT = { duration: 0 } as const

/**
 * Functions of `custom`, because an exiting element keeps the props of its last render: only AnimatePresence's
 * custom can tell it the direction that has just changed, or going back would leave the wrong way.
 */
const AXIS_VARIANTS = {
  enter: (direction: number) => ({ x: direction * AXIS_OFFSET_PX, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: -direction * AXIS_OFFSET_PX, opacity: 0 }),
}
const STILL_VARIANTS = { enter: { x: 0, opacity: 1 }, center: { x: 0, opacity: 1 }, exit: { x: 0, opacity: 1 } }

interface ViewProps {
  state: CascaderState
  variant: CascaderVariant
  label: string
  searchable: boolean
  loadingText: string
  errorText: string
  focusSearch: () => void
}

function ColumnBody({ state, column, stepped, variant, searchable, loadingText, errorText, focusSearch }: ViewProps & { column: CascaderColumn; stepped: boolean }) {
  const key = pathKey(column.parentPath)
  if (column.parent && column.options.length === 0) {
    const failed = state.failed.includes(key)
    return (
      <div className="px-2 py-1.5 text-[13px] text-muted-foreground">
        {failed ? (
          <button
            type="button"
            data-slot="cascader-retry"
            className="rounded-sm text-left underline underline-offset-4 outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 pointer-coarse:py-2.5"
            onClick={() => state.expand(column.parentPath, column.parent!, true)}
          >
            {errorText}
          </button>
        ) : (
          <span role="status">{state.loading.includes(key) ? loadingText : null}</span>
        )}
      </div>
    )
  }
  const firstIndex = firstEnabled(column.options)
  // Until something has focus, the tab stop is the first row of the first level on screen.
  const holdsTabStop = !state.focusPath && (stepped || column.level === 0)
  return column.options.map((option, index) => (
    <CascaderRow
      key={option.value}
      state={state}
      column={column}
      option={option}
      index={index}
      variant={variant}
      searchable={searchable}
      stepped={stepped}
      isFirstFocusable={holdsTabStop && index === firstIndex}
      focusSearch={focusSearch}
    />
  ))
}

function ColumnsView(props: ViewProps) {
  const { state, variant, label } = props
  const { setTree } = state
  const columns = columnsFor(state.resolved, state.activePath)
  return (
    <div ref={setTree} role="tree" aria-label={label} aria-multiselectable={state.multiple || undefined} data-slot="cascader-tree" data-layout="columns" className="flex min-w-0 overflow-x-auto">
      {columns.map((column) => (
        <div
          key={column.level}
          role="group"
          aria-label={column.parent?.label}
          data-slot="cascader-column"
          className={cn("grid shrink-0 content-start gap-px border-r p-1 last:border-r-0", COLUMN_WIDTH_CLASS[variant], LIST_HEIGHT_CLASS)}
        >
          <ColumnBody {...props} column={column} stepped={false} />
        </div>
      ))}
    </div>
  )
}

function StepsView(props: ViewProps & { slide: boolean; backLabel: string }) {
  const { state, label, slide, backLabel } = props
  const { setTree } = state
  const reduceMotion = useReducedMotion() ?? false
  const columns = columnsFor(state.resolved, state.activePath)
  const column = columns[columns.length - 1]
  const moving = slide && !reduceMotion
  return (
    <div data-slot="cascader-steps" className="grid min-w-0 grid-cols-[minmax(0,1fr)] overflow-hidden">
      {column.parent ? (
        <button
          type="button"
          aria-label={`${backLabel}, ${column.parent.label}`}
          data-slot="cascader-back"
          className="flex h-10 min-w-0 items-center gap-2 border-b px-2 text-left text-sm font-medium outline-none hover:bg-accent/60 focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/50"
          onClick={() => state.collapseTo(column.level)}
        >
          <ChevronLeft aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 truncate">{column.parent.label}</span>
        </button>
      ) : null}
      <div ref={setTree} role="tree" aria-label={label} aria-multiselectable={state.multiple || undefined} data-slot="cascader-tree" data-layout="steps" className="relative min-w-0 overflow-hidden">
        <AnimatePresence initial={false} mode="popLayout" custom={state.direction}>
          <motion.div
            key={pathKey(column.parentPath)}
            role="group"
            aria-label={column.parent?.label}
            data-slot="cascader-column"
            className={cn("grid content-start gap-px p-1", LIST_HEIGHT_CLASS)}
            custom={state.direction}
            variants={moving ? AXIS_VARIANTS : STILL_VARIANTS}
            initial="enter"
            animate="center"
            exit="exit"
            transition={moving ? SPRING_DEFAULT : INSTANT}
          >
            <ColumnBody {...props} column={column} stepped />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export { ColumnsView, StepsView }
