import type * as React from "react"
import { useState } from "react"
import { Clipboard, Copy, FolderInput, Link2, Pencil, Scissors, Share2, Trash2 } from "lucide-react"
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuQuickItem,
  ContextMenuQuickRow,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
  type ContextMenuProps,
} from "@/registry/miseui/ui/context-menu"

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

function FileRow({ name, meta }: { name: string; meta: string }) {
  return (
    <ContextMenuTrigger className="grid min-w-0 gap-1 border bg-card p-4">
      <span className="truncate text-sm font-medium">{name}</span>
      <span className="text-[13px] text-muted-foreground">{meta}</span>
    </ContextMenuTrigger>
  )
}

function MoveToSub({ icon }: { icon?: React.ReactNode }) {
  return (
    <ContextMenuSub>
      <ContextMenuSubTrigger icon={icon}>Move to</ContextMenuSubTrigger>
      <ContextMenuSubContent>
        <ContextMenuItem>Budgets</ContextMenuItem>
        <ContextMenuItem>Shared with finance</ContextMenuItem>
        <ContextMenuItem>Archive</ContextMenuItem>
      </ContextMenuSubContent>
    </ContextMenuSub>
  )
}

function ListMenu(props: ContextMenuProps) {
  return (
    <ContextMenu {...props}>
      <FileRow name="Q3 forecast.xlsx" meta="Right-click or long press" />
      <ContextMenuContent>
        <ContextMenuItem>
          Open <ContextMenuShortcut>Enter</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem>
          Rename <ContextMenuShortcut>F2</ContextMenuShortcut>
        </ContextMenuItem>
        <MoveToSub />
        <ContextMenuSeparator />
        <ContextMenuItem tone="destructive">Move to trash</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

function ViewOptions() {
  const [grid, setGrid] = useState(true)
  const [sort, setSort] = useState("modified")
  return (
    <ContextMenu variant="grouped">
      <FileRow name="Design reviews" meta="Folder, 18 files" />
      <ContextMenuContent>
        <ContextMenuGroup>
          <ContextMenuItem>Open in new tab</ContextMenuItem>
          <MoveToSub />
        </ContextMenuGroup>
        <ContextMenuGroup>
          <ContextMenuLabel>View</ContextMenuLabel>
          <ContextMenuCheckboxItem checked={grid} onCheckedChange={setGrid}>
            Show as grid
          </ContextMenuCheckboxItem>
        </ContextMenuGroup>
        <ContextMenuGroup>
          <ContextMenuLabel>Sort by</ContextMenuLabel>
          <ContextMenuRadioGroup value={sort} onValueChange={setSort}>
            <ContextMenuRadioItem value="modified">Last modified</ContextMenuRadioItem>
            <ContextMenuRadioItem value="name">Name</ContextMenuRadioItem>
          </ContextMenuRadioGroup>
        </ContextMenuGroup>
      </ContextMenuContent>
    </ContextMenu>
  )
}

function IconMenu() {
  return (
    <ContextMenu variant="icon">
      <FileRow name="Launch notes.md" meta="Edited 4 minutes ago" />
      <ContextMenuContent>
        <ContextMenuQuickRow>
          <ContextMenuQuickItem aria-label="Cut">
            <Scissors />
          </ContextMenuQuickItem>
          <ContextMenuQuickItem aria-label="Copy">
            <Copy />
          </ContextMenuQuickItem>
          <ContextMenuQuickItem aria-label="Paste">
            <Clipboard />
          </ContextMenuQuickItem>
        </ContextMenuQuickRow>
        <ContextMenuItem icon={<Pencil />}>Rename</ContextMenuItem>
        <ContextMenuItem icon={<Link2 />}>Copy link</ContextMenuItem>
        <ContextMenuItem icon={<Share2 />}>Share</ContextMenuItem>
        <MoveToSub icon={<FolderInput />} />
        <ContextMenuSeparator />
        <ContextMenuItem tone="destructive" icon={<Trash2 className="text-destructive" />}>
          Move to trash
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <Cell label="plain">
        <ListMenu variant="plain" />
      </Cell>
      <Cell label="compact">
        <ListMenu variant="compact" />
      </Cell>
      <Cell label="grouped, with check and radio items">
        <ViewOptions />
      </Cell>
      <Cell label="icon, with a quick row">
        <IconMenu />
      </Cell>
      <Cell label="materialize effect">
        <ListMenu variant="plain" effect="materialize" />
      </Cell>
    </div>
  )
}
