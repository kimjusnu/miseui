import type * as React from "react"
import { useRef } from "react"
import { Compass, Home, Map as MapIcon, NotebookPen, Search, UserRound } from "lucide-react"
import { Button } from "@/registry/miseui/ui/button"
import { FloatingNav, type FloatingNavProps } from "@/registry/miseui/ui/floating-nav"

const ITEMS: FloatingNavProps["items"] = [
  { value: "home", label: "Home", icon: <Home /> },
  { value: "notes", label: "Notes", icon: <NotebookPen /> },
  { value: "map", label: "Map", icon: <MapIcon /> },
  { value: "about", label: "About", icon: <UserRound /> },
]

const PARAGRAPHS = [
  "We left the car at the last gravel turn and walked the old rail bed north. The ties are long gone, but the grade still holds, flat as a table through the birches.",
  "By noon the valley opened and the wind came up off the water. Keep a layer in the top of your pack on this stretch, even in August.",
  "The bridge at the second lake is sound, though the east rail is loose. There is clean water just past it and a good flat place for lunch.",
  "From there the path climbs for an hour. It is not hard, only long, and the view at the saddle pays for all of it.",
  "We came down the south side in the last of the light, with the lake gone copper and nobody else on the hill.",
]

function Article() {
  return (
    <article className="grid gap-3 px-4 pt-4 pb-24">
      <h3 className="text-[15px] font-medium text-foreground">Two days on the old rail bed</h3>
      {PARAGRAPHS.map((text) => (
        <p key={text} className="text-[13px] leading-5 text-muted-foreground">
          {text}
        </p>
      ))}
    </article>
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

/** The nav scrolls with the article and sticks, as it would at the top of a real page. */
function StickyFrame(props: Partial<FloatingNavProps>) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  return (
    <div ref={scrollerRef} role="region" tabIndex={0} aria-label="Article" className="relative h-64 overflow-y-auto rounded-lg border bg-background pt-2 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
      <FloatingNav label="Trail notes" items={ITEMS} position="sticky" scrollContainer={scrollerRef} {...props} />
      <Article />
    </div>
  )
}

/** The article scrolls under a bar pinned to the frame, as a phone screen does. */
function PhoneFrame(props: Partial<FloatingNavProps>) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  return (
    <div className="relative h-64 overflow-hidden rounded-lg border bg-background">
      <div ref={scrollerRef} role="region" tabIndex={0} aria-label="Article" className="h-full overflow-y-auto outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset">
        <Article />
      </div>
      <FloatingNav label="Trail notes" items={ITEMS} variant="tabs" position="absolute" scrollContainer={scrollerRef} {...props} />
    </div>
  )
}

function BarFrame() {
  const scrollerRef = useRef<HTMLDivElement>(null)
  return (
    <div ref={scrollerRef} role="region" tabIndex={0} aria-label="Article" className="relative h-64 overflow-y-auto rounded-lg border bg-background outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
      <FloatingNav
        label="Trail notes"
        items={ITEMS.slice(1)}
        defaultValue="notes"
        variant="bar"
        position="sticky"
        scrollContainer={scrollerRef}
        brand={<Compass aria-label="Trail notes" className="size-5" />}
        actions={
          <Button variant="ghost" size="icon" className="size-10 rounded-full" aria-label="Search">
            <Search aria-hidden="true" />
          </Button>
        }
      />
      <Article />
    </div>
  )
}

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <Cell label="pill: press a link">
        <StickyFrame variant="pill" />
      </Cell>
      <Cell label="island: press the capsule, Escape closes">
        <StickyFrame variant="island" />
      </Cell>
      <Cell label="bar: scroll the box, it shrinks into a pill">
        <BarFrame />
      </Cell>
      <Cell label="tabs, for phones">
        <PhoneFrame />
      </Cell>
      <Cell label="hide effect: scroll down, then back up">
        <StickyFrame variant="pill" effect="hide" />
      </Cell>
      <Cell label="hide effect on tabs">
        <PhoneFrame effect="hide" />
      </Cell>
    </div>
  )
}
