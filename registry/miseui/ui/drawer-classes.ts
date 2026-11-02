export type DrawerSide = "left" | "right" | "top" | "bottom"
export type DrawerVariant = "plain" | "floating" | "split" | "sheet"
export type DrawerEffect = "push"

const EDGE_PLACEMENT: Record<DrawerSide, string> = {
  left: "inset-y-0 left-0 w-[min(24rem,calc(100vw-2rem))] border-r",
  right: "inset-y-0 right-0 w-[min(24rem,calc(100vw-2rem))] border-l",
  top: "inset-x-0 top-0 max-h-[85dvh] border-b",
  bottom: "inset-x-0 bottom-0 max-h-[85dvh] border-t",
}

const FLOATING_PLACEMENT: Record<DrawerSide, string> = {
  left: "inset-y-2 left-2 w-[min(24rem,calc(100vw-1rem))]",
  right: "inset-y-2 right-2 w-[min(24rem,calc(100vw-1rem))]",
  top: "inset-x-2 top-2 max-h-[85dvh]",
  bottom: "inset-x-2 bottom-2 max-h-[85dvh]",
}

/**
 * The enter and exit values stay unqualified so the motion-reduce overrides win on source order;
 * only the running animation reads them, and data-state decides which one runs.
 */
const SLIDE_CLASS: Record<DrawerSide, string> = {
  left: "slide-in-from-left slide-out-to-left motion-reduce:slide-in-from-left-0 motion-reduce:slide-out-to-left-0",
  right: "slide-in-from-right slide-out-to-right motion-reduce:slide-in-from-right-0 motion-reduce:slide-out-to-right-0",
  top: "slide-in-from-top slide-out-to-top motion-reduce:slide-in-from-top-0 motion-reduce:slide-out-to-top-0",
  bottom:
    "slide-in-from-bottom slide-out-to-bottom motion-reduce:slide-in-from-bottom-0 motion-reduce:slide-out-to-bottom-0",
}

const PLAIN_MOTION_CLASS =
  "fade-in-0 fade-out-0 duration-(--duration-base) ease-(--ease-mise) data-[state=closed]:animate-out data-[state=open]:animate-in"

/** The materialize approach on a moving panel: it comes into focus as it arrives, and CSS lets Radix Presence hold the exit. */
const PUSH_MOTION_CLASS = [
  "fade-in-0 fade-out-0 blur-in-sm blur-out-sm will-change-[transform,opacity,filter]",
  "duration-(--duration-slow) ease-(--ease-mise-out) data-[state=closed]:duration-(--duration-base)",
  "data-[state=closed]:animate-out data-[state=open]:animate-in",
  "motion-reduce:blur-in-0 motion-reduce:blur-out-0",
  "[@media(prefers-reduced-transparency:reduce)]:blur-in-0 [@media(prefers-reduced-transparency:reduce)]:blur-out-0",
].join(" ")

/** A registry component cannot own the app root, so the page cannot really recede; the scrim fakes that depth. */
const PUSH_SCRIM_CLASS = [
  "bg-background/40 backdrop-blur-md backdrop-brightness-75 backdrop-saturate-50",
  "[@media(prefers-reduced-transparency:reduce)]:bg-background/90 [@media(prefers-reduced-transparency:reduce)]:backdrop-filter-none",
].join(" ")

const PLAIN_SCRIM_CLASS = "bg-background/80 backdrop-blur-sm"

const SHEET_SURFACE_CLASS =
  "flex max-h-[85dvh] w-full flex-col rounded-t-2xl border-t border-border bg-background pb-[env(safe-area-inset-bottom)] shadow-[0_-12px_40px_-16px_rgb(0_0_0/0.35)]"

export function drawerContentClass(variant: DrawerVariant, side: DrawerSide, effect: DrawerEffect | undefined): string {
  const motionClass = `${effect === "push" ? PUSH_MOTION_CLASS : PLAIN_MOTION_CLASS} ${SLIDE_CLASS[side]}`
  if (variant === "sheet") return `fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-lg outline-none ${motionClass}`
  const surface = "fixed z-50 flex flex-col bg-background outline-none"
  if (variant === "floating") {
    return `${surface} ${FLOATING_PLACEMENT[side]} rounded-xl border border-border shadow-2xl ${motionClass}`
  }
  if (variant === "split") return `${surface} ${EDGE_PLACEMENT[side]} border-border shadow-sm ${motionClass}`
  return `${surface} ${EDGE_PLACEMENT[side]} border-border shadow-xl ${motionClass}`
}

export function drawerScrimClass(effect: DrawerEffect | undefined): string {
  return [
    "fixed inset-0 z-50 fade-in-0 fade-out-0 duration-(--duration-base) ease-(--ease-mise)",
    "data-[state=closed]:animate-out data-[state=open]:animate-in",
    effect === "push" ? PUSH_SCRIM_CLASS : PLAIN_SCRIM_CLASS,
  ].join(" ")
}

export { SHEET_SURFACE_CLASS }
