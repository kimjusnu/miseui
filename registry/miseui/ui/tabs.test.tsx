import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs"

function renderTabs() {
  return render(
    <Tabs defaultValue="account">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>
      <TabsContent value="account">Account panel</TabsContent>
      <TabsContent value="password">Password panel</TabsContent>
    </Tabs>,
  )
}

describe("Tabs", () => {
  it("shows the default tab and marks only it as selected", () => {
    renderTabs()
    expect(screen.getByRole("tab", { name: "Account" })).toHaveAttribute("aria-selected", "true")
    expect(screen.getByRole("tab", { name: "Password" })).toHaveAttribute("aria-selected", "false")
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Account panel")
  })

  it("swaps the panel when another trigger is clicked", async () => {
    const user = userEvent.setup()
    renderTabs()
    await user.click(screen.getByRole("tab", { name: "Password" }))
    expect(screen.getByRole("tab", { name: "Password" })).toHaveAttribute("aria-selected", "true")
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Password panel")
    expect(screen.queryByText("Account panel")).not.toBeInTheDocument()
  })

  it("moves focus and selection to the next tab with ArrowRight", async () => {
    const user = userEvent.setup()
    renderTabs()
    await user.click(screen.getByRole("tab", { name: "Account" }))
    await user.keyboard("{ArrowRight}")
    const password = screen.getByRole("tab", { name: "Password" })
    expect(password).toHaveFocus()
    expect(password).toHaveAttribute("aria-selected", "true")
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Password panel")
  })

  it("exposes data-slot hooks and merges classes", () => {
    render(
      <Tabs defaultValue="one" className="custom-root">
        <TabsList className="custom-list">
          <TabsTrigger value="one">One</TabsTrigger>
        </TabsList>
        <TabsContent value="one">Panel</TabsContent>
      </Tabs>,
    )
    const trigger = screen.getByRole("tab", { name: "One" })
    expect(trigger).toHaveAttribute("data-slot", "tabs-trigger")
    expect(screen.getByRole("tablist")).toHaveClass("custom-list")
    expect(screen.getByRole("tablist")).toHaveAttribute("data-slot", "tabs-list")
    expect(screen.getByRole("tabpanel")).toHaveAttribute("data-slot", "tabs-content")
    expect(screen.getByRole("tablist").parentElement).toHaveClass("custom-root")
  })
})
