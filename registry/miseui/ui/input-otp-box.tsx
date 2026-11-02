import { motion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { cn } from "@/registry/miseui/lib/utils"

type InputOTPVariant = "boxes" | "joined" | "underline" | "dotted-mask"

const CARET_BLINK_SECONDS = 1.1

/** flex-1 from a 40 px basis: six boxes fit a 320 px screen, and shrink rather than overflow anything narrower. */
const BOX_BASE_CLASS =
  "relative flex h-12 min-w-0 flex-1 basis-10 items-center justify-center transition-[border-color,box-shadow] duration-(--duration-fast) ease-(--ease-mise)"

const BOX_CLASS: Record<InputOTPVariant, string> = {
  boxes:
    "rounded-md border border-input shadow-xs data-[active=true]:border-ring data-[active=true]:ring-[3px] data-[active=true]:ring-ring/50 data-[invalid=true]:border-destructive",
  // The active box rises above its neighbours, or the shared edge would cover half of its ring.
  joined:
    "-ml-px border border-input shadow-xs first:ml-0 first:rounded-l-md last:rounded-r-md data-[active=true]:z-10 data-[active=true]:border-ring data-[active=true]:ring-[3px] data-[active=true]:ring-ring/50 data-[invalid=true]:border-destructive",
  underline: "border-b-2 border-input data-[active=true]:border-mise data-[invalid=true]:border-destructive",
  "dotted-mask": "",
}

function OtpCaret({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <motion.span
      data-slot="input-otp-caret"
      className="absolute h-6 w-px bg-foreground"
      animate={reduceMotion ? { opacity: 1 } : { opacity: [1, 1, 0, 0] }}
      transition={reduceMotion ? { duration: 0 } : { duration: CARET_BLINK_SECONDS, repeat: Infinity, ease: "linear" }}
    />
  )
}

function OtpDigit({ char, pop }: { char: string; pop: boolean }) {
  const className = "text-lg leading-none font-medium tabular-nums"
  if (!pop) {
    return (
      <span data-slot="input-otp-digit" className={className}>
        {char}
      </span>
    )
  }
  return (
    <motion.span
      data-slot="input-otp-digit"
      className={className}
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={SPRING_DEFAULT}
    >
      {char}
    </motion.span>
  )
}

function OtpDot({ filled, invalid, pop }: { filled: boolean; invalid: boolean; pop: boolean }) {
  const colour = invalid ? "bg-destructive" : "bg-foreground"
  return (
    <motion.span
      // Remounts on change, so a digit pops in while an emptied slot just goes quiet.
      key={filled ? "filled" : "empty"}
      data-slot="input-otp-dot"
      data-filled={filled ? "true" : "false"}
      className={cn("size-2.5 rounded-full", filled ? colour : "bg-input")}
      initial={pop && filled ? { scale: 0.4 } : false}
      animate={{ scale: 1 }}
      transition={SPRING_DEFAULT}
    />
  )
}

interface OtpBoxProps {
  variant: InputOTPVariant
  char: string | undefined
  active: boolean
  caret: boolean
  invalid: boolean
  pop: boolean
  reduceMotion: boolean
}

function OtpBox({ variant, char, active, caret, invalid, pop, reduceMotion }: OtpBoxProps) {
  const masked = variant === "dotted-mask"
  return (
    <span
      data-slot="input-otp-box"
      data-active={active ? "true" : "false"}
      data-invalid={invalid ? "true" : "false"}
      className={cn(BOX_BASE_CLASS, BOX_CLASS[variant])}
    >
      {masked ? <OtpDot filled={char !== undefined} invalid={invalid} pop={pop} /> : null}
      {!masked && char !== undefined ? <OtpDigit key={char} char={char} pop={pop} /> : null}
      {caret && !masked ? <OtpCaret reduceMotion={reduceMotion} /> : null}
      {/* Dots have no glyph to blink beside, and a filled dot being overwritten needs marking too, so a ring does both. */}
      {active && masked ? (
        <span data-slot="input-otp-caret" className="absolute size-5 rounded-full border-2 border-mise" />
      ) : null}
    </span>
  )
}

export { OtpBox, type InputOTPVariant }
