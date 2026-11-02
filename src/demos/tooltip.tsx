import { Button } from "@/registry/miseui/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/registry/miseui/ui/tooltip"

export function Demo() {
  return (
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
  )
}
