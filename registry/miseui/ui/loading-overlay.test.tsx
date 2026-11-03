import { act, render, screen } from "@testing-library/react"
import { LoadingOverlay, type LoadingOverlayVariant } from "./loading-overlay"
import { remainingVisible } from "./loading-overlay-state"

const cover = (container: HTMLElement) => container.querySelector("[data-slot='loading-overlay-cover']")
const content = (container: HTMLElement) => container.querySelector("[data-slot='loading-overlay-content']") as HTMLElement
const root = (container: HTMLElement) => container.querySelector("[data-slot='loading-overlay']") as HTMLElement
const wait = (ms: number) => act(() => vi.advanceTimersByTime(ms))

describe("remainingVisible", () => {
  it("keeps the rest of the minimum, and never goes negative", () => {
    expect(remainingVisible(1000, 1100, 400)).toBe(300)
    expect(remainingVisible(1000, 1400, 400)).toBe(0)
    expect(remainingVisible(1000, 9000, 400)).toBe(0)
  })
})

describe("LoadingOverlay", () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it("marks the container busy at once, and shows nothing until the delay has passed", () => {
    const { container } = render(
      <LoadingOverlay loading delay={200}>
        <p>Orders</p>
      </LoadingOverlay>,
    )
    expect(root(container)).toHaveAttribute("aria-busy", "true")
    expect(cover(container)).toBeNull()
    wait(199)
    expect(cover(container)).toBeNull()
    wait(1)
    expect(cover(container)).not.toBeNull()
  })

  it("never flashes when the work finishes inside the delay", () => {
    const { container, rerender } = render(
      <LoadingOverlay loading delay={200}>
        <p>Orders</p>
      </LoadingOverlay>,
    )
    wait(100)
    rerender(
      <LoadingOverlay loading={false} delay={200}>
        <p>Orders</p>
      </LoadingOverlay>,
    )
    expect(root(container)).toHaveAttribute("aria-busy", "false")
    wait(1000)
    expect(cover(container)).toBeNull()
    expect(content(container)).not.toHaveAttribute("inert")
  })

  it("makes what is behind inert only while shown, and keeps it in the layout", () => {
    const { container, rerender } = render(
      <LoadingOverlay loading delay={0} minVisible={0}>
        <button type="button">Refund</button>
      </LoadingOverlay>,
    )
    wait(0)
    expect(content(container)).toHaveAttribute("inert")
    expect(screen.getByText("Refund")).toBeInTheDocument()
    rerender(
      <LoadingOverlay loading={false} delay={0} minVisible={0}>
        <button type="button">Refund</button>
      </LoadingOverlay>,
    )
    wait(0)
    expect(content(container)).not.toHaveAttribute("inert")
  })

  it("holds the cover for the minimum time so it cannot blink", () => {
    const { container, rerender } = render(
      <LoadingOverlay loading delay={0} minVisible={400}>
        <p>Orders</p>
      </LoadingOverlay>,
    )
    wait(0)
    wait(100)
    rerender(
      <LoadingOverlay loading={false} delay={0} minVisible={400}>
        <p>Orders</p>
      </LoadingOverlay>,
    )
    wait(299)
    expect(root(container)).toHaveAttribute("data-shown", "true")
    wait(1)
    expect(root(container)).toHaveAttribute("data-shown", "false")
  })

  it("speaks the label when shown through a region that was already there", () => {
    render(
      <LoadingOverlay loading delay={100} label="Refreshing orders">
        <p>Orders</p>
      </LoadingOverlay>,
    )
    const status = screen.getByRole("status")
    expect(status).toHaveTextContent("")
    wait(100)
    expect(status).toHaveTextContent("Refreshing orders")
  })

  it("hands focus back to the element that had it", () => {
    const { rerender } = render(
      <LoadingOverlay loading={false} delay={0} minVisible={0}>
        <button type="button">Refund</button>
      </LoadingOverlay>,
    )
    const button = screen.getByRole("button", { name: "Refund" })
    button.focus()
    rerender(
      <LoadingOverlay loading delay={0} minVisible={0}>
        <button type="button">Refund</button>
      </LoadingOverlay>,
    )
    wait(0)
    // jsdom does not drop focus for inert, so the browser's behaviour is played out here.
    act(() => button.blur())
    rerender(
      <LoadingOverlay loading={false} delay={0} minVisible={0}>
        <button type="button">Refund</button>
      </LoadingOverlay>,
    )
    wait(0)
    expect(button).toHaveFocus()
  })

  it("makes the variants differ in structure", () => {
    const shape = (variant: LoadingOverlayVariant) => {
      const { container, unmount } = render(
        <LoadingOverlay loading delay={0} variant={variant}>
          <p>Orders</p>
        </LoadingOverlay>,
      )
      wait(0)
      const result = {
        spinner: container.querySelector("[data-slot='spinner']") !== null,
        frosted: cover(container)?.className.includes("backdrop-blur") ?? false,
        bars: container.querySelector("[data-slot='loading-overlay-skeleton']") !== null,
        line: container.querySelector("[data-slot='loading-overlay-bar']") !== null,
      }
      unmount()
      return result
    }
    expect(shape("spinner")).toEqual({ spinner: true, frosted: false, bars: false, line: false })
    expect(shape("blur")).toEqual({ spinner: false, frosted: true, bars: false, line: false })
    expect(shape("skeleton")).toEqual({ spinner: false, frosted: false, bars: true, line: false })
    expect(shape("bar")).toEqual({ spinner: false, frosted: false, bars: false, line: true })
  })

  it("takes a custom skeleton and a surface for the cover", () => {
    const { container } = render(
      <LoadingOverlay loading delay={0} variant="skeleton" skeleton={<div>Custom bones</div>} overlayClassName="bg-card">
        <p>Orders</p>
      </LoadingOverlay>,
    )
    wait(0)
    expect(screen.getByText("Custom bones")).toBeInTheDocument()
    expect(cover(container)?.className).toContain("bg-card")
    expect(cover(container)?.className).not.toContain("bg-background")
  })
})
