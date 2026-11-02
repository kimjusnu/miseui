import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Rating, glyphFill, ratingSteps, type RatingProps, type RatingVariant } from "./rating"

class ResizeObserverStub {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

beforeAll(() => vi.stubGlobal("ResizeObserver", ResizeObserverStub))
afterAll(() => vi.unstubAllGlobals())

const VARIANTS: readonly RatingVariant[] = ["stars", "hearts", "numeric", "bar"]
const radio = (name: string) => screen.getByRole("radio", { name })
const root = (container: HTMLElement) => container.querySelector("[data-slot='rating']") as HTMLElement
const fills = (container: HTMLElement) =>
  Array.from(container.querySelectorAll("[data-slot='rating-glyph']")).map((node) => node.getAttribute("data-fill"))

function Sample(props: RatingProps) {
  return <Rating aria-label="Rate this course" {...props} />
}

describe("rating helpers", () => {
  it("lists every value that can be picked", () => {
    expect(ratingSteps(5, 1)).toEqual([1, 2, 3, 4, 5])
    expect(ratingSteps(2, 0.5)).toEqual([0.5, 1, 1.5, 2])
  })

  it("works out how much of a glyph a value covers", () => {
    expect(glyphFill(1, 3.5)).toBe(1)
    expect(glyphFill(4, 3.5)).toBe(0.5)
    expect(glyphFill(5, 3.5)).toBe(0)
    expect(glyphFill(1, 0)).toBe(0)
  })
})

describe("Rating", () => {
  describe.each(VARIANTS)("variant=%s", (variant) => {
    it("is a radio group with one named radio per value", async () => {
      const user = userEvent.setup()
      const onValueChange = vi.fn()
      const { container } = render(<Sample variant={variant} onValueChange={onValueChange} />)
      expect(screen.getByRole("radiogroup", { name: "Rate this course" })).toBe(root(container))
      expect(root(container)).toHaveAttribute("data-variant", variant)
      expect(screen.getAllByRole("radio")).toHaveLength(5)
      await user.click(radio("4 out of 5"))
      expect(radio("4 out of 5")).toBeChecked()
      expect(onValueChange).toHaveBeenCalledWith(4)
    })

    it("moves through the values with the arrow keys", async () => {
      const user = userEvent.setup()
      render(<Sample variant={variant} defaultValue={2} />)
      await user.click(radio("2 out of 5"))
      await user.keyboard("{ArrowRight>}")
      await waitFor(() => expect(radio("3 out of 5")).toHaveFocus())
      await user.keyboard("{/ArrowRight}")
      expect(radio("3 out of 5")).toBeChecked()
    })

    it("draws marks without any radio when read-only", () => {
      const { container } = render(<Sample variant={variant} readOnly value={3} />)
      expect(screen.queryByRole("radio")).not.toBeInTheDocument()
      expect(screen.getByRole("img", { name: "Rate this course: 3 out of 5" })).toBe(root(container))
    })

    it("cannot be changed while disabled", async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 })
      const onValueChange = vi.fn()
      render(<Sample variant={variant} disabled defaultValue={1} onValueChange={onValueChange} />)
      await user.click(radio("3 out of 5"))
      expect(onValueChange).not.toHaveBeenCalled()
      expect(radio("1 out of 5")).toBeChecked()
    })
  })

  it("has a different structure per variant", () => {
    const stars = render(<Sample variant="stars" defaultValue={3} />)
    expect(stars.container.querySelectorAll("[data-slot='rating-glyph']")).toHaveLength(5)
    expect(stars.container.querySelector("[data-slot='rating-value']")).toHaveTextContent("3")
    stars.unmount()

    const hearts = render(<Sample variant="hearts" defaultValue={3} />)
    expect(hearts.container.querySelector("svg")).toHaveClass("lucide-heart")
    expect(hearts.container.querySelector("[data-slot='rating-value']")).toBeNull()
    hearts.unmount()

    const numeric = render(<Sample variant="numeric" defaultValue={3} />)
    expect(numeric.container.querySelector("svg")).toBeNull()
    expect(radio("3 out of 5")).toHaveTextContent("3")
    expect(radio("3 out of 5")).toHaveClass("bg-mise")
    numeric.unmount()

    const bar = render(<Sample variant="bar" defaultValue={3} />)
    expect(bar.container.querySelectorAll("[data-filled='true']")).toHaveLength(3)
    expect(bar.container.querySelector("[data-slot='rating-value']")).toHaveTextContent("3 / 5")
  })

  it("splits each glyph into two radios for half steps", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const { container } = render(<Sample step={0.5} onValueChange={onValueChange} />)
    expect(screen.getAllByRole("radio")).toHaveLength(10)
    await user.click(radio("2.5 out of 5"))
    expect(onValueChange).toHaveBeenCalledWith(2.5)
    expect(fills(container)).toEqual(["1", "1", "0.5", "0", "0"])
  })

  it("keeps numeric on whole numbers even with half steps asked for", () => {
    render(<Sample variant="numeric" step={0.5} />)
    expect(screen.getAllByRole("radio")).toHaveLength(5)
  })

  it("previews on hover without choosing, and goes back on leave", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const { container } = render(<Sample defaultValue={1} onValueChange={onValueChange} />)
    await user.hover(radio("4 out of 5"))
    expect(fills(container)).toEqual(["1", "1", "1", "1", "0"])
    expect(onValueChange).not.toHaveBeenCalled()
    expect(radio("1 out of 5")).toBeChecked()
    await user.unhover(root(container))
    expect(fills(container)).toEqual(["1", "0", "0", "0", "0"])
  })

  it("does not let a touch set a preview", () => {
    const { container } = render(<Sample defaultValue={1} />)
    fireEvent.pointerEnter(radio("4 out of 5"), { pointerType: "touch" })
    expect(fills(container)).toEqual(["1", "0", "0", "0", "0"])
  })

  it("follows a controlled value", () => {
    const { container, rerender } = render(<Sample value={1} />)
    expect(fills(container)).toEqual(["1", "0", "0", "0", "0"])
    rerender(<Sample value={3} />)
    expect(fills(container)).toEqual(["1", "1", "1", "0", "0"])
  })

  it("pops only after a pick, and only with the effect", async () => {
    const user = userEvent.setup()
    const plain = render(<Sample />)
    await user.click(radio("2 out of 5"))
    expect(plain.container.querySelector("[data-slot='rating-pop']")).toBeNull()
    plain.unmount()

    const { container } = render(<Sample effect="pop" />)
    expect(container.querySelector("[data-slot='rating-pop']")).toBeNull()
    await user.click(radio("2 out of 5"))
    expect(container.querySelector("[data-slot='rating-pop']")).not.toBeNull()
  })

  it("posts the value with a form", async () => {
    const user = userEvent.setup()
    const { container } = render(
      <form>
        <Sample name="score" />
      </form>,
    )
    await user.click(radio("5 out of 5"))
    const data = new FormData(container.querySelector("form") as HTMLFormElement)
    expect(data.get("score")).toBe("5")
  })
})
