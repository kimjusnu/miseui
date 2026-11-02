import { act, fireEvent, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Carousel, type CarouselItem, type CarouselProps, type CarouselVariant } from "./carousel"
import { scrollPosition, snapStop } from "./carousel-state"

const ITEMS: readonly CarouselItem[] = [
  { id: "a", label: "Harbour", content: <a href="#harbour">Harbour link</a>, thumbnail: <span data-testid="thumb-a" /> },
  { id: "b", label: "Market", content: <p>Market</p> },
  { id: "c", label: "Station", content: <p>Station</p> },
]

const SLIDE_WIDTH = 100
const scrollTo = vi.fn()

/** jsdom has no layout, so the slides are placed by hand and scrolling is one write plus one event. */
function layOut(viewport: HTMLElement) {
  Object.defineProperty(viewport, "clientWidth", { configurable: true, value: SLIDE_WIDTH })
  Object.defineProperty(viewport, "scrollWidth", { configurable: true, value: SLIDE_WIDTH * ITEMS.length })
  viewport.querySelectorAll<HTMLElement>("[data-slot='carousel-slide']").forEach((slide, index) => {
    Object.defineProperty(slide, "offsetLeft", { configurable: true, value: index * SLIDE_WIDTH })
    Object.defineProperty(slide, "offsetWidth", { configurable: true, value: SLIDE_WIDTH })
  })
}

beforeAll(() => {
  Element.prototype.scrollTo = scrollTo as unknown as typeof Element.prototype.scrollTo
})

afterEach(() => {
  scrollTo.mockClear()
  vi.useRealTimers()
})

const setup = () => userEvent.setup({ pointerEventsCheck: 0 })
const renderCarousel = (props: Partial<CarouselProps> = {}) => render(<Carousel label="Places" items={ITEMS} {...props} />)
const root = () => screen.getByRole("region", { name: "Places" })
const viewport = () => document.querySelector("[data-slot='carousel-viewport']") as HTMLElement

it("holds its width in a narrow parent, because an open grid track would grow to fit the thumbnail strip", () => {
  renderCarousel({ variant: "thumbnails" })
  expect(root()).toHaveClass("grid-cols-[minmax(0,1fr)]")
})
const slides = () => screen.getAllByRole("group", { name: /of 3/ })
const activeSlide = () => document.querySelector("[data-slot='carousel-slide'][data-active='true']") as HTMLElement

describe("carousel math", () => {
  it("snapStop aligns to the start or the centre and clamps to what can scroll", () => {
    expect(snapStop(200, 80, 100, 500, "start")).toBe(200)
    expect(snapStop(200, 80, 100, 500, "center")).toBe(190)
    expect(snapStop(8, 80, 100, 500, "center")).toBe(0)
    expect(snapStop(600, 80, 100, 500, "start")).toBe(500)
  })

  it("scrollPosition interpolates between stops and holds at both ends", () => {
    expect(scrollPosition([0, 100, 200], 0)).toBe(0)
    expect(scrollPosition([0, 100, 200], 50)).toBe(0.5)
    expect(scrollPosition([0, 100, 200], 150)).toBe(1.5)
    expect(scrollPosition([0, 100, 200], 200)).toBe(2)
    expect(scrollPosition([], 10)).toBe(0)
  })
})

