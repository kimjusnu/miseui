import type * as React from "react"
import { useMemo, useRef } from "react"
import { LIGHT_TOKEN_CLASS, LOOP_CLASS, loopStyle, playStyle, useBackgroundPlayback } from "@/registry/miseui/ui/background-loop"
import { glintLayout, starLayout, streakLayout, type MeteorsVariant, type Streak } from "@/registry/miseui/ui/meteors-background-layout"
import { cn } from "@/registry/miseui/lib/utils"

type MeteorsBackgroundEffect = "flow" | "still"

const FLY = "rotate(var(--mise-a)) translateX(var(--mise-d))"
const START = "rotate(var(--mise-a)) translateX(0)"

/** The flight takes part of each period and the rest is empty sky: that gap is what keeps it from reading as a stream. */
const KEYFRAMES = [
  `@keyframes mise-meteor-fly{0%{transform:${START};opacity:0}4%,30%{opacity:var(--mise-o)}40%,100%{transform:${FLY};opacity:0}}`,
  `@keyframes mise-meteor-fall{0%{transform:${START};opacity:0}10%,80%{opacity:var(--mise-o)}100%{transform:${FLY};opacity:0}}`,
  `@keyframes mise-meteor-comet{0%{transform:${START};opacity:0}6%,50%{opacity:var(--mise-o)}60%,100%{transform:${FLY};opacity:0}}`,
  `@keyframes mise-meteor-glint{0%{transform:${START};opacity:0}1%,10%{opacity:var(--mise-o)}12%,100%{transform:${FLY};opacity:0}}`,
  "@keyframes mise-meteor-twinkle{0%,100%{opacity:calc(var(--mise-o)*.3)}50%{opacity:var(--mise-o)}}",
].join("")

const FLIGHT = { meteors: "mise-meteor-fly", rain: "mise-meteor-fall", comets: "mise-meteor-comet" } as const

interface StreakProps {
  streak: Streak
  still: boolean
  animation: string
  head?: boolean
  thick?: boolean
}

function StreakMark({ streak, still, animation, head = false, thick = false }: StreakProps) {
  return (
    <span
      data-slot="meteors-background-streak"
      className={cn("absolute origin-left bg-linear-to-r from-transparent to-(--mise-light)", thick ? "h-0.5" : "h-px", LOOP_CLASS)}
      style={{
        width: streak.length,
        left: `${still ? streak.stillLeft : streak.left}%`,
        top: `${still ? streak.stillTop : streak.top}%`,
        ...({ "--mise-a": `${streak.angle}deg`, "--mise-d": `${streak.travel}px`, "--mise-o": streak.peak } as React.CSSProperties),
        ...(still ? { transform: `rotate(${streak.angle}deg)`, opacity: streak.stillPeak } : loopStyle(animation, streak.seconds, streak.delay)),
      }}
    >
      {head ? <span data-slot="meteors-background-head" className="absolute top-1/2 right-0 size-1 translate-x-1/2 -translate-y-1/2 rounded-full bg-(--mise-light)" /> : null}
    </span>
  )
}

interface FaceProps {
  seed: number
  count?: number
  still: boolean
}

function StreaksFace({ variant, seed, count, still }: FaceProps & { variant: Exclude<MeteorsVariant, "stars"> }) {
  const streaks = useMemo(() => streakLayout(variant, seed, count), [variant, seed, count])
  return streaks.map((streak, index) => (
    <StreakMark key={index} streak={streak} still={still} animation={FLIGHT[variant]} head={variant === "comets"} thick={variant === "comets"} />
  ))
}

function StarsFace({ seed, count, still }: FaceProps) {
  const stars = useMemo(() => starLayout(seed, count), [seed, count])
  const glint = useMemo(() => glintLayout(seed), [seed])
  return (
    <>
      {stars.map((star, index) => (
        <span
          key={index}
          data-slot="meteors-background-star"
          className={cn("absolute rounded-full bg-(--mise-light)", LOOP_CLASS)}
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            width: star.size,
            height: star.size,
            ...({ "--mise-o": star.peak } as React.CSSProperties),
            ...(still ? { opacity: star.peak * 0.7 } : loopStyle("mise-meteor-twinkle", star.seconds, star.delay, "ease-in-out")),
          }}
        />
      ))}
      <StreakMark streak={glint} still={still} animation="mise-meteor-glint" />
    </>
  )
}

type MeteorsBackgroundProps = Omit<React.ComponentProps<"div">, "ref"> & {
  /** `meteors` thin diagonals, `rain` vertical and faint, `comets` few and slow with long tails, `stars` still points with an occasional streak. */
  variant?: MeteorsVariant
  /** How many. Each variant has its own default and ceiling, so it never reads as a stream of errors. */
  count?: number
  /** `flow` moves while on screen. `still` draws one finished frame, the same one reduced motion gets. */
  effect?: MeteorsBackgroundEffect
  /** Holds the motion. Wire it to a control: motion past five seconds needs a way to stop it. */
  paused?: boolean
  /** Another seed gives another layout that is still the same on the server and the client. */
  seed?: number
}

function MeteorsBackground({ variant = "meteors", count, effect = "flow", paused = false, seed = 1, className, children, ...props }: MeteorsBackgroundProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const { still, playing } = useBackgroundPlayback(rootRef, { paused, loops: effect === "flow" })
  return (
    <div
      {...props}
      ref={rootRef}
      data-slot="meteors-background"
      data-variant={variant}
      data-effect={effect}
      data-playing={still ? undefined : String(playing)}
      className={cn("relative isolate min-w-0 overflow-clip", className)}
    >
      {still ? null : <style href="mise-meteors-background" precedence="default">{KEYFRAMES}</style>}
      <div
        aria-hidden="true"
        data-slot="meteors-background-layer"
        className={cn("pointer-events-none absolute inset-0 -z-10 overflow-clip rounded-[inherit]", LIGHT_TOKEN_CLASS)}
        style={playStyle(playing)}
      >
        {variant === "stars" ? <StarsFace seed={seed} count={count} still={still} /> : <StreaksFace variant={variant} seed={seed} count={count} still={still} />}
      </div>
      <div data-slot="meteors-background-content" className="relative h-full">
        {children}
      </div>
    </div>
  )
}

export { MeteorsBackground, type MeteorsBackgroundProps, type MeteorsBackgroundEffect, type MeteorsVariant as MeteorsBackgroundVariant }
