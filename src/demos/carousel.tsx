import { Carousel, type CarouselItem } from "@/registry/miseui/ui/carousel"

/** Drawn from theme tokens so the demo needs no image files and follows the theme. */
function Scene({ ridge, peak }: { ridge: string; peak: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" className="size-full bg-muted">
      <circle cx="240" cy="48" r="20" className="fill-mise" />
      <path d={peak} className="fill-border" />
      <path d={ridge} className="fill-mise-soft" />
    </svg>
  )
}

const SCENES = [
  { id: "harbour", label: "Harbour at dawn", ridge: "M0 140 Q80 100 160 136 T320 120 V180 H0Z", peak: "M0 110 L70 60 L140 112 L210 70 L320 118 V180 H0Z" },
  { id: "ridge", label: "Ridge walk", ridge: "M0 120 Q120 150 200 110 T320 136 V180 H0Z", peak: "M0 90 L110 40 L190 100 L260 64 L320 92 V180 H0Z" },
  { id: "valley", label: "Valley road", ridge: "M0 150 Q60 120 150 150 T320 140 V180 H0Z", peak: "M0 70 L60 110 L150 50 L240 104 L320 60 V180 H0Z" },
  { id: "coast", label: "Coast path", ridge: "M0 130 Q100 160 180 130 T320 150 V180 H0Z", peak: "M0 120 L90 80 L170 124 L250 88 L320 110 V180 H0Z" },
] as const

const PHOTOS: readonly CarouselItem[] = SCENES.map((scene) => ({
  id: scene.id,
  label: scene.label,
  media: <Scene ridge={scene.ridge} peak={scene.peak} />,
  thumbnail: <Scene ridge={scene.ridge} peak={scene.peak} />,
}))

function Note({ title, body }: { title: string; body: string }) {
  return (
    <div className="grid h-full min-h-32 content-center gap-1 p-4">
      <p className="text-[15px] font-medium">{title}</p>
      <p className="text-sm text-muted-foreground">{body}</p>
    </div>
  )
}

const NOTES: readonly CarouselItem[] = [
  { id: "drafts", label: "Saved drafts", content: <Note title="Saved drafts" body="Pick up where you left off, on any device." /> },
  { id: "review", label: "Review together", content: <Note title="Review together" body="Comments stay beside the line they are about." /> },
  { id: "publish", label: "Publish when ready", content: <Note title="Publish when ready" body="Schedule it, or send it to one person first." /> },
]

const PASSES: readonly CarouselItem[] = [
  { id: "seoul", label: "Seoul to Busan", content: <Note title="Seoul to Busan" body="KTX 113, car 8, seat 12A. Boards at 09:30." /> },
  { id: "busan", label: "Busan to Gyeongju", content: <Note title="Busan to Gyeongju" body="Bus 1100, seat 5. Boards at 14:10." /> },
  { id: "return", label: "Gyeongju to Seoul", content: <Note title="Gyeongju to Seoul" body="KTX 240, car 3, seat 7C. Boards at 18:05." /> },
]

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <div className="grid min-w-0 content-start gap-2">
        <p className="text-xs text-muted-foreground">plain</p>
        <Carousel label="Product notes" items={NOTES} />
      </div>
      <div className="grid min-w-0 content-start gap-2">
        <p className="text-xs text-muted-foreground">peek, parallax effect</p>
        <Carousel label="Trip photos" items={PHOTOS} variant="peek" effect="parallax" />
      </div>
      <div className="grid min-w-0 content-start gap-2">
        <p className="text-xs text-muted-foreground">cards</p>
        <Carousel label="Travel passes" items={PASSES} variant="cards" />
      </div>
      <div className="grid min-w-0 content-start gap-2">
        <p className="text-xs text-muted-foreground">thumbnails</p>
        <Carousel label="Gallery" items={PHOTOS} variant="thumbnails" />
      </div>
      <div className="grid min-w-0 content-start gap-2 sm:col-span-2">
        <p className="text-xs text-muted-foreground">autoplay, pauses on hover and focus, wraps at the end</p>
        <Carousel label="Announcements" items={NOTES} autoplay loop interval={5000} />
      </div>
    </div>
  )
}
