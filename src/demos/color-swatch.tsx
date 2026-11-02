import { useState } from "react"
import { ColorSwatch, ColorSwatchGroup, type ColorSwatchVariant } from "@/registry/miseui/ui/color-swatch"

const PALETTE = [
  { color: "#1e3a8a", name: "Navy" },
  { color: "#f59e0b", name: "Marigold" },
  { color: "#f4f4f5", name: "Fog" },
  { color: "rgb(37 99 235 / 40%)", name: "Glass", value: "#2563eb 40%" },
] as const

const VARIANTS: readonly ColorSwatchVariant[] = ["circle", "square", "chip", "tile"]

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

function Picker() {
  const [picked, setPicked] = useState<string>(PALETTE[1].name)
  return (
    <ColorSwatchGroup variant="tile" effect="lift" aria-label="Pick a label colour">
      {PALETTE.map((entry) => (
        <ColorSwatch
          key={entry.name}
          {...entry}
          selected={picked === entry.name}
          onSelect={() => setPicked(entry.name)}
        />
      ))}
    </ColorSwatchGroup>
  )
}

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      {VARIANTS.map((variant) => (
        <Cell key={variant} label={variant}>
          <ColorSwatchGroup variant={variant} aria-label={`Palette as ${variant}`}>
            {PALETTE.map((entry) => (
              <ColorSwatch key={entry.name} {...entry} />
            ))}
          </ColorSwatchGroup>
        </Cell>
      ))}
      <Cell label="single swatch, theme accent">
        <ColorSwatch color="var(--mise)" name="Accent" value="var(--mise)" />
      </Cell>
      <Cell label="lift effect, clickable">
        <Picker />
      </Cell>
    </div>
  )
}
