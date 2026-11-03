import type * as React from "react"
import { useState } from "react"
import { BarChart3, Inbox, Settings } from "lucide-react"
import { AppShell } from "@/registry/miseui/ui/app-shell"
import { Button } from "@/registry/miseui/ui/button"
import { Sidebar, SidebarContent, SidebarGroup, SidebarItem } from "@/registry/miseui/ui/sidebar"
import { cn } from "@/registry/miseui/lib/utils"

const INVOICES = ["Northwind Studio", "Harbor Bakery", "Lumen Clinic", "Pine Street Books", "Atlas Cycles", "Fern and Co", "Mira Dental", "Oak Lane Press"]

const THREADS = [
  { id: "t1", from: "Mina Park", subject: "Quote for the spring order", body: "Could you send the updated quote by Thursday? The numbers changed after our call on Monday." },
  { id: "t2", from: "Theo Lang", subject: "Invoice 4822 paid", body: "Payment went out this morning. It should land in your account within two working days." },
  { id: "t3", from: "Sora Han", subject: "New delivery window", body: "The driver can come between nine and eleven on Friday, if that still works on your side." },
]

function Frame({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="h-80 min-w-0 overflow-hidden rounded-lg border">{children}</div>
    </div>
  )
}

function Rows() {
  return (
    <ul className="grid gap-2 text-sm">
      {INVOICES.map((name) => (
        <li key={name} className="rounded-md border px-3 py-2">
          {name}
        </li>
      ))}
    </ul>
  )
}

function Nav({ label }: { label: string }) {
  return (
    <Sidebar label={label} width={192}>
      <SidebarContent label={`${label} links`}>
        <SidebarGroup>
          <SidebarItem icon={<Inbox />} active badge={8}>
            Invoices
          </SidebarItem>
          <SidebarItem icon={<BarChart3 />}>Reports</SidebarItem>
          <SidebarItem icon={<Settings />}>Settings</SidebarItem>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}

const NEW_INVOICE = (
  <Button size="sm" className="pointer-coarse:h-10">
    New
  </Button>
)

function TopLinks() {
  const [active, setActive] = useState("Invoices")
  return ["Invoices", "Reports", "People", "Settings"].map((name) => (
    <button
      key={name}
      type="button"
      aria-current={active === name ? "page" : undefined}
      onClick={() => setActive(name)}
      className={cn(
        "h-9 shrink-0 rounded-md px-3 text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset pointer-coarse:h-10",
        active === name && "bg-accent font-medium text-foreground",
      )}
    >
      {name}
    </button>
  ))
}

function Mail() {
  const [openId, setOpenId] = useState<string | null>(null)
  const open = THREADS.find((thread) => thread.id === openId)
  const list = (
    <ul className="grid gap-1 p-2">
      {THREADS.map((thread) => (
        <li key={thread.id}>
          <button
            type="button"
            aria-current={openId === thread.id ? "true" : undefined}
            onClick={() => setOpenId(thread.id)}
            className={cn("grid w-full gap-0.5 rounded-md px-3 py-2 text-left outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset", openId === thread.id && "bg-accent")}
          >
            <span className="text-sm font-medium">{thread.from}</span>
            <span className="text-[13px] text-muted-foreground">{thread.subject}</span>
          </button>
        </li>
      ))}
    </ul>
  )
  return (
    <AppShell variant="split" fill list={list} listLabel="Threads" detailLabel="Thread" detailOpen={openId !== null} onBack={() => setOpenId(null)}>
      {open ? (
        <div className="grid gap-2">
          <h3 className="text-[15px] font-medium">{open.subject}</h3>
          <p className="text-sm text-muted-foreground">{open.body}</p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Choose a thread to read it here.</p>
      )}
    </AppShell>
  )
}

export function Demo() {
  return (
    <div className="grid gap-8">
      <Frame label="sidebar, narrow frames get a drawer behind the button">
        <AppShell fill shortcut={false} title="Invoices" actions={NEW_INVOICE} sidebar={<Nav label="Invoices app" />}>
          <Rows />
        </AppShell>
      </Frame>
      <Frame label="topbar">
        <AppShell variant="topbar" fill title="Harbor" actions={NEW_INVOICE} nav={<TopLinks />} navLabel="Sections">
          <Rows />
        </AppShell>
      </Frame>
      <Frame label="split, on a phone one pane at a time">
        <Mail />
      </Frame>
      <Frame label="centered">
        <AppShell variant="centered" fill title="Account settings">
          <div className="grid gap-4 text-sm text-muted-foreground">
            <p>One column keeps long settings and documents at a line length people can actually read, while the scrollbar stays at the edge of the frame.</p>
            <p>The top bar lines up with the text below it, so the title and the content share one left edge all the way down the page.</p>
            <p>There is no navigation to look past here, which is the point: this layout is for a task with a beginning and an end.</p>
            <p>Keep this for pages like billing details, a privacy policy or a long form. An app people move around in all day wants a sidebar instead.</p>
          </div>
        </AppShell>
      </Frame>
    </div>
  )
}
