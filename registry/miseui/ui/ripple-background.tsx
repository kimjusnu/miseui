import type * as React from "react"
import { useMemo, useRef, useState } from "react"
import { LIGHT_TOKEN_CLASS, LOOP_CLASS, loopStyle, playStyle, useBackgroundPlayback } from "@/registry/miseui/ui/background-loop"
import { addPressRing, pondSources, ringLayout, waveLayout, type PressRing } from "@/registry/miseui/ui/ripple-background-layout"
import { cn } from "@/registry/miseui/lib/utils"

type RippleBackgroundVariant = "rings" | "pulse" | "sonar" | "pond"
type RippleBackgroundEffect = "press"

const CENTER = "translate(-50%,-50%)"
const PULSE_SECONDS = 12
const PULSE_PEAK = 0.6
const SONAR_SECONDS = 12
const SWEEP_OPACITY = 0.18
const POND_PEAK = 0.55
const POND_SIZE = 58

const KEYFRAMES = [
  `@keyframes mise-ripple-spread{0%{transform:${CENTER} scale(.06);opacity:0}8%{opacity:var(--mise-o)}100%{transform:${CENTER} scale(1);opacity:0}}`,
  `@keyframes mise-ripple-turn{from{transform:${CENTER} rotate(0deg)}to{transform:${CENTER} rotate(360deg)}}`,
].join("")

const PRESS_KEYFRAMES = [
  `@keyframes mise-ripple-press{0%{transform:${CENTER} scale(.05);opacity:.7}100%{transform:${CENTER} scale(1);opacity:0}}`,
  `@keyframes mise-ripple-press-still{0%{transform:${CENTER} scale(.5);opacity:.5}100%{transform:${CENTER} scale(.5);opacity:0}}`,
].join("")

/** Every ring ends in nothing before the box edge, so no arc is cut off by a straight line. */
const MASK = "radial-gradient(ellipse closest-side, #000 35%, transparent 100%)"
const RING_CLASS = "absolute top-1/2 left-1/2 rounded-full border [border-color:var(--mise-light)]"
/** Rings that scale are a soft band, not a border: a hairline scaled down by the compositor breaks into dashes at 1x. */
const WAVE_CLASS = "absolute top-1/2 left-1/2 rounded-full"
const WAVE_IMAGE = "radial-gradient(closest-side,transparent calc(100% - 7px),var(--mise-light) calc(100% - 3px),transparent 100%)"

function ringBox(sizePercent: number, opacity: number, extra?: React.CSSProperties): React.CSSProperties {
  return { width: `${sizePercent}cqmax`, height: `${sizePercent}cqmax`, opacity, transform: CENTER, ...extra }
}

function StillRings({ count = 7, peak = 0.4 }: { count?: number; peak?: number }) {
  const rings = useMemo(() => ringLayout(count, 10, 100, peak), [count, peak])
  return rings.map((ring) => <span key={ring.size} data-slot="ripple-background-ring" className={RING_CLASS} style={ringBox(ring.size, ring.opacity)} />)
}

interface WavesProps {
  still: boolean
  count: number
  size: number
  seconds: number
  peak: number
}

function Waves({ still, count, size, seconds, peak }: WavesProps) {
  const waves = useMemo(() => waveLayout(count, seconds, peak), [count, seconds, peak])
  return waves.map((wave) => (
    <span
      key={wave.delay}
      data-slot="ripple-background-wave"
      className={cn(WAVE_CLASS, LOOP_CLASS)}
      style={
        still
          ? ringBox(size, wave.stillOpacity, { backgroundImage: WAVE_IMAGE, transform: `${CENTER} scale(${wave.stillScale})` })
          : { backgroundImage: WAVE_IMAGE, width: `${size}cqmax`, height: `${size}cqmax`, ...({ "--mise-o": peak } as React.CSSProperties), ...loopStyle("mise-ripple-spread", seconds, wave.delay) }
      }
    />
  ))
}

function SonarFace({ still }: { still: boolean }) {
  return (
    <>
      <StillRings count={5} peak={0.3} />
      <span
        data-slot="ripple-background-sweep"
        className={cn("absolute top-1/2 left-1/2 size-[100cqmax] rounded-full", LOOP_CLASS)}
        style={{
          backgroundImage: "conic-gradient(from 0deg, transparent 0deg, transparent 270deg, var(--mise-light) 360deg)",
          opacity: SWEEP_OPACITY,
          ...(still ? { transform: `${CENTER} rotate(115deg)` } : { transform: CENTER, ...loopStyle("mise-ripple-turn", SONAR_SECONDS, -3) }),
        }}
      />
    </>
  )
}

