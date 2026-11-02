import { fireEvent, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ColorPicker, type ColorPickerVariant } from "./color-picker"
import { hexToHsva, hsvaToCss, hsvaToHex, hsvToRgb, normalizeHex, parseHex, rgbaToHex, rgbToHsv } from "./color-picker-math"

class ResizeObserverStub {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

const captured = new Set<number>()

beforeAll(() => {
  vi.stubGlobal("ResizeObserver", ResizeObserverStub)
  Element.prototype.setPointerCapture = (id: number) => void captured.add(id)
  Element.prototype.hasPointerCapture = (id: number) => captured.has(id)
  Element.prototype.releasePointerCapture = (id: number) => void captured.delete(id)
  Element.prototype.scrollIntoView = vi.fn()
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
    left: 100,
    top: 100,
    width: 200,
    height: 100,
    right: 300,
    bottom: 200,
    x: 100,
    y: 100,
    toJSON: () => ({}),
  })
})

afterAll(() => vi.unstubAllGlobals())
afterEach(() => captured.clear())

const slider = (name: string) => screen.getByRole("slider", { name })
const hexField = () => screen.getByRole("textbox", { name: "Hex color" })

describe("color math", () => {
  it.each([
    [{ h: 0, s: 1, v: 1, a: 1 }, { r: 255, g: 0, b: 0, a: 1 }],
    [{ h: 120, s: 1, v: 1, a: 1 }, { r: 0, g: 255, b: 0, a: 1 }],
    [{ h: 240, s: 1, v: 1, a: 0.5 }, { r: 0, g: 0, b: 255, a: 0.5 }],
    [{ h: 0, s: 0, v: 1, a: 1 }, { r: 255, g: 255, b: 255, a: 1 }],
    [{ h: 200, s: 0.5, v: 0, a: 1 }, { r: 0, g: 0, b: 0, a: 1 }],
    [{ h: 360, s: 1, v: 1, a: 1 }, { r: 255, g: 0, b: 0, a: 1 }],
  ])("hsvToRgb(%o)", (hsv, rgb) => {
    expect(hsvToRgb(hsv)).toEqual(rgb)
  })

  it("rgbToHsv reads hue, saturation and value, and gives grey no saturation", () => {
    expect(rgbToHsv({ r: 0, g: 0, b: 255, a: 1 })).toEqual({ h: 240, s: 1, v: 1, a: 1 })
    expect(rgbToHsv({ r: 128, g: 128, b: 128, a: 1 })).toMatchObject({ h: 0, s: 0 })
    expect(rgbToHsv({ r: 0, g: 0, b: 0, a: 1 })).toEqual({ h: 0, s: 0, v: 0, a: 1 })
  })

  it.each(["#2563eb", "#e11d48", "#000000", "#ffffff", "#7c3aed80"])("round-trips %s through HSV without losing a digit", (hex) => {
    const hsva = hexToHsva(hex)
    expect(hsva).not.toBeNull()
    expect(hsvaToHex(hsva as NonNullable<typeof hsva>)).toBe(hex)
  })

  it("parseHex takes the short forms and rejects everything else", () => {
    expect(parseHex("#fff")).toEqual({ r: 255, g: 255, b: 255, a: 1 })
    expect(parseHex("f00")).toEqual({ r: 255, g: 0, b: 0, a: 1 })
    expect(parseHex("#00000080")?.a).toBeCloseTo(0.5, 1)
    expect(parseHex("#12345")).toBeNull()
    expect(parseHex("blue")).toBeNull()
  })

  it("rgbaToHex keeps opaque colours at six digits and normalizeHex unifies spelling", () => {
    expect(rgbaToHex({ r: 255, g: 0, b: 0, a: 1 })).toBe("#ff0000")
    expect(rgbaToHex({ r: 255, g: 0, b: 0, a: 0 })).toBe("#ff000000")
    expect(normalizeHex("#F00")).toBe("#ff0000")
    expect(normalizeHex("nope")).toBeNull()
  })

  it("hsvaToCss writes modern rgb with alpha", () => {
    expect(hsvaToCss({ h: 0, s: 1, v: 1, a: 0.5 })).toBe("rgb(255 0 0 / 0.5)")
  })
})

