import type * as React from "react"
import { cn } from "@/registry/miseui/lib/utils"
import { ERROR_COPY, resolveErrorCode, type ErrorCopy, type ErrorPageCode, type ErrorPageLink } from "./error-page-copy"
import { ErrorActions, ErrorNews, ErrorReference } from "./error-page-parts"
import { ErrorSplit } from "./error-page-split"
import { reloadPage, useRetry } from "./error-page-state"
import { ErrorTerminal } from "./error-page-terminal"

type ErrorPageVariant = "centered" | "split" | "terminal"

interface ErrorPageProps extends Omit<React.ComponentProps<"section">, "title"> {
  /** `centered` one sentence and a way out, `split` beside places that still work, `terminal` a plain readout for developer tools. Anything else is `centered`. */
  variant?: ErrorPageVariant
  /** Decides the wording and the way out. Another 5xx reads as 500, and anything else as 404. */
  code?: ErrorPageCode | 404 | 500
  title?: string
  /** Continues the title, one tone quieter. Say what happened and what can be done, and do not guess at a cause. */
  detail?: string
  /** The default reloads the page. Return a promise to get the waiting state; a rejection says it did not work. */
  onRetry?: () => void | Promise<void>
  homeHref?: string
  homeLabel?: string
  /** Null removes the link. */
  helpHref?: string | null
  /** Something to quote to support, such as a request id. */
  reference?: string
  /** `split`: your own places that still work. */
  links?: readonly ErrorPageLink[]
  /** `terminal`: the address in the readout. Left out, it reads the current one. */
  path?: string
  /** `terminal`: when it happened. Pass it from the server, or leave it out. */
  time?: string
}

function ErrorHeading({ copy, title, detail }: { copy: ErrorCopy; title?: string; detail?: string }) {
  return (
    <h1 className="text-display text-3xl leading-[1.12]! text-balance @3xl:text-4xl">
      {title ?? copy.title} <span className="text-muted-foreground">{detail ?? copy.detail}</span>
    </h1>
  )
}

function ErrorCentered({ className, children, ...props }: React.ComponentProps<"section">) {
  return (
    <section data-slot="error-page" data-variant="centered" className={cn("@container flex w-full flex-col bg-muted dark:bg-background", className)} {...props}>
      <div className="flex min-h-[640px] flex-1 flex-col items-center justify-center gap-6 px-4 py-12 text-center">
        <div className="flex w-full max-w-2xl min-w-0 flex-col items-center gap-6">{children}</div>
      </div>
    </section>
  )
}

function ErrorPage({ variant, code: codeProp = "404", title, detail, onRetry = reloadPage, homeHref = "/", homeLabel = "Go to the home page", helpHref = "#support", reference, links, path, time, ...props }: ErrorPageProps) {
  const code = resolveErrorCode(codeProp)
  const copy = ERROR_COPY[code]
  const retry = useRetry(onRetry)
  const centered = variant !== "split" && variant !== "terminal"
  const body = (
    <>
      <ErrorHeading copy={copy} title={title} detail={detail} />
      <div className={cn("flex max-w-full min-w-0 flex-col gap-3", centered && "items-center")}>
        <ErrorActions code={code} retry={retry} homeHref={homeHref} homeLabel={homeLabel} helpHref={helpHref} centered={centered} />
        <ErrorNews code={code} retry={retry} />
        {centered ? <p className="text-[13px] text-muted-foreground">{copy.name}</p> : null}
        {reference && variant !== "terminal" ? <ErrorReference reference={reference} /> : null}
      </div>
    </>
  )
  if (variant === "split") return <ErrorSplit copy={copy} list={links ?? copy.list} {...props}>{body}</ErrorSplit>
  if (variant === "terminal") return <ErrorTerminal code={code} copy={copy} path={path} time={time} reference={reference} {...props}>{body}</ErrorTerminal>
  return <ErrorCentered {...props}>{body}</ErrorCentered>
}

export { ErrorPage, type ErrorPageCode, type ErrorPageLink, type ErrorPageProps, type ErrorPageVariant }
