import { act, fireEvent, render, renderHook, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { PageWipeLink, usePageWipe, type PageWipeVariant } from "./page-wipe"

const VARIANTS: readonly PageWipeVariant[] = ["curtain", "sweep", "iris"]
const STYLE_ID = "miseui-page-wipes"

function setStartViewTransition(value: unknown) {
  Object.defineProperty(document, "startViewTransition", { value, configurable: true, writable: true })
}

const root = document.documentElement

function stubTransition() {
  const start = vi.fn((update: () => void) => {
    update()
    return { finished: new Promise<void>(() => {}) }
  })
  setStartViewTransition(start)
  return start
}

afterEach(() => {
  setStartViewTransition(undefined)
  document.getElementById(STYLE_ID)?.remove()
  delete root.dataset.pageWipe
  delete root.dataset.pageWipeEffect
  delete root.dataset.transition
  root.style.removeProperty("--page-wipe-x")
  root.style.removeProperty("--page-wipe-y")
})

function styles() {
  return document.getElementById(STYLE_ID)?.textContent ?? ""
}

describe("usePageWipe", () => {
  it.each(VARIANTS)("variant=%s runs the update inside a transition and marks the page", (variant) => {
    const start = stubTransition()
    const { result } = renderHook(() => usePageWipe({ variant }))
    const update = vi.fn()
    act(() => result.current(update))
    expect(start).toHaveBeenCalledTimes(1)
    expect(update).toHaveBeenCalledTimes(1)
    expect(root.dataset.pageWipe).toBe(variant)
    expect(root.dataset.transition).toBe("fade-through")
  })

  it("gives each variant its own keyframes", () => {
    renderHook(() => usePageWipe())
    expect(styles()).toMatch(/data-page-wipe="curtain"\]::view-transition-new\(root\) \{ animation: miseui-wipe-lift/)
    expect(styles()).toMatch(/data-page-wipe="sweep"\]::view-transition-new\(root\) \{ animation: miseui-wipe-sweep/)
    expect(styles()).toMatch(/data-page-wipe="iris"\]::view-transition-new\(root\) \{ animation: miseui-wipe-iris/)
  })

  it("dims the old page under a sweep and an iris, or the edge cannot be seen when two pages share most of their pixels", () => {
    renderHook(() => usePageWipe())
    expect(styles()).toMatch(/data-page-wipe="sweep"\]::view-transition-old\(root\) \{ animation: miseui-wipe-dim/)
    expect(styles()).toMatch(/data-page-wipe="iris"\]::view-transition-old\(root\) \{ animation: miseui-wipe-dim/)
  })

  it("just runs the update when the browser has no View Transitions", () => {
    const { result } = renderHook(() => usePageWipe())
    const update = vi.fn()
    act(() => result.current(update))
    expect(update).toHaveBeenCalledTimes(1)
  })

  it("keeps every wipe rule behind a no-preference query, so reduced motion falls to the cross-fade", () => {
    renderHook(() => usePageWipe())
    const css = styles()
    const guarded = css.slice(css.indexOf("@media (prefers-reduced-motion: no-preference)"))
    expect(guarded).toContain('data-page-wipe="curtain"')
    expect(css.slice(0, css.indexOf("@media"))).not.toContain("view-transition-")
  })

  it("adds the stylesheet once and clears its marks on unmount", () => {
    stubTransition()
    const first = renderHook(() => usePageWipe({ effect: "recede" }))
    renderHook(() => usePageWipe())
    expect(document.querySelectorAll(`#${STYLE_ID}`)).toHaveLength(1)
    act(() => first.result.current(() => {}))
    expect(root.dataset.pageWipeEffect).toBe("recede")
    first.unmount()
    expect(root.dataset.pageWipe).toBeUndefined()
    expect(root.dataset.pageWipeEffect).toBeUndefined()
  })

  it("drops the effect mark when the next wipe has none", () => {
    stubTransition()
    const withEffect = renderHook(() => usePageWipe({ effect: "recede" }))
    const without = renderHook(() => usePageWipe())
    act(() => withEffect.result.current(() => {}))
    act(() => without.result.current(() => {}))
    expect(root.dataset.pageWipeEffect).toBeUndefined()
  })
})

describe("PageWipeLink", () => {
  it("is a real link that wipes on a plain click and hands over the address", async () => {
    stubTransition()
    const user = userEvent.setup()
    const onNavigate = vi.fn()
    render(<PageWipeLink href="/pricing" variant="iris" effect="recede" onNavigate={onNavigate}>Pricing</PageWipeLink>)
    const link = screen.getByRole("link", { name: "Pricing" })
    expect(link).toHaveAttribute("data-slot", "page-wipe")
    expect(link).toHaveAttribute("data-variant", "iris")
    expect(link).toHaveAttribute("data-effect", "recede")
    await user.click(link)
    expect(onNavigate).toHaveBeenCalledWith("/pricing")
    expect(root.dataset.pageWipe).toBe("iris")
  })

  it.each([
    ["ctrl", { ctrlKey: true }],
    ["meta", { metaKey: true }],
    ["shift", { shiftKey: true }],
  ])("leaves a %s click to the browser", (_name, modifier) => {
    const onNavigate = vi.fn()
    render(<PageWipeLink href="#pricing" onNavigate={onNavigate}>Pricing</PageWipeLink>)
    const notPrevented = fireEvent.click(screen.getByRole("link"), modifier)
    expect(notPrevented).toBe(true)
    expect(onNavigate).not.toHaveBeenCalled()
  })

  it("leaves a link that opens elsewhere to the browser, and honours a cancelled click", () => {
    const onNavigate = vi.fn()
    const { unmount } = render(<PageWipeLink href="#x" target="_blank" onNavigate={onNavigate}>Out</PageWipeLink>)
    fireEvent.click(screen.getByRole("link"))
    unmount()
    render(<PageWipeLink href="/x" onClick={(event) => event.preventDefault()} onNavigate={onNavigate}>Stay</PageWipeLink>)
    fireEvent.click(screen.getByRole("link"))
    expect(onNavigate).not.toHaveBeenCalled()
  })

  it("opens the iris from the pointer, and from the control for a keyboard", () => {
    stubTransition()
    render(<PageWipeLink href="/x" variant="iris" onNavigate={() => {}}>Go</PageWipeLink>)
    const link = screen.getByRole("link")
    vi.spyOn(link, "getBoundingClientRect").mockReturnValue({ left: 100, top: 200, width: 40, height: 20 } as DOMRect)
    fireEvent.click(link, { detail: 1, clientX: 11, clientY: 22 })
    expect(root.style.getPropertyValue("--page-wipe-x")).toBe("11px")
    expect(root.style.getPropertyValue("--page-wipe-y")).toBe("22px")
    fireEvent.click(link, { detail: 0, clientX: 0, clientY: 0 })
    expect(root.style.getPropertyValue("--page-wipe-x")).toBe("120px")
    expect(root.style.getPropertyValue("--page-wipe-y")).toBe("210px")
  })
})
