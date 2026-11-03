import { drawFunctionPatterns, MASKS, placeCodewords, withMask, type QrGrid } from "@/registry/miseui/ui/qr-code-matrix"
import { maskPenalty } from "@/registry/miseui/ui/qr-code-penalty"
import { rsGenerator, rsRemainder } from "@/registry/miseui/ui/qr-code-rs"
import {
  byteModeCapacity,
  dataCodewords,
  EC_BLOCK_COUNT,
  EC_CODEWORDS_PER_BLOCK,
  MAX_VERSION,
  symbolSize,
  totalCodewords,
  type QrLevel,
} from "@/registry/miseui/ui/qr-code-tables"

const BYTE_MODE = 0b0100
const PAD_BYTES = [0xec, 0x11]

interface QrSymbol {
  version: number
  level: QrLevel
  mask: number
  /** Modules per side, without the quiet zone. */
  size: number
  /** Indexed [y][x]; true is a dark module. */
  modules: QrGrid
}

interface QrEncodeOptions {
  level?: QrLevel
  /** Fixes the mask instead of scoring all eight. */
  mask?: number
  /** Raises the version when a denser grid is needed, for instance to leave room for a logo. */
  minVersion?: number
}

class QrTooLongError extends Error {
  readonly bytes: number
  readonly limit: number
  constructor(bytes: number, limit: number, level: QrLevel) {
    super(`This text is ${bytes} bytes. A QR code at level ${level} holds ${limit} at most.`)
    this.name = "QrTooLongError"
    this.bytes = bytes
    this.limit = limit
  }
}

function pickVersion(byteLength: number, level: QrLevel, minVersion: number) {
  for (let version = minVersion; version <= MAX_VERSION; version += 1) {
    if (byteModeCapacity(version, level) >= byteLength) return version
  }
  throw new QrTooLongError(byteLength, byteModeCapacity(MAX_VERSION, level), level)
}

/** Mode, length, payload, terminator, then padding up to the capacity of this version. */
function dataCodewordsFor(bytes: Uint8Array, version: number, level: QrLevel): number[] {
  const lengthBits = version <= 9 ? 8 : 16
  const bits: number[] = []
  const append = (value: number, count: number) => {
    for (let bit = count - 1; bit >= 0; bit -= 1) bits.push((value >>> bit) & 1)
  }
  append(BYTE_MODE, 4)
  append(bytes.length, lengthBits)
  bytes.forEach((byte) => append(byte, 8))
  const capacity = dataCodewords(version, level)
  append(0, Math.min(4, capacity * 8 - bits.length))
  append(0, (8 - (bits.length % 8)) % 8)
  const filled = Array.from({ length: bits.length / 8 }, (_, index) =>
    bits.slice(index * 8, index * 8 + 8).reduce((byte, bit) => (byte << 1) | bit, 0),
  )
  const padding = Array.from({ length: capacity - filled.length }, (_, index) => PAD_BYTES[index % 2])
  return [...filled, ...padding]
}

/** Splits into blocks, appends each block's error correction, then reads the blocks column by column. */
function interleave(data: readonly number[], version: number, level: QrLevel): number[] {
  const blockCount = EC_BLOCK_COUNT[level][version]
  const ecLength = EC_CODEWORDS_PER_BLOCK[level][version]
  const shortCount = blockCount - (totalCodewords(version) % blockCount)
  const shortLength = Math.floor(totalCodewords(version) / blockCount) - ecLength
  const generator = rsGenerator(ecLength)
  const blocks = Array.from({ length: blockCount }, (_, index) => {
    const start = index * shortLength + Math.max(0, index - shortCount)
    const length = shortLength + (index < shortCount ? 0 : 1)
    const body = data.slice(start, start + length)
    return { body, ec: rsRemainder(body, generator) }
  })
  const dataColumns = Array.from({ length: shortLength + 1 }, (_, column) =>
    blocks.flatMap(({ body }) => (column < body.length ? [body[column]] : [])),
  )
  const ecColumns = Array.from({ length: ecLength }, (_, column) => blocks.map(({ ec }) => ec[column]))
  return [...dataColumns.flat(), ...ecColumns.flat()]
}

function encodeQr(text: string, options: QrEncodeOptions = {}): QrSymbol {
  const { level = "M", mask, minVersion = 1 } = options
  const bytes = new TextEncoder().encode(text)
  const version = pickVersion(bytes.length, level, Math.max(1, minVersion))
  const canvas = drawFunctionPatterns(version)
  placeCodewords(canvas, interleave(dataCodewordsFor(bytes, version, level), version, level))
  const candidates = mask === undefined ? MASKS.map((_, index) => index) : [mask]
  const scored = candidates.map((candidate) => {
    const { modules } = withMask(canvas, level, candidate)
    return { mask: candidate, modules, penalty: mask === undefined ? maskPenalty(modules) : 0 }
  })
  const best = scored.reduce((winner, entry) => (entry.penalty < winner.penalty ? entry : winner))
  return { version, level, mask: best.mask, size: symbolSize(version), modules: best.modules }
}

export { QrTooLongError, dataCodewordsFor, encodeQr, interleave, type QrEncodeOptions, type QrSymbol }
