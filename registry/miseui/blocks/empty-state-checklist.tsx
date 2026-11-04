import type * as React from "react"
import { useEffect, useRef, useState } from "react"
import { cn } from "@/registry/miseui/lib/utils"
import { Button } from "@/registry/miseui/ui/button"
import { Checkbox } from "@/registry/miseui/ui/checkbox"
import { Progress } from "@/registry/miseui/ui/progress"

interface EmptyStateTask {
  id: string
  title: string
  description: string
  actionLabel: string
}

const DEFAULT_TASKS: readonly EmptyStateTask[] = [
  { id: "project", title: "Create your first project", description: "Give it a name. You can change it later.", actionLabel: "New project" },
  { id: "document", title: "Add a document", description: "Drop in a PDF and get the five things that matter.", actionLabel: "Upload a PDF" },
  { id: "invite", title: "Invite one person", description: "Work is easier to finish with someone reading along.", actionLabel: "Invite" },
]

const FOCUS_NEXT_SELECTOR = "[data-focus-next]"

/** Tinted from the ink, and off in dark mode, where a light-tinted shadow would read as a glow. */
const PLATE_CLASS =
  "rounded-2xl border bg-background dark:bg-card shadow-[0_1px_2px_color-mix(in_oklab,var(--foreground)_6%,transparent),0_16px_32px_-16px_color-mix(in_oklab,var(--foreground)_16%,transparent)] dark:shadow-none"

interface EmptyStateChecklistProps extends React.ComponentProps<"section"> {
  title?: string
  /** Continues the title in the same size, one tone quieter. */
  description?: string
  /** The button shown once every task is done. */
  actionLabel?: string
  onAction?: () => void
  /** The first things to do. Three is the point: more than that reads as homework. */
  tasks?: readonly EmptyStateTask[]
  /** Ids of finished tasks. Pass it to decide yourself when a task counts as done; leave it out and pressing a task's button ticks it. */
  completed?: readonly string[]
  defaultCompleted?: readonly string[]
  onCompletedChange?: (completed: readonly string[]) => void
  /** Fires with the task whose button was pressed. Open your dialog or route here. */
  onTask?: (id: string) => void
}

function useCompleted(
  completed: readonly string[] | undefined,
  defaultCompleted: readonly string[],
  onChange?: (completed: readonly string[]) => void,
) {
  const [internal, setInternal] = useState(defaultCompleted)
  const current = completed ?? internal
  const set = (id: string, done: boolean) => {
    const next = done ? [...current.filter((item) => item !== id), id] : current.filter((item) => item !== id)
    setInternal(next)
    onChange?.(next)
  }
  return [current, set, completed !== undefined] as const
}

interface TaskRowProps {
  task: EmptyStateTask
  done: boolean
  next: boolean
  onToggle: (done: boolean) => void
  onAction: () => void
}

function TaskRow({ task, done, next, onToggle, onAction }: TaskRowProps) {
  return (
    <li data-state={done ? "done" : next ? "next" : "later"} className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-3 p-4 @md:grid-cols-[auto_minmax(0,1fr)_auto] @md:items-center @2xl:px-6">
      {/* The label is the hit target: a 16 px box stays 16 px while the press area reaches 40. */}
      <label className="-mx-2 -my-2 inline-flex size-10 cursor-pointer items-center justify-center self-start">
        <Checkbox aria-label={task.title} checked={done} onCheckedChange={(state) => onToggle(state === true)} />
      </label>
      <div className="min-w-0">
        <p className={cn("text-[15px] leading-normal text-pretty", done && "text-muted-foreground line-through")}>{task.title}</p>
        {done ? null : <p className="mt-1 text-[13px] leading-relaxed text-pretty text-muted-foreground">{task.description}</p>}
      </div>
      {done ? null : (
        <Button
          variant={next ? "mise" : "ghost"}
          data-focus-next={next ? "" : undefined}
          onClick={onAction}
          className="col-start-2 justify-self-start pointer-coarse:h-10 @md:col-start-3 @md:row-start-1"
        >
          {task.actionLabel}
        </Button>
      )}
    </li>
  )
}

