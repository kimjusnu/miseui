import { LiquidMetal } from "@/registry/miseui/ui/liquid-metal"

/** Children sit on the metal with no background of their own; the dark mise ink reads on both tints. */
const LABEL_CLASS = "relative inline-flex items-center font-medium text-mise-foreground"

export function Demo() {
  return (
    <div className="flex flex-wrap items-center gap-6">
      <LiquidMetal className="rounded-full shadow-sm">
        <button
          type="button"
          className={`${LABEL_CLASS} h-11 rounded-full px-6 text-[15px] outline-none transition-transform duration-(--duration-fast) ease-(--ease-mise) focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-[0.97]`}
        >
          Continue
        </button>
      </LiquidMetal>
      <LiquidMetal tint="mise" intensity={0.9} speed={0.7} className="rounded-full shadow-sm">
        <span className={`${LABEL_CLASS} h-8 rounded-full px-3.5 text-sm`}>Pro</span>
      </LiquidMetal>
      <LiquidMetal intensity={0.4} speed={0.5} className="rounded-xl shadow-sm">
        <span className={`${LABEL_CLASS} size-11 justify-center text-lg`} aria-label="Sparkle">
          ✦
        </span>
      </LiquidMetal>
    </div>
  )
}
