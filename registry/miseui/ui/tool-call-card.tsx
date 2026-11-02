import type * as React from "react"
import { Check, TriangleAlert } from "lucide-react"
import { cn } from "@/registry/miseui/lib/utils"

type ToolCallStatus = "running" | "success" | "error"

const MS_PER_SECOND = 1000
/** "1.2 s" reads at a glance; more decimals is noise for a tool call. */
const SECONDS_DECIMALS = 1
const JSON_INDENT = 2

interface ToolCallCardProps extends React.ComponentProps<"details"> {
  /** Tool name as the model called it, e.g. "search_web". */
  name: string
  status: ToolCallStatus
  /** Arguments the tool was called with. Strings render as-is, anything else as pretty JSON. */
  input?: unknown
  /** What the tool returned. Omitted while running or when there is nothing to show. */
  output?: unknown
  durationMs?: number
  /** Start expanded. The user can still collapse it. */
  defaultOpen?: boolean
}

function formatDuration(ms: number) {
  if (ms < MS_PER_SECOND) return `${Math.round(ms)} ms`
  return `${(ms / MS_PER_SECOND).toFixed(SECONDS_DECIMALS)} s`
}

function stringifyValue(value: unknown) {
  if (typeof value === "string") return value
  try {
    return JSON.stringify(value, null, JSON_INDENT) ?? String(value)
  } catch {
    // Circular structures cannot be serialized; show something rather than crash the card.
    return String(value)
  }
}

function ToolCallCard({
  name,
  status,
  input,
  output,
  durationMs,
  defaultOpen = false,
  className,
  children,
  ...props
}: ToolCallCardProps) {
  const hasBody = input !== undefined || output !== undefined || children !== undefined

  return (
    <details
      data-slot="tool-call-card"
      data-status={status}
      open={defaultOpen}
      className={cn("group rounded-lg border text-sm", className)}
      {...props}
    >
      <summary
        aria-label={`${name}: ${status}`}
        className={cn(
          "flex cursor-pointer list-none items-center gap-2 px-3 py-2 select-none",
          "[&::-webkit-details-marker]:hidden",
          status === "error" && "text-destructive",
        )}
      >
        <StatusMark status={status} />
        <span className="font-mono">{name}</span>
        {durationMs !== undefined ? (
          <span className="ml-auto text-xs text-muted-foreground tabular-nums">{formatDuration(durationMs)}</span>
        ) : null}
      </summary>
      {hasBody ? (
        <div data-slot="tool-call-card-body" className="flex flex-col gap-3 border-t px-3 py-2">
          {input !== undefined ? <ValueBlock label="Input" value={input} /> : null}
          {output !== undefined ? <ValueBlock label="Output" value={output} /> : null}
          {children}
        </div>
      ) : null}
    </details>
  )
}

function StatusMark({ status }: { status: ToolCallStatus }) {
  if (status === "success") return <Check className="size-4 text-foreground" aria-hidden="true" />
  if (status === "error") return <TriangleAlert className="size-4 text-destructive" aria-hidden="true" />
  return <span className="size-2 rounded-full bg-mise animate-pulse motion-reduce:animate-none" aria-hidden="true" />
}

function ValueBlock({ label, value }: { label: string; value: unknown }) {
  return (
    <div data-slot="tool-call-card-block" className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <pre className="overflow-x-auto rounded-md border px-2 py-1.5 font-mono text-xs whitespace-pre-wrap text-foreground">
        {stringifyValue(value)}
      </pre>
    </div>
  )
}

export { ToolCallCard, formatDuration, type ToolCallCardProps, type ToolCallStatus }
