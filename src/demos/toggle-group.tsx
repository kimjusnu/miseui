import { AlignCenter, AlignLeft, AlignRight, Bold, Italic, Underline } from "lucide-react"
import { ToggleGroup, ToggleGroupItem } from "@/registry/miseui/ui/toggle-group"

const FILTERS = ["Remote", "Full time", "Part time", "Senior", "Visa support"] as const

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start justify-items-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

function FormatIcons() {
  return (
    <>
      <ToggleGroupItem value="bold" aria-label="Bold">
        <Bold aria-hidden="true" />
      </ToggleGroupItem>
      <ToggleGroupItem value="italic" aria-label="Italic">
        <Italic aria-hidden="true" />
      </ToggleGroupItem>
      <ToggleGroupItem value="underline" aria-label="Underline">
        <Underline aria-hidden="true" />
      </ToggleGroupItem>
    </>
  )
}

function AlignIcons() {
  return (
    <>
      <ToggleGroupItem value="left" aria-label="Align left">
        <AlignLeft aria-hidden="true" />
      </ToggleGroupItem>
      <ToggleGroupItem value="center" aria-label="Align center">
        <AlignCenter aria-hidden="true" />
      </ToggleGroupItem>
      <ToggleGroupItem value="right" aria-label="Align right">
        <AlignRight aria-hidden="true" />
      </ToggleGroupItem>
    </>
  )
}

const SIZES = ["Small", "Medium", "Large"] as const

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <Cell label="plain, several at once">
        <ToggleGroup type="multiple" aria-label="Formatting" defaultValue={["bold"]}>
          <FormatIcons />
        </ToggleGroup>
      </Cell>
      <Cell label="outline, one at a time">
        <ToggleGroup variant="outline" aria-label="Size" defaultValue="Medium">
          {SIZES.map((size) => (
            <ToggleGroupItem key={size} value={size}>
              {size}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Cell>
      <Cell label="pill, several at once">
        <ToggleGroup type="multiple" variant="pill" aria-label="Job filters" defaultValue={["Remote", "Senior"]}>
          {FILTERS.map((filter) => (
            <ToggleGroupItem key={filter} value={filter}>
              {filter}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Cell>
      <Cell label="icon, one at a time">
        <ToggleGroup variant="icon" aria-label="Text alignment" defaultValue="left">
          <AlignIcons />
        </ToggleGroup>
      </Cell>
      <Cell label="spring effect, one at a time">
        <ToggleGroup variant="outline" effect="spring" aria-label="Size" defaultValue="Small">
          {SIZES.map((size) => (
            <ToggleGroupItem key={size} value={size}>
              {size}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Cell>
      <Cell label="spring effect, several at once">
        <ToggleGroup type="multiple" variant="icon" effect="spring" aria-label="Formatting" defaultValue={["italic"]}>
          <FormatIcons />
        </ToggleGroup>
      </Cell>
    </div>
  )
}
