import type * as React from "react"
import { ArrowRight } from "lucide-react"
import { cn } from "@/registry/miseui/lib/utils"
import type { ErrorCopy, ErrorPageLink } from "./error-page-copy"

function ListRow({ link }: { link: ErrorPageLink }) {
  const body = (
    <span className="min-w-0 flex-1">
      <span className="block text-sm font-medium">{link.label}</span>
      {link.description ? <span className="block text-[13px] text-pretty text-muted-foreground">{link.description}</span> : null}
    </span>
  )
  if (!link.href) return <div className="flex min-h-10 items-center px-4 py-3">{body}</div>
  return (
    <a href={link.href} className="group flex min-h-10 items-center gap-3 rounded-2xl px-4 py-3 outline-none transition-colors duration-(--duration-fast) ease-(--ease-mise) hover:bg-accent/60 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset">
      {body}
      <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground transition-[translate] duration-(--duration-fast) ease-(--ease-mise) group-hover:translate-x-0.5 motion-reduce:transition-none" />
    </a>
  )
}

interface ErrorSplitProps extends React.ComponentProps<"section"> {
  copy: ErrorCopy
  list: readonly ErrorPageLink[]
  /** Heading, actions and notes. */
  children: React.ReactNode
}

/** For a product with many ways in: beside the apology, the places that still work, so nobody has to start from the top. */
function ErrorSplit({ copy, list, className, children, ...props }: ErrorSplitProps) {
  return (
    <section data-slot="error-page" data-variant="split" className={cn("@container flex w-full flex-col bg-muted dark:bg-background", className)} {...props}>
      <div className="flex min-h-[640px] flex-1 items-center px-4 py-12 @3xl:px-8">
        <div className="mx-auto grid w-full max-w-5xl grid-cols-[minmax(0,1fr)] items-center gap-8 @3xl:grid-cols-2 @3xl:gap-12">
          <div className="flex min-w-0 flex-col items-start gap-6">{children}</div>
          <div className="flex min-w-0 flex-col gap-3">
            <h2 className="text-title px-1 text-lg text-balance">{copy.listTitle}</h2>
            <ul className="flex flex-col divide-y rounded-2xl border bg-background dark:bg-card">
              {list.map((link) => (
                <li key={link.label}>
                  <ListRow link={link} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

export { ErrorSplit }
