import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ColorSwatch, ColorSwatchGroup, type ColorSwatchVariant } from "./color-swatch"
import { INK_DARK, INK_LIGHT, contrastRatio, parseColor, readableInk, relativeLuminance } from "./color-swatch-math"

const VARIANTS: readonly ColorSwatchVariant[] = ["circle", "square", "chip", "tile"]
const swatch = (container: HTMLElement) => container.querySelector("[data-slot='color-swatch']") as HTMLElement
const fill = (container: HTMLElement) => container.querySelector("[data-slot='color-swatch-fill']") as HTMLElement
const rgba = (color: string) => {
  const parsed = parseColor(color)
  if (!parsed) throw new Error(`Could not parse ${color}`)
  return parsed
}

describe("color maths", () => {
  it("parses hex in every length", () => {
    expect(parseColor("#fff")).toEqual({ r: 255, g: 255, b: 255, a: 1 })
    expect(parseColor("#2563eb")).toEqual({ r: 37, g: 99, b: 235, a: 1 })
    expect(parseColor("#00000080")?.a).toBeCloseTo(0.5, 2)
    expect(parseColor("#0008")?.a).toBeCloseTo(0.533, 2)
  })

  it("parses rgb and hsl in comma and space syntax", () => {
    expect(parseColor("rgb(10, 20, 30)")).toEqual({ r: 10, g: 20, b: 30, a: 1 })
    expect(parseColor("rgb(10 20 30 / 50%)")).toEqual({ r: 10, g: 20, b: 30, a: 0.5 })
    expect(parseColor("hsl(0 100% 50%)")).toMatchObject({ r: 255, g: 0, b: 0 })
    expect(parseColor("hsla(120, 100%, 25%, 0.5)")).toMatchObject({ r: 0, g: 127.5, b: 0, a: 0.5 })
  })

  it("converts oklch, the theme colour space, close to its sRGB value", () => {
    const white = rgba("oklch(1 0 0)")
    expect(white.r).toBeCloseTo(255, 0)
    const black = rgba("oklch(0 0 0)")
    expect(black.g).toBeCloseTo(0, 0)
    const red = rgba("oklch(0.628 0.2577 29.23)")
    expect(red.r).toBeGreaterThan(250)
    expect(red.g).toBeLessThan(10)
  })

  it("refuses what it cannot read", () => {
    expect(parseColor("var(--mise)")).toBeNull()
    expect(parseColor("#12")).toBeNull()
    expect(parseColor("rgb(a b c)")).toBeNull()
  })

  it("measures contrast by the WCAG formula", () => {
    expect(relativeLuminance(rgba("#fff"))).toBeCloseTo(1, 5)
    expect(contrastRatio(rgba("#000"), rgba("#fff"))).toBeCloseTo(21, 5)
  })

  it("picks the ink with the higher contrast, counting the checker under transparency", () => {
    expect(readableInk(rgba("#ffffff"))).toBe(INK_DARK)
    expect(readableInk(rgba("#1e3a8a"))).toBe(INK_LIGHT)
    expect(readableInk(rgba("#facc15"))).toBe(INK_DARK)
    // Solid black is dark, but at 10% it is mostly the pale checker beneath.
    expect(readableInk(rgba("rgb(0 0 0 / 10%)"))).toBe(INK_DARK)
    expect(readableInk(rgba("rgb(0 0 0 / 90%)"))).toBe(INK_LIGHT)
  })
})

describe("ColorSwatch", () => {
  it.each(VARIANTS)("%s shows name and value", (variant) => {
    const { container } = render(<ColorSwatch variant={variant} color="#2563eb" name="Ocean" />)
    expect(swatch(container)).toHaveAttribute("data-variant", variant)
    expect(screen.getByText("Ocean")).toBeInTheDocument()
    expect(screen.getByText("#2563eb")).toBeInTheDocument()
  })

  it("puts the label on the colour only for tile, in ink that reads on it", () => {
    const tile = render(<ColorSwatch variant="tile" color="#1e3a8a" name="Navy" />)
    expect(swatch(tile.container).style.color).toBe("rgb(255, 255, 255)")
    expect(fill(tile.container)).toHaveClass("absolute")
    tile.unmount()

    const square = render(<ColorSwatch variant="square" color="#1e3a8a" name="Navy" />)
    expect(swatch(square.container).style.color).toBe("")
    expect(fill(square.container)).not.toHaveClass("absolute")
  })

  it("marks a transparent colour, and leaves an opaque one alone", () => {
    const glass = render(<ColorSwatch color="rgb(37 99 235 / 40%)" name="Glass" />)
    expect(swatch(glass.container)).toHaveAttribute("data-transparent", "true")
    glass.unmount()
    const solid = render(<ColorSwatch color="#2563eb" name="Solid" />)
    expect(swatch(solid.container)).not.toHaveAttribute("data-transparent")
  })

  it("asks the browser about colours it cannot parse", async () => {
    const spy = vi.spyOn(window, "getComputedStyle").mockReturnValue({ backgroundColor: "rgb(0, 0, 0)" } as CSSStyleDeclaration)
    const { container } = render(<ColorSwatch variant="tile" color="var(--brand)" name="Brand" />)
    await waitFor(() => expect(swatch(container).style.color).toBe("rgb(255, 255, 255)"))
    spy.mockRestore()
  })

  it("stays a plain element until it can be selected, then reports pressed state and takes the keyboard", async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const plain = render(<ColorSwatch color="#2563eb" name="Ocean" />)
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
    plain.unmount()

    render(<ColorSwatch color="#2563eb" name="Ocean" selected onSelect={onSelect} />)
    const button = screen.getByRole("button", { name: /Ocean/ })
    expect(button).toHaveAttribute("aria-pressed", "true")
    button.focus()
    await user.keyboard("{Enter}")
    expect(onSelect).toHaveBeenCalledOnce()
  })

  it("lifts only when clicking is possible", () => {
    const still = render(<ColorSwatch effect="lift" color="#2563eb" name="Still" />)
    expect(swatch(still.container).className).not.toContain("hover:-translate-y")
    still.unmount()
    const live = render(<ColorSwatch effect="lift" color="#2563eb" name="Live" onSelect={() => undefined} />)
    expect(swatch(live.container).className).toContain("hover:-translate-y")
  })

  it("does not fire while disabled", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    const onSelect = vi.fn()
    render(<ColorSwatch color="#2563eb" name="Ocean" onSelect={onSelect} disabled />)
    await user.click(screen.getByRole("button"))
    expect(onSelect).not.toHaveBeenCalled()
  })
})

describe("ColorSwatchGroup", () => {
  it("is a named list that hands its look to every swatch", () => {
    const { container } = render(
      <ColorSwatchGroup variant="tile" aria-label="Brand palette">
        <ColorSwatch color="#2563eb" name="Ocean" />
        <ColorSwatch color="#059669" name="Pine" />
      </ColorSwatchGroup>,
    )
    expect(screen.getByRole("list", { name: "Brand palette" })).toHaveAttribute("data-variant", "tile")
    expect(screen.getAllByRole("listitem")).toHaveLength(2)
    expect(container.querySelectorAll("[data-slot='color-swatch'][data-variant='tile']")).toHaveLength(2)
  })
})
