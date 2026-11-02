import { useEffect, useState } from "react"
import { Button } from "@/registry/miseui/ui/button"
import { GooeyMorph } from "@/registry/miseui/ui/gooey-morph"

const ITEMS = [
  { id: "plan", label: "Plan" },
  { id: "search", label: "Search" },
  { id: "write", label: "Write" },
] as const
const TOGGLE_MS = 2200
const DOT_PX = 18
const GAP_PX = 14

export function Demo() {
  const [merged, setMerged] = useState(false)
  const [cycling, setCycling] = useState(true)

  useEffect(() => {
    if (!cycling) return
    const id = window.setInterval(() => setMerged((value) => !value), TOGGLE_MS)
    return () => window.clearInterval(id)
  }, [cycling])

  const toggle = () => {
    setCycling(false)
    setMerged((value) => !value)
  }

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <GooeyMorph items={ITEMS} merged={merged} size={DOT_PX} gap={GAP_PX} />
      <p className="text-sm text-muted-foreground">{merged ? "One summary" : "Three steps"}</p>
      <Button variant="outline" size="sm" onClick={toggle}>
        {merged ? "Split" : "Merge"}
      </Button>
    </div>
  )
}
