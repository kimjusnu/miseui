import type { ReactNode } from "react"
import { Search } from "lucide-react"
import { Kbd, KbdGroup, Mod } from "@/registry/miseui/ui/kbd"

function Design({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid min-w-0 content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

const MENU = [
  { label: "New file", key: "N" },
  { label: "Save", key: "S" },
  { label: "Find", key: "F" },
] as const

function SearchHint() {
  return (
    <div className="flex h-10 items-center gap-2 rounded-md border px-3 text-sm text-muted-foreground">
      <Search aria-hidden="true" className="size-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate">Search docs</span>
      <KbdGroup variant="flat">
        <Mod />
        <Kbd>K</Kbd>
      </KbdGroup>
    </div>
  )
}

function MenuRows() {
  return (
    <ul className="grid gap-1 rounded-md border p-1 text-sm">
      {MENU.map((item) => (
        <li key={item.key} className="flex h-8 items-center justify-between rounded-sm px-2">
          {item.label}
          <KbdGroup variant="ghost">
            <Mod />
            <Kbd>{item.key}</Kbd>
          </KbdGroup>
        </li>
      ))}
    </ul>
  )
}

function PressKeys() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <KbdGroup variant="raised" effect="press">
        <Kbd>J</Kbd>
        <Kbd>K</Kbd>
        <Kbd>L</Kbd>
      </KbdGroup>
      <KbdGroup variant="raised" effect="press" separator="+">
        <Kbd>Shift</Kbd>
        <Kbd>Enter</Kbd>
      </KbdGroup>
    </div>
  )
}

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <Design label="plain">
        <p className="text-sm leading-6 text-muted-foreground">
          Press <Kbd>Esc</Kbd> to close the panel, or <Kbd>Tab</Kbd> to move to the next field.
        </p>
      </Design>
      <Design label="raised">
        <KbdGroup variant="raised" separator="+">
          <Mod />
          <Kbd>Shift</Kbd>
          <Kbd>P</Kbd>
        </KbdGroup>
      </Design>
      <Design label="flat">
        <SearchHint />
      </Design>
      <Design label="ghost">
        <MenuRows />
      </Design>
      <Design label="press effect, try the keys on your keyboard">
        <PressKeys />
      </Design>
      <Design label="sequence, press effect on a plain cap">
        <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          Go to inbox
          <KbdGroup separator="then" effect="press">
            <Kbd>G</Kbd>
            <Kbd>I</Kbd>
          </KbdGroup>
        </p>
      </Design>
    </div>
  )
}
