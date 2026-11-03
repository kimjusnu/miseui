import type * as React from "react"
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Circle,
  Eraser,
  Hand,
  Italic,
  MousePointer2,
  Pencil,
  Redo2,
  Square,
  Type,
  Underline,
  Undo2,
} from "lucide-react"
import {
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  ToolbarLink,
  ToolbarSeparator,
  ToolbarToggleGroup,
  ToolbarToggleItem,
  type ToolbarProps,
} from "@/registry/miseui/ui/toolbar"

const DRAW_TOOLS = [
  { value: "select", label: "Select", Icon: MousePointer2 },
  { value: "hand", label: "Pan", Icon: Hand },
  { value: "pen", label: "Pen", Icon: Pencil },
  { value: "eraser", label: "Eraser", Icon: Eraser },
  { value: "rectangle", label: "Rectangle", Icon: Square },
  { value: "ellipse", label: "Ellipse", Icon: Circle },
] as const

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="min-w-0 justify-self-start">{children}</div>
    </div>
  )
}

function TextTools(props: ToolbarProps) {
  return (
    <Toolbar aria-label="Text formatting" {...props}>
      <ToolbarGroup aria-label="History">
        <ToolbarButton aria-label="Undo">
          <Undo2 />
        </ToolbarButton>
        <ToolbarButton aria-label="Redo" disabled>
          <Redo2 />
        </ToolbarButton>
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarToggleGroup type="multiple" aria-label="Style" defaultValue={["bold"]}>
        <ToolbarToggleItem value="bold" aria-label="Bold">
          <Bold />
        </ToolbarToggleItem>
        <ToolbarToggleItem value="italic" aria-label="Italic">
          <Italic />
        </ToolbarToggleItem>
        <ToolbarToggleItem value="underline" aria-label="Underline">
          <Underline />
        </ToolbarToggleItem>
      </ToolbarToggleGroup>
      <ToolbarSeparator />
      <ToolbarToggleGroup type="single" aria-label="Alignment" defaultValue="left">
        <ToolbarToggleItem value="left" aria-label="Align left">
          <AlignLeft />
        </ToolbarToggleItem>
        <ToolbarToggleItem value="center" aria-label="Align centre">
          <AlignCenter />
        </ToolbarToggleItem>
        <ToolbarToggleItem value="right" aria-label="Align right">
          <AlignRight />
        </ToolbarToggleItem>
      </ToolbarToggleGroup>
    </Toolbar>
  )
}

function DrawTools(props: ToolbarProps) {
  return (
    <Toolbar aria-label="Drawing tools" {...props}>
      <ToolbarToggleGroup type="single" aria-label="Tool" defaultValue="pen">
        {DRAW_TOOLS.map(({ value, label, Icon }) => (
          <ToolbarToggleItem key={value} value={value} aria-label={label}>
            <Icon />
          </ToolbarToggleItem>
        ))}
      </ToolbarToggleGroup>
      <ToolbarSeparator />
      <ToolbarButton aria-label="Add text">
        <Type />
      </ToolbarButton>
    </Toolbar>
  )
}

function ViewSwitch() {
  return (
    <Toolbar aria-label="Report view" variant="pill" effect="spring">
      <ToolbarToggleGroup type="single" aria-label="Period" defaultValue="month">
        <ToolbarToggleItem value="week">Week</ToolbarToggleItem>
        <ToolbarToggleItem value="month">Month</ToolbarToggleItem>
        <ToolbarToggleItem value="year">Year</ToolbarToggleItem>
      </ToolbarToggleGroup>
      <ToolbarSeparator />
      <ToolbarLink href="#export">Export</ToolbarLink>
    </Toolbar>
  )
}

export function Demo() {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8 sm:grid-cols-[repeat(2,minmax(0,1fr))]">
      <Cell label="plain, wraps when narrow">
        <TextTools />
      </Cell>
      <Cell label="floating, spring effect">
        <DrawTools variant="floating" effect="spring" />
      </Cell>
      <Cell label="pill, spring effect">
        <ViewSwitch />
      </Cell>
      <Cell label="vertical, spring effect">
        <DrawTools variant="vertical" effect="spring" />
      </Cell>
      <div className="grid min-w-0 gap-2 sm:col-span-2">
        <p className="text-xs text-muted-foreground">scrolls inside itself instead of wrapping</p>
        <TextTools overflow="scroll" />
      </div>
    </div>
  )
}
