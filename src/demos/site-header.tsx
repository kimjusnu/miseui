import { SiteHeader, type SiteHeaderVariant } from "@/registry/miseui/blocks/site-header"
import { Button } from "@/registry/miseui/ui/button"

const SAMPLE_ROWS = [
  { client: "Harbour Bakery", amount: "$1,280.00", state: "Paid" },
  { client: "North Pier Studio", amount: "$640.00", state: "Sent" },
  { client: "Example Client Ltd", amount: "$2,150.00", state: "Draft" },
]

const SECTIONS = [
  { name: "Send", note: "One invoice takes about a minute, and the next one less." },
  { name: "Follow up", note: "Reminders go out on the days you choose." },
  { name: "Get paid", note: "A link on every invoice, and a note when it lands." },
]

/** A page to sit above. Tall enough that the header has something to stick over; its figures are examples. */
function SamplePage() {
  return (
    <div className="flex min-h-[1100px] flex-col gap-12 bg-muted px-4 py-16 @3xl:px-8 dark:bg-background">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <h1 className="text-display max-w-2xl text-4xl leading-[1.12]! text-balance @3xl:text-5xl">
          Invoices that chase themselves. <span className="text-muted-foreground">So you do not have to.</span>
        </h1>
        <div>
          <Button variant="outline" size="lg">See how it works</Button>
        </div>
        <ul className="flex flex-col divide-y rounded-2xl border bg-background dark:bg-card">
          {SAMPLE_ROWS.map((row) => (
            <li key={row.client} className="flex items-center justify-between gap-3 px-4 py-3 text-[13px]">
              <span className="min-w-0 truncate">{row.client}</span>
              <span className="shrink-0 text-muted-foreground tabular-nums">
                {row.amount} · {row.state}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="mx-auto flex w-full max-w-4xl flex-col divide-y rounded-2xl border bg-background dark:bg-card">
        {SECTIONS.map((section) => (
          <div key={section.name} className="flex flex-col gap-1 p-6">
            <h2 className="text-title text-xl">{section.name}</h2>
            <p className="text-[15px] leading-relaxed text-pretty text-muted-foreground">{section.note}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export function Demo({ variant }: { variant?: string }) {
  return (
    <SiteHeader variant={variant as SiteHeaderVariant | undefined} defaultCurrentHref={variant === "mega" ? "#pricing" : "#features"}>
      <SamplePage />
    </SiteHeader>
  )
}
