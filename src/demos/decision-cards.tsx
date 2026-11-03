import { DecisionCards, type DecisionItem } from "@/registry/miseui/ui/decision-cards"

const ITEMS: readonly DecisionItem[] = [
  {
    title: "Where should search run?",
    chosen: "In the database",
    rejected: ["A hosted search service", "A separate index"],
    reason: "The catalogue has eight thousand rows, and one more system to keep in step was not worth it.",
  },
  {
    title: "How do people sign in?",
    chosen: "Email links",
    rejected: "Passwords",
    reason: "Most password resets happened at checkout, the worst moment to lose someone.",
  },
]

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <Cell label="split">
        <DecisionCards items={ITEMS} />
      </Cell>
      <Cell label="diff">
        <DecisionCards items={ITEMS} variant="diff" />
      </Cell>
      <Cell label="ledger">
        <DecisionCards items={ITEMS} variant="ledger" />
      </Cell>
      <Cell label="disclose effect, ledger">
        <DecisionCards items={ITEMS} variant="ledger" effect="disclose" />
      </Cell>
    </div>
  )
}