describe("Carousel", () => {
  it("is a named carousel region of named slides", () => {
    renderCarousel()
    expect(root()).toHaveAttribute("aria-roledescription", "carousel")
    expect(slides()[1]).toHaveAttribute("aria-roledescription", "slide")
    expect(slides()[1]).toHaveAccessibleName("2 of 3: Market")
  })

  it.each<[CarouselVariant, string, string]>([
    ["plain", "carousel-count", "carousel-thumbs"],
    ["cards", "carousel-count", "carousel-thumbs"],
    ["thumbnails", "carousel-thumbs", "carousel-count"],
  ])("%s draws %s and not %s", (variant, present, absent) => {
    renderCarousel({ variant })
    expect(root()).toHaveAttribute("data-variant", variant)
    expect(document.querySelector(`[data-slot='${present}']`)).not.toBeNull()
    expect(document.querySelector(`[data-slot='${absent}']`)).toBeNull()
  })

  it("peek lays its buttons over the slides and has no control row", () => {
    renderCarousel({ variant: "peek" })
    expect(viewport().parentElement).toContainElement(screen.getByRole("button", { name: "Next slide" }))
    expect(document.querySelector("[data-slot='carousel-count']")).toBeNull()
  })

  it("cards transforms an inner frame so the snap box stays where the browser measures it", () => {
    renderCarousel({ variant: "cards" })
    const slide = slides()[1]
    expect(slide.style.transform).toBe("")
    const frame = within(slide).getByText("Market").closest("[data-slot='carousel-frame']") as HTMLElement
    expect(frame.getAttribute("style")).toContain("--carousel-depth")
    expect(slide.style.zIndex).toBe("2")
  })

  it("next and previous scroll to the slide, smoothly, and stop at the ends with aria-disabled", async () => {
    const user = setup()
    const onIndexChange = vi.fn()
    renderCarousel({ onIndexChange })
    layOut(viewport())
    const previous = screen.getByRole("button", { name: "Previous slide" })
    const next = screen.getByRole("button", { name: "Next slide" })
    expect(previous).toHaveAttribute("aria-disabled", "true")
    await user.click(next)
    expect(scrollTo).toHaveBeenLastCalledWith({ left: SLIDE_WIDTH, behavior: "smooth" })
    expect(onIndexChange).toHaveBeenLastCalledWith(1)
    await user.click(next)
    expect(next).toHaveAttribute("aria-disabled", "true")
    await user.click(next)
    expect(onIndexChange).toHaveBeenCalledTimes(2)
  })

  it("loop wraps past the ends", async () => {
    const user = setup()
    const onIndexChange = vi.fn()
    renderCarousel({ loop: true, onIndexChange })
    await user.click(screen.getByRole("button", { name: "Previous slide" }))
    expect(onIndexChange).toHaveBeenLastCalledWith(2)
  })

  it("arrow keys, Home and End move the carousel from anywhere inside", async () => {
    const user = setup()
    renderCarousel()
    viewport().focus()
    await user.keyboard("{ArrowRight}")
    expect(activeSlide()).toHaveAccessibleName("2 of 3: Market")
    await user.keyboard("{End}")
    expect(activeSlide()).toHaveAccessibleName("3 of 3: Station")
    await user.keyboard("{Home}")
    expect(activeSlide()).toHaveAccessibleName("1 of 3: Harbour")
  })

  it("leaves arrow keys alone inside a text field in a slide", async () => {
    const user = setup()
    const onIndexChange = vi.fn()
    render(<Carousel label="Places" onIndexChange={onIndexChange} items={[{ id: "x", label: "Form", content: <input aria-label="Name" /> }, ...ITEMS]} />)
    await user.click(screen.getByRole("textbox", { name: "Name" }))
    await user.keyboard("{ArrowRight}")
    expect(onIndexChange).not.toHaveBeenCalled()
  })

  it("native swiping updates the current slide and writes the live position for transforms", () => {
    const onIndexChange = vi.fn()
    renderCarousel({ onIndexChange })
    layOut(viewport())
    viewport().scrollLeft = 120
    fireEvent.scroll(viewport())
    expect(onIndexChange).toHaveBeenLastCalledWith(1)
    expect(root().style.getPropertyValue("--carousel-position")).toBe("1.2")
  })

  it("slides passed on the way to a button target do not count as current, and a finger cancels the hold", async () => {
    const user = setup()
    const onIndexChange = vi.fn()
    renderCarousel({ onIndexChange })
    layOut(viewport())
    await user.click(screen.getByRole("button", { name: "Next slide" }))
    await user.click(screen.getByRole("button", { name: "Next slide" }))
    expect(onIndexChange).toHaveBeenLastCalledWith(2)
    viewport().scrollLeft = 110
    fireEvent.scroll(viewport())
    expect(onIndexChange).toHaveBeenLastCalledWith(2)
    fireEvent.pointerDown(viewport())
    fireEvent.scroll(viewport())
    expect(onIndexChange).toHaveBeenLastCalledWith(1)
  })

  it("thumbnails jump directly and mark the current one", async () => {
    const user = setup()
    renderCarousel({ variant: "thumbnails" })
    expect(screen.getByTestId("thumb-a")).toBeInTheDocument()
    const market = screen.getByRole("button", { name: "Market" })
    await user.click(market)
    expect(market).toHaveAttribute("aria-current", "true")
    expect(activeSlide()).toHaveAccessibleName("2 of 3: Market")
  })

  it("peek turns a press on a neighbour into going there, and keeps its links from firing", async () => {
    const user = setup()
    const onLink = vi.fn((event: Event) => event.preventDefault())
    renderCarousel({ variant: "peek", defaultIndex: 1 })
    const link = screen.getByRole("link", { name: "Harbour link" })
    link.addEventListener("click", onLink)
    await user.click(link)
    expect(onLink).not.toHaveBeenCalled()
    expect(activeSlide()).toHaveAccessibleName("1 of 3: Harbour")
  })

  it("autoplay is off unless asked for, and offers no pause button then", () => {
    vi.useFakeTimers()
    const onIndexChange = vi.fn()
    renderCarousel({ onIndexChange, interval: 100 })
    act(() => vi.advanceTimersByTime(500))
    expect(onIndexChange).not.toHaveBeenCalled()
    expect(document.querySelector("[data-slot='carousel-autoplay']")).toBeNull()
  })

  it("autoplay advances, wraps, pauses on hover and focus, and stops with the button", () => {
    vi.useFakeTimers()
    const onIndexChange = vi.fn()
    renderCarousel({ autoplay: true, interval: 100, onIndexChange })
    act(() => vi.advanceTimersByTime(100))
    expect(onIndexChange).toHaveBeenLastCalledWith(1)
    fireEvent.pointerEnter(root())
    act(() => vi.advanceTimersByTime(500))
    expect(onIndexChange).toHaveBeenCalledTimes(1)
    fireEvent.pointerLeave(root())
    act(() => {
      viewport().focus()
    })
    act(() => vi.advanceTimersByTime(500))
    expect(onIndexChange).toHaveBeenCalledTimes(1)
    act(() => {
      viewport().blur()
    })
    act(() => vi.advanceTimersByTime(100))
    expect(onIndexChange).toHaveBeenLastCalledWith(2)
    act(() => vi.advanceTimersByTime(100))
    expect(onIndexChange).toHaveBeenLastCalledWith(0)
    fireEvent.click(screen.getByRole("button", { name: "Pause slides" }))
    act(() => vi.advanceTimersByTime(500))
    expect(onIndexChange).toHaveBeenCalledTimes(3)
    expect(screen.getByRole("button", { name: "Play slides" })).toBeInTheDocument()
  })

  it("announces the slide politely, except while autoplay is running", () => {
    const { unmount } = renderCarousel()
    expect(document.querySelector("[aria-live='polite']")).toHaveTextContent("1 of 3: Harbour")
    unmount()
    renderCarousel({ autoplay: true })
    expect(document.querySelector("[aria-live='off']")).not.toBeNull()
  })

  it("parallax moves the media layer only, and cards ignores it", () => {
    const withMedia = ITEMS.map((item) => ({ ...item, media: <span /> }))
    const { unmount } = render(<Carousel label="Places" items={withMedia} effect="parallax" />)
    expect(root()).toHaveAttribute("data-effect", "parallax")
    expect((document.querySelector("[data-slot='carousel-media']") as HTMLElement).style.transform).toContain("--carousel-position")
    unmount()
    render(<Carousel label="Places" items={withMedia} effect="parallax" variant="cards" />)
    expect((document.querySelector("[data-slot='carousel-media']") as HTMLElement).style.transform).toBe("")
  })
})
