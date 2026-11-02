import { useRef, useState } from "react"
import { Eraser, MousePointer2, PenLine, Square, Type } from "lucide-react"
import { FloatingPanel, type FloatingPanelProps } from "@/registry/miseui/ui/floating-panel"

/** A panel needs somewhere to float, so each one gets its own stage and reopens from a button inside it. */
function Stage({ label, children, ...props }: Partial<FloatingPanelProps> & { label: string }) {
  const stage = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(true)
  return (
    <div className="grid min-w-0 content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div ref={stage} className="relative h-72 min-w-0 overflow-hidden rounded-lg border bg-muted/50">
        {open ? null : (
          <button
            type="button"
            className="absolute top-3 left-3 h-9 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 pointer-coarse:h-10"
            onClick={() => setOpen(true)}
          >
            Open panel
          </button>
        )}
        <FloatingPanel title="Layers" boundary={stage} open={open} onOpenChange={setOpen} {...props}>
          {children}
        </FloatingPanel>
      </div>
    </div>
  )
}

const LAYERS = ["Header", "Product photo", "Price tag", "Background"] as const

function LayerList() {
  return (
    <ul className="grid gap-1 p-3">
      {LAYERS.map((layer) => (
        <li key={layer} className="rounded-md px-2 py-1 hover:bg-accent">{layer}</li>
      ))}
    </ul>
  )
}

const TOOLS = [
  { name: "Select", icon: MousePointer2 },
  { name: "Pen", icon: PenLine },
  { name: "Shape", icon: Square },
  { name: "Text", icon: Type },
  { name: "Erase", icon: Eraser },
] as const

function ToolPalette() {
  const [tool, setTool] = useState<string>("Select")
  return (
    <div role="toolbar" aria-orientation="vertical" aria-label="Drawing tools" className="grid justify-items-center gap-1 p-1">
      {TOOLS.map(({ name, icon: Icon }) => (
        <button
          key={name}
          type="button"
          aria-label={name}
          aria-pressed={tool === name}
          className="flex size-10 items-center justify-center rounded-lg text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-pressed:bg-accent aria-pressed:text-foreground"
          onClick={() => setTool(name)}
        >
          <Icon aria-hidden="true" className="size-4" />
        </button>
      ))}
    </div>
  )
}

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <Stage label="panel, momentum effect: throw it" effect="momentum" defaultSize={{ width: 224, height: 144 }}>
        <LayerList />
      </Stage>
      <Stage label="compact" variant="compact" defaultSize={{ width: 176, height: 96 }} defaultPosition={{ x: 32, y: 48 }} minSize={{ width: 144, height: 64 }}>
        <dl className="grid grid-cols-2 gap-2 p-2 text-[13px]">
          <dt className="text-muted-foreground">Hex</dt>
          <dd className="font-mono">#2F6BFF</dd>
          <dt className="text-muted-foreground">Contrast</dt>
          <dd>5.1 to 1</dd>
        </dl>
      </Stage>
      <Stage label="docked: drag it across" variant="docked" defaultSize={{ width: 176, height: 240 }} minSize={{ width: 144, height: 96 }}>
        <LayerList />
      </Stage>
      <Stage label="tool" variant="tool" defaultPosition={{ x: 16, y: 16 }} closable={false}>
        <ToolPalette />
      </Stage>
    </div>
  )
}
