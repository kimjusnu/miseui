import type * as React from "react"
import { useState } from "react"
import { BarChart3, Folder, Inbox, Settings, Users } from "lucide-react"
import { Button } from "@/registry/miseui/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarItem,
  SidebarNested,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
  type SidebarEffect,
  type SidebarVariant,
} from "@/registry/miseui/ui/sidebar"

function Brand() {
  return (
    <>
      <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
        H
      </span>
      <span className="text-sm font-medium">Harbor</span>
    </>
  )
}

function Links() {
  const [active, setActive] = useState("inbox")
  const item = (id: string) => ({ active: active === id, onClick: () => setActive(id) })
  return (
    <>
      <SidebarHeader>
        <Brand />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup label="Workspace">
          <SidebarItem icon={<Inbox />} badge={12} {...item("inbox")}>
            Inbox
          </SidebarItem>
          <SidebarItem icon={<BarChart3 />} {...item("reports")}>
            Reports
          </SidebarItem>
          <SidebarNested icon={<Folder />} label="Projects" defaultOpen>
            <SidebarItem {...item("atlas")}>Atlas launch</SidebarItem>
            <SidebarItem {...item("pine")}>Pine rebuild</SidebarItem>
          </SidebarNested>
          <SidebarItem icon={<Users />} {...item("people")}>
            People
          </SidebarItem>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarGroup>
          <SidebarItem icon={<Settings />} {...item("settings")}>
            Settings
          </SidebarItem>
        </SidebarGroup>
      </SidebarFooter>
    </>
  )
}

function Frame({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex h-[26rem] min-w-0 overflow-hidden rounded-lg border bg-background">{children}</div>
    </div>
  )
}

function PageBeside() {
  const { icons } = useSidebar()
  return (
    <div className="grid min-w-0 flex-1 content-start gap-2 p-2">
      <SidebarTrigger aria-label="Toggle this sidebar" />
      <p className="px-2 text-[13px] text-muted-foreground">{icons ? "Icons only" : "Open"}</p>
    </div>
  )
}

function Shown({ variant, effect, defaultCollapsed = false }: { variant: SidebarVariant; effect?: SidebarEffect; defaultCollapsed?: boolean }) {
  return (
    <SidebarProvider variant={variant} effect={effect} defaultCollapsed={defaultCollapsed} shortcut={false} mobile={false}>
      <Sidebar width={176} label={`${variant} navigation`}>
        <Links />
      </Sidebar>
      {variant === "inset" ? (
        <SidebarInset className="m-2 ms-0 max-md:m-2 max-md:ms-0 max-md:rounded-xl max-md:border">
          <PageBeside />
        </SidebarInset>
      ) : (
        <PageBeside />
      )}
    </SidebarProvider>
  )
}

function Saved() {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <div className="grid min-w-0 gap-2">
      <SidebarProvider effect="spring" collapsed={collapsed} onCollapsedChange={setCollapsed} mobile={false}>
        <div className="flex h-[26rem] min-w-0 overflow-hidden rounded-lg border bg-background">
          <Sidebar width={176} label="Saved navigation">
            <Links />
          </Sidebar>
          <div className="grid min-w-0 flex-1 content-start gap-2 p-2">
            <SidebarTrigger />
            <p className="px-2 text-[13px] text-muted-foreground">Mod+B works here. The saved value is {String(collapsed)}.</p>
          </div>
        </div>
      </SidebarProvider>
    </div>
  )
}

function PhoneDrawer() {
  return (
    <SidebarProvider mobile shortcut={false}>
      <div className="grid justify-items-start gap-2 rounded-lg border bg-background p-3">
        <SidebarDrawerButton />
        <p className="text-[13px] text-muted-foreground">Phones get this by default, with the trigger in your top bar.</p>
      </div>
      <Sidebar label="Drawer navigation">
        <Links />
      </Sidebar>
    </SidebarProvider>
  )
}

function SidebarDrawerButton() {
  const { toggle } = useSidebar()
  return (
    <Button variant="outline" size="sm" className="pointer-coarse:h-10" onClick={toggle}>
      Open the drawer
    </Button>
  )
}

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <Frame label="plain">
        <Shown variant="plain" />
      </Frame>
      <Frame label="floating">
        <Shown variant="floating" />
      </Frame>
      <Frame label="inset">
        <Shown variant="inset" />
      </Frame>
      <Frame label="rail, icons with tooltips and a menu for projects">
        <Shown variant="rail" />
      </Frame>
      <div className="grid min-w-0 content-start gap-2">
        <p className="text-xs text-muted-foreground">spring effect, saved through a prop</p>
        <Saved />
      </div>
      <div className="grid min-w-0 content-start gap-2">
        <p className="text-xs text-muted-foreground">drawer on phones</p>
        <PhoneDrawer />
      </div>
    </div>
  )
}
