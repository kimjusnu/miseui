import { ArrowLeft, Loader2 } from "lucide-react"
import { cn } from "@/registry/miseui/lib/utils"
import { Button } from "@/registry/miseui/ui/button"
import { Clipboard } from "@/registry/miseui/ui/clipboard"
import type { ErrorPageCode } from "./error-page-copy"
import { useOnline, type Retry } from "./error-page-state"

const LINK_TOUCH_CLASS = "relative underline-offset-4 outline-none hover:underline focus-visible:rounded-sm focus-visible:ring-[3px] focus-visible:ring-ring/50 pointer-coarse:after:absolute pointer-coarse:after:-inset-x-1 pointer-coarse:after:-inset-y-3"

interface ErrorActionsProps {
  code: ErrorPageCode
  retry: Retry
  homeHref: string
  homeLabel: string
  /** Null removes the link. */
  helpHref: string | null
  centered: boolean
}

function RetryButton({ retry, primary }: { retry: Retry; primary: boolean }) {
  return (
    <Button
      variant={primary ? "mise" : "outline"}
      aria-busy={retry.retrying || undefined}
      aria-disabled={retry.retrying || undefined}
      onClick={() => void retry.retry()}
      className="pointer-coarse:h-10"
    >
      {retry.retrying ? <Loader2 aria-hidden="true" className="animate-spin motion-reduce:animate-none" /> : null}
      {retry.retrying ? "Trying again" : "Try again"}
    </Button>
  )
}

function BackButton() {
  return (
    <Button variant="ghost" onClick={() => window.history.back()} className="pointer-coarse:h-10">
      <ArrowLeft aria-hidden="true" />
      Go back
    </Button>
  )
}

/** Each error gets the way out that can work: a 404 cannot be retried, and an offline device cannot follow a link home. */
function ErrorActions({ code, retry, homeHref, homeLabel, helpHref, centered }: ErrorActionsProps) {
  const home = (
    <Button asChild variant={code === "404" ? "mise" : "outline"} className="pointer-coarse:h-10">
      <a href={homeHref}>{homeLabel}</a>
    </Button>
  )
  return (
    <>
      <div className={cn("flex flex-wrap items-center gap-2", centered && "justify-center")}>
        {code === "404" ? home : <RetryButton retry={retry} primary />}
        {code === "500" ? home : <BackButton />}
      </div>
      {helpHref && code !== "offline" ? (
        <p className="text-[13px] text-muted-foreground">
          Still stuck?{" "}
          <a href={helpHref} className={cn("font-medium text-foreground", LINK_TOUCH_CLASS)}>
            Contact support
          </a>
        </p>
      ) : null}
    </>
  )
}

/** Mounted from the start so it is a live region before there is news. The wording only reports what the device says. */
function ErrorNews({ code, retry }: { code: ErrorPageCode; retry: Retry }) {
  const online = useOnline()
  const connection = online ? "Your device reports a connection now. Try again." : "Your device reports no connection yet."
  const message = retry.failed ? "That did not work either. Give it a minute, then try again." : code === "offline" ? connection : ""
  return (
    <p role="status" className="text-[13px] leading-5 text-pretty text-muted-foreground empty:sr-only">
      {message}
    </p>
  )
}

/** For quoting to support. Copy sits beside it, because nobody should have to retype a request id. */
function ErrorReference({ reference, className }: { reference: string; className?: string }) {
  return (
    <div className={cn("flex min-w-0 items-center gap-1 text-[13px] text-muted-foreground", className)}>
      <span className="min-w-0 break-all">
        Reference <span className="font-mono text-foreground">{reference}</span>
      </span>
      <Clipboard value={reference} label="Copy reference" />
    </div>
  )
}

export { ErrorActions, ErrorNews, ErrorReference, type ErrorActionsProps }
