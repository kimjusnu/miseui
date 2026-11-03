import { rawIndexAt } from "@/registry/miseui/ui/mask-input-edit"
import { activeGroupIndex, maskGroups, type MaskSlot } from "@/registry/miseui/ui/mask-input-math"
import { cn } from "@/registry/miseui/lib/utils"

const BOX_CLASS = [
  "flex min-w-0 items-center justify-center rounded-md border border-input bg-transparent shadow-xs tabular-nums",
  "transition-[border-color,box-shadow] duration-(--duration-fast) ease-(--ease-mise)",
  "data-[active=true]:border-ring data-[active=true]:ring-[3px] data-[active=true]:ring-ring/50",
  "group-data-[invalid=true]/mask:border-destructive",
]

/** Quiet marks for what is still to fill, so the box shows how much it wants. */
const EMPTY_MARK = "•"

interface BoxesProps {
  raw: string
  slots: readonly MaskSlot[]
  caret: number
  focused: boolean
  maskedLength: number
}

function GroupBoxes({ raw, slots, caret, focused, maskedLength }: BoxesProps) {
  const groups = maskGroups(raw, slots)
  const activeIndex = focused ? activeGroupIndex(groups, caret, maskedLength) : -1
  return (
    <div aria-hidden="true" className="grid h-9 gap-2 pointer-coarse:h-10" style={{ gridTemplateColumns: groups.map((group) => `minmax(0,${group.size}fr)`).join(" ") }}>
      {groups.map((group, index) => (
        <span
          key={group.start}
          data-slot="mask-input-group"
          data-active={index === activeIndex ? "true" : "false"}
          // Where the caret goes when this box is pressed: the end of what is already typed in it.
          data-caret={Math.min(group.start + group.text.length, maskedLength)}
          className={cn(BOX_CLASS, "overflow-hidden text-sm")}
        >
          <span className="truncate">
            {group.text}
            <span className="text-muted-foreground/60">{EMPTY_MARK.repeat(group.size - group.text.length)}</span>
          </span>
        </span>
      ))}
    </div>
  )
}

function CharacterBoxes({ raw, slots, caret, focused, maskedLength }: BoxesProps) {
  const characters = Array.from(raw)
  const caretRaw = rawIndexAt(caret, slots)
  const capacityLeft = characters.length < slots.filter((slot) => slot.kind === "token").length
  return (
    <div aria-hidden="true" className="flex min-w-0 items-center gap-1">
      {slots.map((slot, position) => {
        if (slot.kind === "literal") {
          // A space is only a gap here, while a dash or slash is part of how the value reads.
          return (
            <span key={position} data-slot="mask-input-literal" className="flex w-2 shrink-0 justify-center text-sm text-muted-foreground">
              {slot.character.trim()}
            </span>
          )
        }
        const index = rawIndexAt(position, slots)
        const active = focused && (caretRaw === index || (!capacityLeft && index === characters.length - 1))
        return (
          <span
            key={position}
            data-slot="mask-input-cell"
            data-active={active ? "true" : "false"}
            data-caret={Math.min(position + 1, maskedLength)}
            className={cn(BOX_CLASS, "h-10 flex-1 basis-8 text-sm font-medium")}
          >
            {characters[index] ?? ""}
          </span>
        )
      })}
    </div>
  )
}

/** The real input lies invisibly over the boxes, so the browser places its caret by text it cannot see. This corrects it to the box that was pressed. */
function caretFromBoxes(root: HTMLElement, clientX: number) {
  const boxes = Array.from(root.querySelectorAll<HTMLElement>("[data-caret]"))
  const pressed = boxes.find((box) => {
    const { left, right } = box.getBoundingClientRect()
    return clientX >= left && clientX <= right
  })
  return pressed ? Number(pressed.dataset.caret) : null
}

export { CharacterBoxes, GroupBoxes, caretFromBoxes }
