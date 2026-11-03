import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useRef, useState } from "react"
import { Tour, type TourProps, type TourStep, type TourVariant } from "./tour"
import { findStep, isInViewport, padRect, placePopover } from "./tour-math"

let observers: Array<{ callback: () => void; disconnect: ReturnType<typeof vi.fn> }> = []

class ResizeObserverStub {
  callback: () => void
  disconnect = vi.fn()
  observe = vi.fn()
  unobserve = vi.fn()
  constructor(callback: () => void) {
    this.callback = callback
    observers = [...observers, this]
  }
}

const scrollIntoView = vi.fn()

beforeAll(() => {
  vi.stubGlobal("ResizeObserver", ResizeObserverStub)
  Element.prototype.scrollIntoView = scrollIntoView
})

afterAll(() => vi.unstubAllGlobals())

afterEach(() => {
  observers = []
  scrollIntoView.mockClear()
})

const VIEWPORT = { width: 1000, height: 800 }
const POPOVER = { width: 300, height: 200 }
const place = (target: Parameters<typeof placePopover>[0]["target"], placement?: "top" | "left" | "auto") =>
  placePopover({ target, popover: POPOVER, viewport: VIEWPORT, placement, gap: 10, margin: 8 })

describe("tour maths", () => {
  it("prefers below, centred on the target", () => {
    expect(place({ x: 400, y: 100, width: 200, height: 40 })).toEqual({ x: 350, y: 150, side: "bottom" })
  })

  it("flips above when there is no room below", () => {
    expect(place({ x: 400, y: 700, width: 200, height: 40 })).toEqual({ x: 350, y: 490, side: "top" })
  })

  it("honours a side that fits and gives up one that does not", () => {
    expect(place({ x: 400, y: 300, width: 200, height: 40 }, "left").side).toBe("left")
    expect(place({ x: 100, y: 300, width: 200, height: 40 }, "left").side).toBe("bottom")
  })

  it("never leaves the viewport", () => {
    const corner = place({ x: 0, y: 0, width: 10, height: 10 })
    expect(corner.x).toBe(8)
    const farRight = place({ x: 980, y: 100, width: 10, height: 10 })
    expect(farRight.x + POPOVER.width).toBeLessThanOrEqual(VIEWPORT.width - 8)
  })

  it("takes the side that misses by least when nothing fits, and pins an oversized popover to the leading edge", () => {
    const tiny = placePopover({ target: { x: 10, y: 50, width: 10, height: 10 }, popover: POPOVER, viewport: { width: 320, height: 240 } })
    expect(tiny.side).toBe("right")
    const wide = placePopover({ target: null, popover: { width: 400, height: 100 }, viewport: { width: 320, height: 240 } })
    expect(wide.x).toBe(8)
  })

  it("centres a step without a target", () => {
    expect(place(null)).toEqual({ x: 350, y: 300, side: null })
  })

  it("pads rectangles and tests visibility", () => {
    expect(padRect({ x: 10, y: 10, width: 20, height: 20 }, 4)).toEqual({ x: 6, y: 6, width: 28, height: 28 })
    expect(isInViewport({ x: 0, y: 0, width: 10, height: 10 }, VIEWPORT)).toBe(true)
    expect(isInViewport({ x: 0, y: 795, width: 10, height: 10 }, VIEWPORT)).toBe(false)
    expect(isInViewport({ x: -1, y: 0, width: 10, height: 10 }, VIEWPORT)).toBe(false)
  })

  it("finds the next available step in either direction", () => {
    const has = (value: string) => value !== "gone"
    expect(findStep(["a", "gone", "c"], 1, 1, has)).toBe(2)
    expect(findStep(["a", "gone", "c"], 1, -1, has)).toBe(0)
    expect(findStep(["gone"], 0, 1, has)).toBe(-1)
    expect(findStep(["a"], 1, 1, has)).toBe(-1)
  })
})

const STEPS: readonly TourStep[] = [
  { target: "#first", title: "Your projects", body: "Everything lives here." },
  { target: "#missing", title: "Never shown" },
  { target: "#second", title: "Invite people", body: "Work together." },
  { title: "All set", body: "A step about the whole page." },
]

const setup = () => userEvent.setup({ pointerEventsCheck: 0 })
const title = (name: string) => screen.getByRole("dialog", { name })
const next = () => screen.getByRole("button", { name: "Next" })

