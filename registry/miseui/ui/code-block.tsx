import type * as React from "react"
import { useId, useMemo, useState } from "react"
import { CodeActions, FileTabs } from "@/registry/miseui/ui/code-block-bar"
import { diffResult, parseDiff } from "@/registry/miseui/ui/code-block-diff"
import { CodeLines, DiffLines } from "@/registry/miseui/ui/code-block-lines"
import { tokenize, type CodeLanguage, type CodeToken } from "@/registry/miseui/ui/code-block-tokens"
import { cn } from "@/registry/miseui/lib/utils"

type CodeBlockVariant = "plain" | "window" | "tabs" | "diff"
type CodeBlockEffect = "line-reveal"
type TokenLines = readonly (readonly CodeToken[])[]

interface CodeBlockFile {
  name: string
  code: string
  language?: CodeLanguage
  /** Your own highlighter's output, one array per line. Skips the built-in tokenizer. */
  tokens?: TokenLines
}

type CodeBlockProps = Omit<React.ComponentProps<"div">, "title"> & {
  /** The source. In `diff` this is a unified diff. Ignored when `files` is set. */
  code?: string
  language?: CodeLanguage
  /** Your own highlighter's output, one array per line. Skips the built-in tokenizer. */
  tokens?: TokenLines
  /** `plain` code alone, `window` a title bar, `tabs` several files, `diff` added and removed lines. */
  variant?: CodeBlockVariant
  /** `line-reveal` brings lines in one after another on mount. Off unless you ask: code should be readable at once. */
  effect?: CodeBlockEffect
  /** File name in the title bar of `window`. */
  title?: React.ReactNode
  /** The files of `tabs`. */
  files?: readonly CodeBlockFile[]
  lineNumbers?: boolean
  /** Lines to mark, counted from 1. */
  highlightLines?: readonly number[]
  wrap?: boolean
  defaultWrap?: boolean
  onWrapChange?: (wrap: boolean) => void
  /** Name of the code region for assistive tech. */
  label?: string
}

const ROOT_CLASS: Record<CodeBlockVariant, string> = {
  plain: "group/code",
  window: "shadow-xs",
  tabs: "",
  diff: "group/code",
}
/** Stays out of the way of the first line until the block is in use; on touch there is no hover, so it just stays. */
const FLOATING_ACTIONS_CLASS =
  "absolute top-1 right-1 z-10 flex rounded-md bg-card opacity-0 transition-opacity duration-(--duration-fast) ease-(--ease-mise) group-hover/code:opacity-100 group-focus-within/code:opacity-100 pointer-coarse:opacity-100 motion-reduce:transition-none"
const EMPTY_LINES: readonly number[] = []

function useCodeSource(source: string, language: CodeLanguage, tokens: TokenLines | undefined, isDiff: boolean) {
  const diff = useMemo(() => (isDiff ? parseDiff(source) : null), [isDiff, source])
  const lines = useMemo<TokenLines>(() => {
    if (tokens) return tokens
    if (diff) return diff.map((line) => tokenize(line.text, line.kind === "hunk" ? "text" : language)[0])
    return tokenize(source.replace(/\n$/, ""), language)
  }, [tokens, diff, source, language])
  return { diff, lines, copyValue: diff ? diffResult(diff) : source }
}

function useWrap(controlled: boolean | undefined, initial: boolean, onChange?: (wrap: boolean) => void) {
  const [state, setState] = useState(initial)
  const wrap = controlled ?? state
  const toggle = () => {
    setState(!wrap)
    onChange?.(!wrap)
  }
  return { wrap, toggle }
}

interface CodePanelProps {
  tabs: boolean
  baseId: string
  activeFile: number
  label: string
  wrap: boolean
  children: React.ReactNode
}

/** Scrolls inside itself, and takes a tab stop so a keyboard can scroll it too. */
function CodePanel({ tabs, baseId, activeFile, label, wrap, children }: CodePanelProps) {
  return (
    <div
      role={tabs ? "tabpanel" : "region"}
      id={tabs ? `${baseId}-panel` : undefined}
      aria-labelledby={tabs ? `${baseId}-tab-${activeFile}` : undefined}
      aria-label={tabs ? undefined : label}
      tabIndex={0}
      className="max-h-96 overflow-auto outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset"
    >
      <pre className={cn("py-3 font-mono text-[13px] leading-5", wrap ? "w-full" : "w-max min-w-full")}>
        <code className="block">{children}</code>
      </pre>
    </div>
  )
}

function CodeBlock({
  code = "", language = "text", tokens, variant = "plain", effect, title, files, lineNumbers = false, highlightLines = EMPTY_LINES,
  wrap: wrapProp, defaultWrap = false, onWrapChange, label = "Code", className, ...props
}: CodeBlockProps) {
  const [activeFile, setActiveFile] = useState(0)
  const baseId = useId()
  const { wrap, toggle } = useWrap(wrapProp, defaultWrap, onWrapChange)
  const tabs = variant === "tabs"
  const file = tabs ? files?.[activeFile] : undefined
  const { diff, lines, copyValue } = useCodeSource(file?.code ?? code, file?.language ?? language, file?.tokens ?? tokens, variant === "diff")
  const actions = <CodeActions value={copyValue} wrap={wrap} onWrap={toggle} />
  const shared = { lines, lineNumbers, wrap, reveal: effect === "line-reveal" }
  return (
    <div
      data-slot="code-block"
      data-variant={variant}
      data-effect={effect}
      className={cn("relative grid min-w-0 grid-cols-[minmax(0,1fr)] overflow-hidden rounded-lg border bg-card text-card-foreground", ROOT_CLASS[variant], className)}
      {...props}
    >
      {variant === "window" ? (
        <div data-slot="code-block-bar" className="flex min-w-0 items-center justify-between gap-2 border-b bg-muted py-1 pr-1 pl-3">
          <span className="min-w-0 truncate font-mono text-[13px] text-muted-foreground">{title}</span>
          {actions}
        </div>
      ) : null}
      {tabs ? (
        <div data-slot="code-block-bar" className="flex min-w-0 items-center gap-2 border-b pr-1">
          <FileTabs names={(files ?? []).map(({ name }) => name)} active={activeFile} baseId={baseId} onActive={setActiveFile} />
          {actions}
        </div>
      ) : null}
      {variant === "plain" || variant === "diff" ? <div className={FLOATING_ACTIONS_CLASS}>{actions}</div> : null}
      <CodePanel {...{ tabs, baseId, activeFile, label, wrap }}>
        {diff ? <DiffLines {...shared} diff={diff} /> : <CodeLines {...shared} highlightLines={highlightLines} />}
      </CodePanel>
    </div>
  )
}

export {
  CodeBlock,
  tokenize,
  type CodeBlockProps,
  type CodeBlockFile,
  type CodeBlockVariant,
  type CodeBlockEffect,
  type CodeLanguage,
  type CodeToken,
}
