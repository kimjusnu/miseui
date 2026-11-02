import { useState } from "react"
import { Pause, Play } from "lucide-react"
import { Button } from "@/registry/miseui/ui/button"
import { Marquee, MarqueeItem } from "@/registry/miseui/ui/marquee"

const RELEASES = ["Dark mode", "Faster search", "CSV export", "Keyboard shortcuts", "Shared views", "Audit log"] as const
/** The tools this kit is really built on, so nothing here pretends to be a customer. */
const STACK = ["React", "Tailwind CSS", "Radix", "Motion", "Vite", "Vitest"] as const
const NOTES = [
  { title: "Dark mode", body: "Every screen now follows your system setting." },
  { title: "CSV export", body: "Download any table with the filters you set." },
  { title: "Audit log", body: "See who changed what, kept for a full year." },
  { title: "Shared views", body: "Send a filtered list by link to your team." },
] as const

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

function Note({ title, body }: { title: string; body: string }) {
  return (
    <MarqueeItem>
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-[13px] leading-5 text-muted-foreground">{body}</p>
    </MarqueeItem>
  )
}

function WithPauseButton() {
  const [paused, setPaused] = useState(false)
  return (
    <div className="grid gap-2">
      <Marquee aria-label="Recent releases" paused={paused} reverse duration={24}>
        {RELEASES.map((release) => (
          <MarqueeItem key={release}>{release}</MarqueeItem>
        ))}
      </Marquee>
      <Button variant="ghost" size="sm" className="justify-self-start" onClick={() => setPaused((current) => !current)}>
        {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
        {paused ? "Play" : "Pause"}
      </Button>
    </div>
  )
}

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <Cell label="plain">
        <Marquee aria-label="Recent releases">
          {RELEASES.map((release) => (
            <MarqueeItem key={release}>{release}</MarqueeItem>
          ))}
        </Marquee>
      </Cell>
      <Cell label="fade">
        <Marquee variant="fade" aria-label="Recent releases" duration={36}>
          {RELEASES.map((release) => (
            <MarqueeItem key={release}>{release}</MarqueeItem>
          ))}
        </Marquee>
      </Cell>
      <Cell label="cards">
        <Marquee variant="cards" aria-label="Release notes" duration={40}>
          {NOTES.map((note) => (
            <Note key={note.title} {...note} />
          ))}
        </Marquee>
      </Cell>
      <Cell label="logos, text only">
        <Marquee variant="logos" aria-label="Built with" duration={36}>
          {STACK.map((tool) => (
            <MarqueeItem key={tool}>{tool}</MarqueeItem>
          ))}
        </Marquee>
      </Cell>
      <Cell label="vertical cards">
        <Marquee variant="cards" vertical aria-label="Release notes" duration={28} className="h-64">
          {NOTES.map((note) => (
            <Note key={note.title} {...note} />
          ))}
        </Marquee>
      </Cell>
      <Cell label="reverse, with a pause button">
        <WithPauseButton />
      </Cell>
    </div>
  )
}
