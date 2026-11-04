import type * as React from "react"
import { DocsCentered } from "./docs-layout-centered"
import { DocsReference } from "./docs-layout-reference"
import { SAMPLE_GROUPS } from "./docs-layout-sample"
import { DocsSidebar } from "./docs-layout-sidebar"
import { useDocsPages, type DocsCode, type DocsGroup, type DocsPage, type DocsSection } from "./docs-layout-state"

type DocsLayoutVariant = "sidebar" | "centered" | "reference"

interface DocsLayoutProps extends React.ComponentProps<"section"> {
  /** `sidebar` nav, page and table of contents, `centered` one column for a short guide, `reference` text beside its code. Anything else is `sidebar`. */
  variant?: DocsLayoutVariant
  /** Pages in their nav groups. `centered` and `reference` show no group list, and move between pages with the links at the end. */
  groups?: readonly DocsGroup[]
  /** The page showing, if your router owns it. */
  current?: string
  defaultCurrent?: string
  /** Fires when someone picks a page. Pages with an `href` still follow the link. */
  onNavigate?: (id: string) => void
  brandName?: React.ReactNode
  brandHref?: string
}

/** `sidebar` and `reference` scroll inside themselves at a fixed height. Set the height through className, for example h-dvh. */
function DocsLayout({ variant, groups = SAMPLE_GROUPS, current, defaultCurrent, onNavigate, brandName = "Paperline docs", brandHref = "#docs", ...props }: DocsLayoutProps) {
  const docs = useDocsPages({ groups, current, defaultCurrent, onNavigate })
  const shared = { docs, brandName, brandHref, ...props }
  if (variant === "centered") return <DocsCentered {...shared} />
  if (variant === "reference") return <DocsReference {...shared} />
  return <DocsSidebar {...shared} groups={groups} />
}

export { DocsLayout, type DocsCode, type DocsGroup, type DocsLayoutProps, type DocsLayoutVariant, type DocsPage, type DocsSection }
