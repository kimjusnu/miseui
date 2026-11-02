import type * as React from "react"
import { useState } from "react"
import { ArrowRight } from "lucide-react"
import { Button } from "@/registry/miseui/ui/button"

function Labeled({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-1.5">
      <span className="font-mono text-xs text-muted-foreground">{name}</span>
      {children}
    </div>
  )
}

export function Demo() {
  const [loading, setLoading] = useState(true)
  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="mise">
          Continue <ArrowRight />
        </Button>
        <Button>Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Delete</Button>
        <Button variant="link">Link</Button>
      </div>
      <div className="flex w-full flex-wrap items-end gap-4">
        <Labeled name="liquid">
          <Button effect="liquid">Continue</Button>
        </Labeled>
        <Labeled name="beam">
          <Button effect="beam" variant="outline">
            Generate
          </Button>
        </Labeled>
        <Labeled name="magnetic">
          <Button effect="magnetic" variant="mise">
            Hover me
          </Button>
        </Labeled>
        <Labeled name="shimmer">
          <div className="flex flex-wrap items-center gap-2">
            <Button effect={loading ? "shimmer" : undefined} disabled={loading}>
              {loading ? "Saving…" : "Save"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setLoading((value) => !value)}>
              {loading ? "Finish" : "Start"}
            </Button>
          </div>
        </Labeled>
      </div>
    </div>
  )
}
