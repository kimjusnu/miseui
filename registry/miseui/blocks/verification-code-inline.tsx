import type * as React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/registry/miseui/lib/utils"
import { CodeField, ResendButton, ResendNote, VerifiedMark, type VerificationCopy } from "./verification-code-parts"
import type { Verification } from "./verification-code-state"

interface InlineProps extends React.ComponentProps<"section">, VerificationCopy {
  flow: Verification
  label: string
  note: string
  sentNote: string
  verifiedTitle: string
}

/** No button: the last digit submits, and a row inside someone else's form should not bring a second primary action. */
function VerificationInline({ flow, label, note, length, hint, autoFocus, sentNote, verifiedTitle, className, ...props }: InlineProps) {
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void flow.verify(flow.code)
  }
  return (
    <section data-slot="verification-code" data-variant="inline" className={cn("@container w-full", className)} {...props}>
      {flow.verified ? (
        <div role="status" className="flex items-center gap-3">
          <VerifiedMark className="size-8 [&_svg]:size-4" />
          <p className="text-[15px]">{verifiedTitle}</p>
        </div>
      ) : (
        <form noValidate onSubmit={submit} className="grid grid-cols-[minmax(0,1fr)] gap-3 @2xl:grid-cols-[minmax(0,1fr)_minmax(0,18rem)] @2xl:gap-6">
          <div className="min-w-0">
            <p className="text-[15px] leading-normal font-medium text-balance">{label}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-pretty wrap-break-word text-muted-foreground">{note}</p>
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <CodeField flow={flow} label={label} labelHidden otpVariant="joined" length={length} hint={hint} autoFocus={autoFocus} />
            <div className="flex min-h-9 flex-wrap items-center justify-between gap-x-2 pointer-coarse:min-h-10">
              <ResendButton flow={flow} className="-ms-3" />
              {flow.checking ? (
                <span role="status" className="inline-flex items-center gap-2 text-[13px] text-muted-foreground">
                  <Loader2 aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" />
                  Checking
                </span>
              ) : null}
            </div>
            <ResendNote flow={flow} sentNote={sentNote} />
          </div>
        </form>
      )}
    </section>
  )
}

export { VerificationInline }
