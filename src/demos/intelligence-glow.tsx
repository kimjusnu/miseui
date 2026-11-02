import { useEffect, useState } from "react"
import { Button } from "@/registry/miseui/ui/button"
import { IntelligenceGlow } from "@/registry/miseui/ui/intelligence-glow"

const SCREEN_GLOW_MS = 3000

export function Demo() {
  const [panelActive, setPanelActive] = useState(true)
  const [screenActive, setScreenActive] = useState(false)

  useEffect(() => {
    if (!screenActive) return
    const id = window.setTimeout(() => setScreenActive(false), SCREEN_GLOW_MS)
    return () => window.clearTimeout(id)
  }, [screenActive])

  return (
    <div className="flex w-full flex-col items-start gap-4">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => setPanelActive((value) => !value)}>
          {panelActive ? "Stop listening" : "Listen"}
        </Button>
        <Button variant="outline" size="sm" onClick={() => setScreenActive(true)}>
          Light the screen for {SCREEN_GLOW_MS / 1000} s
        </Button>
      </div>
      <div className="relative w-full max-w-sm rounded-2xl bg-background p-5">
        <IntelligenceGlow active={panelActive} inset intensity={0.7} />
        <p className="text-[15px] font-medium">{panelActive ? "Listening…" : "Ready"}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          The light lives on the edge, so it stays in view wherever you look.
        </p>
      </div>
      <IntelligenceGlow active={screenActive} />
    </div>
  )
}
