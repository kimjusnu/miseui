import { cn } from "@/registry/miseui/lib/utils"
import { PALETTES } from "@/src/lib/palettes"
import { usePalette } from "@/src/lib/use-palette"

/** Swatches take their colour from the palette itself, not the active theme, so all five stay visible. */
export function PalettePicker({ className }: { className?: string }) {
  const { palette, setPalette } = usePalette()

  return (
    <div role="radiogroup" aria-label="Colour palette" className={cn("flex items-center gap-1", className)}>
      {PALETTES.map((option) => {
        const selected = option.name === palette
        return (
          <button
            key={option.name}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`${option.title} palette. ${option.mood}`}
            title={option.title}
            onClick={() => setPalette(option.name)}
            className={cn(
              "grid size-7 place-items-center rounded-full outline-none transition-[scale,box-shadow] duration-(--duration-fast) ease-(--ease-mise) focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-90 active:duration-100",
              selected && "ring-[1.5px] ring-foreground/70",
            )}
          >
            <span className="size-4 rounded-full ring-1 ring-foreground/15" style={{ backgroundColor: option.light.mise }} />
          </button>
        )
      })}
    </div>
  )
}
