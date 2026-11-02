import { useState } from "react"
import { Button } from "@/registry/miseui/ui/button"
import { ProgressCircular, type ProgressCircularVariant } from "@/registry/miseui/ui/progress-circular"

const VARIANTS: readonly ProgressCircularVariant[] = ["ring", "thin", "gauge", "segmented"]

function DemoCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 content-start justify-items-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex flex-wrap items-center gap-4">{children}</div>
    </div>
  )
}

function SpringDemo() {
  const [value, setValue] = useState(35)
  return (
    <DemoCell label="spring effect, try quick clicks">
      <ProgressCircular value={value} label="Upload" effect="spring" size="lg" />
      <ProgressCircular value={value} variant="gauge" label="Quota" effect="spring" size="lg" />
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => setValue((current) => Math.max(0, current - 20))}>
          Less
        </Button>
        <Button size="sm" variant="outline" onClick={() => setValue((current) => Math.min(100, current + 20))}>
          More
        </Button>
      </div>
    </DemoCell>
  )
}

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      {VARIANTS.map((variant) => (
        <DemoCell key={variant} label={variant}>
          <ProgressCircular variant={variant} value={72} size="lg" label={variant === "gauge" ? "Disk" : "Upload"} />
          <ProgressCircular variant={variant} value={40} label="Upload" />
          <ProgressCircular variant={variant} value={20} size="sm" label="Upload" />
        </DemoCell>
      ))}
      <DemoCell label="no value: nobody knows yet">
        {VARIANTS.map((variant) => (
          <ProgressCircular key={variant} variant={variant} label="Preparing your export" />
        ))}
      </DemoCell>
      <SpringDemo />
    </div>
  )
}
