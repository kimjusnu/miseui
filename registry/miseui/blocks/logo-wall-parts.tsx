import type * as React from "react"
import { Diamond, Hexagon, Octagon, Pentagon, Square, Triangle } from "lucide-react"
import { cn } from "@/registry/miseui/lib/utils"

interface LogoWallLogo {
  /** The accessible name. Required, because a logo says nothing to a screen reader on its own. */
  name: string
  /** A transparent PNG or an SVG. */
  src?: string
  /** Your own mark, such as an inline SVG, instead of `src`. Without either, the name is set as a wordmark. */
  mark?: React.ReactNode
  /** Makes the logo a link, such as to a case study. */
  href?: string
}

interface LogoWallCopyProps extends Omit<React.ComponentProps<"section">, "title"> {
  /** Only logos you have permission to show. An empty list renders nothing. */
  logos: readonly LogoWallLogo[]
  /** Null removes the line. */
  title?: string | null
  /** Continues the title, one tone quieter. */
  titleQuiet?: string
  /** Paints each `src` image as one flat colour, so unrelated logos sit together in both themes. Turn it off for logos on a solid background, which would become a block. */
  monochrome?: boolean
}

const DEFAULT_TITLE = "Used by teams like yours."
const ROOT_CLASS = "@container flex w-full flex-col justify-center"

/** One flat colour from any logo. It needs a transparent background. */
const MONOCHROME_CLASS = "opacity-60 brightness-0 dark:invert"

const PLACEHOLDER_SHAPES = [Square, Triangle, Hexagon, Diamond, Pentagon, Octagon] as const

/** Dashed and numbered: nobody can mistake this for a customer, and an unfinished page cannot quietly claim one. */
function LogoPlaceholder({ index }: { index: number }) {
  const Shape = PLACEHOLDER_SHAPES[index % PLACEHOLDER_SHAPES.length] ?? Square
  return (
    <span data-slot="logo-wall-placeholder" className="inline-flex h-10 items-center gap-2 rounded-lg border border-dashed border-foreground/25 px-3 text-[13px] whitespace-nowrap text-muted-foreground">
      <Shape aria-hidden="true" className="size-4" />
      Logo {index + 1}
    </span>
  )
}

/** Marks to build the page with until you have real logos and permission to show them. */
function placeholderLogos(count = 8): readonly LogoWallLogo[] {
  return Array.from({ length: count }, (_, index) => ({ name: `Placeholder logo ${index + 1}`, mark: <LogoPlaceholder index={index} /> }))
}

function LogoContent({ logo, monochrome }: { logo: LogoWallLogo; monochrome: boolean }) {
  if (logo.mark) {
    return (
      <span role="img" aria-label={logo.name} className="inline-flex items-center">
        {logo.mark}
      </span>
    )
  }
  if (logo.src) {
    return <img src={logo.src} alt={logo.name} loading="lazy" decoding="async" className={cn("h-8 w-auto max-w-36 object-contain", monochrome && MONOCHROME_CLASS)} />
  }
  return <span className="text-base font-semibold tracking-tight whitespace-nowrap text-muted-foreground">{logo.name}</span>
}

function LogoMark({ logo, monochrome }: { logo: LogoWallLogo; monochrome: boolean }) {
  if (!logo.href) return <LogoContent logo={logo} monochrome={monochrome} />
  return (
    <a
      href={logo.href}
      className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-sm outline-none transition-opacity duration-(--duration-fast) ease-(--ease-mise) hover:opacity-70 focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <LogoContent logo={logo} monochrome={monochrome} />
    </a>
  )
}

/** The size of a caption: logos are supporting evidence, and the page has its own headline. */
function LogoWallLine({ title, quiet, className }: { title: string | null; quiet?: string; className?: string }) {
  if (!title) return null
  return (
    <h2 className={cn("text-[15px] leading-relaxed font-medium text-pretty", className)}>
      {title} {quiet ? <span className="font-normal text-muted-foreground">{quiet}</span> : null}
    </h2>
  )
}

export { DEFAULT_TITLE, LogoMark, LogoPlaceholder, LogoWallLine, ROOT_CLASS, placeholderLogos, type LogoWallCopyProps, type LogoWallLogo }
