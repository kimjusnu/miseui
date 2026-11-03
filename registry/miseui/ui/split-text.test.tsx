import { render, screen, waitFor } from "@testing-library/react"
import { SplitText, pieceDelay, splitText } from "./split-text"

const state = vi.hoisted(() => ({ reduced: false, inView: false }))

vi.mock("motion/react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("motion/react")>()),
  useReducedMotion: () => state.reduced,
  useInView: () => state.inView,
}))

beforeEach(() => {
  state.reduced = false
  state.inView = false
})

const pieces = () => Array.from(document.querySelectorAll<HTMLElement>("[data-slot='split-text-piece']"))
const root = () => document.querySelector("[data-slot='split-text']") as HTMLElement

describe("SplitText", () => {
  it("keeps the heading and gives assistive tech the whole sentence", () => {
    render(<SplitText as="h2" text="Ship the quiet version" />)
    expect(screen.getByRole("heading", { level: 2, name: "Ship the quiet version" })).toBeInTheDocument()
    expect(document.querySelector("[data-slot='split-text-visual']")).toHaveAttribute("aria-hidden", "true")
  })

  it("splits by grapheme or by word", () => {
    const { rerender } = render(<SplitText text="제품을 더 조용하게" />)
    expect(pieces()).toHaveLength(8)
    rerender(<SplitText text="제품을 더 조용하게" by="words" />)
    expect(pieces()).toHaveLength(3)
  })

  it("masks only the variant that comes out from behind a line", () => {
    const { rerender } = render(<SplitText text="Quiet" variant="rise" />)
    expect(document.querySelectorAll("[data-slot='split-text-mask']")).toHaveLength(5)
    expect(pieces()[0].style.transform).toContain("110%")

    rerender(<SplitText text="Quiet" variant="fade" />)
    expect(document.querySelectorAll("[data-slot='split-text-mask']")).toHaveLength(0)
    expect(pieces()[0].style.opacity).toBe("0")

    rerender(<SplitText text="Quiet" variant="blur" />)
    expect(pieces()[0].style.filter).toContain("blur(8px)")
  })

  it("waits to be seen before it plays", async () => {
    const { rerender } = render(<SplitText text="Now" variant="fade" />)
    expect(pieces()[0].style.opacity).toBe("0")
    state.inView = true
    rerender(<SplitText text="Now" variant="fade" />)
    await waitFor(() => expect(Number(pieces()[0].style.opacity)).toBeGreaterThan(0))
  })

  it("plays straight away with the mount trigger", async () => {
    render(<SplitText text="Now" variant="fade" trigger="mount" />)
    await waitFor(() => expect(Number(pieces()[0].style.opacity)).toBeGreaterThan(0))
  })

  it("renders the plain text in the chosen tag when motion is off", () => {
    state.reduced = true
    render(<SplitText as="p" text="Plain words" />)
    expect(root().tagName).toBe("P")
    expect(root().textContent).toBe("Plain words")
    expect(pieces()).toHaveLength(0)
  })

  it("numbers pieces across words", () => {
    const words = splitText("ab cd", "chars")
    expect(words.map((word) => word.pieces.map((piece) => piece.index))).toEqual([[0, 1], [2, 3]])
    expect(splitText("  a   b ", "words")).toHaveLength(2)
    expect(splitText("", "chars")).toEqual([])
  })

  it("runs outward from the middle with the center origin and stays under the ceiling", () => {
    expect(pieceDelay(0, 5, "chars", "start")).toBe(0)
    expect(pieceDelay(4, 5, "chars", "start")).toBe(96)
    expect(pieceDelay(2, 5, "chars", "center")).toBe(0)
    expect(pieceDelay(0, 5, "chars", "center")).toBe(pieceDelay(4, 5, "chars", "center"))
    expect(pieceDelay(199, 200, "chars", "start")).toBeLessThanOrEqual(700)
    expect(pieceDelay(0, 1, "chars", "start")).toBe(0)
  })
})
