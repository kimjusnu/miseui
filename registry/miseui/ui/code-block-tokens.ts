type CodeLanguage = "ts" | "json" | "bash" | "text"

type CodeTokenType =
  | "plain"
  | "keyword"
  | "string"
  | "number"
  | "comment"
  | "function"
  | "type"
  | "property"
  | "punctuation"
  | "variable"

interface CodeToken {
  type: CodeTokenType
  text: string
}

interface Rule {
  type: CodeTokenType | ((match: string, rest: string, before: string) => CodeTokenType)
  pattern: RegExp
}

const TS_KEYWORDS = new Set(
  "abstract as async await break case catch class const continue debugger default delete do else enum export extends false finally for from function get if implements import in instanceof interface let new null of private protected public readonly return satisfies set static super switch this throw true try type typeof undefined var void while yield".split(" "),
)

const BASH_KEYWORDS = new Set("case do done elif else esac fi for function if in then until while".split(" "))

/** Every pattern is sticky and free of nested quantifiers, so a hostile paste cannot make the scanner backtrack for long. */
const TS_RULES: readonly Rule[] = [
  { type: "comment", pattern: /\/\/[^\n]*/y },
  { type: "comment", pattern: /\/\*[\s\S]*?(?:\*\/|$)/y },
  { type: "string", pattern: /"(?:[^"\\\n]|\\.)*"?/y },
  { type: "string", pattern: /'(?:[^'\\\n]|\\.)*'?/y },
  { type: "string", pattern: /`(?:[^`\\]|\\[\s\S])*`?/y },
  { type: "number", pattern: /\b(?:0[xX][\da-fA-F_]+|\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?n?)\b/y },
  { type: classifyTsWord, pattern: /[A-Za-z_$][\w$]*/y },
  { type: "punctuation", pattern: /[{}()[\];:,.<>=+\-*/%&|^!?~@]+/y },
]

const JSON_RULES: readonly Rule[] = [
  { type: (_match, rest) => (/^\s*:/.test(rest) ? "property" : "string"), pattern: /"(?:[^"\\\n]|\\.)*"?/y },
  { type: "number", pattern: /-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/y },
  { type: "keyword", pattern: /\b(?:true|false|null)\b/y },
  { type: "punctuation", pattern: /[{}[\]:,]/y },
]

const BASH_RULES: readonly Rule[] = [
  { type: "comment", pattern: /(?<![^\s;|&])#[^\n]*/y },
  { type: "string", pattern: /"(?:[^"\\]|\\[\s\S])*"?/y },
  { type: "string", pattern: /'[^']*'?/y },
  { type: "variable", pattern: /\$(?:\{[^}\n]*\}?|[A-Za-z_]\w*|[\d@#?*!$-])/y },
  { type: "property", pattern: /(?<![^\s])--?[A-Za-z][\w-]*/y },
  { type: "number", pattern: /(?<![^\s=])\d+(?:\.\d+)?(?![^\s;|&)])/y },
  { type: classifyBashWord, pattern: /[A-Za-z_./~][\w./~@+:-]*/y },
  { type: "punctuation", pattern: /[|&;()<>=]+/y },
]

const RULES: Record<CodeLanguage, readonly Rule[]> = { ts: TS_RULES, json: JSON_RULES, bash: BASH_RULES, text: [] }

function classifyTsWord(match: string, rest: string): CodeTokenType {
  if (TS_KEYWORDS.has(match)) return "keyword"
  if (/^\s*\(/.test(rest) || /^<[A-Za-z][\w, ]*>\(/.test(rest)) return "function"
  if (/^[A-Z]/.test(match)) return "type"
  if (/^\??:(?!:)/.test(rest)) return "property"
  return "plain"
}

/** A word is the command when nothing but a separator or an assignment comes before it on the line. */
function classifyBashWord(match: string, rest: string, before: string): CodeTokenType {
  if (BASH_KEYWORDS.has(match)) return "keyword"
  if (rest.startsWith("=")) return "variable"
  const line = before.slice(before.lastIndexOf("\n") + 1)
  const segment = line.split(/[|;&(]/).at(-1) ?? ""
  const commandPosition = /^\s*(?:[A-Za-z_]\w*=\S*\s+)*(?:(?:then|do|else|sudo)\s+)?$/.test(segment)
  return commandPosition ? "function" : "plain"
}

function resolveType(rule: Rule, match: string, code: string, end: number, start: number): CodeTokenType {
  if (typeof rule.type === "string") return rule.type
  return rule.type(match, code.slice(end, end + 64), code.slice(Math.max(0, start - 256), start))
}

function matchAt(code: string, index: number, rules: readonly Rule[]) {
  for (const rule of rules) {
    rule.pattern.lastIndex = index
    const found = rule.pattern.exec(code)
    if (found && found[0].length > 0) return { rule, text: found[0] }
  }
  return null
}

/** Flat list, unrecognised characters collected into plain runs. Joining every text gives back the input exactly. */
function scan(code: string, rules: readonly Rule[]): CodeToken[] {
  const tokens: CodeToken[] = []
  let index = 0
  let plainFrom = 0
  const flushPlain = (upTo: number) => {
    if (upTo > plainFrom) tokens.push({ type: "plain", text: code.slice(plainFrom, upTo) })
  }
  while (index < code.length) {
    const hit = matchAt(code, index, rules)
    if (!hit) {
      index += 1
      continue
    }
    const end = index + hit.text.length
    flushPlain(index)
    tokens.push({ type: resolveType(hit.rule, hit.text, code, end, index), text: hit.text })
    index = end
    plainFrom = end
  }
  flushPlain(code.length)
  return tokens
}

/**
 * One array per line. A token that spans lines, like a block comment, is cut at each newline and keeps its type.
 * Fills local arrays on purpose: copying them per token took 9 s on a 20,000 word line.
 */
function toLines(tokens: readonly CodeToken[]): CodeToken[][] {
  const lines: CodeToken[][] = [[]]
  for (const token of tokens) {
    token.text.split("\n").forEach((text, index) => {
      if (index > 0) lines.push([])
      if (text) lines[lines.length - 1].push({ type: token.type, text })
    })
  }
  return lines
}

/** Good enough to read, not a parser: regex literals and JSX come out plain, and nothing is ever lost or reordered. */
function tokenize(code: string, language: CodeLanguage = "text"): CodeToken[][] {
  return toLines(scan(code, RULES[language]))
}

export { tokenize, type CodeLanguage, type CodeToken, type CodeTokenType }
