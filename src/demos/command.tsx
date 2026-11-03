import type * as React from "react"
import { useState } from "react"
import { CreditCard, FileText, FolderOpen, LogOut, Moon, Search, Settings, UserPlus, Users } from "lucide-react"
import { Button } from "@/registry/miseui/ui/button"
import { Command, pushRecent, useCommandShortcut, type CommandEffect, type CommandItem } from "@/registry/miseui/ui/command"

const ITEMS: readonly CommandItem[] = [
  { value: "projects", label: "Go to Projects", group: "Navigate", icon: <FolderOpen />, shortcut: ["G", "P"], description: "Everything your team is working on" },
  { value: "invoices", label: "Go to Invoices", group: "Navigate", icon: <FileText />, shortcut: ["G", "I"], description: "Sent, paid and overdue" },
  { value: "members", label: "Go to Members", group: "Navigate", icon: <Users />, shortcut: ["G", "M"] },
  { value: "settings", label: "Open settings", group: "Navigate", icon: <Settings />, keywords: ["preferences", "account"] },
  { value: "invite", label: "Invite a teammate", group: "Actions", icon: <UserPlus />, shortcut: ["I"] },
  { value: "billing", label: "Update payment method", group: "Actions", icon: <CreditCard />, keywords: ["card", "billing"] },
  { value: "theme", label: "Switch to dark theme", group: "Actions", icon: <Moon />, keywords: ["appearance", "night"] },
  { value: "sign-out", label: "Sign out", group: "Actions", icon: <LogOut />, disabled: true, description: "Finish the upload in progress first" },
]

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

function usePalette() {
  const [recent, setRecent] = useState<readonly string[]>(["invoices"])
  const [last, setLast] = useState<string | null>(null)
  const onSelect = (value: string, item: CommandItem) => {
    setRecent((list) => pushRecent(list, value))
    setLast(item.label)
  }
  return { recent, last, onSelect }
}

function ModalDemo({ variant, effect, shortcut, label }: { variant: "dialog" | "spotlight"; effect?: CommandEffect; shortcut?: boolean; label: string }) {
  const [open, setOpen] = useState(false)
  const { recent, last, onSelect } = usePalette()
  useCommandShortcut(() => setOpen((current) => !current), { enabled: shortcut === true })
  return (
    <Cell label={label}>
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        <Button variant="outline" onClick={() => setOpen(true)}>
          <Search />
          {shortcut ? "Search commands" : "Open spotlight"}
        </Button>
        {last ? <span className="min-w-0 text-[13px] text-muted-foreground">Ran: {last}</span> : null}
      </div>
      <Command items={ITEMS} variant={variant} effect={effect} open={open} onOpenChange={setOpen} recent={recent} onSelect={onSelect} />
    </Cell>
  )
}

function InlineDemo() {
  const { recent, onSelect } = usePalette()
  return (
    <Cell label="inline, materialize effect, type to see the height spring">
      <Command items={ITEMS} variant="inline" effect="materialize" recent={recent} onSelect={onSelect} placeholder="Search commands" />
    </Cell>
  )
}

export function Demo() {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8 sm:grid-cols-[repeat(2,minmax(0,1fr))]">
      <ModalDemo variant="dialog" effect="materialize" shortcut label="dialog, opens with Mod+K" />
      <ModalDemo variant="spotlight" label="spotlight, a large input first" />
      <InlineDemo />
      <Cell label="compact">
        <Command items={ITEMS} variant="compact" placeholder="Jump to" />
      </Cell>
    </div>
  )
}
