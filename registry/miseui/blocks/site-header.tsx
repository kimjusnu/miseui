import type * as React from "react"
import { useId, useState } from "react"
import { cn } from "@/registry/miseui/lib/utils"
import { HeaderBar } from "./site-header-bar"
import { HeaderFloating } from "./site-header-floating"
import { HeaderMega } from "./site-header-mega"
import { SkipLink, type HeaderContent, type SiteHeaderPosition } from "./site-header-parts"
import { SAMPLE_LINKS, SAMPLE_MENU_LINKS, SAMPLE_MENUS, type SiteHeaderAction, type SiteHeaderLink, type SiteHeaderMenu } from "./site-header-sample"

type SiteHeaderVariant = "bar" | "mega" | "floating"

const DEFAULT_PRIMARY: SiteHeaderAction = { label: "Get started", href: "#get-started" }
const DEFAULT_SECONDARY: SiteHeaderAction = { label: "Log in", href: "#log-in" }

interface SiteHeaderProps extends React.ComponentProps<"div"> {
  /** `bar` a plain row of links, `mega` panels of grouped links, `floating` pieces over the page. All become a drawer on phones. Anything else is `bar`. */
  variant?: SiteHeaderVariant
  brandName?: React.ReactNode
  brandHref?: string
  /** The links in the row. On `mega` they sit after the menus. */
  links?: readonly SiteHeaderLink[]
  /** `mega` and its drawer only. */
  menus?: readonly SiteHeaderMenu[]
  /** Null removes it. */
  primaryAction?: SiteHeaderAction | null
  /** Null removes it. */
  secondaryAction?: SiteHeaderAction | null
  /** The href of the current page, usually from your router. Left out, the last link pressed is marked. */
  currentHref?: string
  defaultCurrentHref?: string
  onNavigate?: (href: string) => void
  /** `sticky` stays inside this block, which is what you want in a frame or a preview. `fixed` attaches to the window. */
  position?: SiteHeaderPosition
  navLabel?: string
  skipLabel?: string
  /** The id of your main element, when it is not inside this block. Children get a main with this id. */
  mainId?: string
  /** The page. It is wrapped in a main, the target of the skip link. */
  children?: React.ReactNode
}

const MAIN_CLASS: Record<SiteHeaderVariant, Record<SiteHeaderPosition, string>> = {
  bar: { sticky: "", fixed: "pt-14" },
  mega: { sticky: "", fixed: "pt-14" },
  // Nothing holds the row's height, so the page starts clear of it unless the owner wants to run underneath.
  floating: { sticky: "pt-16", fixed: "pt-16" },
}

function chooseView(variant: string | undefined): SiteHeaderVariant {
  return variant === "mega" || variant === "floating" ? variant : "bar"
}

function SiteHeader({ variant, brandName = "Paperline", brandHref = "#top", links, menus = SAMPLE_MENUS, primaryAction = DEFAULT_PRIMARY, secondaryAction = DEFAULT_SECONDARY, currentHref, defaultCurrentHref, onNavigate, position = "sticky", navLabel = "Main", skipLabel = "Skip to content", mainId, className, children, ...props }: SiteHeaderProps) {
  const generatedId = useId()
  const targetId = mainId ?? generatedId
  const [lastPressed, setLastPressed] = useState(defaultCurrentHref)
  const view = chooseView(variant)
  const content: HeaderContent = {
    brandName,
    brandHref,
    links: links ?? (view === "mega" ? SAMPLE_MENU_LINKS : SAMPLE_LINKS),
    menus: view === "mega" ? menus : [],
    primaryAction,
    secondaryAction,
    current: currentHref ?? lastPressed,
    onSelect: (href) => {
      setLastPressed(href)
      onNavigate?.(href)
    },
    navLabel,
    position,
  }
  const hasPage = children !== undefined && children !== null
  return (
    <div data-slot="site-header" data-variant={view} data-position={position} className={cn("@container relative isolate w-full bg-background", className)} {...props}>
      {/* Only when there is something to skip to. */}
      {hasPage || mainId ? <SkipLink targetId={targetId} label={skipLabel} /> : null}
      {view === "bar" ? <HeaderBar content={content} /> : null}
      {view === "mega" ? <HeaderMega content={content} /> : null}
      {view === "floating" ? <HeaderFloating content={content} /> : null}
      {hasPage ? (
        <main id={targetId} tabIndex={-1} data-slot="site-header-main" className={cn("outline-none", MAIN_CLASS[view][position])}>
          {children}
        </main>
      ) : null}
    </div>
  )
}

export { SiteHeader, type SiteHeaderAction, type SiteHeaderLink, type SiteHeaderMenu, type SiteHeaderPosition, type SiteHeaderProps, type SiteHeaderVariant }
