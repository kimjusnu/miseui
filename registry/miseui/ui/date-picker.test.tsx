import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Calendar, DatePicker } from "./date-picker"
import {
  addDays,
  addMonths,
  buildMonthGrid,
  clampDay,
  dateKey,
  datePattern,
  firstDayOfWeek,
  nextFocusDate,
  nextRange,
  parseDateText,
  rangeRole,
  weekdayLabels,
} from "./date-picker-math"

class ResizeObserverStub {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

beforeAll(() => {
  vi.stubGlobal("ResizeObserver", ResizeObserverStub)
  Element.prototype.scrollIntoView = vi.fn()
  Element.prototype.hasPointerCapture = () => false
})

afterAll(() => vi.unstubAllGlobals())

const TODAY = new Date(2026, 10, 2)
const NOV = new Date(2026, 10, 1)
const day = (date: number, month = 10, year = 2026) => new Date(year, month, date)
const gridNamed = (name: string) => screen.getByRole("grid", { name })
const dayButton = (name: string) => screen.getByRole("button", { name })

describe("date math", () => {
  it("addMonths lands on the last day of a shorter month, without touching the input", () => {
    const start = day(31, 0)
    expect(dateKey(addMonths(start, 1))).toBe("2026-02-28")
    expect(dateKey(addMonths(day(31, 0, 2024), 1))).toBe("2024-02-29")
    expect(dateKey(addMonths(start, -2))).toBe("2025-11-30")
    expect(dateKey(start)).toBe("2026-01-31")
  })

  it("addDays crosses month ends and dateKey is local, not UTC", () => {
    expect(dateKey(addDays(day(31, 11), 1))).toBe("2027-01-01")
    expect(dateKey(new Date(2026, 2, 8, 23, 59))).toBe("2026-03-08")
  })

  it("buildMonthGrid always draws six weeks that start on the given weekday", () => {
    const sunday = buildMonthGrid(NOV, 0)
    expect(sunday).toHaveLength(6)
    expect(sunday.every((week) => week.length === 7)).toBe(true)
    expect(sunday[0][0].getDay()).toBe(0)
    const monday = buildMonthGrid(NOV, 1)
    expect(monday[0][0].getDay()).toBe(1)
    expect(dateKey(monday[0][0])).toBe("2026-10-26")
    expect(dateKey(monday[0][6])).toBe("2026-11-01")
  })

  it("clampDay keeps a date within its bounds", () => {
    expect(clampDay(day(1), day(5))).toEqual(day(5))
    expect(clampDay(day(30), undefined, day(5))).toEqual(day(5))
    expect(clampDay(day(3), day(1), day(5))).toEqual(day(3))
  })

  it("firstDayOfWeek follows the locale", () => {
    expect(firstDayOfWeek("en-US")).toBe(0)
    expect(firstDayOfWeek("de-DE")).toBe(1)
    expect(firstDayOfWeek("ko-KR")).toBe(0)
  })

  it("weekdayLabels start where the week starts", () => {
    expect(weekdayLabels("en-US", 0)[0].long).toBe("Sunday")
    expect(weekdayLabels("en-US", 1)[0].long).toBe("Monday")
    expect(weekdayLabels("en-US", 1)[6].short).toBe("Sun")
  })

  it("nextFocusDate maps every grid key", () => {
    const wed = day(4)
    const go = (key: string, shift = false) => dateKey(nextFocusDate(key, wed, shift, 0) as Date)
    expect(go("ArrowLeft")).toBe("2026-11-03")
    expect(go("ArrowRight")).toBe("2026-11-05")
    expect(go("ArrowUp")).toBe("2026-10-28")
    expect(go("ArrowDown")).toBe("2026-11-11")
    expect(go("Home")).toBe("2026-11-01")
    expect(go("End")).toBe("2026-11-07")
    expect(go("PageUp")).toBe("2026-10-04")
    expect(go("PageDown")).toBe("2026-12-04")
    expect(go("PageUp", true)).toBe("2025-11-04")
    expect(go("PageDown", true)).toBe("2027-11-04")
    expect(nextFocusDate("Tab", wed, false, 0)).toBeNull()
  })

  it("nextRange starts, finishes in either order, and starts over", () => {
    const first = nextRange(null, day(10))
    expect(first).toEqual({ start: day(10), end: null })
    expect(nextRange(first, day(14))).toEqual({ start: day(10), end: day(14) })
    expect(nextRange(first, day(4))).toEqual({ start: day(4), end: day(10) })
    expect(nextRange({ start: day(1), end: day(2) }, day(9))).toEqual({ start: day(9), end: null })
  })

  it("rangeRole names each day, using the preview for the missing end", () => {
    const range = { start: day(10), end: day(14) }
    expect(rangeRole(day(9), range, null)).toBeNull()
    expect(rangeRole(day(10), range, null)).toBe("start")
    expect(rangeRole(day(12), range, null)).toBe("middle")
    expect(rangeRole(day(14), range, null)).toBe("end")
    expect(rangeRole(day(10), { start: day(10), end: null }, null)).toBe("single")
    expect(rangeRole(day(7), { start: day(10), end: null }, day(5))).toBe("middle")
    expect(rangeRole(day(5), { start: day(10), end: null }, day(5))).toBe("start")
    expect(rangeRole(day(5), null, null)).toBeNull()
  })

  it("parseDateText reads locale order and any separator, and refuses days that do not exist", () => {
    expect(parseDateText("11/03/2026", "en-US")).toEqual(day(3))
    expect(parseDateText("03/11/2026", "en-GB")).toEqual(day(3))
    expect(parseDateText("3.11.26", "de-DE")).toEqual(day(3))
    expect(parseDateText("2026-11-03", "en-US")).toEqual(day(3))
    expect(parseDateText("2026. 11. 3.", "ko-KR")).toEqual(day(3))
    expect(parseDateText("02/30/2026", "en-US")).toBeNull()
    expect(parseDateText("13/01/2026", "en-US")).toBeNull()
    expect(parseDateText("soon", "en-US")).toBeNull()
    expect(parseDateText("11/03", "en-US")).toBeNull()
  })

  it("datePattern writes the locale's own order", () => {
    expect(datePattern("en-US")).toBe("MM/DD/YYYY")
    expect(datePattern("en-GB")).toBe("DD/MM/YYYY")
  })
})

describe("Calendar", () => {
  it("shares its width between seven columns, so a narrow parent never clips Saturday", () => {
    render(<Calendar today={TODAY} defaultMonth={NOV} locale="en-US" />)
    expect(gridNamed("November 2026")).toHaveClass("w-full", "table-fixed")
    expect(dayButton("Monday, November 2, 2026")).toHaveClass("aspect-square", "w-full")
    expect(dayButton("Monday, November 2, 2026")).not.toHaveClass("size-9")
  })

  it("gives a phone the whole header for the month name by dropping the year buttons", () => {
    render(<Calendar today={TODAY} defaultMonth={NOV} locale="en-US" />)
    expect(screen.getByRole("button", { name: "Next year" })).toHaveClass("max-sm:pointer-coarse:hidden")
    expect(screen.getByRole("button", { name: "Next month" })).not.toHaveClass("max-sm:pointer-coarse:hidden")
  })

  const renderCalendar = (props: Partial<React.ComponentProps<typeof Calendar>> = {}) =>
    render(<Calendar locale="en-US" today={TODAY} defaultMonth={NOV} {...(props as object)} />)

  it("draws a labelled grid with weekday headers and marks today", () => {
    renderCalendar()
    const grid = gridNamed("November 2026")
    expect(within(grid).getAllByRole("columnheader")[0]).toHaveTextContent("Sun")
    expect(within(grid).getAllByRole("row")).toHaveLength(7)
    expect(dayButton("Monday, November 2, 2026")).toHaveAttribute("aria-current", "date")
  })

  it("selects a day, marks the cell and reports a local midnight date", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    renderCalendar({ onValueChange } as object)
    await user.click(dayButton("Friday, November 13, 2026"))
    expect(onValueChange).toHaveBeenCalledWith(day(13))
    expect(dayButton("Friday, November 13, 2026").closest("td")).toHaveAttribute("aria-selected", "true")
  })

  it("selects with Enter and Space from the keyboard", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    renderCalendar({ defaultValue: day(16), onValueChange } as object)
    dayButton("Monday, November 16, 2026").focus()
    await user.keyboard("{ArrowRight}{Enter}")
    expect(onValueChange).toHaveBeenLastCalledWith(day(17))
    await user.keyboard("{ArrowRight} ")
    expect(onValueChange).toHaveBeenLastCalledWith(day(18))
  })

