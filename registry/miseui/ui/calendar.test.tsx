import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Calendar, type CalendarEvent, type CalendarProps, type CalendarVariant } from "./calendar"
import { agendaGroups, eventsInMonth, indexEvents, stepPeriod, weekOf } from "./calendar-math"
import { dateKey } from "./date-picker-math"

const TODAY = new Date(2026, 2, 11)
const EVENTS: readonly CalendarEvent[] = [
  { id: "review", title: "Design review", date: new Date(2026, 2, 11), detail: "Room 4" },
  { id: "launch", title: "Launch", date: new Date(2026, 2, 11) },
  { id: "retro", title: "Retro", date: new Date(2026, 2, 11) },
  { id: "trip", title: "Berlin trip", date: new Date(2026, 2, 20), end: new Date(2026, 2, 22) },
  { id: "may", title: "Planning", date: new Date(2026, 4, 4) },
]

const setup = () => userEvent.setup({ pointerEventsCheck: 0 })
const renderCalendar = (props: Partial<CalendarProps> = {}) =>
  render(<Calendar events={EVENTS} today={TODAY} locale="en-US" weekStartsOn={1} {...props} />)
const root = () => document.querySelector("[data-slot='calendar']") as HTMLElement
const day = (key: string) => document.querySelector(`[data-date='${key}']`) as HTMLElement

describe("calendar math", () => {
  it("indexEvents files a multi-day event under each of its days", () => {
    const index = indexEvents(EVENTS)
    expect(index.get("2026-03-20")).toHaveLength(1)
    expect(index.get("2026-03-21")?.[0].id).toBe("trip")
    expect(index.get("2026-03-22")).toHaveLength(1)
    expect(index.get("2026-03-23")).toBeUndefined()
  })

  it("indexEvents treats an end before the start as a one day event", () => {
    const index = indexEvents([{ id: "x", title: "X", date: new Date(2026, 2, 5), end: new Date(2026, 2, 1) }])
    expect([...index.keys()]).toEqual(["2026-03-05"])
  })

  it("weekOf starts on the requested weekday and holds the date", () => {
    const week = weekOf(TODAY, 1)
    expect(week).toHaveLength(7)
    expect(week[0].getDay()).toBe(1)
    expect(week.map(dateKey)).toContain("2026-03-11")
  })

  it("stepPeriod moves by what the variant shows and keeps month ends real", () => {
    expect(dateKey(stepPeriod(TODAY, "week", 1))).toBe("2026-03-18")
    expect(dateKey(stepPeriod(new Date(2026, 0, 31), "month", 1))).toBe("2026-02-28")
    expect(dateKey(stepPeriod(TODAY, "year", -1))).toBe("2025-03-11")
  })

  it("agendaGroups keeps only days with events, in order, and eventsInMonth counts a long event once", () => {
    const index = indexEvents(EVENTS)
    expect(agendaGroups(index, TODAY).map((group) => dateKey(group.day))).toEqual(["2026-03-11", "2026-03-20", "2026-03-21", "2026-03-22"])
    expect(eventsInMonth(index, TODAY)).toBe(4)
  })
})

