import type * as React from "react"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { renderToString } from "react-dom/server"
import { TiltedCard, TiltLayer, type TiltedCardVariant } from "./tilted-card"
import { clampTilt, glareTransform, layerTransform, projectCorner, tiltFromPointer, tiltReach, TILT_RESERVE_PX, tiltTransform } from "./tilted-card-math"

const originalMatchMedia = window.matchMedia
let finePointer = true
let reducedMotion = false
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

afterEach(() => {
  finePointer = true
  setReducedMotion(false)
})

function surfaceOf(container: HTMLElement) {
  return container.querySelector('[data-slot="tilted-card-surface"]') as HTMLElement
}

function placeBox(root: HTMLElement, width = 300, height = 300) {
  root.getBoundingClientRect = () => ({ left: 0, top: 0, right: width, bottom: height, width, height, x: 0, y: 0, toJSON: () => ({}) })
}

describe("tilt maths", () => {
  it("brings the edge under the pointer forward, capped at the limit", () => {
    expect(tiltFromPointer(300, 150, 300, 300, 12)).toEqual({ rotateX: 0, rotateY: -12 })
    expect(tiltFromPointer(150, 0, 300, 300, 12)).toEqual({ rotateX: -12, rotateY: -0 })
    expect(tiltFromPointer(900, 900, 300, 300, 12)).toEqual({ rotateX: 12, rotateY: -12 })
    expect(tiltFromPointer(5, 5, 0, 0, 12)).toEqual({ rotateX: 0, rotateY: 0 })
    expect(clampTilt(40)).toBe(12)
    expect(clampTilt(Number.NaN)).toBe(12)
  })

  it("writes a valid transform for a zero on one axis, and none at rest", () => {
    expect(tiltTransform(0, 0)).toBe("none")
    expect(tiltTransform(0, 5)).toMatch(/^rotateX\(0\.000deg\) rotateY\(5\.000deg\)$/)
    expect(tiltTransform(-3.5, 0)).toMatch(/^rotateX\(-3\.500deg\) rotateY\(0\.000deg\)$/)
    expect(layerTransform(40, 0)).toBe("none")
    expect(layerTransform(40, 0.5)).toBe("translateZ(20.00px)")
    expect(glareTransform(0, 12, 12)).toBe("translate(-28.00%, 0.00%)")
    expect(glareTransform(0, 0, 12)).toBe("none")
  })

  it("keeps every corner at full tilt inside the reserved room in the 263 px cell", () => {
    const cardWidth = 263 - TILT_RESERVE_PX * 2
    expect(tiltReach(cardWidth, 330, 12)).toBeLessThanOrEqual(TILT_RESERVE_PX)
    expect(tiltReach(cardWidth, 180, 12)).toBeLessThanOrEqual(TILT_RESERVE_PX)
    expect(tiltReach(cardWidth, 330, 12)).toBeGreaterThan(0)
  })

  it("keeps a caption at 40 px depth inside the reserved room too", () => {
    const halfWidth = (263 - TILT_RESERVE_PX * 2) / 2
    const { x } = projectCorner(halfWidth - 12, 100, 40, { rotateX: 12, rotateY: 12 })
    expect(Math.abs(x)).toBeLessThanOrEqual(halfWidth + TILT_RESERVE_PX)
  })
})