/** A pressed task button disappears with its row, which would drop keyboard focus onto the page. */
function useFocusAfterAction(plate: React.RefObject<HTMLDivElement | null>, doneCount: number) {
  const pendingRef = useRef(false)
  useEffect(() => {
    if (!pendingRef.current) return
    pendingRef.current = false
    plate.current?.querySelector<HTMLElement>(FOCUS_NEXT_SELECTOR)?.focus()
  }, [doneCount, plate])
  return pendingRef
}

interface ChecklistPlateProps {
  tasks: readonly EmptyStateTask[]
  done: readonly string[]
  finish: React.ReactNode
  onToggle: (id: string, done: boolean) => void
  onPress: (id: string) => void
  plateRef: React.RefObject<HTMLDivElement | null>
}

function ChecklistPlate({ tasks, done, finish, onToggle, onPress, plateRef }: ChecklistPlateProps) {
  const doneCount = tasks.filter((task) => done.includes(task.id)).length
  const nextId = tasks.find((task) => !done.includes(task.id))?.id
  return (
    <div ref={plateRef} className={PLATE_CLASS}>
      <div className="flex flex-col gap-3 border-b p-4 @2xl:px-6">
        <p role="status" className="text-[13px] text-muted-foreground tabular-nums">
          {doneCount} of {tasks.length} done
        </p>
        {/* In ink: the one accent on this screen belongs to the next thing to press. */}
        <Progress
          variant="segmented"
          effect="spring"
          label="Setup progress"
          value={doneCount}
          max={tasks.length}
          steps={tasks.length}
          className="[&_[data-slot=progress-segment]>span]:bg-foreground"
        />
      </div>
      <ol className="flex flex-col divide-y">
        {tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            done={done.includes(task.id)}
            next={task.id === nextId}
            onToggle={(state) => onToggle(task.id, state)}
            onAction={() => onPress(task.id)}
          />
        ))}
      </ol>
      {doneCount === tasks.length ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t p-4 @2xl:px-6">
          <p className="text-[15px]">That is everything.</p>
          {finish}
        </div>
      ) : null}
    </div>
  )
}

function EmptyStateChecklist({
  title = "Three things to do first.",
  description = "About five minutes, and you can skip around.",
  actionLabel = "Open your project",
  onAction,
  tasks = DEFAULT_TASKS,
  completed,
  defaultCompleted = [],
  onCompletedChange,
  onTask,
  className,
  ...props
}: EmptyStateChecklistProps) {
  const [done, setDone, controlled] = useCompleted(completed, defaultCompleted, onCompletedChange)
  const plateRef = useRef<HTMLDivElement>(null)
  const pendingFocusRef = useFocusAfterAction(plateRef, done.length)

  const pressTask = (id: string) => {
    onTask?.(id)
    if (controlled) return
    pendingFocusRef.current = true
    setDone(id, true)
  }
  const finish = (
    <Button variant="mise" data-focus-next="" onClick={onAction} className="pointer-coarse:h-10">
      {actionLabel}
    </Button>
  )

  return (
    <section data-slot="empty-state" data-variant="checklist" className={cn("@container w-full bg-muted dark:bg-background", className)} {...props}>
      <div className="px-4 py-12 @2xl:px-8 @2xl:py-20">
        <div className="mx-auto flex max-w-2xl flex-col gap-8">
          <h2 className="text-display text-3xl text-balance @2xl:text-4xl">
            {title} <span className="text-muted-foreground">{description}</span>
          </h2>
          {tasks.length === 0 ? <div>{finish}</div> : <ChecklistPlate tasks={tasks} done={done} finish={finish} onToggle={setDone} onPress={pressTask} plateRef={plateRef} />}
        </div>
      </div>
    </section>
  )
}

export { EmptyStateChecklist, type EmptyStateChecklistProps, type EmptyStateTask }
