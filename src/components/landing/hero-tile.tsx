import type * as React from "react"
import { Link } from "react-router"
import { motion, useReducedMotion, useSpring, useTransform, type MotionValue } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { cn } from "@/registry/miseui/lib/utils"
import { findComponent } from "@/src/content"

/** Slower than a press spring: parallax should feel like distance, not like the tile chasing the mouse. */
const PARALLAX_SPRING = { bounce: 0, visualDuration: 0.6 }
const ENTER_STAGGER_SECONDS = 0.07
const ENTER_LEAD_SECONDS = 0.25

interface HeroTileProps {
  name: string
  index: number
  /** Parallax travel in px at the edge of the hero. Larger reads as nearer. */
  depth: number
  pointerX: MotionValue<number>
  pointerY: MotionValue<number>
  className: string
  children: React.ReactNode
}

export function HeroTile({ name, index, depth, pointerX, pointerY, className, children }: HeroTileProps) {
  const reduceMotion = useReducedMotion()
  const x = useSpring(useTransform(pointerX, (value) => value * -depth), PARALLAX_SPRING)
  const y = useSpring(useTransform(pointerY, (value) => value * -depth), PARALLAX_SPRING)
  const hidden = reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, filter: "blur(10px)" }
  const shown = reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, filter: "blur(0px)" }

  return (
    <motion.div
      className={cn("min-w-0 xl:absolute xl:w-48 2xl:w-56", className)}
      style={{ x, y }}
      initial={hidden}
      animate={shown}
      transition={{ ...SPRING_DEFAULT, delay: ENTER_LEAD_SECONDS + index * ENTER_STAGGER_SECONDS }}
    >
      <Link
        to={`/components/${name}`}
        className="flex flex-col gap-3 rounded-[22px] border border-white/10 bg-white/[0.045] p-4 outline-none backdrop-blur-xl transition-[background-color,scale] duration-(--duration-fast) ease-(--ease-mise) hover:bg-white/[0.08] focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-[0.98] active:duration-100"
      >
        <span aria-hidden="true" className="flex h-28 items-center justify-center overflow-hidden">
          {children}
        </span>
        <span className="text-[13px] font-medium text-muted-foreground">{findComponent(name)?.title ?? name}</span>
      </Link>
    </motion.div>
  )
}
