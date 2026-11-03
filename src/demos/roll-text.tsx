import { useEffect, useState } from "react"
import { Button } from "@/registry/miseui/ui/button"
import { RollText } from "@/registry/miseui/ui/roll-text"

const SAVE_LABEL = { idle: "Save changes", saving: "Saving", saved: "Saved" } as const
const SAVE_MS = 900

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start justify-items-start gap-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

function SaveButton() {
  const [state, setState] = useState<keyof typeof SAVE_LABEL>("idle")
  useEffect(() => {
    if (state === "idle") return
    const timer = window.setTimeout(() => setState(state === "saving" ? "saved" : "idle"), SAVE_MS)
    return () => window.clearTimeout(timer)
  }, [state])
  return (
    <Button variant="outline" disabled={state !== "idle"} onClick={() => setState("saving")}>
      <RollText text={SAVE_LABEL[state]} effect="change" />
    </Button>
  )
}

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <Cell label="word">
        <nav aria-label="Footer example" className="flex flex-wrap gap-x-4 gap-y-2 text-[15px] font-medium">
          {["Pricing", "Docs", "Changelog"].map((link) => (
            <a key={link} href="#roll-text" className="rounded-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
              <RollText text={link} />
            </a>
          ))}
        </nav>
      </Cell>
      <Cell label="letters, driven by the whole row">
        <a href="#roll-text" className="group flex w-full items-center justify-between gap-4 rounded-sm border-b py-3 text-xl font-semibold tracking-tight outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
          <RollText text="See the work" variant="letters" trigger="parent" />
          <span className="text-[13px] font-normal tracking-normal text-muted-foreground">12 projects</span>
        </a>
      </Cell>
      <Cell label="flip">
        <Button className="group">
          <RollText text="Start free" variant="flip" trigger="parent" />
        </Button>
      </Cell>
      <Cell label="change effect, press to save">
        <SaveButton />
      </Cell>
    </div>
  )
}
