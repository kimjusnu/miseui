import { Button } from "@/registry/miseui/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/registry/miseui/ui/popover"

export function Demo() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Share</Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="flex flex-col gap-2">
        <p className="text-sm font-medium">Anyone with the link</p>
        <p className="text-sm text-muted-foreground">
          Viewers can read and comment. Editing stays with the three people on this project.
        </p>
        <Button size="sm" className="self-start">
          Copy link
        </Button>
      </PopoverContent>
    </Popover>
  )
}
