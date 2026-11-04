import { VerificationCode, type VerificationCodeVariant } from "@/registry/miseui/blocks/verification-code"

const HINT = "Example only: 246810 is accepted, anything else is wrong."

/** The inline design is a row in someone else's form, so the preview gives it a form to sit in. */
function SettingsPage() {
  return (
    <div className="@container flex min-h-[640px] w-full items-center justify-center bg-muted px-4 py-12 dark:bg-background">
      <div className="w-full max-w-2xl divide-y rounded-2xl border bg-background dark:bg-card">
        <div className="px-4 py-4 @2xl:px-6">
          <p className="text-[15px] font-medium">Email address</p>
          <p className="mt-1 text-[13px] text-muted-foreground">maya@northgate.studio</p>
        </div>
        <div className="px-4 py-4 @2xl:px-6">
          <VerificationCode variant="inline" title="Confirm your new email" hint={HINT} />
        </div>
      </div>
    </div>
  )
}

export function Demo({ variant }: { variant?: string }) {
  if (variant === "inline") return <SettingsPage />
  return <VerificationCode variant={variant as VerificationCodeVariant | undefined} hint={HINT} />
}