describe("Calendar", () => {
  it("keeps the agenda day at the top of a long group, not stretched down to its middle", () => {
    renderCalendar({ variant: "agenda", defaultDate: TODAY })
    const group = document.querySelector("ol [role='group']")
    expect(group).toHaveClass("content-start")
  })

  it.each<[CalendarVariant, string]>([
    ["month", "table thead"],
    ["week", "table tbody tr"],
    ["agenda", "ol"],
    ["year", "[data-slot='calendar-year']"],
  ])("variant %s marks itself and draws its own structure", (variant, selector) => {
    renderCalendar({ variant })
    expect(root()).toHaveAttribute("data-variant", variant)
    expect(root().querySelector(selector)).not.toBeNull()
  })

  it("the variants differ in structure: only month has a header row, week has one row, year has twelve months", () => {
    const { unmount } = renderCalendar({ variant: "month" })
    expect(screen.getAllByRole("row")).toHaveLength(7)
    unmount()
    const week = renderCalendar({ variant: "week" })
    expect(screen.getAllByRole("row")).toHaveLength(1)
    expect(screen.getAllByRole("gridcell")).toHaveLength(7)
    week.unmount()
    renderCalendar({ variant: "year" })
    expect(screen.queryByRole("grid")).toBeNull()
    expect(screen.getAllByRole("listitem")).toHaveLength(12)
  })

  it("month: labels sit in the cell and overflow turns into a count", () => {
    renderCalendar({ defaultDate: TODAY, labels: { more: (count) => `${count} more` } })
    const cell = day("2026-03-11").closest("td") as HTMLElement
    expect(within(cell).getByText("Design review")).toBeInTheDocument()
    expect(within(cell).getByText("Launch")).toBeInTheDocument()
    expect(within(cell).queryByText("Retro")).toBeNull()
    expect(within(cell).getByText("1 more")).toBeInTheDocument()
  })

  it("names a day with its event count and marks today", () => {
    renderCalendar()
    expect(day("2026-03-11")).toHaveAttribute("aria-label", expect.stringContaining("3 events"))
    expect(day("2026-03-11")).toHaveAttribute("aria-current", "date")
    expect(day("2026-03-12")).not.toHaveAttribute("aria-current")
  })

  it("arrow keys walk the grid with one tab stop, and crossing the month moves focus into the new one", async () => {
    const user = setup()
    const onDateChange = vi.fn()
    renderCalendar({ defaultDate: new Date(2026, 2, 31), onDateChange })
    expect(root().querySelectorAll("[data-focus-key][tabindex='0']")).toHaveLength(1)
    day("2026-03-31").focus()
    await user.keyboard("{ArrowRight}")
    expect(document.activeElement).toHaveAttribute("data-date", "2026-04-01")
    expect(screen.getByRole("heading")).toHaveTextContent("April 2026")
    expect(dateKey(onDateChange.mock.calls[0][0])).toBe("2026-04-01")
    await user.keyboard("{ArrowUp}")
    expect(document.activeElement).toHaveAttribute("data-date", "2026-03-25")
  })

  it("a click chooses the day; moving with arrows does not fire onDateSelect", async () => {
    const user = setup()
    const onDateSelect = vi.fn()
    renderCalendar({ defaultDate: TODAY, onDateSelect })
    day("2026-03-11").focus()
    await user.keyboard("{ArrowRight}")
    expect(onDateSelect).not.toHaveBeenCalled()
    await user.click(day("2026-03-16"))
    expect(dateKey(onDateSelect.mock.calls[0][0])).toBe("2026-03-16")
    expect(day("2026-03-16").closest("td")).toHaveAttribute("aria-selected", "true")
  })

  it("events are text without a handler and buttons with one, reachable by Tab only on the active day", async () => {
    const onEventSelect = vi.fn()
    const user = setup()
    const { unmount } = renderCalendar({ defaultDate: TODAY })
    expect(within(day("2026-03-11").closest("td") as HTMLElement).queryByRole("button", { name: "Launch" })).toBeNull()
    unmount()
    renderCalendar({ defaultDate: TODAY, onEventSelect })
    const cell = day("2026-03-11").closest("td") as HTMLElement
    const chip = within(cell).getByRole("button", { name: "Launch" })
    expect(chip).toHaveAttribute("tabindex", "0")
    expect(within(day("2026-03-20").closest("td") as HTMLElement).getByRole("button", { name: "Berlin trip" })).toHaveAttribute("tabindex", "-1")
    await user.click(chip)
    expect(onEventSelect.mock.calls[0][0].id).toBe("launch")
  })

  it("the active day's events are also listed under the grid, which is all a phone can show", () => {
    renderCalendar({ defaultDate: TODAY })
    const list = document.querySelector("[data-slot='calendar-day-list']") as HTMLElement
    expect(within(list).getByText("Retro")).toBeInTheDocument()
    expect(within(list).getByText("Room 4")).toBeInTheDocument()
  })

  it("previous, next and today move by the period of the variant", async () => {
    const user = setup()
    renderCalendar({ variant: "year", defaultDate: TODAY })
    await user.click(screen.getByRole("button", { name: "Next" }))
    expect(screen.getByRole("heading")).toHaveTextContent("2027")
    await user.click(screen.getByRole("button", { name: "Today" }))
    expect(screen.getByRole("heading")).toHaveTextContent("2026")
  })

  it("agenda groups by day, shows details and says so when the month is empty", async () => {
    const user = setup()
    renderCalendar({ variant: "agenda", defaultDate: TODAY, labels: { empty: "Clear month" } })
    expect(screen.getByRole("group", { name: /March 11/ })).toBeInTheDocument()
    expect(screen.getByText("Room 4")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Next" }))
    expect(screen.getByText("Clear month")).toBeInTheDocument()
  })

  it("year: months are one tab stop, arrows move between them and a press selects the month", async () => {
    const user = setup()
    const onDateSelect = vi.fn()
    renderCalendar({ variant: "year", defaultDate: TODAY, onDateSelect })
    const march = screen.getByRole("button", { name: "March 2026, 4 events" })
    expect(march).toHaveAttribute("tabindex", "0")
    expect(screen.getByRole("button", { name: "April 2026" })).toHaveAttribute("tabindex", "-1")
    march.focus()
    await user.keyboard("{ArrowRight}")
    expect(document.activeElement).toHaveAttribute("data-focus-key", "2026-04")
    await user.keyboard("{Enter}")
    expect(onDateSelect.mock.calls[0][0].getMonth()).toBe(3)
  })

  it("week: left and right move through the strip", async () => {
    const user = setup()
    renderCalendar({ variant: "week", defaultDate: TODAY })
    day("2026-03-11").focus()
    await user.keyboard("{ArrowLeft}")
    expect(document.activeElement).toHaveAttribute("data-date", "2026-03-10")
  })

  it("locale reaches names and the first day of the week", () => {
    render(<Calendar today={TODAY} locale="ko-KR" />)
    expect(screen.getByRole("heading")).toHaveTextContent("2026년 3월")
  })

  it("slide marks the effect and still renders the period", () => {
    renderCalendar({ effect: "slide" })
    expect(root()).toHaveAttribute("data-effect", "slide")
    expect(root().querySelector("[data-view-key='2026-03']")).not.toBeNull()
  })
})