  it("has one tab stop in the grid and walks it with the keyboard", async () => {
    const user = userEvent.setup()
    renderCalendar({ defaultValue: day(16) } as object)
    const grid = gridNamed("November 2026")
    const tabStops = within(grid).getAllByRole("button").filter((button) => button.getAttribute("tabindex") === "0")
    expect(tabStops).toHaveLength(1)
    tabStops[0].focus()
    await user.keyboard("{ArrowRight}")
    expect(dayButton("Tuesday, November 17, 2026")).toHaveFocus()
    await user.keyboard("{ArrowDown}")
    expect(dayButton("Tuesday, November 24, 2026")).toHaveFocus()
    await user.keyboard("{Home}")
    expect(dayButton("Sunday, November 22, 2026")).toHaveFocus()
    await user.keyboard("{End}")
    expect(dayButton("Saturday, November 28, 2026")).toHaveFocus()
  })

  it("changes month when the keyboard walks out of it, and Shift+PageDown jumps a year", async () => {
    const user = userEvent.setup()
    renderCalendar({ defaultValue: day(1) } as object)
    dayButton("Sunday, November 1, 2026").focus()
    await user.keyboard("{ArrowLeft}")
    expect(gridNamed("October 2026")).toBeInTheDocument()
    expect(dayButton("Saturday, October 31, 2026")).toHaveFocus()
    await user.keyboard("{PageDown}")
    expect(gridNamed("November 2026")).toBeInTheDocument()
    expect(dayButton("Monday, November 30, 2026")).toHaveFocus()
    await user.keyboard("{Shift>}{PageDown}{/Shift}")
    expect(gridNamed("November 2027")).toBeInTheDocument()
  })