function PondFace({ seed, still }: { seed: number; still: boolean }) {
  const sources = useMemo(() => pondSources(seed, 3), [seed])
  return sources.map((source) => (
    <span key={source.left} data-slot="ripple-background-source" className="absolute size-0" style={{ left: `${source.left}%`, top: `${source.top}%` }}>
      <Waves still={still} count={3} size={POND_SIZE} seconds={source.seconds} peak={POND_PEAK} />
    </span>
  ))
}

function RippleFace({ variant, seed, still }: { variant: RippleBackgroundVariant; seed: number; still: boolean }) {
  if (variant === "rings") return <StillRings />
  if (variant === "pulse") return <Waves still={still} count={4} size={100} seconds={PULSE_SECONDS} peak={PULSE_PEAK} />
  if (variant === "sonar") return <SonarFace still={still} />
  return <PondFace seed={seed} still={still} />
}

function usePressRings(active: boolean) {
  const nextId = useRef(0)
  const [rings, setRings] = useState<readonly PressRing[]>([])
  const onPress = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!active || event.button !== 0) return
    const root = event.currentTarget
    const box = root.getBoundingClientRect()
    nextId.current += 1
    // clientLeft and clientTop: the layer sits inside the owner's border, the rect does not.
    const ring = { id: nextId.current, x: event.clientX - box.left - root.clientLeft, y: event.clientY - box.top - root.clientTop }
    setRings((current) => addPressRing(current, ring))
  }
  const onEnd = (id: number) => setRings((current) => current.filter((ring) => ring.id !== id))
  return { rings, onPress, onEnd }
}

type RippleBackgroundProps = Omit<React.ComponentProps<"div">, "ref"> & {
  /** `rings` still concentric lines, `pulse` rings leaving the centre, `sonar` a sweep turning over rings, `pond` several sources. */
  variant?: RippleBackgroundVariant
  /** `press` spreads a ring from where the pointer or finger went down. It never takes the press from what is on top. */
  effect?: RippleBackgroundEffect
  /** Holds the looping motion. Wire it to a control: motion past five seconds needs a way to stop it. */
  paused?: boolean
  /** Another seed places the `pond` sources elsewhere, the same on the server and the client. */
  seed?: number
}

function RippleBackground({ variant = "rings", effect, paused = false, seed = 1, className, children, onPointerDown, ...props }: RippleBackgroundProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const { still, playing } = useBackgroundPlayback(rootRef, { paused, loops: variant !== "rings" })
  const pressing = effect === "press"
  const { rings, onPress, onEnd } = usePressRings(pressing)
  return (
    <div
      {...props}
      ref={rootRef}
      data-slot="ripple-background"
      data-variant={variant}
      data-effect={effect}
      data-playing={still ? undefined : String(playing)}
      className={cn("relative isolate min-w-0 overflow-clip", className)}
      onPointerDown={(event) => {
        onPointerDown?.(event)
        onPress(event)
      }}
    >
      {still ? null : <style href="mise-ripple-background" precedence="default">{KEYFRAMES}</style>}
      {pressing ? <style href="mise-ripple-background-press" precedence="default">{PRESS_KEYFRAMES}</style> : null}
      <div
        aria-hidden="true"
        data-slot="ripple-background-layer"
        // A size container is safe here: the layer takes its size from inset, not from what is inside it.
        className={cn("pointer-events-none absolute inset-0 -z-10 overflow-clip rounded-[inherit] [container-type:size]", LIGHT_TOKEN_CLASS)}
        style={playStyle(playing)}
      >
        <div data-slot="ripple-background-field" className="absolute inset-0" style={{ maskImage: MASK }}>
          <RippleFace variant={variant} seed={seed} still={still} />
        </div>
        {rings.map((ring) => (
          <span
            key={ring.id}
            data-slot="ripple-background-press"
            className={cn(WAVE_CLASS, "size-[64cqmin]")}
            style={{ backgroundImage: WAVE_IMAGE, left: ring.x, top: ring.y, animation: `${still ? "mise-ripple-press-still" : "mise-ripple-press"} 900ms var(--ease-mise-out) forwards` }}
            onAnimationEnd={() => onEnd(ring.id)}
          />
        ))}
      </div>
      <div data-slot="ripple-background-content" className="relative h-full">
        {children}
      </div>
    </div>
  )
}

export { RippleBackground, type RippleBackgroundProps, type RippleBackgroundVariant, type RippleBackgroundEffect }
