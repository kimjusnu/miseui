import { render, renderHook, act, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { FilterChips, countOptions, filterItems, toggleValue, useFilterChips, type FilterChipsProps } from "./filter-chips"

const POSTS = [
  { title: "Empty states", tags: ["design"] },
  { title: "Query plans", tags: ["engineering", "data"] },
  { title: "Pricing page", tags: ["design", "growth"] },
] as const

const OPTIONS = [
  { value: "design", label: "Design" },
  { value: "engineering", label: "Engineering" },
  { value: "growth", label: "Growth" },
  { value: "legal", label: "Legal" },
]

const getTags = (post: (typeof POSTS)[number]) => post.tags

function Library(props: Partial<FilterChipsProps> & { match?: "any" | "all" }) {
  const { match, multiple, ...rest } = props
  const { chips, visible } = useFilterChips({ items: POSTS, getValues: getTags, match, multiple })
  return (
    <>
      <FilterChips options={OPTIONS} label="Topic" {...chips} {...rest} />
      <ul>
        {visible.map((post) => (
          <li key={post.title}>{post.title}</li>
        ))}
      </ul>
    </>
  )
}

const chip = (name: RegExp) => screen.getByRole("button", { name })

describe("FilterChips", () => {
  it("filters the list, shows counts and starts on all", async () => {
    render(<Library />)
    expect(screen.getByRole("group", { name: "Topic" })).toBeInTheDocument()
    expect(chip(/^All/)).toHaveAttribute("aria-pressed", "true")
    expect(chip(/^All/)).toHaveTextContent("3")
    expect(chip(/^Design/)).toHaveTextContent("2")
    await userEvent.click(chip(/^Engineering/))
    expect(screen.getAllByRole("listitem")).toHaveLength(1)
    expect(screen.getByText("Query plans")).toBeInTheDocument()
    expect(chip(/^All/)).toHaveAttribute("aria-pressed", "false")
    expect(screen.getByRole("status")).toHaveTextContent("1 result")
  })

  it("replaces the pressed chip in single mode and returns to all when pressed again", async () => {
    render(<Library />)
    await userEvent.click(chip(/^Design/))
    await userEvent.click(chip(/^Growth/))
    expect(chip(/^Design/)).toHaveAttribute("aria-pressed", "false")
    expect(chip(/^Growth/)).toHaveAttribute("aria-pressed", "true")
    await userEvent.click(chip(/^Growth/))
    expect(chip(/^All/)).toHaveAttribute("aria-pressed", "true")
    expect(screen.queryByRole("button", { name: "Clear" })).toBeNull()
  })

  it("disables a chip with no results, so nobody walks into an empty list", async () => {
    render(<Library multiple match="all" />)
    expect(chip(/^Legal/)).toBeDisabled()
    await userEvent.click(chip(/^Design/))
    expect(chip(/^Growth/)).toBeEnabled()
    expect(chip(/^Engineering/)).toBeDisabled()
  })

  it("clears every chip and hands focus to all when several are pressed", async () => {
    render(<Library multiple />)
    await userEvent.click(chip(/^Design/))
    await userEvent.click(chip(/^Engineering/))
    expect(screen.getAllByRole("listitem")).toHaveLength(3)
    await userEvent.click(screen.getByRole("button", { name: "Clear" }))
    expect(chip(/^All/)).toHaveAttribute("aria-pressed", "true")
    expect(chip(/^All/)).toHaveFocus()
    expect(screen.queryByRole("button", { name: "Clear" })).toBeNull()
  })

  it("works from the keyboard", async () => {
    const onValueChange = vi.fn()
    render(<FilterChips options={OPTIONS} onValueChange={onValueChange} />)
    await userEvent.tab()
    await userEvent.tab()
    expect(chip(/^Design/)).toHaveFocus()
    await userEvent.keyboard(" ")
    expect(onValueChange).toHaveBeenCalledWith(["design"])
    expect(chip(/^Design/)).toHaveAttribute("aria-pressed", "true")
  })

  it("lays out differently for each variant and shows a check only when several can be pressed", () => {
    const { rerender } = render(<FilterChips options={OPTIONS} variant="pills" />)
    const row = () => screen.getByRole("group")
    expect(row().className).toContain("flex-wrap")
    expect(chip(/^Design/).className).toContain("rounded-full")

    rerender(<FilterChips options={OPTIONS} variant="underline" />)
    expect(row().className).toContain("overflow-x-auto")
    expect(chip(/^Design/).className).toContain("whitespace-nowrap")

    rerender(<FilterChips options={OPTIONS} variant="list" multiple />)
    expect(row().className).toContain("grid")
    expect(chip(/^Design/).querySelector("[aria-hidden='true']")?.className).toContain("border")
    rerender(<FilterChips options={OPTIONS} variant="list" />)
    expect(chip(/^Design/).querySelector("[aria-hidden='true']")).toBeNull()
  })

  it("marks only the pressed chip", async () => {
    render(<FilterChips options={OPTIONS} effect="spring" defaultValue={["growth"]} />)
    expect(chip(/^Growth/).querySelector("[data-slot='filter-chips-marker']")).not.toBeNull()
    expect(chip(/^Design/).querySelector("[data-slot='filter-chips-marker']")).toBeNull()
    await userEvent.click(chip(/^Design/))
    expect(chip(/^Design/).querySelector("[data-slot='filter-chips-marker']")).not.toBeNull()
    expect(chip(/^Growth/).querySelector("[data-slot='filter-chips-marker']")).toBeNull()
  })

  it("exposes the filtered items from the hook", () => {
    const { result } = renderHook(() => useFilterChips({ items: POSTS, getValues: getTags, defaultValue: ["growth"] }))
    expect(result.current.visible.map((post) => post.title)).toEqual(["Pricing page"])
    act(() => result.current.chips.onValueChange([]))
    expect(result.current.visible).toHaveLength(3)
  })

  it("computes matching, counts and toggling without side effects", () => {
    expect(filterItems(POSTS, getTags, ["design", "data"]).length).toBe(3)
    expect(filterItems(POSTS, getTags, ["design", "growth"], "all").map((post) => post.title)).toEqual(["Pricing page"])
    expect(countOptions(POSTS, getTags, [])).toEqual({ design: 2, engineering: 1, data: 1, growth: 1 })
    expect(countOptions(POSTS, getTags, ["growth"], "all")).toEqual({ design: 1, growth: 1 })
    const selected = ["a"]
    expect(toggleValue(selected, "b", true)).toEqual(["a", "b"])
    expect(toggleValue(selected, "a", true)).toEqual([])
    expect(toggleValue(selected, "b", false)).toEqual(["b"])
    expect(selected).toEqual(["a"])
  })
})
