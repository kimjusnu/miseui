import type * as React from "react"
import { useRef } from "react"
import { Input } from "@/registry/miseui/ui/input"
import { caretFromBoxes, CharacterBoxes, GroupBoxes } from "@/registry/miseui/ui/mask-input-boxes"
import { isComplete, isNumericMask, placeholderFor } from "@/registry/miseui/ui/mask-input-math"
import { useMaskState, type MaskStateOptions } from "@/registry/miseui/ui/mask-input-state"
import { cn } from "@/registry/miseui/lib/utils"

type MaskInputVariant = "plain" | "grouped" | "compact" | "otp-like"

type MaskInputProps = Omit<React.ComponentProps<"input">, "value" | "defaultValue" | "type" | "onChange"> &
  MaskStateOptions & {
    /** `plain` one field, `grouped` one box per group, `compact` a small field sized to the mask, `otp-like` one box per character. */
    variant?: MaskInputVariant
  }

function MaskInput({ mask, tokens, value, defaultValue, onValueChange, onComplete, variant = "plain", name, placeholder, className, style, "aria-invalid": ariaInvalid, ...props }: MaskInputProps) {
  const state = useMaskState({ mask, tokens, value, defaultValue, onValueChange, onComplete })
  const rootRef = useRef<HTMLDivElement>(null)
  const boxed = variant === "grouped" || variant === "otp-like"
  const attributes = {
    "data-slot": "mask-input-field",
    value: state.masked,
    type: "text",
    inputMode: isNumericMask(state.slots) ? ("numeric" as const) : undefined,
    autoComplete: "off",
    spellCheck: false,
    "aria-invalid": ariaInvalid,
    ...state.handlers,
    ...props,
  }
  const onPress = (event: React.MouseEvent<HTMLInputElement>) => {
    const position = rootRef.current ? caretFromBoxes(rootRef.current, event.clientX) : null
    if (position !== null) state.moveCaret(event.currentTarget, position)
  }
  const boxProps = { raw: state.raw, slots: state.slots, caret: state.caret, focused: state.focused, maskedLength: state.masked.length }
  return (
    <div
      ref={rootRef}
      data-slot="mask-input"
      data-variant={variant}
      data-complete={isComplete(state.raw, state.slots) ? "true" : "false"}
      data-invalid={ariaInvalid ? "true" : undefined}
      className={cn("group/mask relative min-w-0", variant === "compact" ? "inline-block max-w-full" : "w-full", className)}
    >
      {/* The server wants the raw value; the visible field holds the formatted one. */}
      {name ? <input type="hidden" name={name} value={state.raw} /> : null}
      {variant === "grouped" ? <GroupBoxes {...boxProps} /> : null}
      {variant === "otp-like" ? <CharacterBoxes {...boxProps} /> : null}
      {boxed ? (
        // Sits over the boxes and stays invisible: clicks, long-press paste and autofill all reach the real field.
        <input {...attributes} className="absolute inset-0 size-full cursor-text text-base opacity-0 outline-none disabled:cursor-not-allowed" onClick={onPress} />
      ) : (
        <Input
          {...attributes}
          placeholder={placeholder ?? placeholderFor(state.slots)}
          style={variant === "compact" ? { ...style, width: `calc(${state.slots.length}ch + 20px)` } : style}
          className={cn("tabular-nums", variant === "compact" && "h-8 max-w-full rounded-sm px-2 text-base pointer-coarse:h-10 md:text-[13px]")}
        />
      )}
    </div>
  )
}

export { MaskInput, type MaskInputProps, type MaskInputVariant }
