/** The QR field is GF(2^8) reduced by x^8 + x^4 + x^3 + x^2 + 1. */
const FIELD_POLYNOMIAL = 0x11d

function gfMultiply(a: number, b: number) {
  let product = 0
  for (let bit = 7; bit >= 0; bit -= 1) {
    product = (product << 1) ^ ((product >>> 7) * FIELD_POLYNOMIAL)
    product ^= ((b >>> bit) & 1) * a
  }
  return product
}

/** Coefficients of (x - 2^0)(x - 2^1)..., highest power first and its leading 1 left out. */
function rsGenerator(degree: number): number[] {
  const coefficients: number[] = Array.from({ length: degree }, (_, index) => (index === degree - 1 ? 1 : 0))
  let root = 1
  for (let round = 0; round < degree; round += 1) {
    for (let index = 0; index < degree; index += 1) {
      coefficients[index] = gfMultiply(coefficients[index], root) ^ (coefficients[index + 1] ?? 0)
    }
    root = gfMultiply(root, 2)
  }
  return coefficients
}

/** Polynomial long division: what is left over is the error correction block. */
function rsRemainder(data: readonly number[], generator: readonly number[]): number[] {
  const remainder = generator.map(() => 0)
  for (const byte of data) {
    const factor = byte ^ (remainder.shift() ?? 0)
    remainder.push(0)
    generator.forEach((coefficient, index) => {
      remainder[index] ^= gfMultiply(coefficient, factor)
    })
  }
  return remainder
}

export { gfMultiply, rsGenerator, rsRemainder }
