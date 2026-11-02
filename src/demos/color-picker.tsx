import { useState } from "react"
import { ColorPicker } from "@/registry/miseui/ui/color-picker"

const LABEL_COLORS = [
  { value: "#e11d48", label: "Bug" },
  { value: "#d97706", label: "Waiting" },
  { value: "#16a34a", label: "Ready" },
  { value: "#2563eb", label: "In progress" },
  { value: "#64748b", label: "Backlog" },
]

function DemoCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

function LabelPicker() {
  const [color, setColor] = useState("#16a34a")
  const name = LABEL_COLORS.find((entry) => entry.value === color)?.label ?? "Custom"
  return (
    <div className="grid gap-3">
      <ColorPicker variant="swatches" label="Label color" swatches={LABEL_COLORS} value={color} onValueChange={setColor} />
      <p className="text-[13px] text-muted-foreground">Label: {name}</p>
    </div>
  )
}

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <DemoCell label="popover">
        <ColorPicker defaultValue="#2563eb" label="Brand color" />
      </DemoCell>
      <DemoCell label="compact, type or paste a hex">
        <ColorPicker variant="compact" defaultValue="#0d9488" label="Link color" />
      </DemoCell>
      <DemoCell label="swatches">
        <LabelPicker />
      </DemoCell>
      <DemoCell label="swatches, spring effect">
        <ColorPicker variant="swatches" effect="spring" defaultValue="#7c3aed" label="Theme color" />
      </DemoCell>
      <DemoCell label="inline">
        <ColorPicker variant="inline" defaultValue="#e11d48" alpha={false} swatches={[]} />
      </DemoCell>
      <DemoCell label="inline, spring effect: click far away, then drag">
        <ColorPicker variant="inline" effect="spring" defaultValue="#2563eb" />
      </DemoCell>
    </div>
  )
}
