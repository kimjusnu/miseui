import { render, screen } from "@testing-library/react"
import { QrCode, type QrCodeVariant } from "./qr-code"
import { dataCodewordsFor, encodeQr, QrTooLongError } from "./qr-code-encode"
import { formatBits, versionBits } from "./qr-code-matrix"
import { maskPenalty } from "./qr-code-penalty"
import { gfMultiply, rsGenerator, rsRemainder } from "./qr-code-rs"
import { dotPath, inHole, isFinderModule, logoHole, squarePath } from "./qr-code-shapes"
import { alignmentPositions, byteModeCapacity, type QrLevel } from "./qr-code-tables"

const asRows = (modules: readonly (readonly boolean[])[]) => modules.map((row) => row.map((dark) => (dark ? "1" : "0")).join(""))

function fnv1a(text: string) {
  let hash = 0x811c9dc5
  for (const char of text) {
    hash = Math.imul(hash ^ char.charCodeAt(0), 0x01000193) >>> 0
  }
  return hash
}

/** Generated with python-qrcode, an unrelated implementation, with the mask forced to the value in the row. */
const V1_M_MATRIX = [
  "111111100011101111111",
  "100000101111001000001",
  "101110100110101011101",
  "101110100101101011101",
  "101110101010101011101",
  "100000100110101000001",
  "111111101010101111111",
  "000000000111100000000",
  "101010100111000010010",
  "010110010100001100011",
  "111000111100100011111",
  "011011000000001010001",
  "100101111110101100011",
  "000000001101010110001",
  "111111100001011010101",
  "100000100111110100001",
  "101110101111011010011",
  "101110100110001011010",
  "101110101110100111001",
  "100000100000001000010",
  "111111101010101100011",
]

const KNOWN_MATRIX_HASHES: ReadonlyArray<[string, number, QrLevel, number, number]> = [
  ["26:ml64", 1, "L", 2, 0xb1d767c3],
  ["n2qaY?v", 2, "M", 4, 0x565a89d5],
  ["안녕하세요 QR", 2, "M", 3, 0x2e12e7e9],
  ["bcX9?6 ", 7, "M", 7, 0x6332c347],
  ["27t3uoz", 10, "H", 3, 0x700310bf],
  ["Yfip4 0", 14, "Q", 5, 0x79b12b90],
  ["j8j1Zb/", 32, "L", 7, 0x034ddd58],
  ["C3fz69o", 40, "H", 3, 0x890a4f05],
]

describe("QR encoder", () => {
  it("multiplies in the QR field", () => {
    expect(gfMultiply(0, 200)).toBe(0)
    expect(gfMultiply(1, 200)).toBe(200)
    expect(gfMultiply(2, 0x80)).toBe(0x1d)
  })

  it("produces the error correction of the worked example in the standard", () => {
    const data = [0x10, 0x20, 0x0c, 0x56, 0x61, 0x80, 0xec, 0x11, 0xec, 0x11, 0xec, 0x11, 0xec, 0x11, 0xec, 0x11]
    expect(rsRemainder(data, rsGenerator(10))).toEqual([0xa5, 0x24, 0xd4, 0xc1, 0xed, 0x36, 0xc7, 0x87, 0x2c, 0x55])
  })

  it("matches the published format and version words", () => {
    expect(formatBits("L", 0)).toBe(0x77c4)
    expect(formatBits("M", 0)).toBe(0x5412)
    expect(formatBits("Q", 0)).toBe(0x355f)
    expect(formatBits("H", 0)).toBe(0x1689)
    expect(versionBits(7)).toBe(0x07c94)
    expect(versionBits(40)).toBe(0x28c69)
  })

  it("agrees with the published byte capacities", () => {
    expect(byteModeCapacity(1, "L")).toBe(17)
    expect(byteModeCapacity(1, "H")).toBe(7)
    expect(byteModeCapacity(10, "L")).toBe(271)
    expect(byteModeCapacity(10, "M")).toBe(213)
    expect(byteModeCapacity(10, "Q")).toBe(151)
    expect(byteModeCapacity(10, "H")).toBe(119)
    expect(byteModeCapacity(40, "L")).toBe(2953)
  })

  it("places alignment patterns where the standard lists them", () => {
    expect(alignmentPositions(1)).toEqual([])
    expect(alignmentPositions(2)).toEqual([6, 18])
    expect(alignmentPositions(7)).toEqual([6, 22, 38])
    expect(alignmentPositions(32)).toEqual([6, 34, 60, 86, 112, 138])
  })

  it("pads with the two alternating bytes and encodes UTF-8 bytes", () => {
    const words = dataCodewordsFor(new TextEncoder().encode("é"), 1, "H")
    expect(words).toHaveLength(9)
    expect(words.slice(0, 4)).toEqual([0x40, 0x2c, 0x3a, 0x90])
    expect(words.slice(4)).toEqual([0xec, 0x11, 0xec, 0x11, 0xec])
  })

  it("reproduces a known version 1 matrix module for module", () => {
    expect(asRows(encodeQr("7edcmp/", { level: "M", mask: 0 }).modules)).toEqual(V1_M_MATRIX)
  })

  it.each(KNOWN_MATRIX_HASHES)("reproduces the reference matrix of %j at version %i %s", (text, version, level, mask, hash) => {
    const symbol = encodeQr(text, { level, mask, minVersion: version })
    expect(symbol.version).toBe(version)
    expect(fnv1a(asRows(symbol.modules).join(""))).toBe(hash)
  })

  it("picks the smallest version that fits, and the mask with the lowest penalty", () => {
    const symbol = encodeQr("https://miseui.junsu4621.workers.dev", { level: "M" })
    expect(symbol.version).toBe(3)
    expect(symbol.size).toBe(29)
    const best = Array.from({ length: 8 }, (_, mask) => maskPenalty(encodeQr("https://miseui.junsu4621.workers.dev", { level: "M", mask }).modules))
    expect(maskPenalty(symbol.modules)).toBe(Math.min(...best))
  })

  it("throws a typed error with the numbers when the text cannot fit", () => {
    const tooLong = "a".repeat(2954)
    expect(() => encodeQr(tooLong, { level: "L" })).toThrow(QrTooLongError)
    expect(() => encodeQr(tooLong, { level: "L" })).toThrow("2954 bytes")
    expect(encodeQr("a".repeat(2953), { level: "L" }).version).toBe(40)
  })
})

