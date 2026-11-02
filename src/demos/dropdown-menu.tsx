import { Button } from "@/registry/miseui/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
  type DropdownMenuEffect,
} from "@/registry/miseui/ui/dropdown-menu"

const EFFECTS: readonly DropdownMenuEffect[] = ["materialize", "spring"]

export function Demo() {
  return (
    <div className="grid justify-items-start gap-6">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">Actions</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuLabel>Project</DropdownMenuLabel>
          <DropdownMenuGroup>
            <DropdownMenuItem>
              Rename <DropdownMenuShortcut>R</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>
              Duplicate <DropdownMenuShortcut>D</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>Move to folder</DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <div className="flex flex-wrap gap-4">
        {EFFECTS.map((effect) => (
          <div key={effect} className="grid justify-items-start gap-1.5">
            <p className="text-xs text-muted-foreground">{effect}</p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Open</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44" effect={effect}>
                <DropdownMenuItem>Rename</DropdownMenuItem>
                <DropdownMenuItem>Duplicate</DropdownMenuItem>
                <DropdownMenuItem>Move to folder</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>
    </div>
  )
}
