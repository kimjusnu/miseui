import { BookOpen, Bug, CalendarCheck, Eye, HeartHandshake, Rocket } from "lucide-react"
import { RingGallery, type RingGalleryEntry, type RingGalleryVariant } from "@/registry/miseui/ui/ring-gallery"

const ICON_CLASS = "size-6 shrink-0"

const ITEMS: readonly RingGalleryEntry[] = [
  { id: "first", label: "First deploy", detail: "Shipped to production", media: <Rocket aria-hidden="true" className={ICON_CLASS} /> },
  { id: "review", label: "Ten reviews", detail: "Reviewed ten changes", media: <Eye aria-hidden="true" className={ICON_CLASS} /> },
  { id: "streak", label: "Thirty days", detail: "A month without a missed day", media: <CalendarCheck aria-hidden="true" className={ICON_CLASS} /> },
  { id: "mentor", label: "Mentor", detail: "Helped a new teammate settle in", media: <HeartHandshake aria-hidden="true" className={ICON_CLASS} /> },
  { id: "bugs", label: "Bug hunter", detail: "Closed fifty bugs", media: <Bug aria-hidden="true" className={ICON_CLASS} /> },
  { id: "docs", label: "Docs hero", detail: "Wrote the setup guide", media: <BookOpen aria-hidden="true" className={ICON_CLASS} /> },
]

const VARIANTS: readonly RingGalleryVariant[] = ["ring", "medallion", "cylinder"]

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      {VARIANTS.map((variant) => (
        <div key={variant} className="grid min-w-0 content-start gap-2">
          <p className="text-xs text-muted-foreground">{variant}</p>
          <RingGallery label={`Badges, ${variant}`} items={ITEMS} variant={variant} />
        </div>
      ))}
      <div className="grid min-w-0 content-start gap-2">
        <p className="text-xs text-muted-foreground">momentum effect, flick it</p>
        <RingGallery label="Badges, momentum" items={ITEMS} variant="medallion" effect="momentum" defaultIndex={2} />
      </div>
    </div>
  )
}
