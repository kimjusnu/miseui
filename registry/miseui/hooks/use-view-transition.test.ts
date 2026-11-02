import { act, renderHook } from "@testing-library/react"
import { STYLE_ELEMENT_ID, useViewTransition } from "./use-view-transition"

function setStartViewTransition(value: unknown) {
  Object.defineProperty(document, "startViewTransition", { value, configurable: true, writable: true })
}

afterEach(() => {
  setStartViewTransition(undefined)
  document.getElementById(STYLE_ELEMENT_ID)?.remove()
  delete document.documentElement.dataset.transition
})

describe("useViewTransition", () => {
  it("runs the update directly when the browser has no View Transitions", () => {
    const { result } = renderHook(() => useViewTransition("fade-through"))
    const update = vi.fn()
    act(() => result.current(update))
    expect(update).toHaveBeenCalledTimes(1)
    expect(document.documentElement.dataset.transition).toBeUndefined()
  })

  it("names the preset on <html> for the duration of the transition", async () => {
    let settle: () => void = () => {}
    const finished = new Promise<void>((resolve) => {
      settle = resolve
    })
    setStartViewTransition(
      vi.fn((update: () => void) => {
        update()
        return { finished }
      }),
    )
    const { result } = renderHook(() => useViewTransition("shared-axis-x"))
    const update = vi.fn()
    act(() => result.current(update))
    expect(update).toHaveBeenCalledTimes(1)
    expect(document.documentElement.dataset.transition).toBe("shared-axis-x")
    await act(async () => {
      settle()
      await finished
    })
    expect(document.documentElement.dataset.transition).toBeUndefined()
  })

  it("injects the preset stylesheet once, however many hooks mount", () => {
    renderHook(() => useViewTransition("scale-up"))
    renderHook(() => useViewTransition("blur-in"))
    expect(document.querySelectorAll(`#${STYLE_ELEMENT_ID}`)).toHaveLength(1)
    expect(document.getElementById(STYLE_ELEMENT_ID)?.textContent).toContain("prefers-reduced-motion")
  })
})
