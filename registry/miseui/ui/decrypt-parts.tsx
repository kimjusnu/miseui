import type * as React from "react"
import { Fragment } from "react"
import { barScale, markOpacity, scanFractions, scanProgress, type DecryptCell, type DecryptPlan, type DecryptTextVariant, type DecryptWord } from "@/registry/miseui/ui/decrypt-math"
import { GlyphCell, WordRow, glyphCells, paintGlyph, type FramePainter } from "@/registry/miseui/ui/scramble-play"
import { cn } from "@/registry/miseui/lib/utils"

const CIPHER_LAYER = "text-muted-foreground"

function RedactWord({ word, locked }: { word: DecryptWord; locked: boolean }) {
  return (
    <span data-slot="decrypt-text-word" className="relative inline-block whitespace-nowrap">
      <span className={locked ? "invisible" : undefined}>{word.text}</span>
      {/* Retracts toward the end of the word, so the letters appear in reading order. */}
      <span
        data-slot="decrypt-text-bar"
        className="pointer-events-none absolute -inset-x-[0.04em] inset-y-[0.12em] origin-right rounded-[2px] bg-foreground"
        style={{ transform: `scaleX(${locked ? 1 : 0})` }}
      />
    </span>
  )
}

function CipherCell({ cell, variant, locked }: { cell: DecryptCell; variant: DecryptTextVariant; locked: boolean }) {
  return (
    <GlyphCell target={cell.target} before={locked ? cell.before : undefined} layerClassName={CIPHER_LAYER}>
      {variant === "cipher" ? (
        <span data-slot="decrypt-text-mark" className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-mise" style={{ opacity: 0 }} />
      ) : null}
    </GlyphCell>
  )
}

interface DecryptVisualProps {
  plan: DecryptPlan
  variant: DecryptTextVariant
  locked: boolean
  visualRef: React.Ref<HTMLSpanElement>
  /** Changing it drops a half-played frame. Inside the observed element, because useInView keeps watching the node it first got. */
  runKey: string
}

function DecryptVisual({ plan, variant, locked, visualRef, runKey }: DecryptVisualProps) {
  return (
    <span
      ref={visualRef}
      aria-hidden="true"
      data-slot="decrypt-text-visual"
      className={cn("relative", variant === "scan" && "inline-block max-w-full", locked && "select-none")}
    >
      <Fragment key={runKey}>
        {plan.words.map((word, position) =>
          variant === "redact" ? (
            <span key={word.key}>
              <RedactWord word={word} locked={locked} />
              {position < plan.words.length - 1 ? " " : null}
            </span>
          ) : (
            <WordRow key={word.key} last={position === plan.words.length - 1}>
              {word.cells.map((cell) => (
                <CipherCell key={cell.index} cell={cell} variant={variant} locked={locked} />
              ))}
            </WordRow>
          ),
        )}
        {variant === "scan" ? (
          <span data-slot="decrypt-text-line" className="pointer-events-none absolute inset-y-0 left-0 w-px bg-mise" style={{ opacity: 0 }} />
        ) : null}
      </Fragment>
    </span>
  )
}

function redactPainter(visual: HTMLElement, plan: DecryptPlan): FramePainter {
  const nodes = Array.from(visual.querySelectorAll<HTMLElement>("[data-slot='decrypt-text-word']"))
  return (elapsed) => {
    plan.words.forEach((word, position) => {
      const scale = barScale(word.startAt, elapsed)
      const [text, bar] = Array.from(nodes[position].children) as HTMLElement[]
      bar.style.transform = `scaleX(${scale})`
      text.style.visibility = scale >= 1 ? "hidden" : "visible"
    })
    return elapsed >= plan.durationMs
  }
}

function letterPainter(visual: HTMLElement, plan: DecryptPlan): FramePainter {
  const nodes = glyphCells(visual)
  const cells = plan.words.flatMap((word) => word.cells)
  const marks = Array.from(visual.querySelectorAll<HTMLElement>("[data-slot='decrypt-text-mark']"))
  return (elapsed) => {
    cells.forEach((cell, position) => {
      paintGlyph(nodes[position], elapsed >= cell.settleAt ? null : cell.before)
      if (marks[position]) marks[position].style.opacity = String(markOpacity(cell.settleAt, elapsed))
    })
    return elapsed >= plan.durationMs
  }
}

/** Reads the layout once per run, so the frames themselves never measure. */
function scanPainter(visual: HTMLElement, plan: DecryptPlan): FramePainter {
  const nodes = glyphCells(visual)
  const cells = plan.words.flatMap((word) => word.cells)
  const line = visual.querySelector<HTMLElement>("[data-slot='decrypt-text-line']")
  const block = visual.getBoundingClientRect()
  const fractions = scanFractions(nodes.map((node) => node.getBoundingClientRect()), block.left, block.width)
  return (elapsed) => {
    const progress = scanProgress(elapsed)
    cells.forEach((cell, position) => paintGlyph(nodes[position], elapsed >= 0 && fractions[position] <= progress ? null : cell.before))
    const finished = elapsed >= plan.durationMs
    if (line) {
      line.style.transform = `translateX(${progress * block.width}px)`
      line.style.opacity = finished || elapsed < 0 ? "0" : "1"
    }
    return finished
  }
}

function createDecryptPainter(visual: HTMLElement, plan: DecryptPlan, variant: DecryptTextVariant): FramePainter {
  if (variant === "redact") return redactPainter(visual, plan)
  if (variant === "scan") return scanPainter(visual, plan)
  return letterPainter(visual, plan)
}

export { DecryptVisual, createDecryptPainter }
