import { useState } from "react"
import { Button } from "@/registry/miseui/ui/button"
import { Steps, type StepItem, type StepsVariant } from "@/registry/miseui/ui/steps"

const CHECKOUT: readonly StepItem[] = [
  { title: "Cart", description: "Three items, ready to go" },
  { title: "Shipping", description: "Where and how it should arrive" },
  { title: "Payment", description: "Card or bank transfer" },
  { title: "Review", description: "One last look before ordering" },
]
const WITH_ERROR: readonly StepItem[] = [
  { title: "Upload" },
  { title: "Check file", description: "Row 12 has no email address", error: true },
  { title: "Import" },
]
const VARIANTS: readonly StepsVariant[] = ["horizontal", "vertical", "compact", "numbered"]

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

function Stepping({ variant }: { variant: StepsVariant }) {
  const [current, setCurrent] = useState(1)
  return (
    <div className="grid gap-3">
      <Steps aria-label="Checkout" steps={CHECKOUT} current={current} variant={variant} effect="draw" onStepSelect={setCurrent} />
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={current === 0} onClick={() => setCurrent((step) => step - 1)}>
          Back
        </Button>
        <Button size="sm" disabled={current >= CHECKOUT.length} onClick={() => setCurrent((step) => step + 1)}>
          Next
        </Button>
      </div>
    </div>
  )
}

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      {VARIANTS.map((variant) => (
        <Cell key={variant} label={variant}>
          <Steps aria-label="Checkout" steps={CHECKOUT} current={1} variant={variant} />
        </Cell>
      ))}
      <Cell label="draw effect, horizontal">
        <Stepping variant="horizontal" />
      </Cell>
      <Cell label="draw effect, vertical">
        <Stepping variant="vertical" />
      </Cell>
      <Cell label="error, vertical">
        <Steps aria-label="Import" steps={WITH_ERROR} current={1} variant="vertical" />
      </Cell>
      <Cell label="error, compact">
        <Steps aria-label="Import" steps={WITH_ERROR} current={1} variant="compact" />
      </Cell>
    </div>
  )
}
