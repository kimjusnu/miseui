import { fireEvent, render, screen } from "@testing-library/react"
import { renderToString } from "react-dom/server"
import { GridBackground, pickGridBlocks, seededUnit } from "./grid-background"
import { pointerOffset } from "./grid-background-pointer"

const root = () => document.querySelector("[data-slot='grid-background']") as HTMLElement
const layer = () => document.querySelector("[data-slot='grid-background-layer']") as HTMLElement
const slot = (name: string) => document.querySelector<HTMLElement>(`[data-slot='${name}']`)

describe("pickGridBlocks", () => {
  it("gives the same cells for the same seed and other cells for another", () => {
    expect(pickGridBlocks(7)).toEqual(pickGridBlocks(7))
    expect(pickGridBlocks(8)).not.toEqual(pickGridBlocks(7))
  })

  it("keeps every cell inside the area, unique, and without a shared side", () => {
    for (const seed of [1, 2, 3, 7, 42, 1000]) {
      const blocks = pickGridBlocks(seed, 9, 10, 7)
      expect(blocks).toHaveLength(9)
      for (const block of blocks) {
        expect(block.col).toBeGreaterThanOrEqual(0)
        expect(block.col).toBeLessThan(10)
        expect(block.row).toBeGreaterThanOrEqual(0)
        expect(block.row).toBeLessThan(7)
        expect(block.strength).toBeGreaterThan(0)
        expect(block.strength).toBeLessThanOrEqual(1)
        const others = blocks.filter((other) => other !== block)
        expect(others.every((other) => Math.abs(other.col - block.col) + Math.abs(other.row - block.row) > 1)).toBe(true)
      }
    }
  })

  it("leaves several cells inside the narrowest demo cell with the default seed", () => {
    const visible = pickGridBlocks(7).filter((block) => block.col < 8 && block.row < 6)
    expect(visible.length).toBeGreaterThanOrEqual(4)
  })

  it("weakens cells further from the corner", () => {
    const blocks = pickGridBlocks(7)
    const corner = blocks.find((block) => block.col === 0 && block.row === 0)
    const far = blocks.find((block) => block.col === 9)
    expect(corner?.strength).toBe(1)
    expect(far?.strength).toBeLessThan(0.6)
  })

  it("hashes to a unit range without any stored state", () => {
    const values = Array.from({ length: 200 }, (_, index) => seededUnit(3, index))
    expect(values.every((value) => value >= 0 && value < 1)).toBe(true)
    expect(new Set(values).size).toBeGreaterThan(190)
    expect(seededUnit(3, 5)).toBe(values[5])
  })
})

