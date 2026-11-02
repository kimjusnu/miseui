import type { MouseEvent, ReactNode } from "react"
import { useState } from "react"
import { Breadcrumb, type BreadcrumbProps } from "@/registry/miseui/ui/breadcrumb"

const PAGES = ["Home", "Northwind", "Projects", "Atlas", "Settings", "Billing", "Invoices"] as const

function Design({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid min-w-0 content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

/** Clicks walk up the trail inside the demo, so the links work without leaving the page. */
function Trail({ pages, ...props }: Omit<BreadcrumbProps, "items"> & { pages: readonly string[] }) {
  const [depth, setDepth] = useState(pages.length)
  const items = pages.slice(0, depth).map((label, index) => ({
    label,
    href: `#${label.toLowerCase()}`,
    onClick: (event: MouseEvent<HTMLElement>) => {
      event.preventDefault()
      setDepth(index + 1)
    },
  }))
  const reset = depth === pages.length ? null : (
    <button
      type="button"
      className="h-8 justify-self-start rounded-sm text-[13px] text-muted-foreground underline underline-offset-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      onClick={() => setDepth(pages.length)}
    >
      Reset trail
    </button>
  )
  return (
    <div className="grid gap-2">
      <Breadcrumb items={items} {...props} />
      {reset}
    </div>
  )
}

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <Design label="chevron">
        <Trail pages={["Home", "Billing", "Invoices"]} />
      </Design>
      <Design label="slash">
        <Trail pages={["northwind", "atlas", "src", "routes.ts"]} variant="slash" label="File path" />
      </Design>
      <Design label="pill">
        <Trail pages={["All products", "Audio", "Headphones"]} variant="pill" label="Catalogue" />
      </Design>
      <Design label="back">
        <Trail pages={["Home", "Billing", "Invoice 2041"]} variant="back" />
      </Design>
      <Design label="long trail, the middle collapses into a menu">
        <Trail pages={PAGES} />
      </Design>
      <Design label="spring effect, hover or tab along the trail">
        <Trail pages={["Home", "Docs", "Components", "Breadcrumb"]} effect="spring" />
      </Design>
    </div>
  )
}
