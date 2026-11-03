import { render, screen } from "@testing-library/react"
import { RollText, letterDelay } from "./roll-text"

const state = vi.hoisted(() => ({ reduced: false }))

vi.mock("motion/react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("motion/react")>()),
  useReducedMotion: () => state.reduced,
}))

afterEach(() => {
  state.reduced = false
})

const root = () => document.querySelector("[data-slot='roll-text']") as HTMLElement
const copies = () => root().querySelectorAll("[data-slot='roll-text-copy']")

describe("RollText", () => {
  it("gives assistive tech the plain label once and hides the moving copies", () => {
    render(<RollText text="Pricing" />)
    expect(screen.getByText("Pricing", { selector: ".sr-only" })).toBeInTheDocument()
    expect(copies()).toHaveLength(1)
    expect(copies()[0].closest("[aria-hidden='true']")).not.toBeNull()
  })

  it("builds a different structure for each variant", () => {
    const { rerender } = render(<RollText text="Read more" variant="word" />)
    expect(root().querySelector("[data-slot='roll-text-clip']")).not.toBeNull()
    expect(root().querySelector("[data-slot='roll-text-letter']")).toBeNull()

    rerender(<RollText text="Read more" variant="letters" />)
    expect(root().querySelectorAll("[data-slot='roll-text-letter']")).toHaveLength(8)
    expect(copies()).toHaveLength(8)

    rerender(<RollText text="Read more" variant="flip" />)
    expect(root().querySelector("[data-slot='roll-text-stage']")).not.toBeNull()
    expect(copies()[0].className).toContain("rotateX(-90deg)")
  })

  it("counts wide characters as single letters", () => {
    render(<RollText text="더 보기" variant="letters" />)
    expect(root().querySelectorAll("[data-slot='roll-text-letter']")).toHaveLength(3)
  })

  it("rolls with its own hover or a parent group, depending on the trigger", () => {
    const { rerender } = render(<RollText text="Docs" />)
    expect(root().innerHTML).toContain("group-hover/roll:-translate-y-full")
    rerender(<RollText text="Docs" trigger="parent" />)
    expect(root().innerHTML).toContain("group-hover:-translate-y-full")
    expect(root().innerHTML).not.toContain("group-hover/roll:-translate-y-full")
  })

  it("shows only the new word after the text changes with the change effect", async () => {
    const { rerender } = render(<RollText text="Save" effect="change" />)
    expect(root()).toHaveAttribute("data-effect", "change")
    rerender(<RollText text="Saved" effect="change" />)
    expect(screen.getByText("Saved", { selector: ".sr-only" })).toBeInTheDocument()
    expect(screen.queryByText("Save", { selector: ".sr-only" })).toBeNull()
    expect(root().querySelector("[aria-hidden='true']")).toHaveTextContent("Saved")
  })

  it("renders the plain text with no copies when motion is off", () => {
    state.reduced = true
    render(<RollText text="Pricing" variant="letters" />)
    expect(root()).toHaveAttribute("data-reduced", "true")
    expect(root()).toHaveTextContent("Pricing")
    expect(copies()).toHaveLength(0)
  })

  it("keeps the whole wave under its ceiling however long the label", () => {
    expect(letterDelay(0, 10)).toBe(0)
    expect(letterDelay(3, 10)).toBe(54)
    expect(letterDelay(99, 100)).toBeLessThanOrEqual(240)
  })
})
