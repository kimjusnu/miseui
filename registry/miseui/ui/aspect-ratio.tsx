import type * as React from "react"
import { useEffect, useRef, useState } from "react"
import { AspectRatio as AspectRatioPrimitive } from "radix-ui"
import { ImageIcon } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { cn } from "@/registry/miseui/lib/utils"

type AspectRatioVariant = "plain" | "framed" | "overlay" | "placeholder"
type AspectRatioEffect = "reveal"

const INSTANT = { duration: 0 } as const
const MEDIA_CLASS = "size-full [&>img]:size-full [&>img]:object-cover [&>video]:size-full [&>video]:object-cover"
const MAX_DENOMINATOR = 16
const RATIO_TOLERANCE = 0.005

/** Prefers the small whole numbers people say out loud; a cinema 2.39 stays a decimal rather than becoming 43:18. */
function ratioLabel(ratio: number) {
  if (!Number.isFinite(ratio) || ratio <= 0) return ""
  for (let denominator = 1; denominator <= MAX_DENOMINATOR; denominator += 1) {
    const numerator = Math.round(ratio * denominator)
    if (numerator > 0 && Math.abs(numerator / denominator - ratio) < RATIO_TOLERANCE) return `${numerator}:${denominator}`
  }
  return `${ratio.toFixed(2)}:1`
}

function useMediaReady(enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const root = ref.current
    if (!enabled || !root) return
    const finish = () => setReady(true)
    const media = root.querySelector<HTMLImageElement | HTMLVideoElement>("img, video")
    // A cached or broken image fired its event before this effect ran, and nothing arrives for a media-less slot.
    const settled = !media || (media instanceof HTMLImageElement ? media.complete : media.readyState >= 2)
    if (settled) {
      const frame = requestAnimationFrame(finish)
      return () => cancelAnimationFrame(frame)
    }
    // Media events do not bubble but they do pass through the capture phase. An error must also reveal, or a broken image stays invisible.
    const events = ["load", "loadeddata", "error"]
    events.forEach((name) => root.addEventListener(name, finish, true))
    return () => events.forEach((name) => root.removeEventListener(name, finish, true))
  }, [enabled])
  return { ref, ready }
}

function RevealMedia({ children }: { children: React.ReactNode }) {
  const reduceMotion = useReducedMotion() ?? false
  const { ref, ready } = useMediaReady(true)
  const hidden = reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 1.02, filter: "blur(8px)" }
  const shown = reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, filter: "blur(0px)" }
  return (
    <motion.div
      ref={ref}
      data-slot="aspect-ratio-media"
      data-ready={ready ? "true" : "false"}
      className={MEDIA_CLASS}
      initial={false}
      animate={ready ? shown : hidden}
      transition={reduceMotion ? INSTANT : SPRING_DEFAULT}
    >
      {children}
    </motion.div>
  )
}

function Media({ effect, children }: { effect?: AspectRatioEffect; children: React.ReactNode }) {
  if (effect === "reveal") return <RevealMedia>{children}</RevealMedia>
  return (
    <div data-slot="aspect-ratio-media" className={MEDIA_CLASS}>
      {children}
    </div>
  )
}

type AspectRatioProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** Width divided by height, such as 16 / 9. */
  ratio?: number
  /** `plain` clipped media, `framed` a mat with the caption below, `overlay` the caption on the media, `placeholder` an empty slot. */
  variant?: AspectRatioVariant
  /** `reveal` keeps the media hidden until it has loaded, then brings it into focus. */
  effect?: AspectRatioEffect
  /** Shown by `framed` and `overlay`. */
  caption?: React.ReactNode
  /** What `placeholder` says; defaults to the ratio itself. */
  label?: string
  children?: React.ReactNode
}

function EmptySlot({ ratio, label }: { ratio: number; label: string }) {
  return (
    <AspectRatioPrimitive.Root ratio={ratio}>
      <div className="flex size-full flex-col items-center justify-center gap-2">
        <ImageIcon aria-hidden="true" className="size-5" />
        <span className="text-[13px] tabular-nums">{label}</span>
      </div>
    </AspectRatioPrimitive.Root>
  )
}

function AspectRatio({
  ratio = 16 / 9,
  variant = "plain",
  effect,
  caption,
  label,
  className,
  children,
  ...props
}: AspectRatioProps) {
  const root = { ...props, "data-slot": "aspect-ratio", "data-variant": variant, "data-effect": effect }
  const box = (
    <AspectRatioPrimitive.Root ratio={ratio}>
      <Media effect={effect}>{children}</Media>
    </AspectRatioPrimitive.Root>
  )
  if (variant === "framed") {
    return (
      <figure {...root} className={cn("m-0 grid min-w-0 gap-2 rounded-xl border bg-card p-2", className)}>
        <div className="overflow-hidden rounded-md bg-muted">{box}</div>
        {caption ? <figcaption className="px-1 pb-1 text-[13px] leading-5 text-muted-foreground">{caption}</figcaption> : null}
      </figure>
    )
  }
  if (variant === "overlay") {
    return (
      <figure {...root} className={cn("relative m-0 min-w-0 overflow-hidden rounded-lg bg-muted", className)}>
        {box}
        {caption ? (
          // Fixed black and white: this sits on a photo in either theme, so theme tokens would say nothing about legibility.
          <figcaption className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent px-3 pt-8 pb-3 text-sm leading-5 font-medium text-white">
            {caption}
          </figcaption>
        ) : null}
      </figure>
    )
  }
  if (variant === "placeholder") {
    const text = label ?? ratioLabel(ratio)
    return (
      <div
        {...root}
        role="img"
        aria-label={label ?? `Empty media slot, ${text}`}
        className={cn("min-w-0 rounded-lg border border-dashed bg-muted/50 text-muted-foreground", className)}
      >
        <EmptySlot ratio={ratio} label={text} />
      </div>
    )
  }
  return (
    <div {...root} className={cn("min-w-0 overflow-hidden rounded-lg bg-muted", className)}>
      {box}
    </div>
  )
}

export { AspectRatio, ratioLabel, type AspectRatioProps, type AspectRatioVariant, type AspectRatioEffect }
