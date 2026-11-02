import type * as React from "react"
import { Children, Fragment, createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react"
import { cn } from "@/registry/miseui/lib/utils"

type KbdVariant = "plain" | "raised" | "flat" | "ghost"
type KbdEffect = "press"
type KbdPlatform = "mac" | "other"

const BASE_CLASS = [
  "inline-flex items-center justify-center gap-1 font-sans font-medium whitespace-nowrap tabular-nums select-none",
  "transition-[translate,background-color,color,border-width] duration-(--duration-fast) ease-(--ease-mise)",
  "data-[pressed=true]:duration-0 motion-reduce:transition-none",
]

const VARIANT_CLASS: Record<KbdVariant, string> = {
  plain: "h-6 min-w-6 rounded-sm border bg-background px-1 text-xs text-muted-foreground data-[pressed=true]:bg-accent data-[pressed=true]:text-foreground",
  // The thick bottom edge is the side of the cap. Pressing thins it and drops the face by the same pixel.
  raised: [
    "h-8 min-w-8 rounded-md border border-b-2 bg-card px-2 text-[13px] text-foreground shadow-xs",
    "data-[pressed=true]:translate-y-px data-[pressed=true]:border-b data-[pressed=true]:bg-accent data-[pressed=true]:shadow-none",
    "motion-reduce:data-[pressed=true]:translate-y-0",
  ].join(" "),
  flat: "h-5 min-w-5 rounded-sm bg-muted px-1 text-xs text-foreground data-[pressed=true]:bg-accent",
  ghost: "text-xs text-muted-foreground data-[pressed=true]:text-foreground",
}

const KEY_ALIASES: Readonly<Record<string, string>> = {
  "⌘": "meta", cmd: "meta", command: "meta",
  "⌃": "control", ctrl: "control",
  "⌥": "alt", opt: "alt", option: "alt",
  "⇧": "shift",
  "↵": "enter", "⏎": "enter", return: "enter",
  esc: "escape", "⎋": "escape",
  "⌫": "backspace", del: "delete", "⇥": "tab",
  space: " ", spacebar: " ",
  "↑": "arrowup", "↓": "arrowdown", "←": "arrowleft", "→": "arrowright",
}

function normalizeKey(name: string) {
  const lower = name.toLowerCase()
  return KEY_ALIASES[lower] ?? lower
}

/** `event.key` against what the cap says, so "Esc" and "⌘" still match "Escape" and "Meta". */
function keyMatches(eventKey: string, name: string) {
  return normalizeKey(eventKey) === normalizeKey(name)
}

function isApplePlatform(platform: string) {
  return /mac|iphone|ipad|ipod/i.test(platform)
}

function readPlatform() {
  const { userAgentData, platform } = navigator as Navigator & { userAgentData?: { platform?: string } }
  return userAgentData?.platform ?? platform ?? ""
}

const subscribeNever = () => () => undefined
const detectApple = () => isApplePlatform(readPlatform())
/** The server cannot know the platform; it renders Ctrl and the client swaps without a hydration error. */
const detectAppleOnServer = () => false

function useKeyPressed(name: string | undefined) {
  const [pressed, setPressed] = useState(false)
  useEffect(() => {
    if (name === undefined) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (keyMatches(event.key, name)) setPressed(true)
    }
    const onKeyUp = (event: KeyboardEvent) => {
      // macOS sends no keyup for any key while Command is held, so Command's own keyup has to release everything.
      if (keyMatches(event.key, name) || event.key === "Meta") setPressed(false)
    }
    // Switching windows mid-press swallows the keyup too.
    const release = () => setPressed(false)
    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("keyup", onKeyUp)
    window.addEventListener("blur", release)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("keyup", onKeyUp)
      window.removeEventListener("blur", release)
    }
  }, [name])
  return name !== undefined && pressed
}

interface KbdGroupContextValue {
  variant?: KbdVariant
  effect?: KbdEffect
}

const KbdGroupContext = createContext<KbdGroupContextValue>({})

type KbdProps = React.ComponentProps<"kbd"> & {
  /** `plain` a hairline cap, `raised` a physical key, `flat` a filled chip for tight rows, `ghost` text only. */
  variant?: KbdVariant
  /** `press` dips the cap while the real key is held. */
  effect?: KbdEffect
  /** The key `press` listens for. Worked out from string children, so only needed around an icon. */
  keyName?: string
}

function Kbd({ variant, effect, keyName, className, children, ...props }: KbdProps) {
  const group = useContext(KbdGroupContext)
  const resolvedVariant = variant ?? group.variant ?? "plain"
  const resolvedEffect = effect ?? group.effect
  const name = keyName ?? (typeof children === "string" ? children : undefined)
  const pressed = useKeyPressed(resolvedEffect === "press" ? name : undefined)
  return (
    <kbd
      data-slot="kbd"
      data-variant={resolvedVariant}
      data-effect={resolvedEffect}
      data-pressed={resolvedEffect === "press" ? pressed : undefined}
      className={cn(BASE_CLASS, VARIANT_CLASS[resolvedVariant], className)}
      {...props}
    >
      {children}
    </kbd>
  )
}

type KbdGroupProps = React.ComponentProps<"kbd"> & {
  variant?: KbdVariant
  effect?: KbdEffect
  /** Goes between the keys, such as "+" for a chord or "then" for a sequence. */
  separator?: React.ReactNode
}

/** Nested kbd elements are how HTML spells a key combination. */
function KbdGroup({ variant, effect, separator, className, children, ...props }: KbdGroupProps) {
  const context = useMemo(() => ({ variant, effect }), [variant, effect])
  const keys = Children.toArray(children)
  return (
    <KbdGroupContext.Provider value={context}>
      <kbd data-slot="kbd-group" className={cn("inline-flex items-center gap-1 font-sans", className)} {...props}>
        {keys.map((entry, index) => (
          <Fragment key={index}>
            {index > 0 && separator ? <span className="text-xs text-muted-foreground">{separator}</span> : null}
            {entry}
          </Fragment>
        ))}
      </kbd>
    </KbdGroupContext.Provider>
  )
}

type ModProps = Omit<KbdProps, "children" | "keyName"> & {
  /** Forces one platform, for screenshots and docs. Detected from the browser otherwise. */
  platform?: KbdPlatform
}

/** The primary modifier: Command on Apple devices, Control everywhere else. */
function Mod({ platform, ...props }: ModProps) {
  const detected = useSyncExternalStore(subscribeNever, detectApple, detectAppleOnServer)
  const apple = platform ? platform === "mac" : detected
  return (
    <Kbd keyName={apple ? "Meta" : "Control"} {...props}>
      <span aria-hidden="true">{apple ? "⌘" : "Ctrl"}</span>
      <span className="sr-only">{apple ? "Command" : "Control"}</span>
    </Kbd>
  )
}

export {
  Kbd,
  KbdGroup,
  Mod,
  isApplePlatform,
  keyMatches,
  type KbdProps,
  type KbdGroupProps,
  type ModProps,
  type KbdVariant,
  type KbdEffect,
  type KbdPlatform,
}
