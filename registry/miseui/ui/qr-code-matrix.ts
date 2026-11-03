import { alignmentPositions, symbolSize, type QrLevel } from "@/registry/miseui/ui/qr-code-tables"

/** Indexed [y][x]. The builders fill a local buffer: copying a 177 by 177 grid per module would be absurd. */
type QrGrid = boolean[][]

const FORMAT_LEVEL_BITS: Record<QrLevel, number> = { L: 1, M: 0, Q: 3, H: 2 }
const FORMAT_GENERATOR = 0x537
const FORMAT_MASK = 0x5412
const VERSION_GENERATOR = 0x1f25

const MASKS: ReadonlyArray<(x: number, y: number) => boolean> = [
  (x, y) => (x + y) % 2 === 0,
  (_x, y) => y % 2 === 0,
  (x) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
]

function bchRemainder(value: number, generator: number, bits: number) {
  let remainder = value << bits
  for (let bit = 31 - Math.clz32(remainder); bit >= bits; bit -= 1) {
    if ((remainder >>> bit) & 1) remainder ^= generator << (bit - bits)
  }
  return remainder
}

function formatBits(level: QrLevel, mask: number) {
  const data = (FORMAT_LEVEL_BITS[level] << 3) | mask
  return ((data << 10) | bchRemainder(data, FORMAT_GENERATOR, 10)) ^ FORMAT_MASK
}

function versionBits(version: number) {
  return (version << 12) | bchRemainder(version, VERSION_GENERATOR, 12)
}

function createGrid(size: number): QrGrid {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => false))
}

interface Canvas {
  modules: QrGrid
  reserved: QrGrid
  size: number
}

function setFunctionModule(canvas: Canvas, x: number, y: number, dark: boolean) {
  canvas.modules[y][x] = dark
  canvas.reserved[y][x] = true
}

function drawFinder(canvas: Canvas, centreX: number, centreY: number) {
  for (let dy = -4; dy <= 4; dy += 1) {
    for (let dx = -4; dx <= 4; dx += 1) {
      const x = centreX + dx
      const y = centreY + dy
      if (x < 0 || y < 0 || x >= canvas.size || y >= canvas.size) continue
      const ring = Math.max(Math.abs(dx), Math.abs(dy))
      setFunctionModule(canvas, x, y, ring !== 2 && ring !== 4)
    }
  }
}

function drawAlignment(canvas: Canvas, centreX: number, centreY: number) {
  for (let dy = -2; dy <= 2; dy += 1) {
    for (let dx = -2; dx <= 2; dx += 1) {
      setFunctionModule(canvas, centreX + dx, centreY + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1)
    }
  }
}

function drawFormat(canvas: Canvas, level: QrLevel, mask: number) {
  const bits = formatBits(level, mask)
  const bit = (index: number) => ((bits >>> index) & 1) === 1
  const { size } = canvas
  for (let index = 0; index <= 5; index += 1) setFunctionModule(canvas, 8, index, bit(index))
  setFunctionModule(canvas, 8, 7, bit(6))
  setFunctionModule(canvas, 8, 8, bit(7))
  setFunctionModule(canvas, 7, 8, bit(8))
  for (let index = 9; index < 15; index += 1) setFunctionModule(canvas, 14 - index, 8, bit(index))
  for (let index = 0; index < 8; index += 1) setFunctionModule(canvas, size - 1 - index, 8, bit(index))
  for (let index = 8; index < 15; index += 1) setFunctionModule(canvas, 8, size - 15 + index, bit(index))
  // The always-dark module. It sits in the format strip but carries no bit.
  setFunctionModule(canvas, 8, size - 8, true)
}

function drawVersion(canvas: Canvas, version: number) {
  if (version < 7) return
  const bits = versionBits(version)
  for (let index = 0; index < 18; index += 1) {
    const dark = ((bits >>> index) & 1) === 1
    const long = canvas.size - 11 + (index % 3)
    const short = Math.floor(index / 3)
    setFunctionModule(canvas, long, short, dark)
    setFunctionModule(canvas, short, long, dark)
  }
}

function drawFunctionPatterns(version: number): Canvas {
  const size = symbolSize(version)
  const canvas: Canvas = { modules: createGrid(size), reserved: createGrid(size), size }
  for (let index = 0; index < size; index += 1) {
    setFunctionModule(canvas, 6, index, index % 2 === 0)
    setFunctionModule(canvas, index, 6, index % 2 === 0)
  }
  drawFinder(canvas, 3, 3)
  drawFinder(canvas, size - 4, 3)
  drawFinder(canvas, 3, size - 4)
  const positions = alignmentPositions(version)
  const last = positions.length - 1
  positions.forEach((y, row) => {
    positions.forEach((x, column) => {
      const onFinder = (row === 0 && column === 0) || (row === 0 && column === last) || (row === last && column === 0)
      if (!onFinder) drawAlignment(canvas, x, y)
    })
  })
  // Placeholder bits: only the reservation matters until a mask has been chosen.
  drawFormat(canvas, "L", 0)
  drawVersion(canvas, version)
  return canvas
}

/** Two columns wide, snaking up and down from the bottom right, stepping over the vertical timing line. */
function placeCodewords(canvas: Canvas, codewords: readonly number[]) {
  const { size, modules, reserved } = canvas
  let bitIndex = 0
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5
    const upward = ((right + 1) & 2) === 0
    for (let step = 0; step < size; step += 1) {
      const y = upward ? size - 1 - step : step
      for (const x of [right, right - 1]) {
        if (reserved[y][x]) continue
        const byte = codewords[bitIndex >>> 3] ?? 0
        modules[y][x] = ((byte >>> (7 - (bitIndex & 7))) & 1) === 1
        bitIndex += 1
      }
    }
  }
}

function withMask(canvas: Canvas, level: QrLevel, mask: number): Canvas {
  const test = MASKS[mask]
  const modules = canvas.modules.map((row, y) => row.map((dark, x) => (canvas.reserved[y][x] ? dark : dark !== test(x, y))))
  const masked: Canvas = { ...canvas, modules }
  drawFormat(masked, level, mask)
  return masked
}

export { MASKS, drawFunctionPatterns, formatBits, placeCodewords, versionBits, withMask, type Canvas, type QrGrid }
