import type * as React from "react"
import { Lens } from "@/registry/miseui/ui/lens"

const CONTOURS = [
  "M40 150C60 90 130 40 200 50s90 60 70 100-80 40-130 30-80-10-100-30Z",
  "M70 145c20-45 75-80 130-72s65 45 50 75-60 28-100 22-65-5-80-25Z",
  "M100 138c15-30 55-52 95-46s42 30 32 50-40 18-70 14-46-3-57-18Z",
  "M130 130c10-16 34-28 60-24s24 18 18 28-24 10-44 8-28-2-34-12Z",
]

const PLACES = [
  { x: 54, y: 62, name: "Old mill", note: "water all year" },
  { x: 182, y: 118, name: "Saddle", note: "412 m" },
  { x: 250, y: 40, name: "North lake", note: "no fires" },
  { x: 92, y: 176, name: "Car park", note: "12 spaces" },
]

function TrailMap() {
  return (
    <svg viewBox="0 0 320 200" role="img" aria-label="Trail map of the north valley" className="block h-auto w-full rounded-md bg-card text-muted-foreground">
      {CONTOURS.map((path) => (
        <path key={path} d={path} fill="none" stroke="currentColor" strokeOpacity="0.35" strokeWidth="0.6" />
      ))}
      <path d="M0 40C60 30 110 20 170 10" fill="none" stroke="var(--border)" strokeWidth="5" />
      <path d="M92 176c30-30 40-44 90-58s50-50 68-78" fill="none" stroke="var(--mise)" strokeWidth="1.2" strokeDasharray="3 2" />
      {PLACES.map((place) => (
        <g key={place.name}>
          <circle cx={place.x} cy={place.y} r="1.6" fill="var(--foreground)" />
          <text x={place.x + 4} y={place.y} fontSize="5.5" fill="var(--foreground)">
            {place.name}
          </text>
          <text x={place.x + 4} y={place.y + 5.5} fontSize="4" fill="currentColor">
            {place.note}
          </text>
        </g>
      ))}
    </svg>
  )
}

const READINGS = [12, 18, 15, 26, 22, 34, 30, 41, 38, 52, 47, 58]

function MiniChart() {
  const points = READINGS.map((value, index) => `${8 + index * 27},${160 - value * 2.4}`).join(" ")
  return (
    <svg viewBox="0 0 320 176" role="img" aria-label="Readings rising over twelve weeks" className="block h-auto w-full rounded-md bg-card text-muted-foreground">
      {[0, 1, 2, 3, 4].map((line) => (
        <line key={line} x1="8" x2="312" y1={24 + line * 34} y2={24 + line * 34} stroke="var(--border)" strokeWidth="0.5" />
      ))}
      <polyline points={points} fill="none" stroke="var(--mise)" strokeWidth="1.2" />
      {READINGS.map((value, index) => (
        <text key={index} x={8 + index * 27} y={155 - value * 2.4} fontSize="4.5" textAnchor="middle" fill="var(--foreground)">
          {value}
        </text>
      ))}
    </svg>
  )
}

function WatchFace() {
  return (
    <svg viewBox="0 0 200 200" role="img" aria-label="A watch face from the front" className="block aspect-square w-full rounded-md bg-card text-foreground">
      <circle cx="100" cy="100" r="78" fill="var(--background)" stroke="currentColor" strokeOpacity="0.3" />
      {Array.from({ length: 60 }, (_, tick) => (
        <line key={tick} x1="100" x2="100" y1="26" y2={tick % 5 === 0 ? 34 : 29} stroke="currentColor" strokeWidth={tick % 5 === 0 ? 1.2 : 0.4} transform={`rotate(${tick * 6} 100 100)`} />
      ))}
      <text x="100" y="66" fontSize="6" textAnchor="middle" fill="currentColor">
        hand wound
      </text>
      <text x="100" y="146" fontSize="3.6" textAnchor="middle" fill="currentColor">
        water resistant to 50 m
      </text>
      <line x1="100" x2="100" y1="100" y2="52" stroke="currentColor" strokeWidth="1.6" transform="rotate(50 100 100)" />
      <line x1="100" x2="100" y1="100" y2="64" stroke="currentColor" strokeWidth="2.2" transform="rotate(-60 100 100)" />
      <circle cx="100" cy="100" r="2.4" fill="var(--mise)" />
    </svg>
  )
}

function FinePrint() {
  return (
    <p className="text-[9px] leading-[14px] text-muted-foreground">
      The plan renews each year on the date you joined, unless you turn it off at least seven days before. A refund for unused months goes back to the card you paid with, within five working days. Prices
      can change once a year; we write to you thirty days before they do, and you may leave without a charge. Data stays yours: export it whenever you like, and we delete it thirty days after you close the
      account.
    </p>
  )
}

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <Cell label="circle: move over it, or Tab and use the arrows">
        <Lens variant="circle" defaultPoint={{ x: 0.6, y: 0.55 }}>
          <TrailMap />
        </Lens>
      </Cell>
      <Cell label="square: the loupe sits above the point it reads">
        <Lens variant="square" zoom={3} size={88} defaultPoint={{ x: 0.72, y: 0.42 }}>
          <MiniChart />
        </Lens>
      </Cell>
      <div className="min-w-0 sm:col-span-2">
        <Cell label="panel: the detail sits beside it, below it on a narrow screen">
          <Lens variant="panel" zoom={3} defaultPoint={{ x: 0.5, y: 0.32 }}>
            <WatchFace />
          </Lens>
        </Cell>
      </div>
      <Cell label="strip: a band for reading lines">
        <Lens variant="strip" zoom={1.75} size={56} defaultPoint={{ x: 0, y: 0.3 }}>
          <FinePrint />
        </Lens>
      </Cell>
      <Cell label="press effect: hold to look, a finger can drag it">
        <Lens variant="circle" effect="press" zoom={2.5}>
          <TrailMap />
        </Lens>
      </Cell>
    </div>
  )
}
