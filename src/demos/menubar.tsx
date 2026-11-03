import type * as React from "react"
import { useState } from "react"
import { Share2 } from "lucide-react"
import { Button } from "@/registry/miseui/ui/button"
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
  type MenubarProps,
} from "@/registry/miseui/ui/menubar"

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

function FileMenu() {
  return (
    <MenubarMenu>
      <MenubarTrigger>File</MenubarTrigger>
      <MenubarContent>
        <MenubarItem>
          New sheet <MenubarShortcut>Ctrl N</MenubarShortcut>
        </MenubarItem>
        <MenubarItem>
          Rename <MenubarShortcut>F2</MenubarShortcut>
        </MenubarItem>
        <MenubarSub>
          <MenubarSubTrigger>Export as</MenubarSubTrigger>
          <MenubarSubContent>
            <MenubarItem>PDF</MenubarItem>
            <MenubarItem>CSV</MenubarItem>
            <MenubarItem>Excel workbook</MenubarItem>
          </MenubarSubContent>
        </MenubarSub>
        <MenubarSeparator />
        <MenubarItem variant="destructive">Move to trash</MenubarItem>
      </MenubarContent>
    </MenubarMenu>
  )
}

function EditMenu() {
  return (
    <MenubarMenu>
      <MenubarTrigger>Edit</MenubarTrigger>
      <MenubarContent>
        <MenubarItem>
          Undo <MenubarShortcut>Ctrl Z</MenubarShortcut>
        </MenubarItem>
        <MenubarItem disabled>
          Redo <MenubarShortcut>Ctrl Y</MenubarShortcut>
        </MenubarItem>
        <MenubarSeparator />
        <MenubarItem>
          Find <MenubarShortcut>Ctrl F</MenubarShortcut>
        </MenubarItem>
      </MenubarContent>
    </MenubarMenu>
  )
}

function ViewMenu() {
  const [gridlines, setGridlines] = useState(true)
  const [formulas, setFormulas] = useState(false)
  const [zoom, setZoom] = useState("fit")
  return (
    <MenubarMenu>
      <MenubarTrigger>View</MenubarTrigger>
      <MenubarContent>
        <MenubarCheckboxItem checked={gridlines} onCheckedChange={setGridlines}>
          Gridlines
        </MenubarCheckboxItem>
        <MenubarCheckboxItem checked={formulas} onCheckedChange={setFormulas}>
          Formula bar
        </MenubarCheckboxItem>
        <MenubarSeparator />
        <MenubarLabel>Zoom</MenubarLabel>
        <MenubarRadioGroup value={zoom} onValueChange={setZoom}>
          <MenubarRadioItem value="fit">Fit to window</MenubarRadioItem>
          <MenubarRadioItem value="100">100%</MenubarRadioItem>
          <MenubarRadioItem value="150">150%</MenubarRadioItem>
        </MenubarRadioGroup>
      </MenubarContent>
    </MenubarMenu>
  )
}

function SheetMenus(props: MenubarProps) {
  return (
    <Menubar aria-label="Sheet" {...props}>
      <FileMenu />
      <EditMenu />
      <ViewMenu />
    </Menubar>
  )
}

export function Demo() {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8 sm:grid-cols-[repeat(2,minmax(0,1fr))]">
      <Cell label="plain">
        <div className="min-w-0 justify-self-start">
          <SheetMenus />
        </div>
      </Cell>
      <Cell label="ghost">
        <SheetMenus variant="ghost" />
      </Cell>
      <Cell label="pill">
        <div className="min-w-0 justify-self-start">
          <SheetMenus variant="pill" />
        </div>
      </Cell>
      <Cell label="materialize effect">
        <div className="min-w-0 justify-self-start">
          <SheetMenus effect="materialize" />
        </div>
      </Cell>
      <div className="grid min-w-0 gap-2 sm:col-span-2">
        <p className="text-xs text-muted-foreground">app, title row above the menus</p>
        <div className="min-w-0 rounded-lg border">
          <SheetMenus
            variant="app"
            title="Q3 revenue forecast"
            actions={
              <Button size="sm" variant="outline">
                <Share2 />
                Share
              </Button>
            }
          />
        </div>
      </div>
    </div>
  )
}
