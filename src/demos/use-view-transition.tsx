import { useState } from "react"
import { useViewTransition, type ViewTransitionPreset } from "@/registry/miseui/hooks/use-view-transition"
import { Button } from "@/registry/miseui/ui/button"

const PRESETS: readonly ViewTransitionPreset[] = ["fade-through", "shared-axis-x", "shared-axis-y", "scale-up", "blur-in"]
const SCREENS = ["Inbox", "Thread", "Reply"] as const

export function Demo() {
  const [preset, setPreset] = useState<ViewTransitionPreset>("shared-axis-x")
  const [screen, setScreen] = useState(0)
  const transition = useViewTransition(preset)

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((name) => (
          <Button key={name} size="sm" variant={name === preset ? "default" : "outline"} onClick={() => setPreset(name)}>
            {name}
          </Button>
        ))}
      </div>
      <div className="rounded-2xl bg-background p-6 shadow-[0_8px_30px_-12px_rgb(0_0_0/0.25)]">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Screen {screen + 1}</p>
        <p className="text-title mt-1 text-2xl">{SCREENS[screen]}</p>
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" onClick={() => transition(() => setScreen((i) => (i + SCREENS.length - 1) % SCREENS.length))}>
          Back
        </Button>
        <Button variant="mise" onClick={() => transition(() => setScreen((i) => (i + 1) % SCREENS.length))}>
          Next
        </Button>
      </div>
    </div>
  )
}
