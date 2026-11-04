import { useState } from "react"
import { useReducedMotion } from "motion/react"
import { Pause, Play } from "lucide-react"
import { cn } from "@/registry/miseui/lib/utils"
import { IconButton } from "@/registry/miseui/ui/icon-button"
import { Marquee, MarqueeItem } from "@/registry/miseui/ui/marquee"
import { DEFAULT_TITLE, LogoMark, LogoWallLine, ROOT_CLASS, type LogoWallCopyProps } from "./logo-wall-parts"

interface LogoWallMarqueeProps extends LogoWallCopyProps {
  /** Seconds for one full pass. A longer list needs more, to keep the same speed. */
  duration?: number
}

function LogoWallMarquee({ logos, title = DEFAULT_TITLE, titleQuiet, monochrome = true, duration, className, ...props }: LogoWallMarqueeProps) {
  const reduceMotion = useReducedMotion() ?? false
  const [paused, setPaused] = useState(false)
  if (logos.length === 0) return null
  return (
    <section data-slot="logo-wall" data-variant="marquee" className={cn(ROOT_CLASS, "bg-background", className)} {...props}>
      <div className="mx-auto flex w-full max-w-6xl min-w-0 flex-col gap-4 px-4 py-12 @2xl:px-8">
        <div className="flex min-h-10 items-center justify-between gap-4">
          <LogoWallLine title={title} quiet={titleQuiet} className="min-w-0" />
          {/* Anything that moves for more than five seconds needs a way to stop it, and hover does not exist on touch. */}
          {reduceMotion ? null : (
            <IconButton variant="ghost" size="sm" label={paused ? "Play logos" : "Pause logos"} onClick={() => setPaused((current) => !current)} className="ml-auto pointer-coarse:size-10">
              {paused ? <Play /> : <Pause />}
            </IconButton>
          )}
        </div>
        <Marquee variant="fade" role="group" aria-label={title ?? "Logos"} duration={duration} paused={paused}>
          {logos.map((logo) => (
            <MarqueeItem key={logo.name}>
              <LogoMark logo={logo} monochrome={monochrome} />
            </MarqueeItem>
          ))}
        </Marquee>
      </div>
    </section>
  )
}

export { LogoWallMarquee, type LogoWallMarqueeProps }
