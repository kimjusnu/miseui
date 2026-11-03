import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MetroMap, type MetroLine, type MetroMapProps, type MetroMapVariant } from "./metro-map"
import { buildMetro, centeredScroll, edgeMask, progressAlong, roundedPath, scrollEdges, stationInDirection, type MetroLayout } from "./metro-map-layout"

const VARIANTS: readonly MetroMapVariant[] = ["transit", "tube", "branch"]

const LINES: readonly MetroLine[] = [
  {
    id: "research",
    label: "Research",
    tone: "muted",
    stops: [
      { id: "kickoff", label: "Kickoff", at: 0, lane: 1 },
      { id: "interviews", label: "Interviews", at: 1, lane: 1 },
      { id: "brief", label: "Brief", at: 2, lane: 1 },
    ],
  },
  {
    id: "build",
    label: "Build",
    stops: [
      { id: "kickoff", label: "Kickoff", at: 0, lane: 1 },
      { id: "prototype", label: "Prototype", note: "Week 3", at: 1, lane: 0 },
      { id: "beta", label: "Beta", at: 3, lane: 0, disabled: true },
      { id: "launch", label: "Launch", at: 4, lane: 0 },
    ],
  },
]

function Map(props: Partial<MetroMapProps>) {
  return <MetroMap label="Project plan" lines={LINES} {...props} />
}

const station = (name: RegExp | string) => screen.getByRole("button", { name })

const HORIZONTAL: MetroLayout = { orientation: "horizontal", gap: 100, laneGap: 80, padTime: 50, padLane: 40, bend: "diagonal", corner: 0 }

describe("metro layout", () => {
  it("spaces stops by order, not by value, so a long quiet stretch takes no extra room", () => {
    const plan = buildMetro(
      [{ id: "a", label: "A", stops: [{ id: "1", label: "1", at: 0, lane: 0 }, { id: "2", label: "2", at: 1000, lane: 0 }, { id: "3", label: "3", at: 1001, lane: 0 }] }],
      HORIZONTAL,
    )
    expect(plan.stations.map((placed) => placed.x)).toEqual([50, 150, 250])
    expect(plan.width).toBe(300)
    expect(plan.height).toBe(80)
  })

  it("draws a shared stop once, as an interchange of both lines", () => {
    const plan = buildMetro(LINES, HORIZONTAL)
    expect(plan.stations.filter((placed) => placed.id === "kickoff")).toHaveLength(1)
    expect(plan.stations.find((placed) => placed.id === "kickoff")?.lineLabels).toEqual(["Research", "Build"])
  })

  it("bends into a station at 45 degrees, or at a right angle when asked", () => {
    const stops = [{ id: "a", label: "A", at: 0, lane: 1 }, { id: "b", label: "B", at: 1, lane: 0 }]
    const diagonal = buildMetro([{ id: "l", label: "L", stops }], HORIZONTAL).lines[0]?.points
    expect(diagonal).toEqual([{ x: 50, y: 120 }, { x: 70, y: 120 }, { x: 150, y: 40 }])
    const square = buildMetro([{ id: "l", label: "L", stops }], { ...HORIZONTAL, bend: "orthogonal" }).lines[0]?.points
    expect(square).toEqual([{ x: 50, y: 120 }, { x: 100, y: 120 }, { x: 100, y: 40 }, { x: 150, y: 40 }])
  })

  it("swaps the axes when vertical", () => {
    const plan = buildMetro(LINES, { ...HORIZONTAL, orientation: "vertical" })
    const kickoff = plan.stations.find((placed) => placed.id === "kickoff")
    expect(kickoff).toMatchObject({ x: 120, y: 50 })
  })

  it("rounds corners only when given a radius", () => {
    const points = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }]
    expect(roundedPath(points, 0)).toBe("M0 0L10 0L10 10")
    expect(roundedPath(points, 2)).toBe("M0 0L8 0Q10 0 10 2L10 10")
  })

  it("measures how far along a line a station is", () => {
    const points = [{ x: 0, y: 0 }, { x: 30, y: 0 }, { x: 100, y: 0 }]
    expect(progressAlong(points, { x: 30, y: 0 })).toBeCloseTo(0.3)
    expect(progressAlong(points, { x: 100, y: 0 })).toBe(1)
    expect(progressAlong(points, { x: 9, y: 9 })).toBe(0)
  })

  it("finds the station an arrow points at and skips a disabled one", () => {
    const { stations } = buildMetro(LINES, HORIZONTAL)
    expect(stationInDirection(stations, "kickoff", "ArrowRight")).toBe("interviews")
    expect(stationInDirection(stations, "kickoff", "ArrowUp")).toBe("prototype")
    expect(stationInDirection(stations, "prototype", "ArrowRight")).toBe("brief")
    expect(stationInDirection(stations, "launch", "ArrowRight")).toBeNull()
    expect(stationInDirection(stations, "kickoff", "Enter")).toBeNull()
  })

  it("centres without scrolling past the start", () => {
    expect(centeredScroll(400, 40, 200)).toBe(320)
    expect(centeredScroll(20, 40, 200)).toBe(0)
  })

  it("fades only the edges that have more map behind them, so a cut label reads as more to scroll", () => {
    expect(scrollEdges({ scrollLeft: 0, clientWidth: 300, scrollWidth: 300 })).toEqual({ start: false, end: false })
    expect(scrollEdges({ scrollLeft: 0, clientWidth: 300, scrollWidth: 800 })).toEqual({ start: false, end: true })
    expect(scrollEdges({ scrollLeft: 200, clientWidth: 300, scrollWidth: 800 })).toEqual({ start: true, end: true })
    expect(scrollEdges({ scrollLeft: 500, clientWidth: 300, scrollWidth: 800 })).toEqual({ start: true, end: false })
    expect(edgeMask({ start: false, end: false })).toBeUndefined()
    expect(edgeMask({ start: true, end: false })).toContain("transparent, black 24px, black 100%")
    expect(edgeMask({ start: false, end: true })).toContain("black 0, black calc(100% - 24px), transparent")
  })
})

