import { OnboardingChecklist, type OnboardingChecklistVariant } from "@/registry/miseui/blocks/onboarding-checklist"
import { Button } from "@/registry/miseui/ui/button"

const SAMPLE_INVOICES = [
  { id: "1042", client: "Harbour Bakery", amount: "$1,280.00", state: "Paid" },
  { id: "1041", client: "North Pier Studio", amount: "$640.00", state: "Sent" },
  { id: "1040", client: "Example Client Ltd", amount: "$2,150.00", state: "Draft" },
]

/** The page the banner sits above and the dialog sits over. Its figures are examples. */
function SamplePage() {
  return (
    <div className="flex min-h-[560px] flex-1 flex-col gap-6 bg-muted px-4 py-8 @2xl:px-8 dark:bg-background">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-display text-2xl">Invoices</h1>
        <Button variant="outline" className="pointer-coarse:h-10">New invoice</Button>
      </div>
      <ul className="flex flex-col divide-y rounded-2xl border bg-background dark:bg-card">
        {SAMPLE_INVOICES.map((invoice) => (
          <li key={invoice.id} className="flex items-center justify-between gap-3 px-4 py-3 text-[13px]">
            <span className="min-w-0 truncate">{invoice.client}</span>
            <span className="shrink-0 text-muted-foreground tabular-nums">
              {invoice.amount} · {invoice.state}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Demo({ variant }: { variant?: string }) {
  const known = variant as OnboardingChecklistVariant | undefined
  const page = known === "banner" || known === "dialog" ? <SamplePage /> : undefined
  return (
    // The workspace is named during sign-up, so that step is really done by the time anyone sees this.
    <OnboardingChecklist variant={known} defaultCompleted={["workspace"]} className={page ? "flex flex-col" : undefined}>
      {page}
    </OnboardingChecklist>
  )
}
