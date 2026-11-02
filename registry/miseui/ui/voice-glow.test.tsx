import { render, screen } from "@testing-library/react"
import { afterAll, afterEach } from "vitest"
import { VoiceGlow } from "./voice-glow"

// motion reads prefers-reduced-motion once and then listens for "change", so the stub must be in
// place before the first render and must be able to fire that listener.
let reduceMotion = false
const listeners = new Set<() => void>()
const originalMatchMedia = window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    get matches() {
      return reduceMotion
    },
    media: query,
    onchange: null,
    addEventListener: (_: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  }),
})

function setReduceMotion(value: boolean) {
  reduceMotion = value
  listeners.forEach((listener) => listener())
}

afterEach(() => setReduceMotion(false))
afterAll(() => Object.defineProperty(window, "matchMedia", { writable: true, value: originalMatchMedia }))

describe("VoiceGlow", () => {
  it("tells assistive tech whether the microphone is listening", () => {
    const { rerender } = render(<VoiceGlow active />)
    expect(screen.getByRole("img", { name: "Listening" })).toHaveAttribute("data-active", "true")
    rerender(<VoiceGlow active={false} />)
    expect(screen.getByRole("img", { name: "Microphone off" })).toHaveAttribute("data-active", "false")
    rerender(<VoiceGlow active label="Recording a voice note" />)
    expect(screen.getByRole("img", { name: "Recording a voice note" })).toBeInTheDocument()
  })

  it("clamps the level to 0..1", () => {
    const { rerender } = render(<VoiceGlow active level={-1} />)
    expect(screen.getByRole("img")).toHaveAttribute("data-level", "0")
    rerender(<VoiceGlow active level={2} />)
    expect(screen.getByRole("img")).toHaveAttribute("data-level", "1")
    rerender(<VoiceGlow active level={0.5} />)
    expect(screen.getByRole("img")).toHaveAttribute("data-level", "0.5")
  })

  it("sizes the box and the core from the size prop", () => {
    render(<VoiceGlow size={80} />)
    expect(screen.getByRole("img")).toHaveStyle({ width: "80px", height: "80px" })
    expect(screen.getByTestId("voice-glow-core")).toHaveStyle({ width: "27.2px", height: "27.2px" })
    expect(screen.getAllByTestId("voice-glow-halo")).toHaveLength(2)
  })

  it("keeps the level readout but skips the spring under reduced motion", () => {
    render(<VoiceGlow active level={0.5} />)
    expect(screen.getByRole("img")).toHaveAttribute("data-reduced", "false")
    setReduceMotion(true)
    render(<VoiceGlow active level={0.5} label="Reduced" />)
    const reduced = screen.getByRole("img", { name: "Reduced" })
    expect(reduced).toHaveAttribute("data-reduced", "true")
    expect(reduced).toHaveAttribute("data-level", "0.5")
  })
})
