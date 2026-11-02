import type * as React from "react"
import { createContext, useContext, useId, useMemo, useState } from "react"
import { RadioGroup as RadioGroupPrimitive } from "radix-ui"
import { LayoutGroup, useReducedMotion } from "motion/react"
import {
  ITEM_BASE_CLASS,
  ITEM_CLASS,
  ItemText,
  PLAIN_LABEL_CLASS,
  RadioIndicator,
  ROOT_CLASS,
  SelectionCheck,
  type RadioGroupVariant,
} from "@/registry/miseui/ui/radio-group-parts"
import { cn } from "@/registry/miseui/lib/utils"

type RadioGroupEffect = "spring"

interface RadioGroupContextValue {
  variant: RadioGroupVariant
  value: string | null | undefined
  animated: boolean
  reduceMotion: boolean
}

const RadioGroupContext = createContext<RadioGroupContextValue>({
  variant: "plain",
  value: undefined,
  animated: false,
  reduceMotion: false,
})

type RadioGroupProps = React.ComponentProps<typeof RadioGroupPrimitive.Root> & {
  /** `plain` dots, `card` selectable surfaces, `segmented` joined buttons, `list` rows with a trailing check. */
  variant?: RadioGroupVariant
  /** `spring` slides one selection indicator between the options. */
  effect?: RadioGroupEffect
}

function RadioGroup({
  variant = "plain",
  effect,
  className,
  value,
  defaultValue,
  onValueChange,
  ...props
}: RadioGroupProps) {
  // layoutId is global to the page; without a per-instance group two groups would fight over one indicator.
  const groupId = useId()
  const reduceMotion = useReducedMotion() ?? false
  const [uncontrolled, setUncontrolled] = useState<string | null | undefined>(defaultValue)
  const current = value !== undefined ? value : uncontrolled
  const animated = effect === "spring" && !reduceMotion
  const context = useMemo(
    () => ({ variant, value: current, animated, reduceMotion }),
    [variant, current, animated, reduceMotion],
  )

  return (
    <RadioGroupContext.Provider value={context}>
      <LayoutGroup id={groupId}>
        <RadioGroupPrimitive.Root
          data-slot="radio-group"
          data-variant={variant}
          data-effect={effect}
          className={cn(ROOT_CLASS[variant], className)}
          value={value}
          defaultValue={defaultValue}
          onValueChange={(next) => {
            setUncontrolled(next)
            onValueChange?.(next)
          }}
          {...props}
        />
      </LayoutGroup>
    </RadioGroupContext.Provider>
  )
}

type RadioGroupItemProps = React.ComponentProps<typeof RadioGroupPrimitive.Item> & {
  /** A second line. Shown by `plain`, `card` and `list`; `segmented` has no room and keeps it for assistive tech. */
  description?: React.ReactNode
}

function RadioGroupItem({ value, description, className, children, ...props }: RadioGroupItemProps) {
  const { variant, value: current, animated, reduceMotion } = useContext(RadioGroupContext)
  const labelId = useId()
  const descriptionId = useId()
  const selected = current === value
  const plain = variant === "plain"
  const indicator = selected ? <RadioIndicator variant={variant} animated={animated} reduceMotion={reduceMotion} /> : null
  const text = (
    <ItemText
      labelId={labelId}
      descriptionId={descriptionId}
      description={description}
      hideDescription={variant === "segmented"}
    >
      {children}
    </ItemText>
  )
  const item = (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      value={value}
      aria-labelledby={labelId}
      aria-describedby={description ? descriptionId : undefined}
      className={cn(ITEM_BASE_CLASS, ITEM_CLASS[variant], !plain && className)}
      {...props}
    >
      {indicator}
      {plain ? null : text}
      {variant === "card" || variant === "list" ? <SelectionCheck variant={variant} selected={selected} /> : null}
    </RadioGroupPrimitive.Item>
  )
  if (!plain) return item
  return (
    <label className={cn(PLAIN_LABEL_CLASS, className)}>
      {item}
      {text}
    </label>
  )
}

export {
  RadioGroup,
  RadioGroupItem,
  type RadioGroupProps,
  type RadioGroupItemProps,
  type RadioGroupVariant,
  type RadioGroupEffect,
}
