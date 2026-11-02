import { NumberInput } from "@/registry/miseui/ui/number-input"

const USD = { style: "currency", currency: "USD", maximumFractionDigits: 0 } as const
const PERCENT = { style: "percent" } as const

function DemoCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <DemoCell label="plain">
        <NumberInput aria-label="Team size" defaultValue={8} min={1} max={500} />
      </DemoCell>
      <DemoCell label="split, stops at the limit">
        <NumberInput variant="split" aria-label="Guests" defaultValue={2} min={1} max={4} />
      </DemoCell>
      <DemoCell label="stepper-pill">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <span className="text-sm">Oat flat white</span>
          <NumberInput variant="stepper-pill" aria-label="Quantity" defaultValue={1} min={0} max={9} />
        </div>
      </DemoCell>
      <DemoCell label="large">
        <NumberInput variant="large" aria-label="Seats" defaultValue={12} min={1} max={500} caption="seats" />
      </DemoCell>
      <DemoCell label="Intl format, percent">
        <NumberInput aria-label="Tax rate" defaultValue={0.1} min={0} max={1} step={0.01} format={PERCENT} />
      </DemoCell>
      <DemoCell label="roll effect, hold a button">
        <NumberInput
          variant="large"
          effect="roll"
          aria-label="Monthly budget"
          defaultValue={1190}
          min={0}
          step={10}
          format={USD}
          caption="per month"
        />
      </DemoCell>
    </div>
  )
}
