import type * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/registry/miseui/lib/utils"
import { Badge } from "@/registry/miseui/ui/badge"
import { Card } from "@/registry/miseui/ui/card"

const SOFT_SHADOW_CLASS = "shadow-[0_16px_40px_-24px_color-mix(in_oklab,var(--mise)_24%,oklch(0_0_0/40%))]"
/** A whisper of the accent on a neutral: the panel belongs to the brand in every palette without shouting. */
const PANEL_TINT_CLASS = "bg-[color-mix(in_oklab,var(--mise)_6%,var(--muted))]"
const GRID_CELL_PX = 32
const GRID_STYLE: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
  backgroundSize: `${GRID_CELL_PX}px ${GRID_CELL_PX}px`,
  maskImage: "radial-gradient(ellipse at center, #000 20%, transparent 72%)",
  opacity: 0.5,
}

/** Sample product UI, so it is hidden from assistive tech: nobody logging in needs a stranger's invoice read out. */
function InvoiceFragments() {
  return (
    <div aria-hidden="true" data-testid="login-visual" className="relative mt-8 w-full max-w-xs">
      <Card className="absolute inset-x-4 -top-8 gap-0 rounded-2xl bg-card px-4 py-2 shadow-none">
        <div className="flex items-center justify-between gap-3 text-[13px] text-muted-foreground">
          Invoice 1041
          <Badge variant="outline">Paid</Badge>
        </div>
      </Card>
      <Card className={cn("relative gap-3 rounded-2xl bg-popover p-6", SOFT_SHADOW_CLASS)}>
        <div className="flex items-center justify-between gap-3 text-[13px] text-muted-foreground">
          Invoice 1042
          <Badge variant="secondary">Due in 3 days</Badge>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-[15px]">Northgate Studio</p>
          <p className="text-display text-3xl tabular-nums">$1,240.00</p>
        </div>
      </Card>
      <Badge variant="mise" className={cn("absolute -right-3 -bottom-3", SOFT_SHADOW_CLASS)}>
        <Check />
        Reminder sent
      </Badge>
    </div>
  )
}

interface BrandPanelProps {
  brandName: string
  tagline: string
  visual: React.ReactNode
}

/** Inset from the edge and rounded like the cards, so it reads as a calm surface and not a half-painted page. */
function BrandPanel({ brandName, tagline, visual }: BrandPanelProps) {
  return (
    <aside className={cn("relative isolate m-2 hidden flex-col justify-between gap-8 overflow-hidden rounded-2xl border p-8 @3xl:flex @5xl:p-12", PANEL_TINT_CLASS)}>
      <span aria-hidden="true" className="absolute inset-0 -z-10" style={GRID_STYLE} />
      <span className="text-[15px] font-medium">{brandName}</span>
      <div className="flex flex-1 items-center justify-center">{visual}</div>
      <p className="text-display max-w-md text-3xl leading-[1.12]! text-balance @5xl:text-4xl">{tagline}</p>
    </aside>
  )
}

export { BrandPanel, InvoiceFragments }
