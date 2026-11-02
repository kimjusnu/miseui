import type * as React from "react"
import { Children, createContext, useContext, useMemo, useState } from "react"
import { Avatar as AvatarPrimitive } from "radix-ui"
import { motion, useReducedMotion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import {
  MARK_SIZE_CLASS,
  OVERLAP_CLASS,
  SHAPE_CLASS,
  SIZE_CLASS,
  SPREAD_PX,
  STATUS_CLASS,
  avatarTone,
  getInitials,
  type AvatarGroupEffect,
  type AvatarSize,
  type AvatarStatus,
  type AvatarVariant,
} from "@/registry/miseui/ui/avatar-tokens"
import { cn } from "@/registry/miseui/lib/utils"

interface AvatarGroupContextValue {
  size: AvatarSize
  variant: AvatarVariant
}

const AvatarGroupContext = createContext<AvatarGroupContextValue | null>(null)

interface AvatarProps extends Omit<React.ComponentProps<"span">, "children"> {
  /** Used for the accessible label, the initials and their colour. */
  name: string
  src?: string
  size?: AvatarSize
  /** `circle` for people, `rounded` for teams and products, `ring` for the current speaker, `status` for presence. */
  variant?: AvatarVariant
  /** `status` variant only. */
  status?: AvatarStatus
}

function Avatar({ name, src, size, variant, status = "online", className, ...props }: AvatarProps) {
  const group = useContext(AvatarGroupContext)
  const resolvedSize = size ?? group?.size ?? "md"
  const resolvedVariant = variant ?? group?.variant ?? "circle"
  const showMark = resolvedVariant === "status"
  return (
    <span
      role="img"
      aria-label={showMark ? `${name}, ${status}` : name}
      data-slot="avatar"
      data-variant={resolvedVariant}
      data-size={resolvedSize}
      className={cn("relative inline-flex shrink-0 align-middle", className)}
      {...props}
    >
      <AvatarPrimitive.Root
        className={cn(
          "inline-flex select-none items-center justify-center overflow-hidden font-medium",
          SIZE_CLASS[resolvedSize],
          SHAPE_CLASS[resolvedVariant],
          // The cut-out between overlapping faces; the ring variant already has its own offset.
          group && resolvedVariant !== "ring" && "ring-2 ring-background",
        )}
      >
        <AvatarPrimitive.Image data-slot="avatar-image" src={src} alt="" className="size-full object-cover" />
        <AvatarPrimitive.Fallback
          data-slot="avatar-fallback"
          className={cn("flex size-full items-center justify-center", avatarTone(name))}
        >
          {getInitials(name)}
        </AvatarPrimitive.Fallback>
      </AvatarPrimitive.Root>
      {showMark && (
        <span
          data-slot="avatar-status"
          data-status={status}
          className={cn(
            "absolute right-0 bottom-0 overflow-hidden rounded-full ring-2 ring-background",
            MARK_SIZE_CLASS[resolvedSize],
            STATUS_CLASS[status],
          )}
        />
      )}
    </span>
  )
}

interface AvatarGroupProps extends React.ComponentProps<"div"> {
  /** How many faces to show before the +N. */
  max?: number
  /** The real headcount when `children` is only a page of it. */
  total?: number
  size?: AvatarSize
  variant?: AvatarVariant
  /** `stack` spreads the faces apart on hover or focus, on a spring. */
  effect?: AvatarGroupEffect
}

/** Parts on hover or on focus inside the group; the state only moves when the effect is on. */
function useSpread(isOn: boolean) {
  const [spread, setSpread] = useState(false)
  if (!isOn) return { spread: false, handlers: {} }
  return {
    spread,
    handlers: {
      onPointerEnter: () => setSpread(true),
      onPointerLeave: () => setSpread(false),
      onFocus: () => setSpread(true),
      onBlur: () => setSpread(false),
    },
  }
}

function groupCells(children: React.ReactNode, max: number, total: number | undefined, size: AvatarSize) {
  const items = Children.toArray(children)
  const shown = items.slice(0, Math.max(0, max))
  const count = total ?? items.length
  const extra = Math.max(0, count - shown.length)
  return { count, cells: extra > 0 ? [...shown, <OverflowCount key="overflow" extra={extra} size={size} />] : shown }
}

function AvatarGroup({
  max = 4,
  total,
  size = "md",
  variant = "circle",
  effect,
  className,
  style,
  children,
  "aria-label": ariaLabel,
  ...props
}: AvatarGroupProps) {
  const reduceMotion = useReducedMotion() ?? false
  const isStack = effect === "stack"
  const { spread, handlers } = useSpread(isStack)
  const context = useMemo(() => ({ size, variant }), [size, variant])
  const { cells, count } = groupCells(children, max, total, size)
  return (
    <AvatarGroupContext.Provider value={context}>
      <div
        role="group"
        aria-label={ariaLabel ?? `${count} people`}
        data-slot="avatar-group"
        data-effect={effect}
        data-spread={isStack ? String(spread) : undefined}
        className={cn("inline-flex items-center", className)}
        // Transforms take no layout space, so the spread is reserved up front and never covers a neighbour.
        style={isStack ? { paddingInlineEnd: (cells.length - 1) * SPREAD_PX, ...style } : style}
        {...handlers}
        {...props}
      >
        {cells.map((cell, index) => (
          <motion.span
            key={index}
            className={cn("relative inline-flex", index > 0 && OVERLAP_CLASS[size])}
            style={{ zIndex: cells.length - index }}
            initial={false}
            animate={{ x: spread ? index * SPREAD_PX : 0 }}
            transition={reduceMotion ? { duration: 0 } : SPRING_DEFAULT}
          >
            {cell}
          </motion.span>
        ))}
      </div>
    </AvatarGroupContext.Provider>
  )
}

function OverflowCount({ extra, size }: { extra: number; size: AvatarSize }) {
  return (
    <span
      role="img"
      aria-label={`${extra} more`}
      data-slot="avatar-overflow"
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-muted font-medium text-muted-foreground tabular-nums ring-2 ring-background",
        SIZE_CLASS[size],
      )}
    >
      +{extra}
    </span>
  )
}

export {
  Avatar,
  AvatarGroup,
  avatarTone,
  getInitials,
  type AvatarProps,
  type AvatarGroupProps,
  type AvatarVariant,
  type AvatarSize,
  type AvatarStatus,
  type AvatarGroupEffect,
}
