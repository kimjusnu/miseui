import type { ReactElement } from "react"
import { hydrateRoot } from "react-dom/client"
import { renderToString } from "react-dom/server"
import { act, render } from "@testing-library/react"
import { CountUp } from "./count-up"
import { DecryptText } from "./decrypt-text"
import { GlitchText } from "./glitch-text"
import { GradientText } from "./gradient-text"
import { HighlighterText } from "./highlighter-text"
import { RotatingText } from "./rotating-text"
import { GlyphCell, paintGlyph } from "./scramble-play"
import { ScrambleText } from "./scramble-text"
import { SplitText } from "./split-text"
import { TypewriterText } from "./typewriter-text"

/** Defects found by looking at the wave in a real browser. jsdom cannot see them, so these pin the cause. */

beforeAll(() => {
  class Silent {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal("ResizeObserver", Silent)
  vi.stubGlobal("IntersectionObserver", Silent)
  Range.prototype.getClientRects = () => [] as unknown as DOMRectList
})

describe("the screen reader copy stays out of what a person copies", () => {
  it.each<[string, ReactElement]>([
    ["scramble-text", <ScrambleText text="Saved" />],
    ["decrypt-text", <DecryptText text="Saved" />],
    ["typewriter-text", <TypewriterText text="Saved" />],
    ["rotating-text", <RotatingText words={["Saved"]} />],
    ["split-text", <SplitText text="Saved" />],
    ["count-up plain", <CountUp value={12} />],
    ["count-up meter", <CountUp value={12} variant="meter" />],
  ])("%s", (_name, element) => {
    const { container } = render(element)
    expect(container.querySelector(".sr-only")).toHaveClass("select-none")
  })
})

describe("letters that wait for an effect stay ordinary inline text", () => {
  it("does not box a letter or a word, which would drop underlines and kerning", () => {
    const { container } = render(
      <a href="#changelog" className="underline">
        <ScrambleText text="Read the changelog" effect="hover" />
      </a>,
    )
    const cell = container.querySelector("[data-slot='glyph-cell']")
    const word = container.querySelector("[data-slot='glyph-word']")
    expect(cell).not.toHaveClass("inline-block")
    expect(word).not.toHaveClass("inline-block")
    expect(word).toHaveClass("whitespace-nowrap")
  })

  it("hides a letter by colour while noise covers it, because a hidden letter takes the link underline with it", () => {
    const { container } = render(<GlyphCell target="R" />)
    const cell = container.querySelector("[data-slot='glyph-cell']") as HTMLElement
    const letter = container.querySelector("[data-slot='glyph-letter']") as HTMLElement
    paintGlyph(cell, "x")
    expect(letter.style.color).toBe("transparent")
    expect(letter.style.visibility).toBe("")
    paintGlyph(cell, null)
    expect(letter.style.color).toBe("")
  })

  it("lines the stand-in up with the letter under any line height", () => {
    const { container } = render(<ScrambleText text="Saved" />)
    expect(container.querySelector("[data-slot='glyph-layer']")).toHaveClass("leading-[normal]")
  })
})

describe("count-up reels", () => {
  it.each(["odometer", "board"] as const)("%s selects as the number, never the digits on the strip", (variant) => {
    const { container } = render(<CountUp value={1248} variant={variant} />)
    const real = container.querySelector("[data-slot='count-up-text']") as HTMLElement
    expect(real).toHaveClass("text-transparent", "absolute")
    expect(real).not.toHaveClass("sr-only")
    expect(real.textContent).toBe("1,248")
    expect(container.querySelector("[data-slot='count-up-visual']")).toHaveClass("select-none", "pointer-events-none")
  })
})

describe("rotating-text letters", () => {
  it("measures the slot from the same split letters it shows, because splitting loses kerning", () => {
    const { container } = render(<RotatingText words={["faster"]} effect="letters" />)
    const sizer = container.querySelector("[data-slot='rotating-text-sizer']") as HTMLElement
    expect(sizer.querySelectorAll(".inline-block")).toHaveLength(6)
  })
})

describe("gradient-text aurora", () => {
  it("moves hue away from yellow, which turns to mud when darkened for a light page", () => {
    const { container } = render(<GradientText variant="aurora">Fewer screens</GradientText>)
    const paint = container.querySelector("[data-slot='gradient-text-paint']") as HTMLElement
    expect(paint.className).toContain("sin(")
    expect(paint.className).not.toContain("calc(h_-_35)")
    expect(paint.className).not.toContain("calc(h_+_35)")
  })

  it("falls back to the foreground, since mise on a light surface is not body-level contrast", () => {
    const { container } = render(<GradientText variant="aurora">Fewer screens</GradientText>)
    expect(container.querySelector("[data-slot='gradient-text-paint']")).toHaveClass("text-foreground")
    expect(container.querySelector("[data-slot='gradient-text-paint']")).not.toHaveClass("text-mise")
  })
})

describe("decrypt-text press", () => {
  it("keeps the button in the interface face when the secret is set in monospace", () => {
    const { getByRole } = render(<DecryptText text="quiet-harbour-41" effect="press" className="font-mono" />)
    expect(getByRole("button")).toHaveClass("font-sans")
  })
})

describe("server render", () => {
  const cases: [string, ReactElement][] = [
    ["scramble-text", <ScrambleText text="Your changes are saved" />],
    ["decrypt-text", <DecryptText text="Card ending 4242" />],
    ["decrypt-text press", <DecryptText text="Card ending 4242" effect="press" />],
    ["typewriter-text", <TypewriterText text="Fewer tabs." />],
    ["typewriter-text loop", <TypewriterText effect="loop" phrases={["One", "Two"]} />],
    ["glitch-text", <GlitchText text="Signal recovered" />],
    ["count-up", <CountUp value={1248} locale="en-US" />],
    ["count-up odometer", <CountUp value={1248} variant="odometer" locale="en-US" />],
    ["rotating-text", <RotatingText words={["one", "two"]} before="Pick " />],
    ["gradient-text", <GradientText variant="aurora" effect="flow">Fewer screens</GradientText>],
    ["highlighter-text", <HighlighterText variant="sketch">first screen</HighlighterText>],
  ]

  it.each(cases)("%s hydrates without a mismatch", async (_name, element) => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {})
    const host = document.createElement("div")
    document.body.append(host)
    host.innerHTML = renderToString(element)
    const recoverable: unknown[] = []
    const root = await act(async () => hydrateRoot(host, element, { onRecoverableError: (error) => recoverable.push(error) }))
    expect(recoverable).toEqual([])
    expect(errors).not.toHaveBeenCalled()
    await act(async () => root.unmount())
    host.remove()
    errors.mockRestore()
  })
})