function Page(props: Partial<TourProps>) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" id="first">Projects</button>
      <button type="button" id="second">Invite</button>
      <button type="button" onClick={() => setOpen(true)}>Start</button>
      <Tour steps={STEPS} open={open} onOpenChange={setOpen} {...props} />
    </>
  )
}

async function start(props: Partial<TourProps> = {}) {
  const user = setup()
  render(<Page {...props} />)
  await user.click(screen.getByRole("button", { name: "Start" }))
  return user
}

describe("Tour", () => {
  it("opens on the first step, named by its title, with focus on the main action", async () => {
    await start()
    expect(title("Your projects")).toBeInTheDocument()
    expect(title("Your projects")).toHaveAccessibleDescription("Everything lives here.")
    expect(next()).toHaveFocus()
    expect(screen.getByText("1 of 3")).toBeInTheDocument()
  })

  it("skips a missing target in both directions and leaves it out of the count", async () => {
    const user = await start()
    await user.click(next())
    expect(title("Invite people")).toBeInTheDocument()
    expect(screen.getByText("2 of 3")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Back" }))
    expect(title("Your projects")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Back" })).not.toBeInTheDocument()
  })

  it("moves with the arrow keys and keeps focus on the main action", async () => {
    const user = await start()
    await user.keyboard("{ArrowRight}")
    expect(title("Invite people")).toBeInTheDocument()
    expect(next()).toHaveFocus()
    await user.keyboard("{ArrowLeft}")
    expect(title("Your projects")).toBeInTheDocument()
    expect(next()).toHaveFocus()
    await user.keyboard("{ArrowLeft}")
    expect(title("Your projects")).toBeInTheDocument()
  })

  it("closes on Escape, without finishing, and gives focus back", async () => {
    const onFinish = vi.fn()
    const user = await start({ onFinish })
    await user.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(onFinish).not.toHaveBeenCalled()
    await waitFor(() => expect(screen.getByRole("button", { name: "Start" })).toHaveFocus())
  })

  it("finishes after the last step", async () => {
    const onFinish = vi.fn()
    const onStepChange = vi.fn()
    const user = await start({ onFinish, onStepChange })
    await user.click(next())
    await user.click(next())
    expect(title("All set")).toBeInTheDocument()
    expect(onStepChange.mock.calls.map(([index]) => index)).toEqual([2, 3])
    await user.click(screen.getByRole("button", { name: "Done" }))
    expect(onFinish).toHaveBeenCalledOnce()
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("measures the card on the first step, although the portal mounts after the first layout effect", async () => {
    const width = vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(320)
    const rect = { left: 10, top: 100, right: 110, bottom: 140, width: 100, height: 40, x: 10, y: 100, toJSON: () => ({}) }
    const box = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(rect)
    await start()
    // Centred on the target it would start at -100, so it pins to the 8 px margin. Unmeasured, it would start at 60.
    await waitFor(() => expect(screen.getByRole("dialog").style.transform).toContain("translateX(8px)"))
    width.mockRestore()
    box.mockRestore()
  })

  it("scrolls a target into view only when it is out of view", async () => {
    const rect = (top: number) => ({ left: 10, top, right: 110, bottom: top + 40, width: 100, height: 40, x: 10, y: top, toJSON: () => ({}) })
    const spy = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(rect(100))
    const user = await start()
    expect(scrollIntoView).not.toHaveBeenCalled()
    spy.mockReturnValue(rect(5000))
    await user.click(next())
    expect(scrollIntoView).toHaveBeenCalledTimes(1)
    spy.mockRestore()
  })

  it("measures the target with its padding and follows it on resize", async () => {
    const rect = (left: number) => ({ left, top: 100, right: left + 100, bottom: 140, width: 100, height: 40, x: left, y: 100, toJSON: () => ({}) })
    const spy = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(rect(50))
    await start({ padding: 4 })
    const highlight = () => document.querySelector("[data-slot='tour-highlight']") as HTMLElement
    expect(highlight()).toHaveAttribute("data-rect", "46,96,108,48")
    spy.mockReturnValue(rect(200))
    fireEvent(window, new Event("resize"))
    await waitFor(() => expect(highlight()).toHaveAttribute("data-rect", "196,96,108,48"))
    spy.mockRestore()
  })

  it("stops listening when closed", async () => {
    const removeSpy = vi.spyOn(window, "removeEventListener")
    const user = await start()
    await user.keyboard("{Escape}")
    await waitFor(() => expect(removeSpy.mock.calls.some(([type]) => type === "resize")).toBe(true))
    expect(observers.every((observer) => observer.disconnect.mock.calls.length > 0)).toBe(true)
    removeSpy.mockRestore()
  })

  it("takes a ref as a target", () => {
    const WithRef = () => {
      const ref = useRef<HTMLButtonElement>(null)
      const [ready, setReady] = useState(false)
      return (
        <>
          <button ref={ref} type="button" onClick={() => setReady(true)}>Target</button>
          <Tour steps={[{ target: ref, title: "By ref" }]} open={ready} />
        </>
      )
    }
    render(<WithRef />)
    act(() => screen.getByRole("button", { name: "Target" }).click())
    expect(screen.getByRole("dialog", { name: "By ref" })).toBeInTheDocument()
  })

  it("closes itself when no step can be shown", async () => {
    const onOpenChange = vi.fn()
    render(<Tour steps={[{ target: "#nowhere", title: "No" }, { target: "[[bad", title: "Bad selector" }]} defaultOpen onOpenChange={onOpenChange} />)
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("does not close on an outside click", async () => {
    const user = await start({ variant: "popover" })
    await user.click(screen.getByRole("button", { name: "Projects" }))
    expect(title("Your projects")).toBeInTheDocument()
  })

  it("makes the variants differ in structure", async () => {
    const shape = async (variant: TourVariant) => {
      const { unmount } = render(
        <>
          <button type="button" id="first">Projects</button>
          <Tour steps={STEPS} variant={variant} defaultOpen />
        </>,
      )
      await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument())
      const root = document.querySelector("[data-slot='tour']") as HTMLElement
      const result = {
        dim: document.querySelector("[data-dim='true']") !== null,
        ring: document.querySelector("[data-slot='tour-highlight']") !== null,
        list: document.querySelector("[data-slot='tour-checklist']") !== null,
        bottomBar: root.className.includes("inset-x-0"),
      }
      unmount()
      return result
    }
    expect(await shape("spotlight")).toEqual({ dim: true, ring: true, list: false, bottomBar: false })
    expect(await shape("popover")).toEqual({ dim: false, ring: true, list: false, bottomBar: false })
    expect(await shape("banner")).toEqual({ dim: false, ring: true, list: false, bottomBar: true })
    expect(await shape("checklist")).toEqual({ dim: false, ring: true, list: true, bottomBar: false })
  })

  it("lists every step in a checklist, marks the current one and jumps on click", async () => {
    const user = setup()
    render(
      <>
        <button type="button" id="first">Projects</button>
        <button type="button" id="second">Invite</button>
        <Tour steps={STEPS} variant="checklist" defaultOpen title="Getting started" />
      </>,
    )
    expect(screen.getByRole("dialog", { name: "Getting started" })).toBeInTheDocument()
    const row = (name: string) => screen.getByRole("button", { name })
    expect(screen.queryByRole("button", { name: "Never shown" })).not.toBeInTheDocument()
    expect(row("Your projects")).toHaveAttribute("aria-current", "step")
    await user.click(row("All set"))
    expect(row("All set")).toHaveAttribute("aria-current", "step")
    expect(screen.getByText("A step about the whole page.")).toBeInTheDocument()
  })

  it("finds targets that mount together with a tour open from the start", () => {
    render(
      <>
        <button type="button" id="first">Projects</button>
        <Tour steps={STEPS} defaultOpen />
      </>,
    )
    expect(screen.getByRole("dialog", { name: "Your projects" })).toBeInTheDocument()
  })

  it("does not point a description at nothing on a step without a body", () => {
    render(<Tour steps={[{ title: "Only a title" }]} defaultOpen />)
    expect(screen.getByRole("dialog", { name: "Only a title" })).not.toHaveAttribute("aria-describedby")
  })

  it("survives a steps array written inline, which is new on every render", async () => {
    const user = setup()
    render(
      <>
        <button type="button" id="first">Projects</button>
        <button type="button" id="second">Invite</button>
        <Tour steps={[{ target: "#first", title: "One" }, { target: "#second", title: "Two" }]} defaultOpen effect="spring" />
      </>,
    )
    await user.click(next())
    expect(title("Two")).toBeInTheDocument()
  })

  it("does not dim or block the page outside the spotlight", async () => {
    const user = await start({ variant: "banner" })
    const page = screen.getByRole("button", { name: "Projects" })
    expect(page).not.toHaveAttribute("aria-hidden")
    await user.click(page)
    expect(page).toHaveFocus()
  })
})
