import { ArrowRight } from "lucide-react"
import { Button } from "@/registry/miseui/ui/button"

export function Demo() {
  return (
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
  )
}