describe("ColorPicker", () => {
  it("draws a different structure per variant", () => {
    const shape = (variant: ColorPickerVariant) => {
      const { container, unmount } = render(<ColorPicker variant={variant} defaultValue="#2563eb" />)
      const result = {
        trigger: screen.queryByRole("button") !== null,
        area: container.querySelector("[data-slot='color-picker-area']") !== null,
        hex: screen.queryByRole("textbox", { name: "Hex color" }) !== null,
        swatches: container.querySelector("[data-slot='color-picker-swatches']") !== null,
      }
      unmount()
      return result
    }
    expect(shape("popover")).toEqual({ trigger: true, area: false, hex: false, swatches: false })
    expect(shape("inline")).toEqual({ trigger: false, area: true, hex: true, swatches: true })
    expect(shape("swatches")).toEqual({ trigger: false, area: false, hex: false, swatches: true })
    expect(shape("compact")).toEqual({ trigger: true, area: false, hex: true, swatches: false })
  })

  it("opens the panel from the popover trigger, named with the current colour", async () => {
    const user = userEvent.setup()
    render(<ColorPicker defaultValue="#2563eb" label="Brand" />)
    await user.click(screen.getByRole("button", { name: "Brand: #2563eb" }))
    expect(await screen.findByRole("slider", { name: "Hue" })).toBeInTheDocument()
    expect(slider("Opacity")).toBeInTheDocument()
  })

  it("maps a press on the square one to one, and keeps following with the pointer captured", () => {
    const onValueChange = vi.fn()
    render(<ColorPicker variant="inline" defaultValue="#ff0000" onValueChange={onValueChange} />)
    const area = slider("Saturation and brightness")
    // The stubbed rect is left 100, top 100, 200 wide, 100 tall.
    fireEvent.pointerDown(area, { pointerId: 1, button: 0, clientX: 200, clientY: 150 })
    expect(area).toHaveAttribute("aria-valuetext", "Saturation 50%, brightness 50%")
    expect(captured.has(1)).toBe(true)
    fireEvent.pointerMove(area, { pointerId: 1, clientX: 300, clientY: 100 })
    expect(area).toHaveAttribute("aria-valuetext", "Saturation 100%, brightness 100%")
    expect(onValueChange).toHaveBeenLastCalledWith("#ff0000")
    // Far outside the element: the capture keeps it alive, and the value clamps instead of wrapping.
    fireEvent.pointerMove(area, { pointerId: 1, clientX: 900, clientY: 900 })
    expect(area).toHaveAttribute("aria-valuetext", "Saturation 100%, brightness 0%")
  })

  it("ignores a move with no press behind it", () => {
    render(<ColorPicker variant="inline" defaultValue="#ff0000" />)
    const area = slider("Saturation and brightness")
    fireEvent.pointerMove(area, { pointerId: 9, clientX: 100, clientY: 200 })
    expect(area).toHaveAttribute("aria-valuetext", "Saturation 100%, brightness 100%")
  })

  it("moves the square and the sliders by keyboard, ten times with Shift", async () => {
    const user = userEvent.setup()
    render(<ColorPicker variant="inline" defaultValue="#ff0000" />)
    slider("Saturation and brightness").focus()
    await user.keyboard("{ArrowLeft}{ArrowDown}")
    expect(slider("Saturation and brightness")).toHaveAttribute("aria-valuetext", "Saturation 99%, brightness 99%")
    await user.keyboard("{Shift>}{ArrowLeft}{/Shift}")
    expect(slider("Saturation and brightness")).toHaveAttribute("aria-valuetext", "Saturation 89%, brightness 99%")
    slider("Hue").focus()
    await user.keyboard("{ArrowRight}")
    expect(slider("Hue")).toHaveAttribute("aria-valuenow", "1")
    await user.keyboard("{End}")
    expect(slider("Hue")).toHaveAttribute("aria-valuenow", "360")
    slider("Opacity").focus()
    await user.keyboard("{Shift>}{ArrowLeft}{/Shift}")
    expect(slider("Opacity")).toHaveAttribute("aria-valuetext", "90%")
  })

  it("adds the alpha digits only once a colour is see-through, and alpha off removes the slider", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const { unmount } = render(<ColorPicker variant="inline" defaultValue="#ff0000" onValueChange={onValueChange} />)
    slider("Opacity").focus()
    await user.keyboard("{Home}")
    expect(onValueChange).toHaveBeenLastCalledWith("#ff000000")
    unmount()
    render(<ColorPicker variant="inline" defaultValue="#ff0000" alpha={false} />)
    expect(screen.queryByRole("slider", { name: "Opacity" })).toBeNull()
  })

  it("keeps the hue when the colour goes through black", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<ColorPicker variant="inline" defaultValue="#2563eb" onValueChange={onValueChange} />)
    const hue = Number(slider("Hue").getAttribute("aria-valuenow"))
    fireEvent.pointerDown(slider("Saturation and brightness"), { pointerId: 1, button: 0, clientX: 300, clientY: 200 })
    expect(onValueChange).toHaveBeenLastCalledWith("#000000")
    expect(slider("Hue")).toHaveAttribute("aria-valuenow", String(hue))
    await user.tab()
  })

  it("holds half-typed hex as a draft, flags it, and applies a real one on Enter", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<ColorPicker variant="compact" defaultValue="#2563eb" onValueChange={onValueChange} />)
    await user.clear(hexField())
    await user.type(hexField(), "#25")
    expect(hexField()).toHaveAttribute("aria-invalid", "true")
    expect(onValueChange).not.toHaveBeenCalled()
    await user.type(hexField(), "{Enter}")
    expect(hexField()).toHaveValue("#2563eb")
    await user.clear(hexField())
    await user.type(hexField(), "#E11D48{Enter}")
    expect(onValueChange).toHaveBeenLastCalledWith("#e11d48")
    expect(hexField()).toHaveValue("#e11d48")
  })

  it("treats swatches as one radio group with one tab stop and arrow keys", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<ColorPicker variant="swatches" defaultValue="#2563eb" label="Accent" onValueChange={onValueChange} />)
    const group = screen.getByRole("radiogroup", { name: "Accent" })
    const blue = within(group).getByRole("radio", { name: "Blue" })
    expect(blue).toBeChecked()
    expect(blue).toHaveAttribute("tabindex", "0")
    expect(within(group).getByRole("radio", { name: "Teal" })).toHaveAttribute("tabindex", "-1")
    await user.tab()
    expect(blue).toHaveFocus()
    await user.keyboard("{ArrowRight}")
    expect(onValueChange).toHaveBeenLastCalledWith("#0d9488")
    expect(within(group).getByRole("radio", { name: "Teal" })).toHaveFocus()
    expect(within(group).getByRole("radio", { name: "Teal" })).toBeChecked()
    await user.click(within(group).getByRole("radio", { name: "Rose" }))
    expect(onValueChange).toHaveBeenLastCalledWith("#e11d48")
  })

  it("draws the selection ring on the chosen swatch only", () => {
    const { container } = render(<ColorPicker variant="swatches" defaultValue="#2563eb" />)
    expect(container.querySelectorAll("[data-slot='color-picker-swatch-ring']")).toHaveLength(1)
    expect(screen.getByRole("radio", { name: "Blue" }).querySelector("[data-slot='color-picker-swatch-ring']")).not.toBeNull()
  })

  it("accepts plain hex swatches and names them by their hex", () => {
    render(<ColorPicker variant="swatches" swatches={["#101010"]} value="#101010" />)
    expect(screen.getByRole("radio", { name: "#101010" })).toBeChecked()
  })

  it("follows a controlled value and ignores no external change", () => {
    const onValueChange = vi.fn()
    const { rerender } = render(<ColorPicker variant="compact" value="#2563eb" onValueChange={onValueChange} />)
    expect(hexField()).toHaveValue("#2563eb")
    rerender(<ColorPicker variant="compact" value="#e11d48" onValueChange={onValueChange} />)
    expect(hexField()).toHaveValue("#e11d48")
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it("does not move or take focus when disabled", () => {
    const onValueChange = vi.fn()
    render(<ColorPicker variant="inline" defaultValue="#ff0000" disabled onValueChange={onValueChange} />)
    const area = slider("Saturation and brightness")
    expect(area).toHaveAttribute("aria-disabled", "true")
    expect(area).toHaveAttribute("tabindex", "-1")
    fireEvent.pointerDown(area, { pointerId: 1, button: 0, clientX: 100, clientY: 200 })
    expect(onValueChange).not.toHaveBeenCalled()
    expect(hexField()).toBeDisabled()
  })

  it("posts the hex with a form and marks the root", () => {
    const { container } = render(<ColorPicker variant="swatches" effect="spring" name="accent" defaultValue="#2563eb" />)
    expect(container.querySelector("input[type='hidden']")).toHaveValue("#2563eb")
    const root = container.querySelector("[data-slot='color-picker']")
    expect(root).toHaveAttribute("data-variant", "swatches")
    expect(root).toHaveAttribute("data-effect", "spring")
  })

  it("keeps working with the spring on: press jumps, a move still lands exactly", () => {
    render(<ColorPicker variant="inline" effect="spring" defaultValue="#ff0000" />)
    const area = slider("Saturation and brightness")
    fireEvent.pointerDown(area, { pointerId: 1, button: 0, clientX: 150, clientY: 125 })
    expect(area).toHaveAttribute("aria-valuetext", "Saturation 25%, brightness 75%")
    fireEvent.pointerMove(area, { pointerId: 1, clientX: 250, clientY: 175 })
    expect(area).toHaveAttribute("aria-valuetext", "Saturation 75%, brightness 25%")
    fireEvent.pointerUp(area, { pointerId: 1 })
  })
})
