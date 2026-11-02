import { createContext } from "react"

export type CollapsibleVariant = "plain" | "card" | "fade" | "inline"
export type CollapsibleEffect = "spring"

interface CollapsibleContextValue {
  variant: CollapsibleVariant
  effect: CollapsibleEffect | undefined
  open: boolean
  reduceMotion: boolean
}

export const CollapsibleContext = createContext<CollapsibleContextValue>({
  variant: "plain",
  effect: undefined,
  open: false,
  reduceMotion: false,
})

export const DEFAULT_COLLAPSED_HEIGHT_PX = 96
/** Where the text starts to fade; 100% means no fade at all, so the same mask serves both states. */
export const FADE_STOP_CLOSED = "40%"
export const FADE_STOP_OPEN = "100%"
export const FADE_MASK_CLASS = "[mask-image:linear-gradient(to_bottom,black_var(--collapsible-fade),transparent)]"

export const ROOT_CLASS: Record<CollapsibleVariant, string> = {
  plain: "w-full",
  card: "w-full rounded-lg border border-border bg-card text-card-foreground",
  fade: "w-full",
  inline: "inline-flex max-w-full flex-col items-start",
}

export const TRIGGER_CLASS: Record<CollapsibleVariant, string> = {
  plain: "flex min-h-10 w-full items-center justify-between gap-4 text-sm font-medium hover:text-foreground/70",
  card: "flex min-h-11 w-full items-center justify-between gap-4 rounded-lg px-4 py-3 text-sm font-medium hover:bg-accent/60",
  fade: "inline-flex min-h-10 items-center gap-1 text-sm font-medium hover:text-foreground/70",
  inline: "inline-flex min-h-10 flex-row-reverse items-center gap-1 text-sm text-muted-foreground hover:text-foreground",
}

export const PANEL_CLASS: Record<CollapsibleVariant, string> = {
  plain: "pb-2 text-sm/6 text-muted-foreground",
  card: "px-4 pb-4 text-sm/6 text-muted-foreground",
  fade: "text-sm/6 text-muted-foreground",
  inline: "ml-2 border-l border-border py-1 pl-3 text-sm/6 text-muted-foreground",
}