describe("QR shapes", () => {
  it("keeps the logo hole odd, centred and under six percent of the modules", () => {
    for (const size of [21, 25, 29, 57, 177]) {
      const hole = logoHole(size)
      expect(hole.side % 2).toBe(1)
      expect(hole.start * 2 + hole.side).toBe(size)
      expect((hole.side * hole.side) / (size * size)).toBeLessThan(0.06)
    }
  })

  it("draws no module inside the hole", () => {
    const { modules, size } = encodeQr("hole", { level: "H", minVersion: 3 })
    const hole = logoHole(size)
    expect(inHole(size / 2 - 0.5, size / 2 - 0.5, hole)).toBe(true)
    expect(squarePath(modules, 0, hole).length).toBeLessThan(squarePath(modules, 0).length)
  })

  it("leaves the finder corners out of the dots", () => {
    expect(isFinderModule(0, 0, 21)).toBe(true)
    expect(isFinderModule(20, 20, 21)).toBe(false)
    const empty = Array.from({ length: 21 }, (_, y) => Array.from({ length: 21 }, (_, x) => isFinderModule(x, y, 21)))
    expect(dotPath(empty, 0)).toBe("")
  })
})

describe("QrCode", () => {
  const symbol = () => screen.getByRole("img")

  it("names the symbol, keeps a quiet zone, and stays dark on light in every theme", () => {
    render(<QrCode value="https://example.com" label="Open the menu" />)
    const svg = symbol()
    expect(svg).toHaveAccessibleName("Open the menu")
    const { size } = encodeQr("https://example.com", { level: "M" })
    expect(svg).toHaveAttribute("viewBox", `0 0 ${size + 8} ${size + 8}`)
    expect(svg.querySelector("rect")).toHaveAttribute("fill", "#ffffff")
    expect(svg.querySelector("path")).toHaveAttribute("fill", "#000000")
  })

  it("makes the variants differ in structure", () => {
    const path = (variant: QrCodeVariant) => {
      const { unmount } = render(<QrCode value="variant" variant={variant} logo={<svg />} caption="Scan" />)
      const d = document.querySelector("path")?.getAttribute("d")
      const rendering = symbol().getAttribute("shape-rendering")
      const hasFigure = document.querySelector("figure") !== null
      const hasLogo = document.querySelector("[data-slot='qr-code-logo']") !== null
      unmount()
      return { d, rendering, hasFigure, hasLogo }
    }
    expect(path("rounded").rendering).toBe("geometricPrecision")
    expect(path("rounded").d).not.toEqual(path("plain").d)
    expect(path("framed").hasFigure).toBe(true)
    expect(path("plain").hasFigure).toBe(false)
    expect(path("logo").hasLogo).toBe(true)
  })

  it("forces level H under a logo, whatever level was asked for", () => {
    const text = "a logo costs modules"
    const { container } = render(<QrCode value={text} variant="logo" level="L" />)
    const { size } = encodeQr(text, { level: "H" })
    expect(container.querySelector("svg")).toHaveAttribute("viewBox", `0 0 ${size + 8} ${size + 8}`)
    expect(size).toBeGreaterThan(encodeQr(text, { level: "L" }).size)
  })

  it("shows a clear error instead of throwing when the value is too long", () => {
    render(<QrCode value={"a".repeat(3000)} level="L" />)
    expect(screen.getByRole("alert")).toHaveTextContent("3000 bytes")
    expect(screen.queryByRole("img")).not.toBeInTheDocument()
  })

  it("clips the symbol only while the reveal runs", () => {
    render(<QrCode value="reveal" effect="reveal" />)
    expect(document.querySelector("[data-slot='qr-code']")).toHaveAttribute("data-effect", "reveal")
    expect(document.querySelector("clipPath")).toBeInTheDocument()
    expect(document.querySelector("path")?.getAttribute("clip-path")).toMatch(/^url\(#qr-reveal-/)
  })

  it("shows the caption only in framed", () => {
    const { rerender } = render(<QrCode value="caption" variant="framed" caption="Table 12" />)
    expect(screen.getByText("Table 12").tagName).toBe("FIGCAPTION")
    rerender(<QrCode value="caption" variant="plain" caption="Table 12" />)
    expect(screen.queryByText("Table 12")).not.toBeInTheDocument()
  })
})
