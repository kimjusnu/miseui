type QrLevel = "L" | "M" | "Q" | "H"

/** Index 0 is unused so a version number can index these directly. Values are from ISO/IEC 18004 table 9. */
const EC_CODEWORDS_PER_BLOCK: Record<QrLevel, readonly number[]> = {
  L: [0, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  M: [0, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
  Q: [0, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  H: [0, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
}

const EC_BLOCK_COUNT: Record<QrLevel, readonly number[]> = {
  L: [0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
  M: [0, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
  Q: [0, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
  H: [0, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81],
}

const MAX_VERSION = 40

function symbolSize(version: number) {
  return version * 4 + 17
}

/** Modules left for data and error correction once the function patterns are drawn, remainder bits included. */
function rawDataModules(version: number) {
  const base = (16 * version + 128) * version + 64
  if (version < 2) return base
  const alignCount = Math.floor(version / 7) + 2
  const withoutAlignment = base - ((25 * alignCount - 10) * alignCount - 55)
  return version >= 7 ? withoutAlignment - 36 : withoutAlignment
}

function totalCodewords(version: number) {
  return Math.floor(rawDataModules(version) / 8)
}

function dataCodewords(version: number, level: QrLevel) {
  return totalCodewords(version) - EC_CODEWORDS_PER_BLOCK[level][version] * EC_BLOCK_COUNT[level][version]
}

/** Byte mode costs a 4 bit mode and an 8 or 16 bit length, which is what makes the limit depend on the version. */
function byteModeCapacity(version: number, level: QrLevel) {
  const lengthBits = version <= 9 ? 8 : 16
  return Math.floor((dataCodewords(version, level) * 8 - 4 - lengthBits) / 8)
}

/** Centre coordinates of the alignment patterns on both axes. */
function alignmentPositions(version: number): number[] {
  if (version === 1) return []
  const count = Math.floor(version / 7) + 2
  const last = symbolSize(version) - 7
  // Version 32 is the one irregular spacing in the standard.
  const step = version === 32 ? 26 : Math.ceil((last - 6) / (count - 1) / 2) * 2
  return [6, ...Array.from({ length: count - 1 }, (_, index) => last - (count - 2 - index) * step)]
}

export {
  EC_BLOCK_COUNT,
  EC_CODEWORDS_PER_BLOCK,
  MAX_VERSION,
  alignmentPositions,
  byteModeCapacity,
  dataCodewords,
  symbolSize,
  totalCodewords,
  type QrLevel,
}
