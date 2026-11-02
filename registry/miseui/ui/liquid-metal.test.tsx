import { render, screen } from "@testing-library/react"
import { afterAll, vi } from "vitest"
import { LiquidMetal } from "./liquid-metal"

// jsdom has no WebGL. Returning null (not jsdom's "not implemented" undefined) is what a real browser does without it.
const getContext = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() => null)
afterAll(() => getContext.mockRestore())

const host = () => document.querySelector('[data-slot="liquid-metal"]') as HTMLElement

describe("LiquidMetal", () => {
  it("renders its children on top of the surface", () => {
    render(
      <LiquidMetal>
        <button>Continue</button>
      </LiquidMetal>,
    )
    expect(screen.getByRole("button", { name: "Continue" })).toBeInTheDocument()
  })

  it("falls back to plain children when WebGL2 is unavailable", () => {
    render(
      <LiquidMetal>
        <span>Chip</span>
      </LiquidMetal>,
    )
    expect(host()).toHaveAttribute("data-fallback", "true")
    expect(host().querySelector("canvas")).toBeNull()
    expect(screen.getByText("Chip")).toBeInTheDocument()
  })

  it("clamps intensity to 0..1 and exposes it with the tint", () => {
    const { rerender } = render(
      <LiquidMetal intensity={-1} tint="mise">
        <span>Go</span>
      </LiquidMetal>,
    )
    expect(host()).toHaveAttribute("data-intensity", "0")
    expect(host()).toHaveAttribute("data-tint", "mise")
    rerender(
      <LiquidMetal intensity={2}>
        <span>Go</span>
      </LiquidMetal>,
    )
    expect(host()).toHaveAttribute("data-intensity", "1")
    expect(host()).toHaveAttribute("data-tint", "silver")
    rerender(
      <LiquidMetal intensity={0.4}>
        <span>Go</span>
      </LiquidMetal>,
    )
    expect(host()).toHaveAttribute("data-intensity", "0.4")
  })

  it("unmounts without throwing", () => {
    const { unmount } = render(
      <LiquidMetal speed={2}>
        <span>Go</span>
      </LiquidMetal>,
    )
    expect(() => unmount()).not.toThrow()
  })
})
