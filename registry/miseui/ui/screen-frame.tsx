import type * as React from "react"
import { useRef, useState } from "react"
import { motion, useInView, useReducedMotion } from "motion/react"
import { cn } from "@/registry/miseui/lib/utils"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"

type ScreenFrameVariant = "browser" | "phone" | "plain"
type ScreenFrameEffect = "settle"

const SETTLE_TRANSITION = { ...SPRING_DEFAULT, duration: 0.8 }
const VIEW_MARGIN = "0px 0px -10% 0px"
/** Black, not the foreground colour: a foreground shadow in dark mode would glow. */
const SHADOW = "shadow-[0_24px_48px_-24px_rgb(0_0_0/0.45)]"

const FRAME_CLASS: Record<ScreenFrameVariant, string> = {
  browser: cn("overflow-hidden rounded-lg border bg-card", SHADOW),
  phone: cn("mx-auto w-full max-w-60 rounded-[2rem] border bg-card p-2", SHADOW),
  plain: cn("overflow-hidden rounded-md ring-1 ring-border", SHADOW),
}

const SCREEN_CLASS: Record<ScreenFrameVariant, string> = {
  browser: "aspect-video",
  phone: "aspect-[9/19.5] overflow-hidden rounded-[1.5rem]",
  plain: "aspect-video",
}

/** What people read in an address bar: the host and path, without the protocol. */
function displayAddress(url: string) {
  return url.replace(/^[a-z][a-z0-9+.-]*:\/\//i, "").replace(/\/$/, "")
}

function ScreenImage({ src, alt, eager }: { src: string; alt: string; eager: boolean }) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return <p data-slot="screen-frame-fallback" className="grid size-full place-items-center p-4 text-center text-[13px] leading-5 text-muted-foreground">{alt}</p>
  }
  return <img src={src} alt={alt} loading={eager ? "eager" : "lazy"} decoding="async" className="block size-full object-cover" onError={() => setFailed(true)} />
}

interface ChromeProps {
  variant: ScreenFrameVariant
  url?: string
  screenClassName?: string
  children: React.ReactNode
}

function FrameChrome({ variant, url, screenClassName, children }: ChromeProps) {
  return (
    <>
      {/* The real address and no decorative traffic lights: they say nothing and date a screenshot. */}
      {variant === "browser" && url ? (
        <p data-slot="screen-frame-address" className="truncate border-b px-3 py-1 font-mono text-xs leading-5 text-muted-foreground">
          {displayAddress(url)}
        </p>
      ) : null}
      <div data-slot="screen-frame-screen" className={cn("min-w-0 bg-background", SCREEN_CLASS[variant], screenClassName)}>
        {children}
      </div>
    </>
  )
}

type ScreenFrameProps = Omit<React.ComponentProps<"figure">, "children"> & {
  /** A screenshot. Leave it out and pass `children` to frame live interface. */
  src?: string
  alt?: string
  /** Shown in the `browser` bar. */
  url?: string
  /** A line under the frame. */
  caption?: React.ReactNode
  /** Loads straight away, for the first screen of a page. */
  eager?: boolean
  /** Changes the screen, such as its aspect ratio. */
  screenClassName?: string
  /** `browser` a window with its address, `phone` a slim device, `plain` only a hairline and a shadow. */
  variant?: ScreenFrameVariant
  /** `settle` lays the frame flat as it comes into view, from a slight tilt. */
  effect?: ScreenFrameEffect
  children?: React.ReactNode
}

function ScreenFrame({ src, alt = "", url, caption, eager = false, screenClassName, variant = "browser", effect, className, children, ...props }: ScreenFrameProps) {
  const reduceMotion = useReducedMotion() ?? false
  const ref = useRef<HTMLDivElement>(null)
  const seen = useInView(ref, { once: true, margin: VIEW_MARGIN })
  const settling = effect === "settle" && !reduceMotion
  const tilted = { rotateX: 10, scale: 0.97, transformPerspective: 1200 }
  const flat = { rotateX: 0, scale: 1, transformPerspective: 1200 }
  const screen = children ?? (src ? <ScreenImage src={src} alt={alt} eager={eager} /> : null)
  return (
    <figure data-slot="screen-frame" data-variant={variant} data-effect={effect} className={cn("grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2", className)} {...props}>
      <motion.div
        ref={ref}
        data-slot="screen-frame-body"
        className={FRAME_CLASS[variant]}
        initial={settling ? tilted : false}
        animate={settling ? (seen ? flat : tilted) : undefined}
        transition={SETTLE_TRANSITION}
      >
        <FrameChrome variant={variant} url={url} screenClassName={screenClassName}>
          {screen}
        </FrameChrome>
      </motion.div>
      {caption ? <figcaption className="text-[13px] leading-5 text-muted-foreground">{caption}</figcaption> : null}
    </figure>
  )
}

export { ScreenFrame, displayAddress, type ScreenFrameProps, type ScreenFrameVariant, type ScreenFrameEffect }
