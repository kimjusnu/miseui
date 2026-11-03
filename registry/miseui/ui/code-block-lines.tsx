import type * as React from "react"
import { motion, useReducedMotion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import type { DiffLine, DiffLineKind } from "@/registry/miseui/ui/code-block-diff"
import type { CodeToken, CodeTokenType } from "@/registry/miseui/ui/code-block-tokens"
import { cn } from "@/registry/miseui/lib/utils"

/**
 * One accent and tone instead of a rainbow, because the accent is the only hue a theme guarantees. Mixing it into
 * the foreground keeps keywords readable on the surface in both modes, whichever accent the palette picked.
 */
const ACCENT_INK = "text-[color-mix(in_oklab,var(--mise)_55%,var(--foreground))]"
const TOKEN_CLASS: Record<CodeTokenType, string> = {
  plain: "",
  keyword: ACCENT_INK,
  string: "text-foreground/70",
  number: ACCENT_INK,
  comment: "text-muted-foreground italic",
  function: "font-medium",
  type: "font-medium",
  property: "text-foreground/80",
  punctuation: "text-muted-foreground",
  variable: ACCENT_INK,
}

/** Fixed hues: added and removed are status, and the accent may itself be green or red. */
const DIFF_LINE_CLASS: Record<DiffLineKind, string> = {
  added: "bg-emerald-500/10 dark:bg-emerald-400/10",
  removed: "bg-red-500/10 dark:bg-red-400/10",
  context: "",
  hunk: "bg-muted text-muted-foreground",
}
const DIFF_SIGN_CLASS: Record<DiffLineKind, string> = {
  added: "text-emerald-700 dark:text-emerald-400",
  removed: "text-red-700 dark:text-red-400",
  context: "text-transparent",
  hunk: "text-transparent",
}
const DIFF_SIGN: Record<DiffLineKind, string> = { added: "+", removed: "-", context: " ", hunk: " " }
const DIFF_SPOKEN: Partial<Record<DiffLineKind, string>> = { added: "Added: ", removed: "Removed: " }

const LINE_CLASS = "flex min-w-full px-3"
const GUTTER_CLASS = "shrink-0 pr-3 text-right text-muted-foreground tabular-nums select-none"
/** Beyond this many lines the stagger would make people wait for code they could already read. */
const REVEAL_LINE_LIMIT = 24
const REVEAL_STEP_S = 0.025

function Tokens({ tokens }: { tokens: readonly CodeToken[] }) {
  if (tokens.length === 0) return "​"
  return tokens.map((token, index) =>
    token.type === "plain" ? (
      <span key={index}>{token.text}</span>
    ) : (
      <span key={index} data-token={token.type} className={TOKEN_CLASS[token.type]}>
        {token.text}
      </span>
    ),
  )
}

interface LineShellProps {
  index: number
  reveal: boolean
  className?: string
  children: React.ReactNode
  highlighted?: boolean
  kind?: DiffLineKind
}

function LineShell({ index, reveal, className, children, highlighted, kind }: LineShellProps) {
  const reduceMotion = useReducedMotion() ?? false
  const shared = {
    "data-slot": "code-block-line",
    "data-highlighted": highlighted ? "true" : undefined,
    "data-kind": kind,
    className: cn(LINE_CLASS, highlighted && "bg-mise-soft", className),
  }
  if (!reveal || reduceMotion || index >= REVEAL_LINE_LIMIT) return <div {...shared}>{children}</div>
  return (
    <motion.div
      {...shared}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING_DEFAULT, delay: index * REVEAL_STEP_S }}
    >
      {children}
    </motion.div>
  )
}

interface CodeLinesProps {
  lines: readonly (readonly CodeToken[])[]
  lineNumbers: boolean
  highlightLines: readonly number[]
  wrap: boolean
  reveal: boolean
}

function CodeLines({ lines, lineNumbers, highlightLines, wrap, reveal }: CodeLinesProps) {
  const gutterWidth = `${String(lines.length).length}ch`
  return lines.map((tokens, index) => (
    <LineShell key={index} index={index} reveal={reveal} highlighted={highlightLines.includes(index + 1)}>
      {lineNumbers ? (
        <span aria-hidden="true" className={GUTTER_CLASS} style={{ boxSizing: "content-box", width: gutterWidth }}>
          {index + 1}
        </span>
      ) : null}
      <span className={wrap ? "min-w-0 wrap-anywhere whitespace-pre-wrap" : "whitespace-pre"}>
        <Tokens tokens={tokens} />
      </span>
    </LineShell>
  ))
}

interface DiffLinesProps {
  diff: readonly DiffLine[]
  lines: readonly (readonly CodeToken[])[]
  lineNumbers: boolean
  wrap: boolean
  reveal: boolean
}

function DiffLines({ diff, lines, lineNumbers, wrap, reveal }: DiffLinesProps) {
  const highest = diff.reduce((top, line) => Math.max(top, line.oldNumber ?? 0, line.newNumber ?? 0), 0)
  const gutter = { boxSizing: "content-box", width: `${String(highest).length}ch` } as const
  return diff.map((line, index) => (
    <LineShell key={index} index={index} reveal={reveal} kind={line.kind} className={DIFF_LINE_CLASS[line.kind]}>
      {lineNumbers ? (
        <>
          <span aria-hidden="true" className={GUTTER_CLASS} style={gutter}>
            {line.oldNumber}
          </span>
          <span aria-hidden="true" className={GUTTER_CLASS} style={gutter}>
            {line.newNumber}
          </span>
        </>
      ) : null}
      <span aria-hidden="true" className={cn("w-[2ch] shrink-0 select-none", DIFF_SIGN_CLASS[line.kind])}>
        {DIFF_SIGN[line.kind]}
      </span>
      <span className={wrap ? "min-w-0 wrap-anywhere whitespace-pre-wrap" : "whitespace-pre"}>
        {DIFF_SPOKEN[line.kind] ? <span className="sr-only">{DIFF_SPOKEN[line.kind]}</span> : null}
        <Tokens tokens={lines[index] ?? []} />
      </span>
    </LineShell>
  ))
}

export { CodeLines, DiffLines }
