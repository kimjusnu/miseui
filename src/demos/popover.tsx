import { Button } from "@/registry/miseui/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/registry/miseui/ui/popover"

export function Demo() {
  return (
    <div className="grid justify-items-start gap-6">
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
      <div className="grid justify-items-start gap-1.5">
        <p className="text-xs text-muted-foreground">materialize</p>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">Filters</Button>
          </PopoverTrigger>
          <PopoverContent align="start" effect="materialize" className="w-64 text-sm text-muted-foreground">
            Open issues assigned to you, newest first.
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
