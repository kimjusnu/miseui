import { Bold, Italic, Star, Underline, VolumeX } from "lucide-react"
import { Toggle } from "@/registry/miseui/ui/toggle"

const FILL_WHEN_ON = "data-[state=on]:[&_svg]:fill-current"
const FILTERS = ["Remote", "Full time", "Senior", "Visa support"] as const

function DemoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  )
}

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <DemoRow label="plain">
        <Toggle aria-label="Bold" defaultPressed>
          <Bold />
        </Toggle>
        <Toggle aria-label="Italic">
          <Italic />
        </Toggle>
        <Toggle aria-label="Underline">
          <Underline />
        </Toggle>
      </DemoRow>
      <DemoRow label="outline">
        <Toggle variant="outline" defaultPressed>
          Show archived
        </Toggle>
        <Toggle variant="outline" disabled>
          Show drafts
        </Toggle>
      </DemoRow>
      <DemoRow label="pill">
        {FILTERS.map((filter, index) => (
          <Toggle key={filter} variant="pill" defaultPressed={index === 0}>
            {filter}
          </Toggle>
        ))}
      </DemoRow>
      <DemoRow label="icon">
        <Toggle variant="icon" aria-label="Favourite" defaultPressed className={FILL_WHEN_ON}>
          <Star />
        </Toggle>
        <Toggle variant="icon" aria-label="Mute">
          <VolumeX />
        </Toggle>
      </DemoRow>
      <DemoRow label="pop effect">
        <Toggle variant="icon" effect="pop" aria-label="Save to favourites" className={FILL_WHEN_ON}>
          <Star />
        </Toggle>
        <Toggle variant="pill" effect="pop">
          Notify me
        </Toggle>
      </DemoRow>
    </div>
  )
}
