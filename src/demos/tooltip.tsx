import { Button } from "@/registry/miseui/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/registry/miseui/ui/tooltip"

export function Demo() {
  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline">Hover or focus me</Button>
          </TooltipTrigger>
          <TooltipContent>Saves the draft without publishing</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost">Below</Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Opens on the side you ask for</TooltipContent>
        </Tooltip>
      </div>
      <div className="grid justify-items-start gap-1.5">
        <p className="text-xs text-muted-foreground">materialize</p>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline">Hover me</Button>
          </TooltipTrigger>
          <TooltipContent effect="materialize">Grows out of this button</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}
