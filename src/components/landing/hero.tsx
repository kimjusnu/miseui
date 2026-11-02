import type * as React from "react"
import { Link } from "react-router"
import { ArrowRight } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { Button } from "@/registry/miseui/ui/button"
import { PalettePicker } from "@/src/components/palette-picker"
import { BeforeAfter } from "./before-after"
import { MiseScreen, PlainScreen } from "./compare-screens"

const LINE_STAGGER_SECONDS = 0.08

function Arrive({ order, className, children }: { order: number; className?: string; children: React.ReactNode }) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, filter: "blur(8px)" }}
      animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ ...SPRING_DEFAULT, delay: order * LINE_STAGGER_SECONDS }}
    >
      {children}
    </motion.div>
  )
}

export function Hero() {
  return (
    <section className="rounded-[28px] bg-background">
      <div className="mx-auto grid w-full max-w-7xl items-center gap-10 px-5 py-12 md:px-10 lg:min-h-[calc(100dvh-5rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-14 lg:py-10">
        <div className="flex flex-col items-start gap-6">
          <Arrive order={0}>
            <h1 className="text-display text-[2.625rem] text-balance sm:text-5xl xl:text-6xl">
              Design decisions, already made.
              <span className="text-muted-foreground"> You just ship.</span>
            </h1>
          </Arrive>
          <Arrive order={1}>
            <p className="max-w-md text-[17px] leading-relaxed text-pretty text-muted-foreground">
              Whole screens and living effects for developers who would rather not open Figma. Each one explains itself.
            </p>
          </Arrive>
          <Arrive order={2} className="flex flex-wrap items-center gap-2">
            <Button variant="mise" size="lg" asChild>
              <Link to="/blocks">
                Browse blocks <ArrowRight />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/docs">Install</Link>
            </Button>
          </Arrive>
          <Arrive order={3} className="flex flex-wrap items-center gap-3 pt-2">
            <PalettePicker />
            <span className="text-[13px] text-muted-foreground">Pick a palette. That is the whole colour decision.</span>
          </Arrive>
        </div>
        <Arrive order={2} className="flex w-full flex-col gap-3">
          <BeforeAfter before={<PlainScreen />} after={<MiseScreen />} />
          <p className="text-center text-[13px] text-muted-foreground">
            The same form, the same fields. Drag to compare what you would write with what you copy.
          </p>
        </Arrive>
      </div>
    </section>
  )
}
