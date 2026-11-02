import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { AspectRatio, ratioLabel, type AspectRatioVariant } from "./aspect-ratio"

const VARIANTS: readonly AspectRatioVariant[] = ["plain", "framed", "overlay", "placeholder"]
const root = (container: HTMLElement) => container.querySelector("[data-slot='aspect-ratio']") as HTMLElement
const wrapper = (container: HTMLElement) => container.querySelector("[data-radix-aspect-ratio-wrapper]") as HTMLElement

describe("ratioLabel", () => {
  it.each([
    [16 / 9, "16:9"],
    [4 / 3, "4:3"],
    [1, "1:1"],
    [4 / 5, "4:5"],
    [2.39, "2.39:1"],
  ])("names %f as %s", (ratio, label) => {
    expect(ratioLabel(ratio)).toBe(label)
  })

  it("returns nothing for a ratio that cannot exist", () => {
    expect(ratioLabel(0)).toBe("")
    expect(ratioLabel(Number.NaN)).toBe("")
  })
})

describe("AspectRatio", () => {
  it.each(VARIANTS)("reserves the height for the ratio in %s", (variant) => {
    const { container } = render(<AspectRatio variant={variant} ratio={2} />)
    expect(root(container)).toHaveAttribute("data-variant", variant)
    expect(wrapper(container).style.paddingBottom).toBe("50%")
  })

  it("puts the framed caption outside the media and the overlay caption over it", () => {
    const framed = render(<AspectRatio variant="framed" caption="Harbour at dusk" />)
    const framedCaption = screen.getByText("Harbour at dusk")
    expect(framedCaption.tagName).toBe("FIGCAPTION")
    expect(framedCaption).not.toHaveClass("absolute")
    expect(root(framed.container).tagName).toBe("FIGURE")
    framed.unmount()

    render(<AspectRatio variant="overlay" caption="Harbour at dusk" />)
    expect(screen.getByText("Harbour at dusk")).toHaveClass("absolute")
  })

  it("plain has no caption even when one is passed", () => {
    render(<AspectRatio caption="Not shown" />)
    expect(screen.queryByText("Not shown")).not.toBeInTheDocument()
  })

  it("placeholder is one named image that states its ratio", () => {
    render(<AspectRatio variant="placeholder" ratio={4 / 3} />)
    expect(screen.getByRole("img", { name: "Empty media slot, 4:3" })).toHaveAttribute("data-variant", "placeholder")
    expect(screen.getByText("4:3")).toBeInTheDocument()
  })

  it("reveal waits for the image to load", async () => {
    const { container } = render(
      <AspectRatio effect="reveal">
        <img src="/photo.jpg" alt="Harbour" />
      </AspectRatio>,
    )
    const media = container.querySelector("[data-slot='aspect-ratio-media']") as HTMLElement
    expect(root(container)).toHaveAttribute("data-effect", "reveal")
    expect(media).toHaveAttribute("data-ready", "false")
    fireEvent.load(screen.getByAltText("Harbour"))
    expect(media).toHaveAttribute("data-ready", "true")
  })

  it("reveal does not keep a broken image hidden", () => {
    const { container } = render(
      <AspectRatio effect="reveal">
        <img src="/missing.jpg" alt="Missing" />
      </AspectRatio>,
    )
    fireEvent.error(screen.getByAltText("Missing"))
    expect(container.querySelector("[data-slot='aspect-ratio-media']")).toHaveAttribute("data-ready", "true")
  })

  it("reveal shows media that was already cached before mount, and slots with no media", async () => {
    const complete = vi.spyOn(HTMLImageElement.prototype, "complete", "get").mockReturnValue(true)
    const cached = render(
      <AspectRatio effect="reveal">
        <img src="/cached.jpg" alt="Cached" />
      </AspectRatio>,
    )
    await waitFor(() =>
      expect(cached.container.querySelector("[data-slot='aspect-ratio-media']")).toHaveAttribute("data-ready", "true"),
    )
    complete.mockRestore()
    const empty = render(<AspectRatio effect="reveal">A chart</AspectRatio>)
    await waitFor(() =>
      expect(empty.container.querySelector("[data-slot='aspect-ratio-media']")).toHaveAttribute("data-ready", "true"),
    )
  })
})
