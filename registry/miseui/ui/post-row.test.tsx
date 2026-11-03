import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { PostRow, formatPostDate } from "./post-row"

const POST = { href: "/notes/empty-states", title: "Empty states people read", date: "2026-11-03", tags: ["Design", "Writing"], locale: "en-US" }

const link = () => screen.getByRole("link")
const slot = (name: string) => link().querySelector(`[data-slot='post-row-${name}']`)

describe("PostRow", () => {
  it("is one link holding the title, date and tags", () => {
    render(<PostRow {...POST} />)
    expect(link()).toHaveAttribute("href", "/notes/empty-states")
    expect(link()).toHaveAccessibleName(/Empty states people read/)
    expect(link().querySelectorAll("a, button")).toHaveLength(0)
    expect(screen.getByText("Nov 3, 2026").tagName).toBe("TIME")
    expect(screen.getByText("Nov 3, 2026")).toHaveAttribute("datetime", "2026-11-03")
    expect(slot("tags")).toHaveTextContent("DesignWriting")
  })

  it("orders and groups differently for each variant", () => {
    const { rerender } = render(<PostRow {...POST} excerpt="What to write when there is nothing to show." />)
    expect(link().className).toContain("grid-cols-[minmax(0,1fr)_auto]")
    expect(slot("excerpt")).toBeNull()
    expect(link().firstElementChild).not.toBe(slot("date"))

    rerender(<PostRow {...POST} variant="stacked" excerpt="What to write when there is nothing to show." />)
    expect(slot("excerpt")).toHaveTextContent("What to write")
    expect(link().firstElementChild).toBe(slot("title"))

    rerender(<PostRow {...POST} variant="ledger" excerpt="What to write when there is nothing to show." />)
    expect(link().firstElementChild).toBe(slot("date"))
    expect(slot("excerpt")).toBeNull()
  })

  it("adds an arrow and travel only with the nudge effect", () => {
    const { rerender } = render(<PostRow {...POST} />)
    expect(slot("arrow")).toBeNull()
    rerender(<PostRow {...POST} effect="nudge" />)
    expect(slot("arrow")).toHaveAttribute("aria-hidden", "true")
    expect(slot("title")?.className).toContain("group-hover/post:translate-x-1")
  })

  it("is reached and followed from the keyboard, with a focus ring", async () => {
    const onClick = vi.fn((event: React.MouseEvent) => event.preventDefault())
    render(<PostRow {...POST} onClick={onClick} />)
    await userEvent.tab()
    expect(link()).toHaveFocus()
    expect(link().className).toContain("focus-visible:ring-[3px]")
    await userEvent.keyboard("{Enter}")
    expect(onClick).toHaveBeenCalledOnce()
  })

  it("renders through a router link", () => {
    function RouterLink({ href, ...props }: React.ComponentProps<"a">) {
      return <a data-router="true" href={href} {...props} />
    }
    render(<PostRow {...POST} as={RouterLink} />)
    expect(link()).toHaveAttribute("data-router", "true")
    expect(link()).toHaveAttribute("data-slot", "post-row")
  })

  it("leaves out empty tags and shows the kicker and meta", () => {
    render(<PostRow {...POST} tags={[]} kicker="Note" meta="6 min read" />)
    expect(slot("tags")).toBeNull()
    expect(screen.getByText("Note")).toBeInTheDocument()
    expect(screen.getByText("6 min read")).toBeInTheDocument()
  })

  it("keeps a date-only string on its calendar day and survives bad input", () => {
    expect(formatPostDate("2026-01-01", "en-US")).toEqual({ label: "Jan 1, 2026", dateTime: "2026-01-01" })
    expect(formatPostDate("2026-01-01", "ko-KR").label).toContain("2026")
    expect(formatPostDate(new Date("2026-01-01T12:00:00Z"), "en-US").dateTime).toBe("2026-01-01T12:00:00.000Z")
    expect(formatPostDate("soon")).toEqual({ label: "soon", dateTime: undefined })
  })
})
