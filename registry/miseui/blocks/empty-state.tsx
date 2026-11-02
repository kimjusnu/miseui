import type * as React from "react"
import { ArrowRight, FileText, ListChecks, Mic } from "lucide-react"
import { cn } from "@/registry/miseui/lib/utils"
import { Button } from "@/registry/miseui/ui/button"

interface EmptyStateStarter {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}

const DEFAULT_STARTERS: readonly EmptyStateStarter[] = [
  { id: "summary", title: "Summarize a document", description: "Drop in a PDF and get the five things that matter.", icon: FileText },
  { id: "plan", title: "Turn notes into a plan", description: "Paste rough notes. Leave with owners and dates.", icon: ListChecks },
  { id: "meeting", title: "Record a meeting", description: "Talk for an hour, read the two-minute version.", icon: Mic },
]

interface EmptyStateProps extends React.ComponentProps<"section"> {
  title?: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  /** Starting points, so nobody has to invent the first prompt. Pass an empty list to hide them. */
  starters?: readonly EmptyStateStarter[]
  onStarter?: (id: string) => void
}

function EmptyState({
  title = "Your first project starts here",
  description = "Start from an example or from nothing. You can change everything later.",
  actionLabel = "New project",
  onAction,
  starters = DEFAULT_STARTERS,
  onStarter,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <section data-slot="empty-state" className={cn("@container w-full px-6 py-14 @2xl:py-20", className)} {...props}>
      <div className="mx-auto flex max-w-2xl flex-col items-start gap-8 @2xl:items-center">
        <div className="flex flex-col gap-3 @2xl:items-center @2xl:text-center">
          <h2 className="text-display text-3xl text-balance @2xl:text-4xl">{title}</h2>
          <p className="max-w-md text-[15px] leading-relaxed text-pretty text-muted-foreground">{description}</p>
          <Button variant="mise" size="lg" onClick={onAction} className="mt-2">
            {actionLabel} <ArrowRight />
          </Button>
        </div>
        {starters.length > 0 ? (
          <ul className="flex w-full flex-col divide-y rounded-2xl border bg-card">
            {starters.map((starter) => (
              <li key={starter.id}>
                <button
                  type="button"
                  onClick={() => onStarter?.(starter.id)}
                  className="group flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-left outline-none transition-colors duration-(--duration-fast) ease-(--ease-mise) hover:bg-accent/60 focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/50"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground transition-colors duration-(--duration-fast) ease-(--ease-mise) group-hover:bg-mise-soft group-hover:text-foreground">
                    <starter.icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{starter.title}</span>
                    <span className="block text-sm text-pretty text-muted-foreground">{starter.description}</span>
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-[opacity,translate] duration-(--duration-fast) ease-(--ease-mise) group-hover:translate-x-0.5 group-hover:opacity-100" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  )
}

export { EmptyState, type EmptyStateProps, type EmptyStateStarter }
