import type * as React from "react"
import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react"

type SidebarVariant = "plain" | "floating" | "inset" | "rail"
type SidebarEffect = "spring"

const PHONE_QUERY = "(max-width: 767px)"

/** Either modifier, so the shortcut works without sniffing the platform: Ctrl+B on a Mac does nothing else here. */
function isToggleShortcut(event: Pick<KeyboardEvent, "key" | "metaKey" | "ctrlKey" | "altKey" | "shiftKey">) {
  return event.key.toLowerCase() === "b" && (event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey
}

/** Mod+B is bold in every text editor, so the sidebar leaves it alone wherever someone is typing. */
function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT"
}

function useIsPhone(query = PHONE_QUERY) {
  return useSyncExternalStore(
    (notify) => {
      const media = window.matchMedia(query)
      media.addEventListener("change", notify)
      return () => media.removeEventListener("change", notify)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

interface SidebarContextValue {
  variant: SidebarVariant
  effect: SidebarEffect | undefined
  collapsed: boolean
  /** Showing as a drawer rather than a rail beside the page. */
  drawer: boolean
  drawerOpen: boolean
  setDrawerOpen: (open: boolean) => void
  /** Icons only: collapsed or `rail`. A drawer always has room for words. */
  icons: boolean
  /** The state a press on the toggle can reach. A wide `rail` has none. */
  canToggle: boolean
  shortcut: boolean
  toggle: () => void
  expanded: boolean
}

const SidebarContext = createContext<SidebarContextValue | null>(null)

function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) throw new Error("useSidebar must be used inside a Sidebar or a SidebarProvider.")
  return context
}

interface SidebarProviderProps {
  /** `plain` a full-height column, `floating` a card inset from the edges, `inset` a tinted column around a raised page, `rail` icons only with tooltips. */
  variant?: SidebarVariant
  /** `spring` carries the width change on a spring, so a quick second press reverses it. */
  effect?: SidebarEffect
  /** Save this wherever you keep preferences and hand it back. The sidebar never touches storage. */
  collapsed?: boolean
  defaultCollapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  /** Mod+B toggles. Turn off when two sidebars share a page. */
  shortcut?: boolean
  /** Forces drawer mode on or off. Left out, it follows the viewport: phones get a drawer. */
  mobile?: boolean
  children?: React.ReactNode
}

function SidebarProvider({ variant = "plain", effect, collapsed: collapsedProp, defaultCollapsed = false, onCollapsedChange, shortcut = true, mobile, children }: SidebarProviderProps) {
  const isPhone = useIsPhone()
  const drawer = mobile ?? isPhone
  const [uncontrolled, setUncontrolled] = useState(defaultCollapsed)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const collapsed = collapsedProp ?? uncontrolled
  const canToggle = drawer || variant !== "rail"

  const toggle = useCallback(() => {
    if (drawer) {
      setDrawerOpen((open) => !open)
      return
    }
    if (variant === "rail") return
    setUncontrolled(!collapsed)
    onCollapsedChange?.(!collapsed)
  }, [drawer, variant, collapsed, onCollapsedChange])

  useEffect(() => {
    if (!shortcut) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (!isToggleShortcut(event) || isEditableTarget(event.target)) return
      event.preventDefault()
      toggle()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [shortcut, toggle])

  const value = useMemo(
    () => ({
      variant,
      effect,
      collapsed,
      drawer,
      drawerOpen,
      setDrawerOpen,
      icons: !drawer && (collapsed || variant === "rail"),
      canToggle,
      shortcut,
      toggle,
      expanded: drawer ? drawerOpen : !collapsed,
    }),
    [variant, effect, collapsed, drawer, drawerOpen, canToggle, shortcut, toggle],
  )
  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
}

export {
  SidebarContext,
  SidebarProvider,
  isEditableTarget,
  isToggleShortcut,
  useIsPhone,
  useSidebar,
  type SidebarEffect,
  type SidebarProviderProps,
  type SidebarVariant,
}
