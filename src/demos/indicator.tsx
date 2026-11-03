import type * as React from "react"
import { useState } from "react"
import { Bell, Inbox, MessageSquare, Minus, Plus, ShoppingBag, Sparkles } from "lucide-react"
import { Indicator } from "@/registry/miseui/ui/indicator"

/** The demo sits on the card surface, so the cut-out around each mark has to match it. */
const SURFACE_STYLE = { "--indicator-surface": "var(--card)" } as React.CSSProperties

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 content-start gap-2" style={SURFACE_STYLE}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex min-w-0 flex-wrap items-center gap-4 py-2">{children}</div>
    </div>
  )
}

function IconTile({ children, name }: { children: React.ReactNode; name: string }) {
  return (
    <span role="img" aria-label={name} className="flex size-10 items-center justify-center rounded-md border bg-background text-muted-foreground">
      {children}
    </span>
  )
}

function Initials({ children }: { children: string }) {
  return <span className="flex size-10 items-center justify-center rounded-full bg-muted text-[13px] font-medium">{children}</span>
}

const STEP_CLASS =
  "inline-flex size-8 items-center justify-center rounded-md border bg-background outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 pointer-coarse:size-10"

function Cart() {
  const [count, setCount] = useState(3)
  return (
    <>
      <Indicator count={count} effect="pop" label={`${count} items in cart`}>
        <IconTile name="Cart">
          <ShoppingBag className="size-4" aria-hidden="true" />
        </IconTile>
      </Indicator>
      <div className="flex items-center gap-2">
        <button type="button" aria-label="Remove an item" className={STEP_CLASS} onClick={() => setCount((current) => Math.max(0, current - 1))}>
          <Minus className="size-4" aria-hidden="true" />
        </button>
        <button type="button" aria-label="Add an item" className={STEP_CLASS} onClick={() => setCount((current) => current + 1)}>
          <Plus className="size-4" aria-hidden="true" />
        </button>
      </div>
    </>
  )
}

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <Cell label="dot">
        <Indicator variant="dot" label="New activity">
          <IconTile name="Notifications">
            <Bell className="size-4" aria-hidden="true" />
          </IconTile>
        </Indicator>
        <Indicator variant="dot" shape="circle" corner="bottom-right" tone="success" label="Mina is online">
          <Initials>MP</Initials>
        </Indicator>
      </Cell>
      <Cell label="count, capped with a plus">
        <Indicator count={7} label="7 unread messages">
          <IconTile name="Messages">
            <MessageSquare className="size-4" aria-hidden="true" />
          </IconTile>
        </Indicator>
        <Indicator count={128} tone="error" label="128 failed deliveries">
          <IconTile name="Inbox">
            <Inbox className="size-4" aria-hidden="true" />
          </IconTile>
        </Indicator>
      </Cell>
      <Cell label="ring, around the whole child">
        <Indicator variant="ring" shape="circle" label="Theo is speaking">
          <Initials>TG</Initials>
        </Indicator>
        <Indicator variant="ring" tone="neutral" label="Selected">
          <IconTile name="Generate">
            <Sparkles className="size-4" aria-hidden="true" />
          </IconTile>
        </Indicator>
      </Cell>
      <Cell label="label">
        <div className="flex flex-wrap gap-12">
          <Indicator variant="label" text="Beta" label="Beta feature">
            <span className="rounded-md border bg-background px-3 py-2 text-sm">Reports</span>
          </Indicator>
          <Indicator variant="label" text="New" tone="neutral" corner="top-left" label="New">
            <span className="rounded-md border bg-background px-3 py-2 text-sm">Exports</span>
          </Indicator>
        </div>
      </Cell>
      <Cell label="pop effect, on change only">
        <Cart />
      </Cell>
    </div>
  )
}
