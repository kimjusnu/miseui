import type * as React from "react"
import { Eraser, Keyboard, PenLine, Undo2 } from "lucide-react"
import { Button } from "@/registry/miseui/ui/button"
import { SCRIPT_FONT } from "@/registry/miseui/ui/signature-pad-export"
import { smoothPath, typedFontSize, type SignatureBox, type SignatureStroke } from "@/registry/miseui/ui/signature-pad-math"
import { cn } from "@/registry/miseui/lib/utils"

interface SignatureLabels {
  /** Names the drawing area. */
  pad: string
  placeholder: string
  lineHint: string
  undo: string
  clear: string
  typeInstead: string
  drawInstead: string
  typedName: string
  strokes: (count: number) => string
}

interface SignatureActionsProps {
  labels: SignatureLabels
  typing: boolean
  allowTyped: boolean
  canUndo: boolean
  canClear: boolean
  disabled: boolean
  onUndo: () => void
  onClear: () => void
  onToggleMode: () => void
}

/** Undo stays a real control while it has nothing to do, so the row keeps its shape. */
function SignatureActions({ labels, typing, allowTyped, canUndo, canClear, disabled, onUndo, onClear, onToggleMode }: SignatureActionsProps) {
  return (
    <div data-slot="signature-pad-actions" className="flex flex-wrap items-center gap-1">
      {allowTyped ? (
        <Button type="button" variant="ghost" size="sm" disabled={disabled} className="pointer-coarse:h-10" onClick={onToggleMode}>
          {typing ? <PenLine aria-hidden="true" /> : <Keyboard aria-hidden="true" />}
          {typing ? labels.drawInstead : labels.typeInstead}
        </Button>
      ) : null}
      <div className="ms-auto flex items-center gap-1">
        {typing ? null : (
          <Button type="button" variant="ghost" size="sm" disabled={disabled || !canUndo} className="pointer-coarse:h-10" onClick={onUndo}>
            <Undo2 aria-hidden="true" />
            {labels.undo}
          </Button>
        )}
        <Button type="button" variant="ghost" size="sm" disabled={disabled || !canClear} className="pointer-coarse:h-10" onClick={onClear}>
          <Eraser aria-hidden="true" />
          {labels.clear}
        </Button>
      </div>
    </div>
  )
}

const ICON_BUTTON_CLASS = "size-8 pointer-coarse:size-10"

/** Compact has no row to spare, so the controls sit in the corner of the pad, out of the way of most signatures. */
function CompactActions({ labels, typing, allowTyped, canUndo, canClear, disabled, onUndo, onClear, onToggleMode }: SignatureActionsProps) {
  return (
    <div data-slot="signature-pad-actions" className="absolute top-0 right-0 flex items-center">
      {canUndo && !typing ? (
        <Button type="button" variant="ghost" size="icon" aria-label={labels.undo} disabled={disabled} className={ICON_BUTTON_CLASS} onClick={onUndo}>
          <Undo2 aria-hidden="true" />
        </Button>
      ) : null}
      {canClear ? (
        <Button type="button" variant="ghost" size="icon" aria-label={labels.clear} disabled={disabled} className={ICON_BUTTON_CLASS} onClick={onClear}>
          <Eraser aria-hidden="true" />
        </Button>
      ) : null}
      {allowTyped ? (
        <Button type="button" variant="ghost" size="icon" aria-label={typing ? labels.drawInstead : labels.typeInstead} disabled={disabled} className={ICON_BUTTON_CLASS} onClick={onToggleMode}>
          {typing ? <PenLine aria-hidden="true" /> : <Keyboard aria-hidden="true" />}
        </Button>
      ) : null}
    </div>
  )
}

/** Anchored from the bottom in px, not a share of the height, so the room above the line grows with the pad. */
function SigningRule({ hint, empty }: { hint: string; empty: boolean }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-4 bottom-2">
      <div className="relative">
        <span className="absolute bottom-1 left-0 text-[13px] text-muted-foreground">x</span>
        <div data-slot="signature-pad-rule" className="h-px bg-foreground/40" />
      </div>
      <p className={cn("mt-1 text-[13px] text-muted-foreground", !empty && "invisible")}>{hint}</p>
    </div>
  )
}

interface PadInkProps {
  strokes: readonly SignatureStroke[]
  drawing: SignatureStroke | null
  typed: string
  box: SignatureBox
  strokeWidth: number
  svg: React.RefObject<SVGSVGElement | null>
}

function PadInk({ strokes, drawing, typed, box, strokeWidth, svg }: PadInkProps) {
  return (
    <svg ref={svg} aria-hidden="true" viewBox={`0 0 ${box.width} ${box.height}`} className="block size-full">
      {typed ? (
        <text x={box.width / 2} y={box.height / 2} textAnchor="middle" dominantBaseline="central" fontFamily={SCRIPT_FONT} fontSize={typedFontSize(typed, box)} className="fill-foreground">
          {typed}
        </text>
      ) : (
        <g fill="none" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className="stroke-foreground">
          {strokes.map((stroke, index) => (
            <path key={index} data-slot="signature-pad-stroke" d={smoothPath(stroke)} />
          ))}
          {drawing ? <path data-slot="signature-pad-stroke" d={smoothPath(drawing)} /> : null}
        </g>
      )}
    </svg>
  )
}

export { CompactActions, PadInk, SignatureActions, SigningRule, type SignatureActionsProps, type SignatureLabels }
