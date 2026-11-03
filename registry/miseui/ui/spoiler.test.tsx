import { act, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Spoiler, type SpoilerVariant } from "./spoiler"
import { previewOfText } from "./spoiler-state"

const originalMatchMedia = window.matchMedia
let reducedMotion = false
const changeListeners: Array<() => void> = []
let scrollHeight = 400

class ResizeObserverStub {
  private callback: ResizeObserverCallback
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
  }
  observe = () => this.callback([], this as unknown as ResizeObserver)
  unobserve = vi.fn()
  disconnect = vi.fn()
}

beforeAll(() => {
  vi.stubGlobal("ResizeObserver", ResizeObserverStub)
  Object.defineProperty(HTMLElement.prototype, "scrollHeight", { configurable: true, get: () => scrollHeight })
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
  Reflect.deleteProperty(HTMLElement.prototype, "scrollHeight")
  Object.defineProperty(window, "matchMedia", { configurable: true, writable: true, value: originalMatchMedia })
})

function setReducedMotion(value: boolean) {
  reducedMotion = value
  act(() => changeListeners.forEach((listener) => listener()))
}

afterEach(() => {
  setReducedMotion(false)
  scrollHeight = 400
})

const SECRET = "The butler did it."

describe("previewOfText", () => {
  it("takes the first sentence, or cuts at a word boundary", () => {
    expect(previewOfText("Short.")).toBe("Short.")
    expect(previewOfText(`One sentence here. ${"Word ".repeat(40)}`)).toBe("One sentence here.")
    const cut = previewOfText("word ".repeat(60), 40)
    expect(cut.endsWith("...")).toBe(true)
    expect(cut.length).toBeLessThanOrEqual(43)
    expect(cut).not.toMatch(/wor\.\.\.$/)
  })
})

describe.each(["blur", "block", "inline"] satisfies SpoilerVariant[])("Spoiler %s", (variant) => {
  it("keeps the text out of the accessibility tree until pressed", async () => {
    const user = userEvent.setup()
    render(<Spoiler variant={variant}>{SECRET}</Spoiler>)
    // getByRole-style queries honour aria-hidden; the text must not be reachable by name or as a readable node.
    const button = screen.getByRole("button", { name: /Show spoiler/ })
    expect(button).toBeInTheDocument()
    expect(screen.getByText(SECRET).closest("[aria-hidden='true']")).not.toBeNull()
    await user.click(button)
    expect(screen.getByText(SECRET).closest("[aria-hidden='true']")).toBeNull()
    await waitFor(() => expect(screen.queryByRole("button", { name: /Show spoiler/ })).not.toBeInTheDocument())
  })

  it("reveals from the keyboard and moves focus to what appeared", async () => {
    const user = userEvent.setup()
    const onRevealedChange = vi.fn()
    render(
      <Spoiler variant={variant} onRevealedChange={onRevealedChange}>
        {SECRET}
      </Spoiler>,
    )
    await user.tab()
    expect(screen.getByRole("button", { name: /Show spoiler/ })).toHaveFocus()
    await user.keyboard("{Enter}")
    expect(onRevealedChange).toHaveBeenCalledWith(true)
    await waitFor(() => expect(document.activeElement?.getAttribute("data-slot")).toBe("spoiler-content"))
  })
})

describe("Spoiler", () => {
  it("makes hidden content inert, so links inside cannot be tabbed into", async () => {
    const user = userEvent.setup()
    render(
      <Spoiler variant="block">
        <a href="#plot">Plot details</a>
      </Spoiler>,
    )
    expect(screen.getByText("Plot details").closest("[inert]")).not.toBeNull()
    await user.click(screen.getByRole("button"))
    expect(screen.getByRole("link", { name: "Plot details" }).closest("[inert]")).toBeNull()
  })

  it("does not steal focus when revealed from outside", () => {
    const { rerender } = render(<Spoiler revealed={false}>{SECRET}</Spoiler>)
    rerender(<Spoiler revealed>{SECRET}</Spoiler>)
    expect(document.activeElement).toBe(document.body)
    expect(screen.getByText(SECRET).closest("[aria-hidden='true']")).toBeNull()
  })

  it("makes the variants differ in structure", () => {
    const shape = (variant: SpoilerVariant) => {
      const { container, unmount } = render(<Spoiler variant={variant}>{SECRET}</Spoiler>)
      const cover = container.querySelector("[data-slot='spoiler-cover']")
      const content = container.querySelector("[data-slot='spoiler-content']")
      const result = {
        tag: container.firstElementChild?.tagName,
        coverTag: cover?.tagName ?? null,
        invisible: content?.className.includes("invisible") ?? false,
        toggle: container.querySelector("[data-slot='spoiler-toggle']") !== null,
      }
      unmount()
      return result
    }
    expect(shape("blur")).toEqual({ tag: "DIV", coverTag: "BUTTON", invisible: false, toggle: false })
    expect(shape("block")).toEqual({ tag: "DIV", coverTag: "BUTTON", invisible: true, toggle: false })
    expect(shape("inline")).toEqual({ tag: "SPAN", coverTag: "SPAN", invisible: false, toggle: false })
    expect(shape("more")).toEqual({ tag: "DIV", coverTag: null, invisible: false, toggle: true })
  })

  it("more: reads a preview until opened, then the whole text, and can close again", async () => {
    const user = userEvent.setup()
    const long = `First sentence stays. ${"Then many more words follow here. ".repeat(10)}`
    const { container } = render(<Spoiler variant="more">{long}</Spoiler>)
    const content = container.querySelector("[data-slot='spoiler-content']") as HTMLElement
    expect(content).toHaveAttribute("aria-hidden", "true")
    expect(screen.getByText("First sentence stays.")).toHaveClass("sr-only")
    const toggle = screen.getByRole("button", { name: "Show more" })
    expect(toggle).toHaveAttribute("aria-expanded", "false")
    await user.click(toggle)
    expect(content).not.toHaveAttribute("aria-hidden")
    expect(screen.queryByText("First sentence stays.")).not.toBeInTheDocument()
    const back = screen.getByRole("button", { name: "Show less" })
    expect(back).toHaveAttribute("aria-expanded", "true")
    await user.click(back)
    expect(content).toHaveAttribute("aria-hidden", "true")
  })

  it("more: no button and no fade when the content already fits", () => {
    scrollHeight = 40
    const { container } = render(<Spoiler variant="more">Fits in one line.</Spoiler>)
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
    const content = container.querySelector("[data-slot='spoiler-content']") as HTMLElement
    expect(content).not.toHaveAttribute("aria-hidden")
    expect(content.style.maskImage).toBe("")
  })

  it("clears the blur only with the effect, and instantly under reduced motion", async () => {
    const user = userEvent.setup()
    const { container } = render(<Spoiler effect="blur">{SECRET}</Spoiler>)
    const content = () => container.querySelector("[data-slot='spoiler-content']") as HTMLElement
    expect(content().style.filter).toBe("blur(8px)")
    await user.click(screen.getByRole("button"))
    await waitFor(() => expect(content().style.filter).toMatch(/blur\(0(px)?\)|none/), { timeout: 2000 })
  })

  it("is not animated under reduced motion", async () => {
    setReducedMotion(true)
    const user = userEvent.setup()
    const { container } = render(<Spoiler effect="blur">{SECRET}</Spoiler>)
    await user.click(screen.getByRole("button"))
    const content = container.querySelector("[data-slot='spoiler-content']") as HTMLElement
    await waitFor(() => expect(content.style.filter).toMatch(/blur\(0(px)?\)|none/), { timeout: 200 })
  })
})
