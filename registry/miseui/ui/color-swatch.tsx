import type * as React from "react"
import { Children, createContext, useContext, useEffect, useMemo, useRef, useState } from "react"
import { Check } from "lucide-react"
import { CHECKER_BACKGROUND, parseColor, readableInk, type Rgba } from "@/registry/miseui/ui/color-swatch-math"
import { cn } from "@/registry/miseui/lib/utils"

type ColorSwatchVariant = "circle" | "square" | "chip" | "tile"
type ColorSwatchEffect = "lift"

const ROOT_CLASS: Record<ColorSwatchVariant, string> = {
  circle: "inline-grid w-16 justify-items-center gap-2 rounded-md text-center",
  square: "flex w-full min-w-0 items-center gap-3 rounded-md text-left",
  chip: "inline-flex h-8 max-w-full items-center gap-2 rounded-full border pr-3 pl-1 text-left pointer-coarse:h-10",
  tile: "relative isolate flex min-h-24 w-full min-w-0 flex-col justify-end gap-1 rounded-lg p-3 text-left",
}

/** A hairline on every fill: white on a white page and near-black on a dark page would otherwise vanish. */
const FILL_CLASS: Record<ColorSwatchVariant, string> = {
  circle: "relative size-10 rounded-full",
  square: "relative size-10 rounded-md",
  chip: "relative size-5 rounded-full",
  tile: "absolute inset-0 -z-10 rounded-[inherit] items-start justify-end p-3",
}

const GROUP_CLASS: Record<ColorSwatchVariant, string> = {
  circle: "flex flex-wrap gap-x-2 gap-y-4",
  square: "grid grid-cols-[repeat(auto-fill,minmax(min(100%,9rem),1fr))] gap-3",
  chip: "flex flex-wrap gap-2",
  tile: "grid grid-cols-[repeat(auto-fit,minmax(6.5rem,1fr))] gap-2",
}

const CLICKABLE_CLASS =
  "cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
const LIFT_CLASS =
  "transition-[translate,box-shadow] duration-(--duration-fast) ease-(--ease-mise) motion-safe:hover:-translate-y-0.5"
/** Black, not foreground: a foreground shadow would turn into a glow in dark mode. */
const TILE_LIFT_CLASS = "hover:shadow-md hover:shadow-black/20 dark:hover:shadow-black/50"

const GroupContext = createContext<{ variant: ColorSwatchVariant; effect?: ColorSwatchEffect } | null>(null)

/** The parser cannot read var(--mise) or a named colour, so those are resolved by asking the browser what it painted. */
function useResolvedColor(color: string) {
  const ref = useRef<HTMLSpanElement>(null)
  const parsed = parseColor(color)
  const [probed, setProbed] = useState<{ source: string; rgba: Rgba | null } | null>(null)
  useEffect(() => {
    const node = ref.current
    if (parseColor(color) || !node) return
    const frame = requestAnimationFrame(() =>
      setProbed({ source: color, rgba: parseColor(getComputedStyle(node).backgroundColor) }),
    )
    return () => cancelAnimationFrame(frame)
  }, [color])
  return { ref, rgba: parsed ?? (probed?.source === color ? probed.rgba : null) }
}

function paint(color: string, rgba: Rgba | null): React.CSSProperties {
  if (!rgba || rgba.a >= 1) return { backgroundColor: color }
  return { background: `linear-gradient(${color}, ${color}), ${CHECKER_BACKGROUND}` }
}

interface ColorFillProps {
  look: ColorSwatchVariant
  color: string
  rgba: Rgba | null
  fillRef: React.Ref<HTMLSpanElement>
  selected: boolean
}

function ColorFill({ look, color, rgba, fillRef, selected }: ColorFillProps) {
  return (
    <span
      ref={fillRef}
      aria-hidden="true"
      data-slot="color-swatch-fill"
      style={paint(color, rgba)}
      className={cn(
        "flex shrink-0 items-center justify-center inset-ring inset-ring-black/10 dark:inset-ring-white/15",
        FILL_CLASS[look],
        selected && "ring-2 ring-foreground ring-offset-2 ring-offset-background",
      )}
    >
      {selected ? (
        <Check aria-hidden="true" className="size-4" style={{ color: rgba ? readableInk(rgba) : undefined }} />
      ) : null}
    </span>
  )
}

