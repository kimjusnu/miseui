import type * as React from "react"
import { useRef, useState } from "react"
import { Button } from "@/registry/miseui/ui/button"
import { SignaturePad, type SignaturePadHandle, type SignaturePadVariant, type SignatureStroke } from "@/registry/miseui/ui/signature-pad"

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

const CARD_TEXT = { title: "Sign the delivery note", description: "You received 12 boxes in good condition." }
const VARIANTS: readonly SignaturePadVariant[] = ["plain", "line", "card", "compact"]

/** A wave drawn from a formula, so the sample really is strokes going through the same curve as a hand's. */
const SAMPLE: readonly SignatureStroke[] = [
  Array.from({ length: 40 }, (_, index) => ({
    x: 60 + index * 9.5,
    y: 100 + Math.sin(index / 2.6) * (38 - index * 0.7),
  })),
]

function Exporting() {
  const pad = useRef<SignaturePadHandle>(null)
  const [output, setOutput] = useState<string | null>(null)
  const show = (text: string | undefined) => setOutput(text ? `${text.slice(0, 64)}...` : null)
  return (
    <div className="grid min-w-0 gap-3">
      <SignaturePad ref={pad} defaultStrokes={SAMPLE} />
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" className="pointer-coarse:h-10" onClick={() => show(pad.current?.toSvgPath())}>
          SVG path
        </Button>
        <Button variant="outline" size="sm" className="pointer-coarse:h-10" onClick={() => show(pad.current?.toPng({ background: "#ffffff" }))}>
          PNG data URL
        </Button>
      </div>
      {output ? <p className="font-mono text-xs break-all text-muted-foreground">{output}</p> : null}
    </div>
  )
}

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      {VARIANTS.map((variant) => (
        <Cell key={variant} label={variant}>
          <SignaturePad variant={variant} title={CARD_TEXT.title} description={CARD_TEXT.description} />
        </Cell>
      ))}
      <Cell label="exports, with a saved signature loaded">
        <Exporting />
      </Cell>
    </div>
  )
}
