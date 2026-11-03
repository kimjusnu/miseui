import { fireEvent, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { RoleMap, collectAreas, type RoleMember } from "./role-map"

const MEMBERS: readonly RoleMember[] = [
  { name: "Lead engineer", role: "Engineering", owns: ["API design", "Billing"], lead: true },
  { name: "Designer", role: "Product design", owns: ["Interface", "Billing"] },
  { name: "Analyst", owns: [] },
]

const member = (name: string) => screen.getByText(name).closest("[data-slot='role-map-member']") as HTMLElement

describe("RoleMap", () => {
  it("lists each person with what they took on, and says so when there is nothing", () => {
    render(<RoleMap members={MEMBERS} />)
    expect(within(member("Designer")).getByText("Interface")).toBeInTheDocument()
    expect(within(member("Designer")).getByText("Product design")).toBeInTheDocument()
    expect(within(member("Analyst")).getByText("Nothing recorded")).toBeInTheDocument()
  })

  it("gives the accent only to the lead", () => {
    render(<RoleMap members={MEMBERS} />)
    expect(member("Lead engineer")).toHaveAttribute("data-lead", "true")
    // A soft tint, like the matrix column: a solid accent panel shouted louder than anything else on the page.
    expect(member("Lead engineer").className).toContain("bg-mise-soft")
    expect(member("Lead engineer").className).not.toContain("text-mise-foreground")
    expect(member("Designer").className).not.toContain("bg-mise")
  })

  it("renders a different structure for each variant", () => {
    const { rerender } = render(<RoleMap members={MEMBERS} variant="panels" />)
    expect(document.querySelector("[data-slot='role-map-panels']")).not.toBeNull()
    expect(screen.queryByRole("table")).toBeNull()

    rerender(<RoleMap members={MEMBERS} variant="rows" />)
    expect(document.querySelector("[data-slot='role-map-rows']")).not.toBeNull()
    expect(screen.getByText("API design, Billing")).toBeInTheDocument()

    rerender(<RoleMap members={MEMBERS} variant="matrix" label="Launch team" />)
    expect(screen.getByRole("table", { name: "Launch team" })).toBeInTheDocument()
  })

  it("crosses people with areas in the matrix and reads each cell aloud", () => {
    render(<RoleMap members={MEMBERS} variant="matrix" />)
    expect(screen.getAllByRole("columnheader")).toHaveLength(4)
    expect(screen.getByRole("rowheader", { name: "Billing" })).toBeInTheDocument()
    const billing = screen.getByRole("row", { name: /Billing/ })
    expect(within(billing).getByText("Lead engineer: yes")).toBeInTheDocument()
    expect(within(billing).getByText("Designer: yes")).toBeInTheDocument()
    expect(within(billing).getByText("Analyst: no")).toBeInTheDocument()
  })

  it("has no buttons without the focus effect", () => {
    render(<RoleMap members={MEMBERS} />)
    expect(screen.queryByRole("button")).toBeNull()
  })

  it("pins one person from the keyboard and dims the rest", async () => {
    render(<RoleMap members={MEMBERS} effect="focus" />)
    await userEvent.tab()
    await userEvent.tab()
    const designer = screen.getByRole("button", { name: "Designer" })
    expect(designer).toHaveFocus()
    await userEvent.keyboard("{Enter}")
    expect(designer).toHaveAttribute("aria-pressed", "true")
    expect(member("Lead engineer")).toHaveAttribute("data-dimmed", "true")
    expect(member("Designer")).not.toHaveAttribute("data-dimmed")
    await userEvent.keyboard(" ")
    expect(designer).toHaveAttribute("aria-pressed", "false")
    expect(member("Lead engineer")).not.toHaveAttribute("data-dimmed")
  })

  it("previews on mouse hover, ignores a finger, and dims matrix columns", () => {
    render(<RoleMap members={MEMBERS} variant="matrix" effect="focus" />)
    const header = screen.getByRole("columnheader", { name: "Designer" })
    fireEvent.pointerEnter(header, { pointerType: "touch" })
    expect(document.querySelectorAll("[data-slot='role-map-cell'][data-dimmed]")).toHaveLength(0)
    fireEvent.pointerEnter(header, { pointerType: "mouse" })
    expect(document.querySelectorAll("[data-slot='role-map-cell'][data-dimmed]")).toHaveLength(6)
    fireEvent.pointerLeave(header, { pointerType: "mouse" })
    expect(document.querySelectorAll("[data-slot='role-map-cell'][data-dimmed]")).toHaveLength(0)
  })

  it("collects each area once, in order of first appearance", () => {
    expect(collectAreas(MEMBERS)).toEqual(["API design", "Billing", "Interface"])
    expect(collectAreas([])).toEqual([])
  })
})
