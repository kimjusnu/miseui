import { cn } from "@/registry/miseui/lib/utils"
import { LogoWallMarquee, type LogoWallMarqueeProps } from "./logo-wall-marquee"
import { DEFAULT_TITLE, LogoMark, LogoPlaceholder, LogoWallLine, ROOT_CLASS, placeholderLogos, type LogoWallCopyProps, type LogoWallLogo } from "./logo-wall-parts"

type LogoWallVariant = "row" | "grid" | "marquee"

interface LogoWallProps extends LogoWallMarqueeProps {
  /** `row` a quiet line for a few logos, `grid` a plate for each when the list itself is the point, `marquee` more logos than fit, moving. Anything else is `row`. */
  variant?: LogoWallVariant
}

function LogoWallRow({ logos, title = DEFAULT_TITLE, titleQuiet, monochrome = true, className, ...props }: LogoWallCopyProps) {
  if (logos.length === 0) return null
  return (
    <section data-slot="logo-wall" data-variant="row" className={cn(ROOT_CLASS, "bg-background", className)} {...props}>
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-4 py-12 @2xl:px-8">
        <LogoWallLine title={title} quiet={titleQuiet} className="text-center" />
        <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 @3xl:gap-x-12">
          {logos.map((logo) => (
            <li key={logo.name} className="flex min-w-0 items-center">
              <LogoMark logo={logo} monochrome={monochrome} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function LogoWallGrid({ logos, title = DEFAULT_TITLE, titleQuiet, monochrome = true, className, ...props }: LogoWallCopyProps) {
  if (logos.length === 0) return null
  return (
    <section data-slot="logo-wall" data-variant="grid" className={cn(ROOT_CLASS, "bg-muted dark:bg-background", className)} {...props}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-12 @2xl:px-8 @2xl:py-16">
        {title ? (
          <h2 className="max-w-2xl text-title text-3xl text-balance @2xl:text-4xl">
            {title} {titleQuiet ? <span className="text-muted-foreground">{titleQuiet}</span> : null}
          </h2>
        ) : null}
        {/* Flex and not grid: a last row that does not fill stays centred, with no hole at the end. */}
        <ul className="flex flex-wrap justify-center gap-2">
          {logos.map((logo) => (
            <li key={logo.name} className="flex h-24 w-[calc(50%-4px)] min-w-0 items-center justify-center rounded-2xl border bg-background p-4 dark:bg-card @2xl:w-[calc(25%-6px)]">
              <LogoMark logo={logo} monochrome={monochrome} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function LogoWall({ variant, duration, ...props }: LogoWallProps) {
  switch (variant) {
    case "grid":
      return <LogoWallGrid {...props} />
    case "marquee":
      return <LogoWallMarquee duration={duration} {...props} />
    default:
      return <LogoWallRow {...props} />
  }
}

export { LogoPlaceholder, LogoWall, placeholderLogos, type LogoWallLogo, type LogoWallProps, type LogoWallVariant }