function SwatchText({ look, name, value }: { look: ColorSwatchVariant; name?: React.ReactNode; value: React.ReactNode }) {
  const body = (
    <>
      {name ? (
        <span className={cn("block min-w-0 truncate font-medium", look === "tile" ? "text-sm" : "text-[13px]")}>{name}</span>
      ) : null}
      <span className={cn("block min-w-0 truncate font-mono text-xs", look === "tile" ? "opacity-80" : "text-muted-foreground")}>
        {value}
      </span>
    </>
  )
  if (look === "tile") return body
  if (look === "chip") return <span className="flex min-w-0 items-baseline gap-2">{body}</span>
  return <span className="grid w-full min-w-0 gap-1">{body}</span>
}

type ColorSwatchProps = Omit<React.ComponentProps<"div">, "color" | "onSelect"> & {
  /** Any CSS colour, including var(--mise). Transparent colours sit on a checker. */
  color: string
  name?: React.ReactNode
  /** The text under the name; defaults to the colour itself. */
  value?: React.ReactNode
  /** `circle` a dot over its name, `square` a row with name and value, `chip` an inline pill, `tile` the label on the colour. Inherited from a group. */
  variant?: ColorSwatchVariant
  /** `lift` raises a clickable swatch on hover. Static swatches stay put, since movement would promise a click. */
  effect?: ColorSwatchEffect
  selected?: boolean
  /** Makes the swatch a button. */
  onSelect?: () => void
  disabled?: boolean
}

function ColorSwatch({ color, name, value, variant, effect, selected = false, onSelect, disabled, className, style, ...props }: ColorSwatchProps) {
  const group = useContext(GroupContext)
  const look = variant ?? group?.variant ?? "square"
  const resolvedEffect = effect ?? group?.effect
  const { ref, rgba } = useResolvedColor(color)
  const clickable = onSelect !== undefined
  const lift = clickable && resolvedEffect === "lift"
  const Root = (clickable ? "button" : "div") as React.ElementType
  const buttonProps = clickable ? { type: "button", "aria-pressed": selected, disabled, onClick: onSelect } : {}
  return (
    <Root
      data-slot="color-swatch"
      data-variant={look}
      data-effect={resolvedEffect}
      data-transparent={rgba && rgba.a < 1 ? "true" : undefined}
      className={cn(
        ROOT_CLASS[look],
        clickable && CLICKABLE_CLASS,
        lift && LIFT_CLASS,
        lift && look === "tile" && TILE_LIFT_CLASS,
        className,
      )}
      style={look === "tile" && rgba ? { color: readableInk(rgba), ...style } : style}
      {...props}
      {...buttonProps}
    >
      <ColorFill {...{ look, color, rgba, selected }} fillRef={ref} />
      <SwatchText look={look} name={name} value={value ?? color} />
    </Root>
  )
}

type ColorSwatchGroupProps = React.ComponentProps<"div"> & {
  variant?: ColorSwatchVariant
  effect?: ColorSwatchEffect
}

/** A palette: one look for all its swatches, laid out for that look. Name it with aria-label. */
function ColorSwatchGroup({ variant = "square", effect, className, children, ...props }: ColorSwatchGroupProps) {
  const context = useMemo(() => ({ variant, effect }), [variant, effect])
  return (
    <GroupContext.Provider value={context}>
      <div
        role="list"
        data-slot="color-swatch-group"
        data-variant={variant}
        className={cn(GROUP_CLASS[variant], className)}
        {...props}
      >
        {Children.map(children, (child) => (
          <div role="listitem" className="min-w-0">
            {child}
          </div>
        ))}
      </div>
    </GroupContext.Provider>
  )
}

export { ColorSwatch, ColorSwatchGroup, type ColorSwatchProps, type ColorSwatchGroupProps, type ColorSwatchVariant, type ColorSwatchEffect }
