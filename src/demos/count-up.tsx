import type * as React from "react"
import { useState } from "react"
import { RotateCcw } from "lucide-react"
import { Button } from "@/registry/miseui/ui/button"
import { CountUp } from "@/registry/miseui/ui/count-up"

/** Container units, so a long figure shrinks with a narrow cell instead of overflowing it. */
const FIGURE_CLASS = "text-[clamp(24px,11cqi,36px)] leading-tight font-semibold tracking-tight"
const CURRENCY = { style: "currency", currency: "USD", maximumFractionDigits: 0 } as const

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="@container grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

function CartTotal() {
  const [total, setTotal] = useState(1280)
  return (
    <div className="grid gap-3">
      <div className={FIGURE_CLASS}>
        <CountUp value={total} from={1280} variant="odometer" effect="retarget" formatOptions={CURRENCY} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => setTotal(total + 349)}>
          Add headphones
        </Button>
        <Button variant="outline" size="sm" disabled={total < 500} onClick={() => setTotal(total - 500)}>
          Use a voucher
        </Button>
      </div>
    </div>
  )
}

export function Demo() {
  const [run, setRun] = useState(0)
  return (
    <div className="grid gap-8">
      <div>
        <Button variant="outline" size="sm" onClick={() => setRun(run + 1)}>
          <RotateCcw aria-hidden="true" />
          Play again
        </Button>
      </div>
      <div key={run} className="grid gap-8 sm:grid-cols-2">
        <Cell label="plain, revenue this month">
          <CountUp value={48250} className={FIGURE_CLASS} formatOptions={CURRENCY} />
        </Cell>
        <Cell label="odometer, orders shipped">
          <CountUp value={12480} variant="odometer" className={FIGURE_CLASS} />
        </Cell>
        <Cell label="board, seats left">
          <CountUp value={3482} variant="board" className={FIGURE_CLASS} />
        </Cell>
        <Cell label="meter, storage used of 100 GB">
          <CountUp value={72} max={100} suffix=" GB" variant="meter" className={FIGURE_CLASS} />
        </Cell>
        <Cell label="compact notation, in your language">
          <CountUp value={1500} variant="odometer" className={FIGURE_CLASS} formatOptions={{ notation: "compact" }} />
        </Cell>
        <Cell label="retarget effect, cart total">
          <CartTotal />
        </Cell>
      </div>
    </div>
  )
}
