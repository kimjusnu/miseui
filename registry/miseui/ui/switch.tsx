import { Switch as SwitchPrimitive } from "radix-ui"
import { cn } from "@/registry/miseui/lib/utils"
import {
  GooeySwitch,
  HapticSwitch,
  SWITCH_ROOT_CLASS,
  SWITCH_THUMB_CLASS,
  type SwitchRootProps,
} from "@/registry/miseui/ui/switch-effects"

const THUMB_TRAVEL_CLASS = "data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0"

type SwitchEffect = "gooey" | "haptic"

type SwitchProps = SwitchRootProps & {
  /** `gooey` stretches the thumb like a drop as it travels; `haptic` dips it the moment it is pressed. */
  effect?: SwitchEffect
}

function Switch({ effect, className, ...props }: SwitchProps) {
  if (effect === "gooey") return <GooeySwitch className={className} {...props} />
  if (effect === "haptic") return <HapticSwitch className={className} {...props} />
  return (
    <SwitchPrimitive.Root data-slot="switch" className={cn(SWITCH_ROOT_CLASS, className)} {...props}>
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          SWITCH_THUMB_CLASS,
          THUMB_TRAVEL_CLASS,
          "shadow-xs transition-transform duration-(--duration-fast) ease-(--ease-mise)",
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch, type SwitchEffect, type SwitchProps }
