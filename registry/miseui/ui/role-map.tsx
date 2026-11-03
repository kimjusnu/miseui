import type * as React from "react"
import { useState } from "react"
import { RoleMatrix, RolePanels, RoleRows, collectAreas, type RoleFocus, type RoleMapVariant, type RoleMember } from "@/registry/miseui/ui/role-map-views"
import { cn } from "@/registry/miseui/lib/utils"

type RoleMapEffect = "focus"

/** Hovering previews and pressing pins. On touch only the pin exists, which is why there are two states. */
function useRoleFocus(enabled: boolean): RoleFocus {
  const [hovered, setHovered] = useState<string | null>(null)
  const [pinned, setPinned] = useState<string | null>(null)
  return {
    enabled,
    active: enabled ? (hovered ?? pinned) : null,
    pinned,
    hover: setHovered,
    toggle: (name) => setPinned(pinned === name ? null : name),
  }
}

type RoleMapProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** Who did what. Mark at most one as `lead`: it is the focal point of the map. */
  members: readonly RoleMember[]
  /** `panels` a surface per person, `rows` one quiet line per person, `matrix` a table of who touched which area. */
  variant?: RoleMapVariant
  /** `focus` dims everyone else when a person is pointed at or pressed, to trace one person's share. */
  effect?: RoleMapEffect
  /** Shown for someone with nothing listed, so an empty share reads as a fact and not as a bug. */
  emptyText?: string
  /** Names the matrix table and the first column. */
  label?: string
}

function RoleMap({ members, variant = "panels", effect, emptyText = "Nothing recorded", label = "Who did what", className, ...props }: RoleMapProps) {
  const focus = useRoleFocus(effect === "focus")
  const shared = { members, focus, emptyText }
  return (
    <div data-slot="role-map" data-variant={variant} data-effect={effect} className={cn("@container grid w-full min-w-0 grid-cols-[minmax(0,1fr)]", className)} {...props}>
      {variant === "panels" ? <RolePanels {...shared} /> : null}
      {variant === "rows" ? <RoleRows {...shared} /> : null}
      {variant === "matrix" ? <RoleMatrix {...shared} label={label} /> : null}
    </div>
  )
}

export { RoleMap, collectAreas, type RoleMapProps, type RoleMapVariant, type RoleMapEffect, type RoleMember }
