import type * as React from "react"
import { cn } from "@/registry/miseui/lib/utils"
import { Clipboard } from "@/registry/miseui/ui/clipboard"
import type { ErrorCopy, ErrorPageCode } from "./error-page-copy"
import { usePathname } from "./error-page-state"

interface ReadoutRow {
  term: string
  value: string
}

/** Real values only, and a row with nothing to say is left out. A prompt or a command here would be something to type that does nothing. */
function readoutRows(code: ErrorPageCode, copy: ErrorCopy, path: string, time: string | undefined, reference: string | undefined): readonly ReadoutRow[] {
  const rows: readonly (ReadoutRow | null)[] = [
    { term: "status", value: code },
    { term: "reason", value: copy.readout },
    path ? { term: "path", value: path } : null,
    time ? { term: "time", value: time } : null,
    reference ? { term: "reference", value: reference } : null,
  ]
  return rows.filter((row) => row !== null)
}

interface ErrorTerminalProps extends React.ComponentProps<"section"> {
  code: ErrorPageCode
  copy: ErrorCopy
  /** The address shown in the readout. Left out, it reads the current one. */
  path?: string
  time?: string
  reference?: string
  /** Heading, actions and notes. */
  children: React.ReactNode
}

/** For a developer tool, where people want the facts to paste into a ticket. Plain text, selectable, in one block with a copy button. */
function ErrorTerminal({ code, copy, path, time, reference, className, children, ...props }: ErrorTerminalProps) {
  const pathname = usePathname()
  const rows = readoutRows(code, copy, path ?? pathname, time, reference)
  const text = rows.map((row) => `${row.term}: ${row.value}`).join("\n")
  return (
    <section data-slot="error-page" data-variant="terminal" className={cn("@container flex w-full flex-col bg-background", className)} {...props}>
      <div className="flex min-h-[640px] flex-1 items-center justify-center px-4 py-12">
        <div className="flex w-full max-w-xl min-w-0 flex-col items-start gap-6">
          {children}
          <div className="relative w-full min-w-0 rounded-2xl bg-muted p-4 pe-12">
            <dl data-testid="error-readout" className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 font-mono text-[13px] leading-5">
              {rows.map((row) => (
                <div key={row.term} className="col-span-2 grid grid-cols-subgrid">
                  <dt className="text-muted-foreground">{row.term}</dt>
                  <dd className="min-w-0 wrap-break-word">{row.value}</dd>
                </div>
              ))}
            </dl>
            <Clipboard value={text} label="Copy these details" className="absolute end-2 top-2" />
          </div>
        </div>
      </div>
    </section>
  )
}

export { ErrorTerminal, readoutRows }
