import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { renderToString } from "react-dom/server"
import { CardStack, type CardStackItem, type CardStackVariant } from "./card-stack"
import { cascadePose, depthOf, fanPose, fitFan, pilePose, shouldLeave, swipeTint } from "./card-stack-math"

const ITEMS: readonly CardStackItem[] = [
  { id: "a", label: "Alpine lake", content: <a href="#a">Open Alpine lake</a> },
  { id: "b", label: "Beach house", content: <a href="#b">Open Beach house</a> },
  { id: "c", label: "Cedar trail", content: <a href="#c">Open Cedar trail</a> },
]
const VARIANTS: readonly CardStackVariant[] = ["pile", "fan", "swipe", "cascade"]

const originalMatchMedia = window.matchMedia
let reducedMotion = false
let finePointer = false
const changeListeners: Array<() => void> = []

function setReducedMotion(value: boolean) {
  reducedMotion = value
  act(() => changeListeners.forEach((listener) => listener()))
}

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      get matches() {
        if (query.includes("reduced-motion")) return reducedMotion
        if (query.includes("pointer: fine")) return finePointer
        return false
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
  Object.defineProperty(window, "matchMedia", { configurable: true, writable: true, value: originalMatchMedia })
})

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} })
})

afterEach(() => {
  finePointer = false
  setReducedMotion(false)
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

const cards = (container: HTMLElement) => [...container.querySelectorAll<HTMLElement>('[data-slot="card-stack-card"]')]
const topCard = (container: HTMLElement) => cards(container).find((card) => card.dataset.depth === "0") as HTMLElement

describe("stack maths", () => {
  it("counts depth round from the top", () => {
    expect([0, 1, 2].map((index) => depthOf(index, 1, 3))).toEqual([2, 0, 1])
    expect(depthOf(0, 0, 0)).toBe(0)
  })

  it("seeds the scatter, keeps the top level, and differs per seed", () => {
    expect(pilePose(1, 1, 3, 7)).toEqual(pilePose(1, 1, 3, 7))
    expect(pilePose(1, 1, 3, 7)).not.toEqual(pilePose(1, 1, 3, 8))
    expect(pilePose(1, 0, 3, 7)).toMatchObject({ rotate: 0, x: 0, y: 0, scale: 1 })
    for (let index = 0; index < 20; index += 1) expect(Math.abs(pilePose(index, 1, 21, 3).rotate)).toBeLessThanOrEqual(3.5)
  })

  it("lets a long drag or a quick flick leave, not a nudge", () => {
    expect(shouldLeave(10, 0, 300)).toBe(false)
    expect(shouldLeave(120, 0, 300)).toBe(true)
    expect(shouldLeave(-120, 0, 300)).toBe(true)
    expect(shouldLeave(10, 900, 300)).toBe(true)
  })

  it("keeps a fan inside the 263 px cell, however tall the cards", () => {
    for (const height of [120, 200, 320]) {
      const fit = fitFan(5, 263, 163, height)
      const outer = (fit.spread * 2 * Math.PI) / 180
      const reach = (163 / 2) * Math.cos(outer) + height * Math.sin(outer) + 2 * fit.gap
      expect(reach).toBeLessThanOrEqual(263 / 2 + 0.01)
    }
    expect(fitFan(1, 263, 163, 120).gap).toBe(0)
  })

  it("poses a fan: closed is tight, open spreads symmetrically", () => {
    const fit = { spread: 10, gap: 12 }
    expect(Math.abs(fanPose(0, 3, false, fit).rotate)).toBeLessThan(5)
    expect(fanPose(0, 3, true, fit).rotate).toBe(-10)
    expect(fanPose(1, 3, true, fit).rotate).toBe(0)
    expect(fanPose(2, 3, true, fit).x).toBe(12)
  })

  it("opens a cascade into even rows, closed it only peeks", () => {
    expect(cascadePose(2, true, 60).y).toBe(2 * (60 + 8))
    expect(cascadePose(1, false, 60).y).toBe(8)
    expect(cascadePose(2, false, 60).scale).toBeCloseTo(0.92)
    expect(cascadePose(3, false, 60).opacity).toBe(0)
  })

  it("tints in proportion, up to full strength", () => {
    expect(swipeTint(0, 300)).toBe(0)
    expect(swipeTint(-52.5, 300)).toBeCloseTo(0.5)
    expect(swipeTint(500, 300)).toBe(1)
  })
})

describe("CardStack", () => {
  it("draws a different structure per variant, and renders on the server", () => {
    const seen = VARIANTS.map((variant) => {
      expect(renderToString(<CardStack label="Saved places" items={ITEMS} variant={variant} />)).toContain("Open Alpine lake")
      const { container, unmount } = render(<CardStack label="Saved places" items={ITEMS} variant={variant} />)
      const root = container.firstElementChild as HTMLElement
      const shape = [root.dataset.variant, screen.getAllByRole("button").map((button) => button.textContent).join(",")].join(":")
      unmount()
      return shape
    })
    expect(seen).toEqual(["pile:Next", "fan:Spread", "swipe:Skip,Keep", "cascade:Show all"])
  })

  it.each(VARIANTS)("keeps cards behind the top out of reach in %s", (variant) => {
    const { container } = render(<CardStack label="Saved places" items={ITEMS} variant={variant} />)
    for (const card of cards(container)) {
      if (card.dataset.depth === "0") {
        expect(card).not.toHaveAttribute("inert")
        expect(card).not.toHaveAttribute("aria-hidden")
      } else {
        expect(card).toHaveAttribute("inert")
        expect(card).toHaveAttribute("aria-hidden", "true")
      }
    }
    expect(screen.getAllByRole("link")).toHaveLength(1)
  })

  it("stacks every card in one cell, so the tallest sets the height", () => {
    const { container } = render(<CardStack label="Saved places" items={ITEMS} />)
    for (const card of cards(container)) expect(card.className).toContain("[grid-area:1/1]")
  })

  it("pile: Next sends the top to the back and says so, in order and round again", async () => {
    setReducedMotion(true)
    const user = userEvent.setup()
    const { container } = render(<CardStack label="Saved places" items={ITEMS} />)
    expect(screen.getByText("1 of 3: Alpine lake")).toHaveAttribute("aria-live", "polite")
    await user.click(screen.getByRole("button", { name: "Next" }))
    expect(screen.getByText("2 of 3: Beach house")).toBeInTheDocument()
    expect(topCard(container)).toHaveTextContent("Open Beach house")
    await user.click(screen.getByRole("button", { name: "Next" }))
    await user.click(screen.getByRole("button", { name: "Next" }))
    expect(topCard(container)).toHaveTextContent("Open Alpine lake")
  })

  it("pile: a card flies first and lands on the back, also when pressed again mid-flight", async () => {
    const { container } = render(<CardStack label="Saved places" items={ITEMS} />)
    const next = screen.getByRole("button", { name: "Next" })
    fireEvent.click(next)
    expect(cards(container)[0]).toHaveAttribute("inert")
    fireEvent.click(next)
    await waitFor(() => expect(screen.getByText("3 of 3: Cedar trail")).toBeInTheDocument())
  })

  it("fan: opens on hover for a fine pointer, and keeps its width to the cell", () => {
    finePointer = true
    const { container } = render(<CardStack label="Saved places" items={ITEMS} variant="fan" />)
    const root = container.firstElementChild as HTMLElement
    fireEvent.pointerEnter(root, { pointerType: "mouse" })
    expect(root).toHaveAttribute("data-open", "true")
    expect(screen.getAllByRole("link")).toHaveLength(3)
    fireEvent.pointerLeave(root, { pointerType: "mouse" })
    expect(root).toHaveAttribute("data-open", "false")
  })

  it("fan: a tap toggles it on touch, and does not steal a press on a link", async () => {
    const { container } = render(<CardStack label="Saved places" items={ITEMS} variant="fan" />)
    const root = container.firstElementChild as HTMLElement
    const area = container.querySelector('[data-slot="card-stack-fan"]') as HTMLElement
    fireEvent.click(area)
    expect(root).toHaveAttribute("data-open", "true")
    fireEvent.click(screen.getAllByRole("link")[0] as HTMLElement)
    expect(root).toHaveAttribute("data-open", "true")
    fireEvent.click(area)
    expect(root).toHaveAttribute("data-open", "false")
  })

  it("fan: the keyboard opens it and reaches every card", async () => {
    const user = userEvent.setup()
    const { container } = render(<CardStack label="Saved places" items={ITEMS} variant="fan" />)
    await user.tab()
    expect(container.firstElementChild).toHaveAttribute("data-open", "true")
    expect(screen.getAllByRole("link")).toHaveLength(3)
  })

  it("swipe: buttons decide for the keyboard, report the side, and end with a summary and focus", async () => {
    setReducedMotion(true)
    const onDecide = vi.fn()
    const user = userEvent.setup()
    render(<CardStack label="Saved places" items={ITEMS} variant="swipe" onDecide={onDecide} />)
    await user.click(screen.getByRole("button", { name: "Keep" }))
    expect(onDecide).toHaveBeenLastCalledWith("a", "right")
    await user.click(screen.getByRole("button", { name: "Skip" }))
    expect(onDecide).toHaveBeenLastCalledWith("b", "left")
    await user.click(screen.getByRole("button", { name: "Keep" }))
    expect(screen.getByText("2 keep, 1 skip")).toBeInTheDocument()
    const again = screen.getByRole("button", { name: "Start over" })
    expect(again).toHaveFocus()
    await user.click(again)
    expect(screen.getByText("1 of 3: Alpine lake")).toBeInTheDocument()
  })

  it("swipe: the choice shows in words as well as colour, in fixed hues", () => {
    const { container } = render(<CardStack label="Saved places" items={ITEMS} variant="swipe" />)
    const right = container.querySelector('[data-slot="card-stack-tint-right"]') as HTMLElement
    const left = container.querySelector('[data-slot="card-stack-tint-left"]') as HTMLElement
    expect(right).toHaveTextContent("Keep")
    expect(right.className).toContain("emerald")
    expect(left).toHaveTextContent("Skip")
    expect(left.className).toContain("red")
  })

  it("cascade: opens on press or focus, closes on Escape and returns focus, and takes no room when open", async () => {
    const user = userEvent.setup()
    const { container } = render(<CardStack label="Updates" items={ITEMS} variant="cascade" />)
    const root = container.firstElementChild as HTMLElement
    const toggle = screen.getByRole("button", { name: "Show all" })
    await user.tab()
    expect(toggle).toHaveFocus()
    expect(root).toHaveAttribute("data-open", "true")
    expect(screen.getAllByRole("link")).toHaveLength(3)
    await user.keyboard("{Escape}")
    expect(root).toHaveAttribute("data-open", "false")
    expect(screen.getByRole("button", { name: "Show all" })).toHaveFocus()
    expect(screen.getAllByRole("link")).toHaveLength(1)
    fireEvent.click(container.querySelector('[data-slot="card-stack-rows"]') as HTMLElement)
    expect(root).toHaveAttribute("data-open", "true")
    expect(root.className).toContain("z-20")
  })

  it("autoplay: turns on a timer, stops on hover and focus, never announces, holds when paused", () => {
    vi.useFakeTimers()
    setReducedMotion(false)
    const { container, rerender } = render(<CardStack label="Saved places" items={ITEMS} effect="autoplay" interval={1000} />)
    const root = container.firstElementChild as HTMLElement
    expect(root).toHaveAttribute("data-playing", "true")
    expect(screen.getByText("1 of 3: Alpine lake")).toHaveAttribute("aria-live", "off")
    act(() => void vi.advanceTimersByTime(1300))
    expect(screen.getByText("2 of 3: Beach house")).toBeInTheDocument()
    fireEvent.pointerEnter(root, { pointerType: "mouse" })
    expect(root).toHaveAttribute("data-playing", "false")
    act(() => void vi.advanceTimersByTime(3000))
    expect(screen.getByText("2 of 3: Beach house")).toBeInTheDocument()
    fireEvent.pointerLeave(root, { pointerType: "mouse" })
    rerender(<CardStack label="Saved places" items={ITEMS} effect="autoplay" interval={1000} paused />)
    act(() => void vi.advanceTimersByTime(3000))
    expect(screen.getByText("2 of 3: Beach house")).toBeInTheDocument()
  })

  it("autoplay: does not run under reduced motion, and never decides a swipe", () => {
    vi.useFakeTimers()
    setReducedMotion(true)
    const { unmount } = render(<CardStack label="Saved places" items={ITEMS} effect="autoplay" interval={1000} />)
    act(() => void vi.advanceTimersByTime(3000))
    expect(screen.getByText("1 of 3: Alpine lake")).toBeInTheDocument()
    unmount()
    setReducedMotion(false)
    const onDecide = vi.fn()
    render(<CardStack label="Saved places" items={ITEMS} variant="swipe" effect="autoplay" interval={1000} onDecide={onDecide} />)
    act(() => void vi.advanceTimersByTime(3000))
    expect(onDecide).not.toHaveBeenCalled()
  })

  it.each(VARIANTS)("still calls the owner's root handlers in %s", (variant) => {
    const handlers = { onPointerEnter: vi.fn(), onPointerLeave: vi.fn(), onFocus: vi.fn(), onBlur: vi.fn(), onKeyDown: vi.fn() }
    const { container } = render(<CardStack label="Saved places" items={ITEMS} variant={variant} {...handlers} />)
    const root = container.firstElementChild as HTMLElement
    fireEvent.pointerEnter(root, { pointerType: "mouse" })
    fireEvent.pointerLeave(root, { pointerType: "mouse" })
    fireEvent.focusIn(root)
    fireEvent.keyDown(root, { key: "a" })
    fireEvent.focusOut(root)
    for (const handler of Object.values(handlers)) expect(handler).toHaveBeenCalledTimes(1)
  })

  it("keeps its own behaviour when the owner passes handlers too", async () => {
    finePointer = true
    const owner = { onPointerEnter: vi.fn(), onPointerLeave: vi.fn(), onFocus: vi.fn(), onBlur: vi.fn(), onKeyDown: vi.fn() }
    const fan = render(<CardStack label="Plans" items={ITEMS} variant="fan" {...owner} />)
    const fanRoot = fan.container.firstElementChild as HTMLElement
    fireEvent.pointerEnter(fanRoot, { pointerType: "mouse" })
    expect(fanRoot).toHaveAttribute("data-open", "true")
    fireEvent.pointerLeave(fanRoot, { pointerType: "mouse" })
    expect(fanRoot).toHaveAttribute("data-open", "false")
    fan.unmount()

    const pile = render(<CardStack label="Places" items={ITEMS} effect="autoplay" {...owner} />)
    const pileRoot = pile.container.firstElementChild as HTMLElement
    expect(pileRoot).toHaveAttribute("data-playing", "true")
    fireEvent.pointerEnter(pileRoot, { pointerType: "mouse" })
    expect(pileRoot).toHaveAttribute("data-playing", "false")
    pile.unmount()

    const user = userEvent.setup()
    const cascade = render(<CardStack label="Updates" items={ITEMS} variant="cascade" {...owner} />)
    const cascadeRoot = cascade.container.firstElementChild as HTMLElement
    await user.tab()
    expect(cascadeRoot).toHaveAttribute("data-open", "true")
    await user.keyboard("{Escape}")
    expect(cascadeRoot).toHaveAttribute("data-open", "false")
    expect(owner.onKeyDown).toHaveBeenCalled()
  })

  it("survives one card and no cards", () => {
    const one = render(<CardStack label="One" items={ITEMS.slice(0, 1)} />)
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled()
    one.unmount()
    for (const variant of VARIANTS) render(<CardStack label="None" items={[]} variant={variant} />).unmount()
  })
})
