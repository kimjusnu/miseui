import type { QrGrid } from "@/registry/miseui/ui/qr-code-matrix"

const RUN_WEIGHT = 3
const RUN_MINIMUM = 5
const BLOCK_WEIGHT = 3
const FINDER_LIKE_WEIGHT = 40
const BALANCE_WEIGHT = 10
const FINDER_LIKE_PATTERNS = ["10111010000", "00001011101"]

function lineString(line: readonly boolean[]) {
  return line.map((dark) => (dark ? "1" : "0")).join("")
}

function runPenalty(line: string) {
  return [...line.matchAll(/0+|1+/g)].reduce((total, [run]) => {
    return run.length >= RUN_MINIMUM ? total + RUN_WEIGHT + run.length - RUN_MINIMUM : total
  }, 0)
}

function finderLikePenalty(line: string) {
  return FINDER_LIKE_PATTERNS.reduce((total, pattern) => {
    let hits = 0
    for (let at = line.indexOf(pattern); at !== -1; at = line.indexOf(pattern, at + 1)) hits += 1
    return total + hits * FINDER_LIKE_WEIGHT
  }, 0)
}

function blockPenalty(modules: QrGrid) {
  let total = 0
  for (let y = 0; y < modules.length - 1; y += 1) {
    for (let x = 0; x < modules.length - 1; x += 1) {
      const dark = modules[y][x]
      if (dark === modules[y][x + 1] && dark === modules[y + 1][x] && dark === modules[y + 1][x + 1]) total += BLOCK_WEIGHT
    }
  }
  return total
}

function balancePenalty(modules: QrGrid) {
  const total = modules.length * modules.length
  const dark = modules.reduce((sum, row) => sum + row.filter(Boolean).length, 0)
  const steps = Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1
  return Math.max(0, steps) * BALANCE_WEIGHT
}

/** ISO/IEC 18004 section 7.8.3: the mask with the lowest score is the one a scanner reads most reliably. */
function maskPenalty(modules: QrGrid) {
  const rows = modules.map(lineString)
  const columns = modules.map((_, x) => lineString(modules.map((row) => row[x])))
  const lines = [...rows, ...columns]
  const perLine = lines.reduce((total, line) => total + runPenalty(line) + finderLikePenalty(line), 0)
  return perLine + blockPenalty(modules) + balancePenalty(modules)
}

export { maskPenalty }
