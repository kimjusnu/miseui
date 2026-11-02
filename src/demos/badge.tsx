import type * as React from "react"
import { useState } from "react"
import { Badge } from "@/registry/miseui/ui/badge"
import { Button } from "@/registry/miseui/ui/button"

const START_COUNT = 8

function Labeled({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-2">
      <span className="font-mono text-xs text-muted-foreground">{name}</span>
      {children}
    </div>
  )
}

export function Demo() {
  const [count, setCount] = useState(START_COUNT)
  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge>Default</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="outline">Outline</Badge>
        <Badge variant="destructive">Failed</Badge>
        <Badge variant="mise">New</Badge>
        <Badge asChild variant="outline">
          <a href="#changelog">v0.2</a>
        </Badge>
      </div>
      <div className="flex w-full flex-wrap items-end gap-5">
        <Labeled name="glow">
          <Badge effect="glow" variant="outline">
            New model
          </Badge>
        </Labeled>
        <Labeled name="beam">
          <Badge effect="beam" variant="outline">
            Syncing
          </Badge>
        </Labeled>
        <Labeled name="live">
          <Badge effect="live" variant="outline">
            Recording
          </Badge>
        </Labeled>
        <Labeled name="count">
          <div className="flex items-center gap-2">
            <Badge effect="count" variant="mise">
              {count}
            </Badge>
            <Button variant="outline" size="sm" onClick={() => setCount((value) => value + 1)}>
              Add one
            </Button>
          </div>
        </Labeled>
      </div>
    </div>
  )
}
