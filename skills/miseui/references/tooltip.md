# Tooltip

One-line hint that appears on hover or focus with no delay and leaves with the pointer, for detail that does not deserve screen space.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/tooltip.json
```

## Why it looks like this

**Progressive disclosure.** Screens stay calm when secondary detail is hidden until someone asks for it. The tooltip opens the instant the pointer or keyboard focus lands, says one thing, and leaves when the pointer does, so the user gets the hint exactly when curiosity strikes and never has to dismiss it.

**Don't.** Never put essential instructions, links or buttons in a tooltip: touch users cannot hover and screen readers only hear it as a description. If the text is needed to finish the task, put it on the page.

## Effects

Pass one as the `effect` prop.

- `materialize` (Spatial continuity): Use it for occasional hints on sparse toolbars; on a row of icons people sweep across, the plain tooltip gets out of the way sooner.

## Usage

```tsx
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"

<Tooltip>
  <TooltipTrigger asChild>
    <Button variant="outline">Save</Button>
  </TooltipTrigger>
  <TooltipContent>Saves the draft without publishing</TooltipContent>
</Tooltip>

// <TooltipContent effect="materialize"> grows the hint out of its trigger with scale, blur and opacity together.
```

Exports: `Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider`
