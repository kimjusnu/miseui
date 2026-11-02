import type { ReactNode } from "react"
import { useState } from "react"
import { Resizable } from "@/registry/miseui/ui/resizable"

const THREADS = ["Quarterly invoice", "Seat change request", "Refund for March"] as const

function Design({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid min-w-0 content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

function ThreadList() {
  return (
    <ul className="grid gap-1 p-2 text-[13px]">
      {THREADS.map((thread, index) => (
        <li key={thread} className={index === 0 ? "truncate rounded-sm bg-accent px-2 py-1 font-medium" : "truncate px-2 py-1 text-muted-foreground"}>
          {thread}
        </li>
      ))}
    </ul>
  )
}

function Message() {
  return (
    <div className="grid gap-1 p-4">
      <p className="text-sm font-medium">Quarterly invoice</p>
      <p className="text-[13px] leading-5 text-muted-foreground">
        The invoice for the last quarter is ready. It covers twelve seats and the storage add-on.
      </p>
    </div>
  )
}

function Code({ text }: { text: string }) {
  return <pre className="p-4 font-mono text-[13px] leading-5 whitespace-pre-wrap text-muted-foreground">{text}</pre>
}

function SnapDemo() {
  const [size, setSize] = useState(35)
  const state = size <= 0 ? "List collapsed" : size >= 100 ? "Message collapsed" : `List takes ${Math.round(size)}%`
  return (
    <div className="grid gap-2">
      <Resizable
        effect="snap"
        variant="grip"
        size={size}
        min={20}
        max={80}
        defaultSize={35}
        onSizeChange={setSize}
        handleLabel="Resize thread list"
        className="h-48"
      >
        <ThreadList />
        <Message />
      </Resizable>
      <p aria-live="polite" className="text-[13px] text-muted-foreground tabular-nums">
        {state}. Flick the handle, or press Enter on it.
      </p>
    </div>
  )
}

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <Design label="line">
        <Resizable defaultSize={40} min={25} max={75} handleLabel="Resize thread list" className="h-48">
          <ThreadList />
          <Message />
        </Resizable>
      </Design>
      <Design label="grip, vertical">
        <Resizable variant="grip" direction="vertical" defaultSize={60} min={25} max={80} handleLabel="Resize terminal" className="h-48">
          <Code text="export const retries = 3" />
          <Code text="Build finished in 2.1 s" />
        </Resizable>
      </Design>
      <Design label="gap">
        <Resizable variant="gap" defaultSize={40} min={25} max={75} handleLabel="Resize cards" className="h-48">
          <ThreadList />
          <Message />
        </Resizable>
      </Design>
      <Design label="hidden, hover the seam">
        <Resizable variant="hidden" defaultSize={40} min={25} max={75} handleLabel="Resize thread list" className="h-48 bg-card">
          <ThreadList />
          <Message />
        </Resizable>
      </Design>
      <Design label="snap effect">
        <SnapDemo />
      </Design>
    </div>
  )
}
