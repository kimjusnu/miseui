import { act, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ViewCounter, type ViewCounterProps, type ViewCounterVariant } from "./view-counter"
import { defaultViewLabel, formatCount, readCount } from "./view-counter-state"

const originalMatchMedia = window.matchMedia
let reducedMotion = false
const changeListeners: Array<() => void> = []

beforeAll(() => {
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
  Object.defineProperty(window, "matchMedia", { configurable: true, writable: true, value: originalMatchMedia })
})

function setReducedMotion(value: boolean) {
  reducedMotion = value
  act(() => changeListeners.forEach((listener) => listener()))
}

afterEach(() => setReducedMotion(false))

const VARIANTS: readonly ViewCounterVariant[] = ["inline", "badge", "stat"]

function Counter(props: Partial<ViewCounterProps>) {
  return <ViewCounter fetcher={() => Promise.resolve(1284)} locale="en-US" data-testid="counter" {...props} />
}

const counter = () => screen.getByTestId("counter")

describe("view counter helpers", () => {
  it("accepts only a real count", () => {
    expect(readCount(0)).toBe(0)
    expect(readCount(12)).toBe(12)
    expect(() => readCount(-1)).toThrow()
    expect(() => readCount(Number.NaN)).toThrow()
    expect(() => readCount("12")).toThrow()
    expect(() => readCount(null)).toThrow()
  })

  it("formats by locale, in full or compact", () => {
    expect(formatCount(1284, "en-US", false)).toBe("1,284")
    expect(formatCount(1500, "en-US", true)).toBe("1.5K")
    expect(formatCount(15000, "ko-KR", true)).toBe("1.5만")
  })

  it("says one view and many views", () => {
    expect(defaultViewLabel(1)).toBe("view")
    expect(defaultViewLabel(0)).toBe("views")
    expect(defaultViewLabel(2)).toBe("views")
  })
})

