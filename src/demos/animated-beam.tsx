import type * as React from "react"
import { useRef, useState } from "react"
import { Bell, Calendar, CreditCard, Database, Inbox, Laptop, Mail, MessageSquare, Pause, Play, Send, Server } from "lucide-react"
import { Button } from "@/registry/miseui/ui/button"
import { AnimatedBeam, AnimatedBeamHub, type AnimatedBeamProps } from "@/registry/miseui/ui/animated-beam"
import { cn } from "@/registry/miseui/lib/utils"

const SOURCES = [
  { id: "payments", label: "Payments", icon: <CreditCard /> },
  { id: "email", label: "Email", icon: <Mail /> },
  { id: "calendar", label: "Calendar", icon: <Calendar /> },
  { id: "chat", label: "Chat", icon: <MessageSquare /> },
  { id: "alerts", label: "Alerts", icon: <Bell /> },
]

interface TileProps {
  tileRef: React.RefObject<HTMLDivElement | null>
  label: string
  children: React.ReactNode
  className?: string
}

function Tile({ tileRef, label, children, className }: TileProps) {
  return (
    <div className={cn("grid justify-items-center gap-1", className)}>
      <div ref={tileRef} className="flex size-10 items-center justify-center rounded-xl border bg-background shadow-sm [&_svg]:size-4">
        {children}
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

type PairProps = Pick<AnimatedBeamProps, "variant" | "effect" | "curvature" | "trigger" | "paused"> & {
  /** Sets the second tile lower, which is the case a curve or a step is for. */
  offset?: boolean
}

function Pair({ offset = false, ...beam }: PairProps) {
  const box = useRef<HTMLDivElement>(null)
  const from = useRef<HTMLDivElement>(null)
  const to = useRef<HTMLDivElement>(null)
  return (
    <div ref={box} className="relative isolate flex h-32 justify-between rounded-lg border p-4">
      <AnimatedBeam containerRef={box} fromRef={from} toRef={to} {...beam} />
      <Tile tileRef={from} label="Your laptop">
        <Laptop aria-hidden="true" />
      </Tile>
      <Tile tileRef={to} label={offset ? "Server" : "Database"} className={offset ? "self-end" : "self-start"}>
        {offset ? <Server aria-hidden="true" /> : <Database aria-hidden="true" />}
      </Tile>
    </div>
  )
}

function PauseButton({ paused, onToggle }: { paused: boolean; onToggle: () => void }) {
  return (
    <Button variant="outline" size="sm" className="pointer-coarse:h-10" aria-pressed={paused} onClick={onToggle}>
      {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
      {paused ? "Resume" : "Pause"}
    </Button>
  )
}

function PulseCell() {
  const [sent, setSent] = useState(0)
  return (
    <div className="grid gap-3">
      <Pair effect="pulse" trigger={sent} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] text-muted-foreground tabular-nums">{sent === 1 ? "1 backup sent" : `${sent} backups sent`}</p>
        <Button size="sm" className="pointer-coarse:h-10" onClick={() => setSent(sent + 1)}>
          <Send aria-hidden="true" />
          Send backup
        </Button>
      </div>
    </div>
  )
}

export function Demo() {
  const [paused, setPaused] = useState(false)
  return (
    <div className="grid gap-4">
      <div className="flex justify-end">
        <PauseButton paused={paused} onToggle={() => setPaused(!paused)} />
      </div>
      <div className="grid gap-8 sm:grid-cols-2">
        <div className="grid min-w-0 content-start gap-2">
          <p className="text-xs text-muted-foreground">line</p>
          <Pair paused={paused} />
        </div>
        <div className="grid min-w-0 content-start gap-2">
          <p className="text-xs text-muted-foreground">curve</p>
          <Pair variant="curve" offset curvature={-24} paused={paused} />
        </div>
        <div className="grid min-w-0 content-start gap-2">
          <p className="text-xs text-muted-foreground">step</p>
          <Pair variant="step" offset paused={paused} />
        </div>
        <div className="grid min-w-0 content-start gap-2">
          <p className="text-xs text-muted-foreground">hub: stacked here, lying down when there is room</p>
          <div className="rounded-lg border p-4">
            <AnimatedBeamHub label="Five sources feeding the inbox" sources={SOURCES} center={{ id: "inbox", label: "Inbox", icon: <Inbox /> }} paused={paused} />
          </div>
        </div>
        <div className="grid min-w-0 content-start gap-2 sm:col-span-2">
          <p className="text-xs text-muted-foreground">line, pulse effect: one light per real event</p>
          <PulseCell />
        </div>
      </div>
    </div>
  )
}
