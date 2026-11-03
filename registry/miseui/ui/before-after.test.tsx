import { act, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { BeforeAfter, type BeforeAfterProps, type BeforeAfterVariant } from "./before-after"
import { clampShare, clipFor, shareAlong, shareForKey, sweepFrames } from "./before-after-geometry"

const originalMatchMedia = window.matchMedia
let reducedMotion = false
const changeListeners: Array<() => void> = []
const views: Array<(entries: Array<{ isIntersecting: boolean }>) => void> = []

class ViewStub {
  constructor(callback: (entries: Array<{ isIntersecting: boolean }>) => void) {
    views.push(callback)
  }
  observe = vi.fn()
  disconnect = vi.fn()
}

beforeAll(() => {
  vi.stubGlobal("IntersectionObserver", ViewStub)
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      get matches() {
        return reducedMotion
      },
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: (_type: string, listener: () => void) => changeListeners.push(listener),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
})

afterAll(() => {
  vi.unstubAllGlobals()
  Object.defineProperty(window, "matchMedia", { configurable: true, writable: true, value: originalMatchMedia })
})

function setReducedMotion(value: boolean) {
  reducedMotion = value
  act(() => changeListeners.forEach((listener) => listener()))
}

afterEach(() => {
  setReducedMotion(false)
  views.splice(0)
})

const VARIANTS: readonly BeforeAfterVariant[] = ["split", "curtain", "lens"]

function Compare(props: Partial<BeforeAfterProps>) {
  return <BeforeAfter before={<div>Old screen</div>} after={<div>New screen</div>} {...props} />
}

const slider = () => screen.getByRole("slider")

function frameOf(container: HTMLElement) {
  const frame = container.querySelector("[data-slot='before-after-frame']") as HTMLElement
  vi.spyOn(frame, "getBoundingClientRect").mockReturnValue({ left: 0, top: 0, width: 200, height: 100 } as DOMRect)
  return frame
}

describe("before-after geometry", () => {
  it("clamps a share and survives NaN", () => {
    expect(clampShare(-4)).toBe(0)
    expect(clampShare(140)).toBe(100)
    expect(clampShare(Number.NaN)).toBe(0)
  })

  it("reads a pointer as a share, keeping the old one when there is no size", () => {
    expect(shareAlong(50, 0, 200, 9)).toBe(25)
    expect(shareAlong(500, 0, 200, 9)).toBe(100)
    expect(shareAlong(50, 0, 0, 9)).toBe(9)
  })

  it("moves with every slider key and ignores the rest", () => {
    expect(shareForKey("ArrowRight", 50, 5)).toBe(55)
    expect(shareForKey("ArrowLeft", 50, 5)).toBe(45)
    expect(shareForKey("ArrowUp", 50, 5)).toBe(45)
    expect(shareForKey("ArrowDown", 50, 5)).toBe(55)
    expect(shareForKey("PageUp", 50, 5)).toBe(60)
    expect(shareForKey("PageDown", 50, 5)).toBe(40)
    expect(shareForKey("Home", 50, 5)).toBe(0)
    expect(shareForKey("End", 50, 5)).toBe(100)
    expect(shareForKey("ArrowRight", 98, 5)).toBe(100)
    expect(shareForKey("Enter", 50, 5)).toBeNull()
  })

  it("clips differently per variant", () => {
    expect(clipFor("split", 30, 50)).toBe("inset(0 70% 0 0)")
    expect(clipFor("curtain", 30, 50)).toBe("inset(0 0 70% 0)")
    expect(clipFor("lens", 30, 60)).toContain("at 30% 60%")
  })

  it("sweeps out and comes back to where it began", () => {
    const frames = sweepFrames(50, 14)
    expect(frames[0]).toBe(frames.at(-1))
    expect(frames).toContain(36)
    expect(frames).toContain(64)
    expect(sweepFrames(5, 14)[1]).toBe(0)
  })
})

describe("BeforeAfter", () => {
  describe.each(VARIANTS)("variant=%s", (variant) => {
    it("is one slider with both versions on screen, moved by the keyboard", async () => {
      const user = userEvent.setup()
      const onValueChange = vi.fn()
      const { container } = render(<Compare variant={variant} onValueChange={onValueChange} />)
      expect(container.querySelector("figure")).toHaveAttribute("data-variant", variant)
      expect(screen.getByText("Old screen")).toBeInTheDocument()
      expect(screen.getByText("New screen")).toBeInTheDocument()
      expect(slider()).toHaveAttribute("aria-valuenow", "50")
      expect(slider()).toHaveAccessibleName("Compare before and after")
      await user.tab()
      expect(slider()).toHaveFocus()
      await user.keyboard("{ArrowRight}")
      expect(slider()).toHaveAttribute("aria-valuenow", "55")
      expect(onValueChange).toHaveBeenLastCalledWith(55)
      await user.keyboard("{Home}")
      expect(slider()).toHaveAttribute("aria-valuenow", "0")
      await user.keyboard("{End}")
      expect(slider()).toHaveAttribute("aria-valuenow", "100")
    })
  })

  it("builds each variant differently: which version is clipped and how the handle looks", () => {
    const shape = (variant: BeforeAfterVariant) => {
      const { container, unmount } = render(<Compare variant={variant} />)
      const clipLayer = container.querySelector("[data-slot='before-after-clip']") as HTMLElement
      const found = {
        clipped: clipLayer.textContent?.includes("Old screen") ? "before" : "after",
        orientation: slider().getAttribute("aria-orientation"),
        icon: slider().querySelector("svg") !== null,
      }
      unmount()
      return found
    }
    expect(shape("split")).toEqual({ clipped: "before", orientation: "horizontal", icon: true })
    expect(shape("curtain")).toEqual({ clipped: "before", orientation: "vertical", icon: true })
    expect(shape("lens")).toEqual({ clipped: "after", orientation: "horizontal", icon: false })
  })

  it("follows a horizontal drag on split and a vertical drag on curtain", () => {
    const onValueChange = vi.fn()
    const { container, unmount } = render(<Compare onValueChange={onValueChange} />)
    const frame = frameOf(container)
    fireEvent.pointerDown(frame, { clientX: 100, clientY: 10, button: 0, pointerId: 1 })
    fireEvent.pointerMove(frame, { clientX: 40, clientY: 90, pointerId: 1 })
    expect(onValueChange).toHaveBeenLastCalledWith(20)
    fireEvent.pointerUp(frame, { pointerId: 1 })
    fireEvent.pointerMove(frame, { clientX: 160, clientY: 90, pointerId: 1 })
    expect(onValueChange).toHaveBeenLastCalledWith(20)
    unmount()

    const onCurtain = vi.fn()
    const curtain = render(<Compare variant="curtain" onValueChange={onCurtain} />)
    const curtainFrame = frameOf(curtain.container)
    fireEvent.pointerDown(curtainFrame, { clientX: 10, clientY: 25, button: 0, pointerId: 1 })
    expect(onCurtain).toHaveBeenLastCalledWith(25)
  })

  it("lets a lens follow a mouse with no press, but not a finger", () => {
    const onValueChange = vi.fn()
    const { container } = render(<Compare variant="lens" onValueChange={onValueChange} />)
    const frame = frameOf(container)
    fireEvent.pointerMove(frame, { clientX: 40, clientY: 10, pointerType: "touch", pointerId: 1 })
    expect(onValueChange).not.toHaveBeenCalled()
    fireEvent.pointerMove(frame, { clientX: 40, clientY: 10, pointerType: "mouse", pointerId: 1 })
    expect(onValueChange).toHaveBeenLastCalledWith(20)
  })

  it("ignores everything when disabled, and leaves the tab order", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const { container } = render(<Compare disabled onValueChange={onValueChange} />)
    const frame = frameOf(container)
    fireEvent.pointerDown(frame, { clientX: 20, clientY: 10, button: 0, pointerId: 1 })
    expect(onValueChange).not.toHaveBeenCalled()
    expect(slider()).toHaveAttribute("aria-disabled", "true")
    await user.tab()
    expect(slider()).not.toHaveFocus()
  })

  it("follows a controlled value", () => {
    const { rerender } = render(<Compare value={20} />)
    expect(slider()).toHaveAttribute("aria-valuenow", "20")
    rerender(<Compare value={70} />)
    expect(slider()).toHaveAttribute("aria-valuenow", "70")
  })

  it("sweeps only when it comes into view, only with the effect, and reports no change", () => {
    const onValueChange = vi.fn()
    const { unmount } = render(<Compare onValueChange={onValueChange} />)
    expect(views).toHaveLength(0)
    unmount()
    render(<Compare effect="sweep" onValueChange={onValueChange} />)
    expect(views).toHaveLength(1)
    act(() => views[0]?.([{ isIntersecting: true }]))
    expect(onValueChange).not.toHaveBeenCalled()
    expect(slider()).toHaveAttribute("aria-valuenow", "50")
  })

  it("does not sweep under reduced motion", () => {
    setReducedMotion(true)
    render(<Compare effect="sweep" />)
    expect(views).toHaveLength(0)
  })

  it("keeps a chip out of the lens, where its round edge would cut the word in half", () => {
    render(<Compare variant="lens" beforeLabel="Old" afterLabel="New" />)
    expect(screen.getByText("Old")).toBeInTheDocument()
    expect(screen.queryByText("New")).not.toBeInTheDocument()
  })

  it("labels both versions and shows a caption", () => {
    render(<Compare beforeLabel="Old" afterLabel="New" caption="The checkout, a year apart" />)
    expect(screen.getByText("Old")).toBeInTheDocument()
    expect(screen.getByText("New")).toBeInTheDocument()
    expect(screen.getByText("The checkout, a year apart").tagName).toBe("FIGCAPTION")
  })
})
