export type AvatarVariant = "circle" | "rounded" | "ring" | "status"
export type AvatarSize = "sm" | "md" | "lg"
export type AvatarStatus = "online" | "away" | "busy" | "offline"
export type AvatarGroupEffect = "stack"

export const SIZE_CLASS: Record<AvatarSize, string> = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-12 text-[15px]",
}

export const SHAPE_CLASS: Record<AvatarVariant, string> = {
  circle: "rounded-full",
  rounded: "rounded-lg",
  ring: "rounded-full ring-2 ring-mise ring-offset-2 ring-offset-background",
  status: "rounded-full",
}

/** Pairs of theme tokens only, so initials stay legible in every palette and in dark mode. */
const TONES = [
  "bg-muted text-foreground",
  "bg-mise-soft text-foreground",
  "bg-mise/30 text-foreground",
  "bg-primary text-primary-foreground",
  "bg-mise text-mise-foreground",
] as const

/** Shape as well as colour, so presence survives colour blindness and every accent palette. */
export const STATUS_CLASS: Record<AvatarStatus, string> = {
  online: "bg-mise",
  away: "border-2 border-mise bg-background",
  busy: "bg-destructive after:absolute after:inset-x-[20%] after:top-1/2 after:h-0.5 after:-translate-y-1/2 after:bg-background",
  offline: "border-2 border-muted-foreground/50 bg-background",
}

export const MARK_SIZE_CLASS: Record<AvatarSize, string> = { sm: "size-2.5", md: "size-3", lg: "size-3.5" }
export const OVERLAP_CLASS: Record<AvatarSize, string> = { sm: "-ml-2", md: "-ml-2.5", lg: "-ml-3" }
export const SPREAD_PX = 12

/** Same name, same colour, on every render and every device. */
export function avatarTone(name: string): string {
  const hash = Array.from(name).reduce((sum, char) => (sum * 31 + (char.codePointAt(0) ?? 0)) >>> 0, 7)
  return TONES[hash % TONES.length]
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  const first = Array.from(parts[0])[0]
  const last = parts.length > 1 ? Array.from(parts[parts.length - 1])[0] : ""
  return `${first}${last}`.toUpperCase()
}
