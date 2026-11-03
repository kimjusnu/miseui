type DecisionCardsVariant = "split" | "diff" | "ledger"

interface DecisionItem {
  /** Needed only when two decisions share a title. */
  id?: string
  /** The question that was open. */
  title: string
  chosen: string
  /** What was on the table and did not win. */
  rejected: string | readonly string[]
  reason: string
}

interface DecisionLabels {
  chosen: string
  rejected: string
  reason: string
  /** Joins the two in `ledger`: "Postgres over MongoDB". */
  over: string
}

const ROOT_CLASS: Record<DecisionCardsVariant, string> = {
  split: "grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4",
  diff: "grid min-w-0 grid-cols-[minmax(0,1fr)] gap-8",
  ledger: "grid min-w-0 grid-cols-[minmax(0,1fr)]",
}

const ROW_CLASS: Record<DecisionCardsVariant, string> = {
  split: "@container min-w-0 rounded-lg border bg-card p-4 text-card-foreground",
  diff: "min-w-0 border-t pt-4",
  ledger: "min-w-0 border-b py-3 last:border-b-0",
}

function toList(rejected: DecisionItem["rejected"]) {
  return typeof rejected === "string" ? [rejected] : rejected
}

function joinOptions(options: readonly string[]) {
  return options.join(", ")
}

interface BodyProps {
  item: DecisionItem
  index: number
  labels: DecisionLabels
}

function SplitBody({ item, index, labels }: BodyProps) {
  return (
    <>
      <p className="text-xs leading-5 text-muted-foreground tabular-nums">{String(index + 1).padStart(2, "0")}</p>
      <h3 className="text-[15px] leading-6 font-medium text-pretty">{item.title}</h3>
      <div data-slot="decision-cards-options" className="mt-3 grid gap-2 @md:grid-cols-2">
        <div className="min-w-0 rounded-md bg-mise-soft p-3">
          <p className="text-xs leading-5 text-muted-foreground">{labels.chosen}</p>
          <p className="text-sm leading-5 font-medium text-foreground">{item.chosen}</p>
        </div>
        <div className="min-w-0 rounded-md border p-3">
          <p className="text-xs leading-5 text-muted-foreground">{labels.rejected}</p>
          {toList(item.rejected).map((option) => (
            <p key={option} className="text-sm leading-5 text-muted-foreground">
              {option}
            </p>
          ))}
        </div>
      </div>
    </>
  )
}

function DiffBody({ item, labels }: BodyProps) {
  return (
    <>
      <h3 className="text-[13px] leading-5 text-muted-foreground">{item.title}</h3>
      <div data-slot="decision-cards-diff" className="mt-3 grid grid-cols-[1.25rem_minmax(0,1fr)] gap-y-1">
        {toList(item.rejected).map((option) => (
          <p key={option} className="col-span-2 grid grid-cols-subgrid text-[15px] leading-6 text-muted-foreground">
            <span aria-hidden="true" className="font-mono">−</span>
            <span>
              <span className="sr-only">{labels.rejected}: </span>
              <del className="decoration-1">{option}</del>
            </span>
          </p>
        ))}
        <p className="col-span-2 grid grid-cols-subgrid text-xl leading-7 font-semibold tracking-tight text-pretty">
          <span aria-hidden="true" className="font-mono font-normal">+</span>
          <span>
            <span className="sr-only">{labels.chosen}: </span>
            <ins className="no-underline">{item.chosen}</ins>
          </span>
        </p>
      </div>
    </>
  )
}

function LedgerBody({ item, labels }: BodyProps) {
  return (
    <>
      <h3 className="text-[13px] leading-5 text-muted-foreground">{item.title}</h3>
      <p data-slot="decision-cards-sentence" className="mt-1 text-sm leading-5 text-pretty">
        <strong className="font-medium">{item.chosen}</strong>
        <span className="text-muted-foreground">
          {" "}
          {labels.over} {joinOptions(toList(item.rejected))}
        </span>
      </p>
    </>
  )
}

function DecisionBody({ variant, ...props }: BodyProps & { variant: DecisionCardsVariant }) {
  if (variant === "diff") return <DiffBody {...props} />
  if (variant === "ledger") return <LedgerBody {...props} />
  return <SplitBody {...props} />
}

export { DecisionBody, ROOT_CLASS, ROW_CLASS, type DecisionCardsVariant, type DecisionItem, type DecisionLabels }
