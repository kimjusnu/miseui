import { fireEvent, render, screen } from "@testing-library/react"
import { GradientText } from "./gradient-text"

const state = vi.hoisted(() => ({ reduced: false, inView: true }))

vi.mock("motion/react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("motion/react")>()),
  useReducedMotion: () => state.reduced,
  useInView: () => state.inView,
}))

beforeEach(() => {
  state.reduced = false
  state.inView = true
})

const root = () => document.querySelector("[data-slot='gradient-text']") as HTMLElement
const paint = () => document.querySelector("[data-slot='gradient-text-paint']") as HTMLElement

describe("GradientText", () => {
  it("keeps the real text in the tree, once, with the heading it was given", () => {
    render(<GradientText as="h1">Ship the quiet version</GradientText>)
    expect(screen.getByRole("heading", { level: 1, name: "Ship the quiet version" })).toBeInTheDocument()
    expect(document.querySelector("[aria-hidden]")).toBeNull()
    expect(screen.getAllByText("Ship the quiet version")).toHaveLength(1)
  })

  it("gives descenders room with padding and an equal negative margin", () => {
    render(<GradientText>glyphs</GradientText>)
    expect(paint()).toHaveClass("pb-[0.14em]", "-mb-[0.14em]", "bg-clip-text")
  })

  it("repaints the gradient per line when text wraps", () => {
    render(<GradientText>A sentence long enough to wrap</GradientText>)
    expect(paint()).toHaveClass("box-decoration-clone")
  })

  it("keeps selected text legible", () => {
    render(<GradientText>Select me</GradientText>)
    expect(paint()).toHaveClass("selection:text-foreground", "selection:bg-mise-soft")
  })

  it("falls back to solid text for forced colours and high contrast, winning by importance", () => {
    render(<GradientText variant="aurora">Readable</GradientText>)
    expect(paint()).toHaveClass("forced-colors:bg-none!", "forced-colors:text-[CanvasText]!", "contrast-more:bg-none!", "contrast-more:text-foreground!")
  })

  it("only makes text transparent where the gradient can be drawn, and keeps a solid colour otherwise", () => {
    const solid = { fade: "text-foreground", accent: "text-foreground", aurora: "text-foreground", metal: "text-foreground" } as const
    for (const variant of ["fade", "accent", "aurora", "metal"] as const) {
      const { unmount } = render(<GradientText variant={variant}>Text</GradientText>)
      expect(paint()).toHaveClass(solid[variant], "supports-[color:oklch(from_red_l_c_h)]:text-transparent")
      expect(paint()).not.toHaveClass("text-transparent")
      unmount()
    }
  })

  it("draws different gradients from theme tokens only", () => {
    const imageOf = (variant: "fade" | "accent" | "aurora" | "metal") => {
      const { unmount } = render(<GradientText variant={variant}>Text</GradientText>)
      const image = paint().className.split(" ").find((name) => name.includes("background-image:")) as string
      unmount()
      return image
    }
    const images = (["fade", "accent", "aurora", "metal"] as const).map(imageOf)
    expect(new Set(images).size).toBe(4)
    expect(images[0]).toContain("180deg")
    for (const image of images) {
      expect(image).not.toMatch(/#[0-9a-f]{3,8}|rgb\(/i)
    }
  })

  it("clamps accent stops per theme, so a near-black or near-white accent still reads", () => {
    render(<GradientText variant="accent">Text</GradientText>)
    expect(paint().className).toContain("[--mise-gradient-accent:oklch(from_var(--mise)_clamp(0.46,l,0.58)_c_h)]")
    expect(paint().className).toContain("dark:[--mise-gradient-accent:oklch(from_var(--mise)_clamp(0.66,l,0.74)_c_h)]")
  })

  it("makes aurora from hue shifts starting on the accent, with lightness carrying a palette that has no chroma", () => {
    render(<GradientText variant="aurora">Text</GradientText>)
    const classes = paint().className
    expect(classes).toContain("[--mise-gradient-1:oklch(from_var(--mise)_clamp(0.38,l,0.54)_c_h)]")
    expect(classes).toContain("calc(h_+_40_*_sin((h_-_100)_*_1deg))")
    expect(classes).toContain("calc(h_+_80_*_sin((h_-_100)_*_1deg))")
  })

  it("does not move unless asked", () => {
    render(<GradientText variant="aurora">Still</GradientText>)
    expect(paint().className).not.toContain("animate-")
    expect(root()).not.toHaveAttribute("data-effect")
    expect(root()).not.toHaveAttribute("data-playing")
  })

  it("flows with the effect, on a seamless image twice the width", () => {
    render(<GradientText variant="aurora" effect="flow">Flow</GradientText>)
    expect(paint().className).toContain("animate-[mise-gradient-flow")
    expect(paint().className).toContain("[background-size:200%_100%]")
    expect(paint().className).toContain("--mise-gradient-1),var(--mise-gradient-2),var(--mise-gradient-3),var(--mise-gradient-1)")
    expect(paint().style.animationPlayState).toBe("running")
    expect(root()).toHaveAttribute("data-effect", "flow")
  })

  it("pauses the flow on hover, focus, off screen and in a hidden tab", () => {
    const { rerender } = render(<GradientText effect="flow">Flow</GradientText>)
    fireEvent.pointerEnter(root())
    expect(paint().style.animationPlayState).toBe("paused")
    fireEvent.pointerLeave(root())
    expect(paint().style.animationPlayState).toBe("running")

    fireEvent.focus(root())
    expect(paint().style.animationPlayState).toBe("paused")
    fireEvent.blur(root())

    const hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(true)
    fireEvent(document, new Event("visibilitychange"))
    expect(paint().style.animationPlayState).toBe("paused")
    hidden.mockRestore()
    fireEvent(document, new Event("visibilitychange"))
    expect(paint().style.animationPlayState).toBe("running")

    state.inView = false
    rerender(<GradientText effect="flow">Flow</GradientText>)
    expect(paint().style.animationPlayState).toBe("paused")
  })

  it("holds the flow with the paused prop", () => {
    const { rerender } = render(<GradientText effect="flow" paused>Flow</GradientText>)
    expect(paint().style.animationPlayState).toBe("paused")
    expect(root()).toHaveAttribute("data-playing", "false")
    rerender(<GradientText effect="flow">Flow</GradientText>)
    expect(paint().style.animationPlayState).toBe("running")
  })

  it("draws the still gradient under reduced motion even with the effect on", () => {
    state.reduced = true
    render(<GradientText variant="fade" effect="flow">Still</GradientText>)
    expect(paint().className).not.toContain("animate-")
    expect(paint().className).toContain("180deg")
    expect(paint().style.animationPlayState).toBe("")
  })

  it("passes attributes through and calls the owner's handlers", () => {
    const onPointerEnter = vi.fn()
    render(<GradientText className="text-4xl" data-testid="title" onPointerEnter={onPointerEnter}>Text</GradientText>)
    expect(screen.getByTestId("title")).toHaveClass("text-4xl")
    fireEvent.pointerEnter(root())
    expect(onPointerEnter).toHaveBeenCalledTimes(1)
  })
})
