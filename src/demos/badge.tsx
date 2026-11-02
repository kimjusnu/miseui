import { Badge } from "@/registry/miseui/ui/badge"

export function Demo() {
  return (
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
  )
}