describe("GridBackground", () => {
  it("draws one hidden layer behind and keeps the content outside it", () => {
    render(
      <GridBackground className="h-48">
        <button type="button">Open board</button>
      </GridBackground>,
    )
    expect(root()).toHaveClass("relative", "isolate", "overflow-clip", "h-48")
    expect(layer()).toHaveAttribute("aria-hidden", "true")
    expect(layer()).toHaveClass("pointer-events-none", "absolute", "inset-0")
    const button = screen.getByRole("button", { name: "Open board" })
    expect(layer().contains(button)).toBe(false)
    expect(slot("grid-background-content")).toHaveClass("relative")
    expect(root().className).not.toMatch(/\b(h-screen|min-h-screen|[\w-]*\d+vh)\b/)
  })

  it("draws a different structure for each variant", () => {
    const { rerender } = render(<GridBackground variant="lines" />)
    expect(slot("grid-background-lines")?.style.backgroundImage).toContain("linear-gradient")
    expect(slot("grid-background-lines")?.style.maskImage).toBeFalsy()
    expect(slot("grid-background-plane")).toBeNull()
    expect(document.querySelectorAll("[data-slot='grid-background-block']")).toHaveLength(0)

    rerender(<GridBackground variant="fade" />)
    expect(slot("grid-background-lines")?.style.maskImage).toContain("radial-gradient")

    rerender(<GridBackground variant="perspective" />)
    expect(slot("grid-background-lines")).toBeNull()
    expect(slot("grid-background-plane")?.style.transform).toMatch(/rotateX\(88deg\)/)
    expect(slot("grid-background-plane")?.parentElement?.style.perspective).toBe("100cqh")

    rerender(<GridBackground variant="blocks" />)
    expect(document.querySelectorAll("[data-slot='grid-background-block']")).toHaveLength(9)
    expect(root()).toHaveAttribute("data-variant", "blocks")
  })

  it("fades through a mask that ends at the box edge, so the box never shows", () => {
    render(<GridBackground variant="fade" />)
    const mask = slot("grid-background-lines")?.style.maskImage ?? ""
    expect(mask).toContain("closest-side")
    expect(mask).toContain("transparent 100%")
  })

  it("lines the blocks up with the grid: same corner, same cell", () => {
    render(<GridBackground variant="blocks" />)
    expect(slot("grid-background-lines")?.style.backgroundPosition).toBe("100% -1px")
    const block = slot("grid-background-block") as HTMLElement
    expect(block.style.width).toBe("var(--mise-grid-cell,32px)")
    expect(block.style.top).toContain("- 1px")
    expect(block).toHaveClass("bg-mise-soft")
  })

  it("renders the same markup twice, so a server render hydrates", () => {
    const html = () => renderToString(<GridBackground variant="blocks" seed={21} />)
    expect(html()).toBe(html())
  })

  it("steps aside for forced colours and high contrast", () => {
    render(<GridBackground />)
    expect(layer()).toHaveClass("forced-colors:hidden", "contrast-more:hidden")
  })

  it("has no pointer layer unless asked", () => {
    render(<GridBackground />)
    expect(slot("background-pointer-layer")).toBeNull()
    fireEvent.pointerMove(root(), { pointerType: "mouse", clientX: 10, clientY: 10 })
    expect(root()).not.toHaveAttribute("data-lit")
    expect(root().style.getPropertyValue("--mise-bg-x")).toBe("")
  })

  it("brightens a second masked copy around a mouse and lets it go on leave", () => {
    render(<GridBackground effect="pointer" />)
    const bright = slot("background-pointer-layer") as HTMLElement
    expect(bright.style.maskImage).toContain("var(--mise-bg-x)")
    expect(bright).toHaveClass("opacity-0")
    expect(bright.querySelector("[data-slot='grid-background-lines']")).not.toBeNull()

    root().getBoundingClientRect = () => ({ left: 10, top: 5, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) })
    fireEvent.pointerMove(root(), { pointerType: "mouse", clientX: 40, clientY: 25 })
    expect(root().style.getPropertyValue("--mise-bg-x")).toBe("30px")
    expect(root().style.getPropertyValue("--mise-bg-y")).toBe("20px")
    expect(bright).toHaveClass("opacity-100")
    expect(root()).toHaveAttribute("data-lit", "true")

    fireEvent.pointerLeave(root(), { pointerType: "mouse" })
    expect(bright).toHaveClass("opacity-0")
    expect(root()).not.toHaveAttribute("data-lit")
  })

  it("stays off for a finger", () => {
    render(<GridBackground effect="pointer" />)
    fireEvent.pointerMove(root(), { pointerType: "touch", clientX: 40, clientY: 25 })
    expect(root()).not.toHaveAttribute("data-lit")
    expect(root().style.getPropertyValue("--mise-bg-x")).toBe("")
  })

  it("follows the pointer over the content on top and never listens on window", () => {
    const onWindow = vi.spyOn(window, "addEventListener")
    render(
      <GridBackground effect="pointer">
        <button type="button">Open board</button>
      </GridBackground>,
    )
    fireEvent.pointerMove(screen.getByRole("button"), { pointerType: "mouse", clientX: 4, clientY: 4, bubbles: true })
    expect(root()).toHaveAttribute("data-lit", "true")
    const pointerCalls = onWindow.mock.calls.filter(([type]) => String(type).startsWith("pointer") || String(type).startsWith("mouse"))
    expect(pointerCalls).toHaveLength(0)
    onWindow.mockRestore()
  })

  it("calls the handlers and passes the attributes it was given", () => {
    const onPointerMove = vi.fn()
    const onPointerLeave = vi.fn()
    render(<GridBackground data-testid="hero" onPointerMove={onPointerMove} onPointerLeave={onPointerLeave} />)
    fireEvent.pointerMove(screen.getByTestId("hero"), { pointerType: "mouse" })
    fireEvent.pointerLeave(screen.getByTestId("hero"), { pointerType: "mouse" })
    expect(onPointerMove).toHaveBeenCalledTimes(1)
    expect(onPointerLeave).toHaveBeenCalledTimes(1)
  })
})

describe("pointerOffset", () => {
  it("measures from the top left of the box", () => {
    expect(pointerOffset(100, 80, { left: 30, top: 50 })).toEqual({ x: 70, y: 30 })
  })
})
