import type * as React from "react"
import { useImperativeHandle } from "react"
import { DEFAULT_STROKE_WIDTH, signatureToPng, signatureToSvg } from "@/registry/miseui/ui/signature-pad-export"
import { strokesToPath, type SignatureBox, type SignatureStroke } from "@/registry/miseui/ui/signature-pad-math"
import { CompactActions, PadInk, SignatureActions, SigningRule, type SignatureLabels } from "@/registry/miseui/ui/signature-pad-parts"
import { usePadDrawing, useSignature, type SignatureValue } from "@/registry/miseui/ui/signature-pad-state"
import { Input } from "@/registry/miseui/ui/input"
import { cn } from "@/registry/miseui/lib/utils"

type SignaturePadVariant = "plain" | "line" | "card" | "compact"

/** Strokes live in this fixed box, and the SVG scales it: resizing the pad can never lose or redraw ink. */
const BOX: Record<SignaturePadVariant, SignatureBox> = {
  plain: { width: 500, height: 200 },
  line: { width: 500, height: 200 },
  card: { width: 500, height: 200 },
  compact: { width: 400, height: 100 },
}

const PAD_CLASS: Record<SignaturePadVariant, string> = {
  plain: "aspect-[5/2] rounded-lg border bg-background",
  line: "aspect-[5/2]",
  card: "aspect-[5/2] rounded-lg bg-muted",
  compact: "aspect-[4/1] rounded-md border bg-background",
}

const DEFAULT_LABELS: SignatureLabels = {
  pad: "Signature",
  placeholder: "Sign here",
  lineHint: "Sign above the line",
  undo: "Undo",
  clear: "Clear",
  typeInstead: "Type instead",
  drawInstead: "Draw instead",
  typedName: "Your full name",
  strokes: (count) => (count === 0 ? "empty" : `${count} ${count === 1 ? "stroke" : "strokes"}`),
}

interface SignaturePadHandle {
  clear: () => void
  undo: () => void
  isEmpty: () => boolean
  toSvgPath: () => string
  toSvg: (options?: { color?: string; background?: string }) => string
  toPng: (options?: { color?: string; background?: string; scale?: number }) => string
}

interface SignaturePadProps extends Omit<React.ComponentProps<"div">, "onChange" | "defaultValue" | "title" | "ref"> {
  /** `plain` a bordered box, `line` a signing rule with no box, `card` a titled surface, `compact` one short strip with its controls inside. */
  variant?: SignaturePadVariant
  defaultStrokes?: readonly SignatureStroke[]
  onChange?: (value: SignatureValue) => void
  /** `card`: the heading. */
  title?: React.ReactNode
  /** `card`: one line under the heading, a good place for what the signature agrees to. */
  description?: React.ReactNode
  /** A way to sign without a pointer. Turn it off only if a drawn signature is a legal requirement and you offer another route. */
  allowTyped?: boolean
  disabled?: boolean
  /** Posts the path, or the typed name, with a form. */
  name?: string
  strokeWidth?: number
  labels?: Partial<SignatureLabels>
  ref?: React.Ref<SignaturePadHandle>
}

function CardHeading({ title, description }: Pick<SignaturePadProps, "title" | "description">) {
  if (!title && !description) return null
  return (
    <div className="grid gap-1">
      {title ? <p className="text-[15px] font-medium">{title}</p> : null}
      {description ? <p className="text-[13px] text-muted-foreground">{description}</p> : null}
    </div>
  )
}

function SignaturePad({ variant = "plain", defaultStrokes, onChange, title, description, allowTyped = true, disabled = false, name, strokeWidth = DEFAULT_STROKE_WIDTH, labels: labelOverrides, ref, className, ...props }: SignaturePadProps) {
  const labels = { ...DEFAULT_LABELS, ...labelOverrides }
  const box = BOX[variant]
  const signature = useSignature(defaultStrokes, onChange)
  const { strokes, typing, empty } = signature
  const { svg, drawing, surface } = usePadDrawing(box, disabled || typing, signature.dispatch)
  const content = { strokes, typed: signature.name }
  useImperativeHandle(ref, () => ({
    clear: signature.clear,
    undo: signature.undo,
    isEmpty: () => empty,
    toSvgPath: () => (signature.name ? "" : strokesToPath(strokes)),
    toSvg: (options) => signatureToSvg(content, { box, strokeWidth, ...options }),
    toPng: (options) => signatureToPng(content, { box, strokeWidth, ...options }),
  }))
  const actions = { labels, typing, allowTyped, canUndo: signature.canUndo, canClear: !empty, disabled, onUndo: signature.undo, onClear: signature.clear, onToggleMode: signature.toggleMode }
  const pad = (
    <div
      data-slot="signature-pad-surface"
      role="img"
      aria-label={`${labels.pad}, ${signature.name || labels.strokes(strokes.length)}`}
      className={cn("relative w-full min-w-0 touch-none overflow-hidden select-none", PAD_CLASS[variant], !disabled && !typing && "cursor-crosshair", disabled && "opacity-50")}
      {...surface}
    >
      <PadInk strokes={strokes} drawing={drawing} typed={signature.name} box={box} strokeWidth={strokeWidth} svg={svg} />
      {variant === "line" ? <SigningRule hint={labels.lineHint} empty={empty && !drawing} /> : null}
      {variant !== "line" && empty && !drawing ? <p className="pointer-events-none absolute inset-0 grid place-items-center text-[13px] text-muted-foreground">{labels.placeholder}</p> : null}
    </div>
  )
  return (
    <div data-slot="signature-pad" data-variant={variant} data-mode={typing ? "typed" : "drawn"} className={cn("grid w-full min-w-0 grid-cols-[minmax(0,1fr)] gap-2", variant === "card" && "gap-3 rounded-xl border bg-card p-4", className)} {...props}>
      {variant === "card" ? <CardHeading title={title} description={description} /> : null}
      {variant === "compact" ? (
        <div className="relative min-w-0">
          {pad}
          <CompactActions {...actions} />
        </div>
      ) : (
        pad
      )}
      {/* Mounted only by pressing the toggle, so taking focus here is what that press asked for. */}
      {typing ? <Input autoFocus aria-label={labels.typedName} placeholder={labels.typedName} disabled={disabled} value={signature.typed} autoComplete="name" onChange={(event) => signature.typeName(event.target.value)} /> : null}
      {variant === "compact" ? null : <SignatureActions {...actions} />}
      {name ? <input type="hidden" name={name} value={signature.name || strokesToPath(strokes)} /> : null}
    </div>
  )
}

export { SignaturePad, signatureToPng, signatureToSvg, type SignaturePadHandle, type SignaturePadProps, type SignaturePadVariant, type SignatureStroke, type SignatureValue }