describe("ViewCounter", () => {
  describe.each(VARIANTS)("variant=%s", (variant) => {
    it("goes from a busy placeholder to the number", async () => {
      render(<Counter variant={variant} />)
      expect(counter()).toHaveAttribute("data-slot", "view-counter")
      expect(counter()).toHaveAttribute("data-variant", variant)
      expect(counter()).toHaveAttribute("data-state", "loading")
      expect(counter()).toHaveAttribute("aria-busy", "true")
      expect(screen.getByText("Loading views")).toHaveClass("sr-only")
      expect(screen.queryByText("views")).toBeNull()
      await waitFor(() => expect(counter()).toHaveAttribute("data-state", "ready"))
      expect(counter()).not.toHaveAttribute("aria-busy")
      expect(counter()).toHaveTextContent("1,284")
      expect(counter()).toHaveTextContent("views")
    })
  })

  it("builds each variant differently", async () => {
    const shape = async (variant: ViewCounterVariant) => {
      const { container, unmount } = render(<Counter variant={variant} />)
      await waitFor(() => expect(counter()).toHaveAttribute("data-state", "ready"))
      const found = {
        icon: container.querySelector("svg") !== null,
        labelHidden: screen.getByText("views").classList.contains("sr-only"),
        big: screen.getByText("1,284").parentElement?.classList.contains("text-3xl") ?? false,
      }
      unmount()
      return found
    }
    expect(await shape("inline")).toEqual({ icon: false, labelHidden: false, big: false })
    expect(await shape("badge")).toEqual({ icon: true, labelHidden: true, big: false })
    expect(await shape("stat")).toEqual({ icon: false, labelHidden: false, big: true })
  })

  it("shows the failure with a retry, and the retry can succeed", async () => {
    const user = userEvent.setup()
    const onError = vi.fn()
    const fetcher = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(9)
    render(<Counter fetcher={fetcher} onError={onError} />)
    await waitFor(() => expect(counter()).toHaveAttribute("data-state", "failed"))
    expect(counter()).toHaveTextContent("Views unavailable")
    expect(onError).toHaveBeenCalledTimes(1)
    await user.click(screen.getByRole("button", { name: "Retry" }))
    await waitFor(() => expect(counter()).toHaveTextContent("9"))
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it("treats a malformed answer and a fetcher that throws as failures", async () => {
    const { unmount } = render(<Counter fetcher={() => Promise.resolve("many" as unknown as number)} />)
    await waitFor(() => expect(counter()).toHaveAttribute("data-state", "failed"))
    unmount()
    render(<Counter fetcher={() => { throw new Error("nope") }} />)
    await waitFor(() => expect(counter()).toHaveAttribute("data-state", "failed"))
  })

  it("can fail silently", async () => {
    const onError = vi.fn()
    const { container } = render(<Counter fetcher={() => Promise.reject(new Error("x"))} failureText={null} retryLabel={null} onError={onError} />)
    await waitFor(() => expect(onError).toHaveBeenCalled())
    expect(container).toBeEmptyDOMElement()
  })

  it("does not refetch when only the function identity changes, and does when the key does", async () => {
    const first = vi.fn(() => Promise.resolve(1))
    const { rerender } = render(<Counter fetcher={first} resourceKey="a" />)
    await waitFor(() => expect(counter()).toHaveAttribute("data-state", "ready"))
    const second = vi.fn(() => Promise.resolve(2))
    rerender(<Counter fetcher={second} resourceKey="a" />)
    expect(first).toHaveBeenCalledTimes(1)
    expect(second).not.toHaveBeenCalled()
    rerender(<Counter fetcher={second} resourceKey="b" />)
    expect(counter()).toHaveAttribute("data-state", "loading")
    await waitFor(() => expect(counter()).toHaveTextContent("2"))
    expect(second).toHaveBeenCalledTimes(1)
  })

  it("aborts on unmount and ignores the late answer", async () => {
    let signal: AbortSignal | undefined
    let answer: (value: number) => void = () => {}
    const onError = vi.fn()
    const { unmount } = render(
      <Counter
        onError={onError}
        fetcher={(given) => {
          signal = given
          return new Promise((resolve) => {
            answer = resolve
          })
        }}
      />,
    )
    await waitFor(() => expect(signal).toBeDefined())
    unmount()
    expect(signal?.aborted).toBe(true)
    await act(async () => answer(5))
    expect(onError).not.toHaveBeenCalled()
  })

  it("uses singular and custom words, a custom format and compact numbers", async () => {
    const { unmount } = render(<Counter fetcher={() => Promise.resolve(1)} />)
    await waitFor(() => expect(counter()).toHaveTextContent("1view"))
    unmount()
    const second = render(<Counter fetcher={() => Promise.resolve(1500)} compact label="reads" />)
    await waitFor(() => expect(counter()).toHaveTextContent("1.5Kreads"))
    second.unmount()
    render(<Counter fetcher={() => Promise.resolve(7)} format={(count) => `#${count}`} label={(count) => `of ${count + 1}`} />)
    await waitFor(() => expect(counter()).toHaveTextContent("#7of 8"))
  })

  it("rolls digits only and keeps the plain figure for assistive tech", async () => {
    const { container } = render(<Counter effect="odometer" />)
    await waitFor(() => expect(counter()).toHaveAttribute("data-state", "ready"))
    expect(container.querySelectorAll("[data-slot='view-counter-wheel']")).toHaveLength(4)
    expect(screen.getByText("1,284")).toHaveClass("sr-only")
    expect(container.querySelector("[data-slot='view-counter-odometer']")?.textContent).toContain(",")
  })

  it("shows the final number at once under reduced motion", async () => {
    setReducedMotion(true)
    const { container } = render(<Counter effect="count" />)
    await waitFor(() => expect(counter()).toHaveAttribute("data-state", "ready"))
    expect(screen.getByText("1,284")).not.toHaveClass("sr-only")
    expect(container.querySelector("[aria-hidden='true']")).toBeNull()
  })

  it("keeps the count effect's figure readable while the digits rise", async () => {
    render(<Counter effect="count" />)
    await waitFor(() => expect(counter()).toHaveAttribute("data-state", "ready"))
    expect(screen.getByText("1,284")).toHaveClass("sr-only")
  })
})