  it("steps by month and year with the buttons and announces the new month", async () => {
    const user = userEvent.setup()
    const onMonthChange = vi.fn()
    const { container } = renderCalendar({ onMonthChange } as object)
    await user.click(screen.getByRole("button", { name: "Next month" }))
    expect(gridNamed("December 2026")).toBeInTheDocument()
    expect(onMonthChange).toHaveBeenLastCalledWith(day(1, 11))
    expect(container.querySelector("[aria-live='polite']")).toHaveTextContent("December 2026")
    await user.click(screen.getByRole("button", { name: "Previous year" }))
    expect(gridNamed("December 2025")).toBeInTheDocument()
  })

  it("stops at min and max, on the buttons, on the days and on the keyboard", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    renderCalendar({ min: day(10), max: day(20), onValueChange } as object)
    expect(screen.getByRole("button", { name: "Previous month" })).toHaveAttribute("aria-disabled", "true")
    expect(screen.getByRole("button", { name: "Next month" })).toHaveAttribute("aria-disabled", "true")
    expect(screen.getByRole("button", { name: "Previous year" })).toHaveAttribute("aria-disabled", "true")
    fireEvent.click(screen.getByRole("button", { name: "Next month" }))
    expect(gridNamed("November 2026")).toBeInTheDocument()
    const blocked = dayButton("Monday, November 9, 2026")
    expect(blocked).toHaveAttribute("aria-disabled", "true")
    await user.click(blocked)
    expect(onValueChange).not.toHaveBeenCalled()
    dayButton("Tuesday, November 10, 2026").focus()
    await user.keyboard("{ArrowLeft}")
    expect(dayButton("Tuesday, November 10, 2026")).toHaveFocus()
    await user.keyboard("{PageDown}")
    expect(dayButton("Friday, November 20, 2026")).toHaveFocus()
  })

  it("greys out whatever isDateDisabled rules out", () => {
    const weekend = (date: Date) => date.getDay() === 0 || date.getDay() === 6
    renderCalendar({ isDateDisabled: weekend } as object)
    expect(dayButton("Saturday, November 7, 2026")).toHaveAttribute("aria-disabled", "true")
    expect(dayButton("Friday, November 6, 2026")).not.toHaveAttribute("aria-disabled")
  })

  it("follows the locale in names and in the first day of the week", () => {
    render(<Calendar locale="de-DE" today={TODAY} defaultMonth={NOV} />)
    const grid = gridNamed("November 2026")
    expect(within(grid).getAllByRole("columnheader")[0]).toHaveAttribute("abbr", "Montag")
  })

  it("keeps days of the next month reachable by click on one month, and moves there", async () => {
    const user = userEvent.setup()
    renderCalendar()
    await user.click(dayButton("Tuesday, December 1, 2026"))
    expect(gridNamed("December 2026")).toBeInTheDocument()
  })

  it("previews a range while choosing and paints a band once finished", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    renderCalendar({ mode: "range", onValueChange } as object)
    const cell = (name: string) => dayButton(name).closest("td")
    await user.click(dayButton("Tuesday, November 10, 2026"))
    expect(onValueChange).toHaveBeenLastCalledWith({ start: day(10), end: null })
    fireEvent.mouseEnter(dayButton("Friday, November 13, 2026"))
    expect(cell("Thursday, November 12, 2026")).toHaveAttribute("data-range", "middle")
    await user.click(dayButton("Friday, November 13, 2026"))
    expect(onValueChange).toHaveBeenLastCalledWith({ start: day(10), end: day(13) })
    expect(cell("Tuesday, November 10, 2026")).toHaveAttribute("data-range", "start")
    expect(cell("Friday, November 13, 2026")).toHaveAttribute("data-range", "end")
    expect(cell("Saturday, November 14, 2026")).not.toHaveAttribute("data-range")
  })

  describe("two months", () => {
    const original = window.matchMedia
    beforeAll(() => {
      Object.defineProperty(window, "matchMedia", {
        configurable: true,
        writable: true,
        value: (query: string) => ({
          matches: query.includes("min-width"),
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          addListener: vi.fn(),
          removeListener: vi.fn(),
          dispatchEvent: vi.fn(),
        }),
      })
    })
    afterAll(() => {
      Object.defineProperty(window, "matchMedia", { configurable: true, writable: true, value: original })
    })

    it("shows two grids side by side, without duplicating days between them", () => {
      render(<Calendar locale="en-US" today={TODAY} defaultMonth={NOV} months={2} mode="range" />)
      expect(gridNamed("November 2026")).toBeInTheDocument()
      const december = gridNamed("December 2026")
      expect(within(december).queryByRole("button", { name: "Monday, November 30, 2026" })).toBeNull()
      expect(screen.getAllByRole("button", { name: "Tuesday, December 1, 2026" })).toHaveLength(1)
    })

    it("does not change the view when the focus moves within both months", async () => {
      const user = userEvent.setup()
      render(<Calendar locale="en-US" today={TODAY} defaultMonth={NOV} months={2} mode="range" defaultValue={{ start: day(30), end: null }} />)
      dayButton("Monday, November 30, 2026").focus()
      await user.keyboard("{ArrowRight}")
      expect(dayButton("Tuesday, December 1, 2026")).toHaveFocus()
      expect(gridNamed("November 2026")).toBeInTheDocument()
    })
  })

  it("falls back to one month on a narrow screen", () => {
    const { container } = render(<Calendar locale="en-US" today={TODAY} defaultMonth={NOV} months={2} />)
    expect(container.querySelector("[data-slot='calendar']")).toHaveAttribute("data-months", "1")
  })

  it("slides between months and still lands focus on the arriving one", async () => {
    const user = userEvent.setup()
    const { container } = render(<Calendar locale="en-US" today={TODAY} defaultMonth={NOV} effect="slide" defaultValue={day(30)} />)
    expect(container.querySelector("[data-slot='calendar']")).toHaveAttribute("data-effect", "slide")
    dayButton("Monday, November 30, 2026").focus()
    await user.keyboard("{ArrowRight}")
    await waitFor(() => expect(document.activeElement).toHaveAttribute("data-date", "2026-12-01"))
    expect(await screen.findByRole("grid", { name: "December 2026" })).toBeInTheDocument()
  })
})

