import type * as React from "react"
import { useId, useMemo, useState } from "react"
import { motion, useReducedMotion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { encodeQr, QrTooLongError, type QrSymbol } from "@/registry/miseui/ui/qr-code-encode"
import { dotPath, finderPath, logoHole, squarePath } from "@/registry/miseui/ui/qr-code-shapes"
import type { QrLevel } from "@/registry/miseui/ui/qr-code-tables"
import { cn } from "@/registry/miseui/lib/utils"

type QrCodeVariant = "plain" | "rounded" | "framed" | "logo"
type QrCodeEffect = "reveal"

/** The standard asks for four modules of light margin; a phone camera needs them to find the edge. */
const QUIET_ZONE = 4
const DEFAULT_SIZE_PX = 192
/**
 * Fixed on purpose, in both themes. Readers expect dark on light, and many refuse an inverted symbol,
 * so these two are the one place the theme tokens must not reach.
 */
const DARK_MODULE = "#000000"
const LIGHT_MODULE = "#ffffff"

type QrCodeProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** The text or URL to encode, as UTF-8 in byte mode. */
  value: string
  /** `plain` square modules, `rounded` dots with soft finders, `framed` a card with a caption, `logo` a centre mark. */
  variant?: QrCodeVariant
  /** `reveal` opens the symbol outward once, then removes the clip so nothing stands between it and a camera. */
  effect?: QrCodeEffect
  /** Error correction. `logo` always uses H because the mark covers modules. */
  level?: QrLevel
  /** Width in px; it shrinks with a narrower container. */
  size?: number
  /** What the code is for, read by assistive tech. Say where it leads, not that it is a QR code. */
  label?: string
  /** Line under the symbol in `framed`. */
  caption?: React.ReactNode
  /** The centre mark of `logo`. Keep it simple: it sits on a white tile. */
  logo?: React.ReactNode
}

function tryEncode(value: string, level: QrLevel): { symbol?: QrSymbol; error?: string } {
  try {
    return { symbol: encodeQr(value, { level }) }
  } catch (error) {
    if (error instanceof QrTooLongError) return { error: error.message }
    throw error
  }
}

function modulesPath(symbol: QrSymbol, variant: QrCodeVariant) {
  if (variant === "rounded") return dotPath(symbol.modules, QUIET_ZONE) + finderPath(symbol.size, QUIET_ZONE)
  return squarePath(symbol.modules, QUIET_ZONE, variant === "logo" ? logoHole(symbol.size) : undefined)
}

interface QrSvgProps {
  symbol: QrSymbol
  variant: QrCodeVariant
  label: string
  reveal: boolean
}

function QrSvg({ symbol, variant, label, reveal }: QrSvgProps) {
  const reduceMotion = useReducedMotion() ?? false
  const clipId = `qr-reveal-${useId().replace(/[^a-zA-Z0-9]/g, "")}`
  const [revealed, setRevealed] = useState(false)
  const box = symbol.size + QUIET_ZONE * 2
  const path = useMemo(() => modulesPath(symbol, variant), [symbol, variant])
  const clipping = reveal && !reduceMotion && !revealed
  return (
    <svg
      role="img"
      aria-label={label}
      data-slot="qr-code-symbol"
      viewBox={`0 0 ${box} ${box}`}
      shapeRendering={variant === "rounded" ? "geometricPrecision" : "crispEdges"}
      className="block h-auto w-full"
    >
      {clipping ? (
        <clipPath id={clipId}>
          <motion.circle
            cx={box / 2}
            cy={box / 2}
            initial={{ r: 0 }}
            animate={{ r: box * Math.SQRT1_2 }}
            transition={SPRING_DEFAULT}
            onAnimationComplete={() => setRevealed(true)}
          />
        </clipPath>
      ) : null}
      <rect width={box} height={box} fill={LIGHT_MODULE} />
      <path d={path} fill={DARK_MODULE} fillRule="evenodd" clipPath={clipping ? `url(#${clipId})` : undefined} />
    </svg>
  )
}

function QrLogo({ symbol, children }: { symbol: QrSymbol; children: React.ReactNode }) {
  const share = (logoHole(symbol.size).side / (symbol.size + QUIET_ZONE * 2)) * 100
  return (
    <div
      data-slot="qr-code-logo"
      aria-hidden="true"
      style={{ width: `${share}%` }}
      className="absolute top-1/2 left-1/2 grid aspect-square -translate-x-1/2 -translate-y-1/2 place-items-center overflow-hidden text-black *:size-3/4"
    >
      {children}
    </div>
  )
}

function QrFrame({ caption, children }: { caption?: React.ReactNode; children: React.ReactNode }) {
  return (
    <figure className="grid gap-3 rounded-xl border bg-card p-3 text-card-foreground shadow-xs">
      {children}
      {caption ? (
        <figcaption data-slot="qr-code-caption" className="text-center text-[13px] leading-5 text-muted-foreground">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  )
}

function QrCode({ value, variant = "plain", effect, level = "M", size = DEFAULT_SIZE_PX, label, caption, logo, className, style, ...props }: QrCodeProps) {
  const resolvedLevel: QrLevel = variant === "logo" ? "H" : level
  const { symbol, error } = useMemo(() => tryEncode(value, resolvedLevel), [value, resolvedLevel])
  const root = { "data-slot": "qr-code", "data-variant": variant, "data-effect": effect, style: { ...style, width: size }, ...props }
  if (!symbol) {
    return (
      <div {...root} role="alert" data-state="error" className={cn("max-w-full rounded-md border border-dashed p-4 text-[13px] leading-5 text-muted-foreground", className)}>
        {error}
      </div>
    )
  }
  const tile = (
    <div className="relative overflow-hidden rounded-md">
      <QrSvg key={value} symbol={symbol} variant={variant} label={label ?? `QR code for ${value}`} reveal={effect === "reveal"} />
      {variant === "logo" && logo ? <QrLogo symbol={symbol}>{logo}</QrLogo> : null}
    </div>
  )
  return (
    <div {...root} className={cn("max-w-full", className)}>
      {variant === "framed" ? <QrFrame caption={caption}>{tile}</QrFrame> : tile}
    </div>
  )
}

export { QrCode, type QrCodeProps, type QrCodeVariant, type QrCodeEffect, type QrLevel }