describe("MetroMap", () => {
  describe.each(VARIANTS)("variant=%s", (variant) => {
    it("is a named navigation landmark that marks the selected station", async () => {
      const user = userEvent.setup()
      const onSelect = vi.fn()
      render(<Map variant={variant} onSelect={onSelect} />)
      const root = screen.getByRole("navigation", { name: "Project plan" })
      expect(root).toHaveAttribute("data-slot", "metro-map")
      expect(root).toHaveAttribute("data-variant", variant)
      const brief = station("Brief")
      await user.click(brief)
      expect(onSelect).toHaveBeenCalledWith("brief", brief)
      expect(brief).toHaveAttribute("aria-current", "location")
      expect(station(/^Kickoff/)).not.toHaveAttribute("aria-current")
    })

    it("has one tab stop and moves with the arrow keys, without selecting", async () => {
      const user = userEvent.setup()
      const onSelect = vi.fn()
      render(<Map variant={variant} onSelect={onSelect} />)
      await user.tab()
      expect(station(/^Kickoff/)).toHaveFocus()
      await user.tab()
      expect(document.body).toHaveFocus()
      station(/^Kickoff/).focus()
      await user.keyboard(variant === "branch" ? "{ArrowDown}" : "{ArrowRight}")
      expect(document.activeElement).not.toBe(station(/^Kickoff/))
      expect(onSelect).not.toHaveBeenCalled()
      await user.keyboard("{End}")
      expect(station("Launch")).toHaveFocus()
      await user.keyboard("{Enter}")
      expect(onSelect).toHaveBeenCalledWith("launch", station("Launch"))
    })
  })

  it("draws different geometry and markers per variant", () => {
    const shape = (variant: MetroMapVariant) => {
      const { container, unmount } = render(<Map variant={variant} />)
      const found = {
        ticks: container.querySelectorAll("[data-shape='tick']").length,
        rings: container.querySelectorAll("[data-shape='ring']").length,
        canvasWidth: container.querySelector<HTMLElement>("[data-slot='metro-map-canvas']")?.style.width,
        d: container.querySelector("[data-line='build']")?.getAttribute("d"),
      }
      unmount()
      return found
    }
    const transit = shape("transit")
    const tube = shape("tube")
    const branch = shape("branch")
    expect(transit.ticks).toBe(0)
    expect(transit.rings).toBeGreaterThan(0)
    expect(tube.ticks).toBeGreaterThan(0)
    expect(tube.d).not.toBe(transit.d)
    expect(branch.canvasWidth).toBe("100%")
    expect(transit.canvasWidth).not.toBe("100%")
  })

  it("names an interchange for assistive tech and does not rely on the ring", () => {
    render(<Map />)
    expect(station(/^Kickoff/)).toHaveTextContent("Interchange: Research, Build")
    expect(station("Brief")).not.toHaveTextContent("Interchange")
  })

  it("disables a station and leaves it out of the way", async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<Map onSelect={onSelect} />)
    const beta = station("Beta")
    expect(beta).toBeDisabled()
    await user.click(beta)
    expect(onSelect).not.toHaveBeenCalled()
  })

  it("renders a link when a station has an address", () => {
    const lines = [{ id: "l", label: "Line", stops: [{ id: "docs", label: "Docs", at: 0, lane: 0, href: "/docs" }] }]
    render(<MetroMap label="Map" lines={lines} defaultSelected="docs" />)
    expect(screen.getByRole("link", { name: "Docs" })).toHaveAttribute("href", "/docs")
    expect(screen.getByRole("link", { name: "Docs" })).toHaveAttribute("aria-current", "location")
  })

  it("inks the line up to the selected station with the ride effect", async () => {
    const user = userEvent.setup()
    const { container } = render(<Map effect="ride" defaultSelected="kickoff" />)
    const ride = () => container.querySelector("[data-slot='metro-map-ride']")
    expect(ride()).toHaveAttribute("data-progress", "0.000")
    await user.click(station("Launch"))
    expect(ride()).toHaveAttribute("data-progress", "1.000")
    await user.click(station(/^Prototype/))
    expect(Number(ride()?.getAttribute("data-progress"))).toBeLessThan(1)
  })

  it("draws no ride path without the effect, and a legend only for two or more lines", () => {
    const { container, unmount } = render(<Map defaultSelected="kickoff" />)
    expect(container.querySelector("[data-slot='metro-map-ride']")).toBeNull()
    expect(container.querySelector("[data-slot='metro-map-legend']")).not.toBeNull()
    unmount()
    const one = render(<MetroMap label="Map" lines={[LINES[0] as MetroLine]} />)
    expect(one.container.querySelector("[data-slot='metro-map-legend']")).toBeNull()
  })

  it("follows a controlled selection", async () => {
    const user = userEvent.setup()
    render(<Map selected="brief" />)
    await user.click(station("Launch"))
    expect(station("Brief")).toHaveAttribute("aria-current", "location")
    expect(station("Launch")).not.toHaveAttribute("aria-current")
  })

  it("scrolls itself to a station when the keyboard moves there", async () => {
    const user = userEvent.setup()
    const scrollTo = vi.fn()
    const { container } = render(<Map />)
    const scroller = container.querySelector("[data-slot='metro-map-scroller']") as HTMLElement
    scroller.scrollTo = scrollTo
    station(/^Kickoff/).focus()
    await user.keyboard("{End}")
    expect(scrollTo).toHaveBeenCalledTimes(1)
  })
})