describe("DatePicker", () => {
  const shared = { locale: "en-US", today: TODAY, defaultMonth: NOV } as const
  const shape = (variant: "plain" | "inline" | "compact" | "range") => {
    const { container, unmount } = render(<DatePicker {...shared} variant={variant as "plain"} />)
    const result = {
      grid: screen.queryByRole("grid") !== null,
      field: container.querySelector("[data-slot='date-picker-input']") !== null,
    }
    expect(container.querySelector("[data-slot='date-picker']")).toHaveAttribute("data-variant", variant)
    unmount()
    return result
  }

  it("draws a different structure per variant", () => {
    expect(shape("plain")).toEqual({ grid: false, field: false })
    expect(shape("range")).toEqual({ grid: false, field: false })
    expect(shape("inline")).toEqual({ grid: true, field: false })
    expect(shape("compact")).toEqual({ grid: false, field: true })
  })

  it("plain opens on a day, closes on choice and writes the date on the trigger", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<DatePicker {...shared} placeholder="Pick a delivery day" onValueChange={onValueChange} />)
    await user.click(screen.getByRole("button", { name: "Pick a delivery day" }))
    expect(await screen.findByRole("grid", { name: "November 2026" })).toBeInTheDocument()
    await waitFor(() => expect(dayButton("Monday, November 2, 2026")).toHaveFocus())
    await user.click(dayButton("Friday, November 13, 2026"))
    expect(onValueChange).toHaveBeenCalledWith(day(13))
    await waitFor(() => expect(screen.queryByRole("grid")).toBeNull())
    expect(screen.getByRole("button", { name: "Nov 13, 2026" })).toBeInTheDocument()
  })

  it("closes on Escape and gives the focus back to the trigger", async () => {
    const user = userEvent.setup()
    render(<DatePicker {...shared} />)
    const trigger = screen.getByRole("button", { name: "Pick a date" })
    await user.click(trigger)
    await screen.findByRole("grid")
    await user.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByRole("grid")).toBeNull())
    expect(trigger).toHaveFocus()
  })

  it("range stays open after the first click and closes after the second", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<DatePicker {...shared} variant="range" onValueChange={onValueChange} />)
    await user.click(screen.getByRole("button", { name: "Pick dates" }))
    await screen.findByRole("grid", { name: "November 2026" })
    await user.click(dayButton("Tuesday, November 10, 2026"))
    expect(screen.getByRole("grid", { name: "November 2026" })).toBeInTheDocument()
    await user.click(dayButton("Friday, November 13, 2026"))
    expect(onValueChange).toHaveBeenLastCalledWith({ start: day(10), end: day(13) })
    await waitFor(() => expect(screen.queryByRole("grid")).toBeNull())
    expect(screen.getByRole("button", { name: /Nov 10.*13, 2026/ })).toBeInTheDocument()
  })

  it("compact parses what is typed, on blur and Enter, and shows the locale's pattern", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<DatePicker {...shared} variant="compact" aria-label="Start date" onValueChange={onValueChange} />)
    const input = screen.getByRole("textbox", { name: "Start date" })
    expect(input).toHaveAttribute("placeholder", "MM/DD/YYYY")
    await user.type(input, "11/3/26{Enter}")
    expect(onValueChange).toHaveBeenLastCalledWith(day(3))
    expect(input).toHaveValue("11/03/2026")
    await user.clear(input)
    await user.tab()
    expect(onValueChange).toHaveBeenLastCalledWith(null)
  })

  it("compact flags a date that does not exist or breaks a bound, and keeps the text for fixing", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<DatePicker {...shared} variant="compact" aria-label="Start date" min={day(10)} onValueChange={onValueChange} />)
    const input = screen.getByRole("textbox", { name: "Start date" })
    await user.type(input, "02/30/2026")
    await user.tab()
    expect(input).toHaveAttribute("aria-invalid", "true")
    expect(input).toHaveValue("02/30/2026")
    await user.clear(input)
    await user.type(input, "11/01/2026{Enter}")
    expect(input).toHaveAttribute("aria-invalid", "true")
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it("compact also opens a calendar, which fills in the field", async () => {
    const user = userEvent.setup()
    render(<DatePicker {...shared} variant="compact" aria-label="Start date" />)
    await user.click(screen.getByRole("button", { name: "Open calendar" }))
    await screen.findByRole("grid", { name: "November 2026" })
    await user.click(dayButton("Friday, November 13, 2026"))
    expect(screen.getByRole("textbox", { name: "Start date" })).toHaveValue("11/13/2026")
    await waitFor(() => expect(screen.queryByRole("grid")).toBeNull())
  })

  it("does not open when disabled, and forwards trigger attributes", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    render(<DatePicker {...shared} disabled aria-label="Delivery day" data-testid="trigger" />)
    const trigger = screen.getByTestId("trigger")
    expect(trigger).toBeDisabled()
    await user.click(trigger)
    expect(screen.queryByRole("grid")).toBeNull()
  })

  it("posts local dates with a form, as one value or as start and end", () => {
    const { container, rerender } = render(<DatePicker {...shared} name="due" defaultValue={day(3)} />)
    const hidden = () => Array.from(container.querySelectorAll("input[type='hidden']")).map((input) => [input.getAttribute("name"), input.getAttribute("value")])
    expect(hidden()).toEqual([["due", "2026-11-03"]])
    rerender(<DatePicker {...shared} key="range" variant="range" name="stay" defaultValue={{ start: day(3), end: day(9) }} />)
    expect(hidden()).toEqual([
      ["stay-start", "2026-11-03"],
      ["stay-end", "2026-11-09"],
    ])
  })

  it("follows a controlled value, not the click", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<DatePicker {...shared} variant="inline" value={day(3)} onValueChange={onValueChange} />)
    await user.click(dayButton("Friday, November 13, 2026"))
    expect(onValueChange).toHaveBeenCalledWith(day(13))
    expect(dayButton("Tuesday, November 3, 2026").closest("td")).toHaveAttribute("aria-selected", "true")
    expect(dayButton("Friday, November 13, 2026").closest("td")).toHaveAttribute("aria-selected", "false")
  })
})
