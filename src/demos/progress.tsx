import type * as React from "react"
import { useState } from "react"
import { Button } from "@/registry/miseui/ui/button"
import { Progress, type ProgressEffect, type ProgressVariant } from "@/registry/miseui/ui/progress"

const VARIANTS: readonly ProgressVariant[] = ["plain", "thin", "segmented", "labelled"]
const EFFECTS: readonly ProgressEffect[] = ["shimmer", "spring"]
const STEP = 15

function Labelled({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 gap-2">
      <p className="text-xs text-muted-foreground">{title}</p>
      {children}
    </div>
  )
}

export function Demo() {
  const [value, setValue] = useState(45)
  return (
    <div className="grid w-full max-w-md min-w-0 gap-6">
      {VARIANTS.map((variant) => (
        <Labelled key={variant} title={variant}>
          <Progress label="Uploading photos" value={value} variant={variant} />
        </Labelled>
      ))}
      {EFFECTS.map((effect) => (
        <Labelled key={effect} title={`${effect} effect`}>
          <Progress label={`Uploading photos, ${effect}`} value={value} effect={effect} />
        </Labelled>
      ))}
      <Labelled title="segmented with shimmer">
        <Progress label="Setup steps" value={value} variant="segmented" effect="shimmer" />
      </Labelled>
      <Labelled title="indeterminate">
        <Progress label="Connecting to the printer" variant="labelled" />
      </Labelled>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => setValue((current) => Math.max(0, current - STEP))}>
          Back
        </Button>
        <Button size="sm" variant="outline" onClick={() => setValue((current) => Math.min(100, current + STEP))}>
          Advance
        </Button>
      </div>
    </div>
  )
}
