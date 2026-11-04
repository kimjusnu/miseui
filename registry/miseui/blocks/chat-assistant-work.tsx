/** Invented report, shown only when no children are passed. It carries the figures the sample conversation is about. */

const BREAKDOWN = [
  { id: "starter-annual", label: "Starter, annual", count: 29 },
  { id: "starter-monthly", label: "Starter, monthly", count: 7 },
  { id: "team", label: "Team", count: 5 },
]
const TOTAL = BREAKDOWN.reduce((sum, row) => sum + row.count, 0)
const PERCENT = 100

const ACCOUNTS = [
  { id: "northgate", name: "Northgate Studio", note: "Open invoice question", value: "$1,008" },
  { id: "halden", name: "Halden Freight", note: "Open invoice question", value: "$1,008" },
  { id: "pell", name: "Pell Street Studio", note: "Never added a second seat", value: "$504" },
]

/** Sample work for the chat to sit beside. Replace it by passing your own screen as children. */
function ChatSampleWork() {
  return (
    <div className="@container">
      <div className="flex flex-col gap-6 p-4 @2xl:p-8">
        <div className="flex flex-col gap-1">
          <h2 className="text-display text-2xl text-balance @2xl:text-3xl">
            March churn. <span className="text-muted-foreground">41 accounts left, up from 18 in February.</span>
          </h2>
          <p className="text-[13px] text-muted-foreground">Sample report. Every figure is made up.</p>
        </div>
        <section aria-label="Accounts lost by plan" className="flex flex-col gap-3 rounded-2xl border bg-background p-4 dark:bg-card @2xl:p-6">
          {BREAKDOWN.map((row) => (
            <div key={row.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1">
              <span className="text-[13px] text-muted-foreground">{row.label}</span>
              <span className="text-[13px] tabular-nums">{row.count}</span>
              <span aria-hidden="true" className="col-span-2 h-2 overflow-hidden rounded-full bg-muted">
                <span className="block h-full rounded-full bg-foreground/30" style={{ width: `${(row.count / TOTAL) * PERCENT}%` }} />
              </span>
            </div>
          ))}
        </section>
        <section aria-label="Accounts to call" className="flex flex-col divide-y rounded-2xl border bg-background dark:bg-card">
          {ACCOUNTS.map((account) => (
            <div key={account.id} className="flex items-center justify-between gap-4 p-4 @2xl:px-6">
              <div className="min-w-0">
                <p className="text-[15px] text-pretty">{account.name}</p>
                <p className="text-[13px] text-pretty text-muted-foreground">{account.note}</p>
              </div>
              <span className="shrink-0 text-[13px] tabular-nums">{account.value}</span>
            </div>
          ))}
        </section>
      </div>
    </div>
  )
}

export { ChatSampleWork }
