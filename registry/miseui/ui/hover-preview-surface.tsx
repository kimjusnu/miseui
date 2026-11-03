import type * as React from "react"
import { motion, useReducedMotion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import type { PreviewMotion } from "@/registry/miseui/ui/hover-preview-state"
import { cn } from "@/registry/miseui/lib/utils"

export type HoverPreviewVariant = "card" | "media" | "tag"

export interface HoverPreviewContent {
  title?: string
  text?: string
  meta?: string
  media?: React.ReactNode
}

const SURFACE_CLASS: Record<HoverPreviewVariant, string> = {
  card: "w-72 overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-[0_16px_40px_-16px_rgb(0_0_0/0.5)]",
  media: "aspect-[4/3] w-64 overflow-hidden rounded-xl bg-muted shadow-[0_16px_40px_-16px_rgb(0_0_0/0.5)] ring-1 ring-foreground/10",
  tag: "max-w-64 rounded-md bg-foreground px-2 py-1 text-[13px] text-background shadow-[0_8px_16px_-8px_rgb(0_0_0/0.5)]",
}

function PreviewBody({ variant, content }: { variant: HoverPreviewVariant; content: HoverPreviewContent }) {
  if (variant === "tag") {
    return <span data-slot="hover-preview-tag">{[content.title, content.meta].filter(Boolean).join(", ")}</span>
  }
  if (variant === "media") return <div data-slot="hover-preview-media" className="size-full">{content.media}</div>
  return (
    <>
      {content.media ? <div className="aspect-video overflow-hidden bg-muted">{content.media}</div> : null}
      <div className="grid gap-1 p-4">
        {content.meta ? <p className="text-[13px] text-muted-foreground">{content.meta}</p> : null}
        {content.title ? <p className="text-[15px] leading-snug font-semibold tracking-tight">{content.title}</p> : null}
        {content.text ? <p className="line-clamp-3 text-[13px] leading-snug text-muted-foreground">{content.text}</p> : null}
      </div>
    </>
  )
}

interface PreviewFloatProps extends Pick<PreviewMotion, "x" | "y" | "rotate"> {
  variant: HoverPreviewVariant
  content: HoverPreviewContent
  onSurface: (element: HTMLElement | null) => void
}

export function PreviewFloat({ variant, content, x, y, rotate, onSurface }: PreviewFloatProps) {
  const reduceMotion = useReducedMotion() ?? false
  return (
    <motion.div
      ref={onSurface}
      aria-hidden="true"
      data-slot="hover-preview-surface"
      data-kind={variant}
      className={cn("pointer-events-none fixed top-0 left-0 z-50", SURFACE_CLASS[variant])}
      style={{ x, y, rotate }}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92 }}
      transition={reduceMotion ? { duration: 0 } : SPRING_DEFAULT}
    >
      <PreviewBody variant={variant} content={content} />
    </motion.div>
  )
}
