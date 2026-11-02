import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterAll, vi } from "vitest"
import { RevealImage } from "./reveal-image"

// jsdom has no canvas; null is what a browser returns when a 2D context cannot be created.
const getContext = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() => null)
afterAll(() => getContext.mockRestore())

const SRC = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='3'/%3E"
const wrapper = () => document.querySelector('[data-slot="reveal-image"]') as HTMLElement

describe("RevealImage", () => {
  it("renders the image with its alt text", () => {
    render(<RevealImage src={SRC} alt="Generated sunset" />)
    expect(screen.getByRole("img", { name: "Generated sunset" })).toHaveAttribute("src", SRC)
  })

  it("clamps progress to 0..1", () => {
    const { rerender } = render(<RevealImage src={SRC} alt="a" progress={-1} />)
    expect(wrapper()).toHaveAttribute("data-progress", "0")
    rerender(<RevealImage src={SRC} alt="a" progress={2} />)
    expect(wrapper()).toHaveAttribute("data-progress", "1")
  })

  it("exposes the mode and applies the matching effect", async () => {
    const { rerender } = render(<RevealImage src={SRC} alt="a" mode="blur" progress={0.5} />)
    expect(wrapper()).toHaveAttribute("data-mode", "blur")
    expect(screen.getByRole("img").style.filter).toContain("blur(12")
    // jsdom's CSSStyleDeclaration drops clip-path, so wipe is checked by what it does not do: no blur.
    // motion writes style changes on the next animation frame, hence waitFor.
    rerender(<RevealImage src={SRC} alt="a" mode="wipe" progress={0.25} />)
    expect(wrapper()).toHaveAttribute("data-mode", "wipe")
    await waitFor(() => expect(screen.getByRole("img").style.filter).not.toContain("blur"))
    rerender(<RevealImage src={SRC} alt="a" mode="pixelate" progress={0.5} />)
    expect(wrapper()).toHaveAttribute("data-mode", "pixelate")
    expect(screen.getByTestId("reveal-mosaic")).toBeInTheDocument()
  })

  it("shows the image plain once progress reaches 1", () => {
    const { rerender } = render(<RevealImage src={SRC} alt="a" />)
    expect(screen.getByRole("img").style.filter).not.toContain("blur")
    rerender(<RevealImage src={SRC} alt="a" mode="wipe" progress={1} />)
    expect(screen.getByRole("img").style.clipPath).not.toContain("inset")
  })

  it("keeps a blur under the mosaic so pixelate degrades to blur when the canvas cannot draw", () => {
    render(<RevealImage src={SRC} alt="a" mode="pixelate" progress={0.5} />)
    const image = screen.getByRole("img")
    // jsdom never decodes images; pretend this one did so the draw path runs and hits the null context.
    Object.defineProperty(image, "naturalWidth", { value: 4 })
    Object.defineProperty(image, "naturalHeight", { value: 3 })
    fireEvent.load(image)
    expect(getContext).toHaveBeenCalledWith("2d")
    expect(image.style.filter).toContain("blur(12")
  })
})
