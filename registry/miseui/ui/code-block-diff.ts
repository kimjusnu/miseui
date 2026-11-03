type DiffLineKind = "added" | "removed" | "context" | "hunk"

interface DiffLine {
  kind: DiffLineKind
  /** The line without its marker. */
  text: string
  oldNumber?: number
  newNumber?: number
}

const HUNK_HEADER = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/
const FILE_HEADER = /^(?:---|\+\+\+) /

/** Reads a unified diff. Numbers restart from each @@ header and start at 1 when there is none. */
function parseDiff(source: string): DiffLine[] {
  const lines: DiffLine[] = []
  let oldNumber = 1
  let newNumber = 1
  for (const raw of source.replace(/\n$/, "").split("\n")) {
    const hunk = HUNK_HEADER.exec(raw)
    if (hunk) {
      oldNumber = Number(hunk[1])
      newNumber = Number(hunk[2])
      lines.push({ kind: "hunk", text: raw })
    } else if (FILE_HEADER.test(raw)) {
      lines.push({ kind: "hunk", text: raw })
    } else if (raw.startsWith("+")) {
      lines.push({ kind: "added", text: raw.slice(1), newNumber })
      newNumber += 1
    } else if (raw.startsWith("-")) {
      lines.push({ kind: "removed", text: raw.slice(1), oldNumber })
      oldNumber += 1
    } else {
      lines.push({ kind: "context", text: raw.startsWith(" ") ? raw.slice(1) : raw, oldNumber, newNumber })
      oldNumber += 1
      newNumber += 1
    }
  }
  return lines
}

/** What the file looks like after the change: the thing people mean to copy from a diff. */
function diffResult(lines: readonly DiffLine[]) {
  return lines
    .filter((line) => line.kind === "added" || line.kind === "context")
    .map((line) => line.text)
    .join("\n")
}

export { diffResult, parseDiff, type DiffLine, type DiffLineKind }