describe("TiltedCard", () => {
  it("has a different structure per variant, and exposes them as data", () => {
    const slots: Record<TiltedCardVariant, string> = {
      photo: "tilted-card-picture",
      glare: "tilted-card-sheen",
      layers: "tilted-card-plate",
      pass: "tilted-card-pass-stub",
    }
    for (const variant of Object.keys(slots) as TiltedCardVariant[]) {
      const { container, unmount } = render(
        <TiltedCard variant={variant} caption="Caption" stub="Stub" finePrint="Terms">
          Body
        </TiltedCard>,
      )
      expect(container.querySelector(`[data-slot="${slots[variant]}"]`)).not.toBeNull()
      for (const other of Object.values(slots).filter((slot) => slot !== slots[variant])) expect(container.querySelector(`[data-slot="${other}"]`)).toBeNull()
      unmount()
    }
  })

  it("rests on transform none on the server, so text is sharp", () => {
    const html = renderToString(<TiltedCard variant="layers"><TiltLayer depth={24}>Part</TiltLayer></TiltedCard>)
    expect(html).toMatch(/data-slot="tilted-card-surface"[^>]*transform:none/)
    expect(html).toMatch(/data-slot="tilt-layer"[^>]*transform:none/)
  })

  it("tilts with a written, valid transform under a fine pointer and returns to none", async () => {
    const { container } = render(<TiltedCard data-testid="card">Body</TiltedCard>)
    const root = screen.getByTestId("card")
    placeBox(root)
    fireEvent.pointerMove(root, { clientX: 290, clientY: 150, pointerType: "mouse" })
    await waitFor(() => expect(surfaceOf(container).style.transform).toMatch(/^rotateX\(-?\d+(\.\d+)?deg\) rotateY\(-?\d+(\.\d+)?deg\)$/))
    fireEvent.pointerLeave(root, { pointerType: "mouse" })
    await waitFor(() => expect(surfaceOf(container).style.transform).toBe("none"), { timeout: 3000 })
  })

  it("does nothing for a coarse pointer or under reduced motion", async () => {
    finePointer = false
    const { container, unmount } = render(<TiltedCard data-testid="card">Body</TiltedCard>)
    placeBox(screen.getByTestId("card"))
    fireEvent.pointerMove(screen.getByTestId("card"), { clientX: 290, clientY: 150, pointerType: "mouse" })
    await act(() => new Promise((resolve) => setTimeout(resolve, 60)))
    expect(surfaceOf(container).style.transform).toBe("none")
    unmount()

    finePointer = true
    setReducedMotion(true)
    const reduced = render(<TiltedCard data-testid="card" effect="drag">Body</TiltedCard>)
    placeBox(screen.getByTestId("card"))
    fireEvent.pointerMove(screen.getByTestId("card"), { clientX: 290, clientY: 150, pointerType: "mouse" })
    fireEvent.pointerDown(screen.getByTestId("card"), { clientX: 290, clientY: 150, pointerType: "touch" })
    await act(() => new Promise((resolve) => setTimeout(resolve, 60)))
    expect(surfaceOf(reduced.container).style.transform).toBe("none")
  })

  it("follows a finger with the drag effect, leaves vertical scroll to the page, and settles on release", async () => {
    finePointer = false
    const { container } = render(<TiltedCard data-testid="card" effect="drag">Body</TiltedCard>)
    const root = screen.getByTestId("card")
    placeBox(root)
    expect(root.className).toContain("touch-pan-y")
    fireEvent.pointerDown(root, { clientX: 20, clientY: 150, pointerType: "touch" })
    fireEvent.pointerMove(root, { clientX: 10, clientY: 150, pointerType: "touch" })
    await waitFor(() => expect(surfaceOf(container).style.transform).toMatch(/rotateY\(/))
    fireEvent.pointerUp(root, { pointerType: "touch" })
    await waitFor(() => expect(surfaceOf(container).style.transform).toBe("none"), { timeout: 3000 })
  })

  it("never touches a finger without the effect", async () => {
    finePointer = false
    const { container } = render(<TiltedCard data-testid="card">Body</TiltedCard>)
    const root = screen.getByTestId("card")
    placeBox(root)
    expect(root.className).not.toContain("touch-pan-y")
    fireEvent.pointerDown(root, { clientX: 20, clientY: 150, pointerType: "touch" })
    fireEvent.pointerMove(root, { clientX: 10, clientY: 150, pointerType: "touch" })
    await act(() => new Promise((resolve) => setTimeout(resolve, 60)))
    expect(surfaceOf(container).style.transform).toBe("none")
  })

  it("leaves a link inside clickable and reachable by keyboard", async () => {
    const onClick = vi.fn((event: React.MouseEvent) => event.preventDefault())
    const user = userEvent.setup()
    render(
      <TiltedCard variant="pass" effect="drag" stub="Row 4">
        <a href="#ticket" onClick={onClick}>Open ticket</a>
      </TiltedCard>,
    )
    await user.tab()
    expect(screen.getByRole("link", { name: "Open ticket" })).toHaveFocus()
    await user.keyboard("{Enter}")
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it("forwards the owner's pointer handlers and reserves the corner room", () => {
    const onPointerMove = vi.fn()
    render(<TiltedCard data-testid="card" onPointerMove={onPointerMove}>Body</TiltedCard>)
    fireEvent.pointerMove(screen.getByTestId("card"), { pointerType: "mouse" })
    expect(onPointerMove).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId("card").className).toContain("p-2")
  })
})
