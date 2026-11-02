import { useState } from "react"
import { RotateCcw } from "lucide-react"
import { Button } from "@/registry/miseui/ui/button"
import { AspectRatio } from "@/registry/miseui/ui/aspect-ratio"

const SCENE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice">
  <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#20294a"/><stop offset="1" stop-color="#d8a26a"/></linearGradient></defs>
  <rect width="320" height="200" fill="url(#sky)"/>
  <circle cx="226" cy="118" r="34" fill="#f3c47f"/>
  <path d="M0 150C60 120 110 170 170 140S270 120 320 150V200H0Z" fill="#2b2f3a"/>
  <path d="M0 175C80 150 140 190 320 165V200H0Z" fill="#171a22"/>
</svg>`
const SRC = `data:image/svg+xml,${encodeURIComponent(SCENE_SVG)}`
const ALT = "Hills in front of a low sun"

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

export function Demo() {
  const [run, setRun] = useState(0)
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <Cell label="plain, 16:9">
        <AspectRatio>
          <img src={SRC} alt={ALT} />
        </AspectRatio>
      </Cell>
      <Cell label="framed, 4:3">
        <AspectRatio variant="framed" ratio={4 / 3} caption="Evening light over the ridge, late October.">
          <img src={SRC} alt={ALT} />
        </AspectRatio>
      </Cell>
      <Cell label="overlay, 16:9">
        <AspectRatio variant="overlay" caption="Three days on the ridge walk">
          <img src={SRC} alt={ALT} />
        </AspectRatio>
      </Cell>
      <Cell label="placeholder, 1:1">
        <AspectRatio variant="placeholder" ratio={1} className="max-w-48" />
      </Cell>
      <Cell label="reveal effect">
        <AspectRatio key={run} effect="reveal">
          <img src={`${SRC}#${run}`} alt={ALT} />
        </AspectRatio>
        <Button variant="ghost" size="sm" className="justify-self-start" onClick={() => setRun((current) => current + 1)}>
          <RotateCcw aria-hidden="true" />
          Load again
        </Button>
      </Cell>
    </div>
  )
}
