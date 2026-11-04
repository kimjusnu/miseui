import type * as React from "react"
import { cn } from "@/registry/miseui/lib/utils"
import { CodeForm, VerifiedScreen, type CodeFormProps, type VerifiedProps } from "./verification-code-parts"

interface SplitProps extends React.ComponentProps<"section"> {
  title: string
  note: string
  form: CodeFormProps
  verified: VerifiedProps
  /** The name on the email, so it can be picked out of an inbox. */
  sender: string
  subject: string
  /** What can go wrong while waiting. Keep them true for your own mail. */
  tips: readonly string[]
}

/** A sketch of the message, not a real one: the code stays out of it, because nobody should read a code off this page. */
function MailFragment({ sender, subject, length }: { sender: string; subject: string; length: number }) {
  return (
    <div data-testid="mail-fragment" aria-hidden="true" className="rounded-2xl border bg-background p-4 shadow-[0_16px_32px_-16px_rgb(0_0_0/0.25)] dark:bg-card dark:shadow-none">
      <p className="truncate text-[13px] font-medium">{sender}</p>
      <p className="truncate text-[13px] text-muted-foreground">{subject}</p>
      <div className="mt-4 flex gap-1">
        {Array.from({ length }, (_, index) => (
          <span key={index} className="h-8 min-w-0 flex-1 rounded-md bg-muted dark:bg-background" />
        ))}
      </div>
    </div>
  )
}

/** Beside the form, because the person is about to leave for their inbox: they should know what to look for before they go. */
function VerificationSplit({ title, note, form, verified, sender, subject, tips, className, ...props }: SplitProps) {
  return (
    <section data-slot="verification-code" data-variant="split" className={cn("@container flex w-full flex-col bg-background", className)} {...props}>
      <div className="grid min-h-[640px] flex-1 grid-cols-[minmax(0,1fr)] @3xl:grid-cols-2">
        <div className="flex items-center justify-center px-4 py-12 @3xl:px-12">
          <div className="flex w-full max-w-sm flex-col gap-8">
            {form.flow.verified ? (
              <VerifiedScreen {...verified} />
            ) : (
              <>
                <h2 className="text-display text-3xl leading-[1.12]! text-balance wrap-break-word">
                  {title} <span className="text-muted-foreground">{note}</span>
                </h2>
                <CodeForm {...form} />
              </>
            )}
          </div>
        </div>
        <div className="flex items-center justify-center bg-muted px-4 py-12 @3xl:px-12">
          <div className="flex w-full max-w-sm flex-col gap-6">
            <h3 className="text-title text-xl text-balance">
              What to look for. <span className="text-muted-foreground">A message with this name and subject.</span>
            </h3>
            <MailFragment sender={sender} subject={subject} length={form.length} />
            <ul className="flex flex-col gap-2 text-[13px] leading-relaxed text-pretty text-muted-foreground">
              {tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

export { VerificationSplit }
