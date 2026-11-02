import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type * as React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger, type TabsEffect } from "./tabs"

const INDICATOR = "[data-slot='tabs-indicator']"

function EffectTabs({ effect, label }: { effect: TabsEffect; label: string }) {
  return (
    <Tabs defaultValue="a" effect={effect}>
      <TabsList>
        <TabsTrigger value="a">{`${label} A`}</TabsTrigger>
        <TabsTrigger value="b">{`${label} B`}</TabsTrigger>
        <TabsTrigger value="c" disabled>{`${label} C`}</TabsTrigger>
      </TabsList>
      <TabsContent value="a">Panel A</TabsContent>
      <TabsContent value="b">Panel B</TabsContent>
    </Tabs>
  )
}

describe.each<TabsEffect>(["spring", "pill"])("Tabs effect=%s", (effect) => {
  it("marks the root and draws the indicator only inside the active trigger", async () => {
    const user = userEvent.setup()
    render(<EffectTabs effect={effect} label="One" />)
    const first = screen.getByRole("tab", { name: "One A" })
    const second = screen.getByRole("tab", { name: "One B" })
    expect(screen.getByRole("tablist").parentElement).toHaveAttribute("data-effect", effect)
    expect(first.querySelector(INDICATOR)).not.toBeNull()
    expect(second.querySelector(INDICATOR)).toBeNull()
    await user.click(second)
    expect(first.querySelector(INDICATOR)).toBeNull()
    expect(second.querySelector(INDICATOR)).not.toBeNull()
  })

  it("keeps arrow keys moving focus and selection, and skips disabled triggers", async () => {
    const user = userEvent.setup()
    render(<EffectTabs effect={effect} label="One" />)
    await user.click(screen.getByRole("tab", { name: "One A" }))
    await user.keyboard("{ArrowRight}")
    const second = screen.getByRole("tab", { name: "One B" })
    expect(second).toHaveFocus()
    expect(second).toHaveAttribute("aria-selected", "true")
    expect(second.querySelector(INDICATOR)).not.toBeNull()
    await user.keyboard("{ArrowRight}")
    expect(screen.getByRole("tab", { name: "One A" })).toHaveFocus()
  })

  it("follows a controlled value, not the click, when the owner holds the state", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <Tabs value="a" effect={effect} onValueChange={onValueChange}>
        <TabsList>
          <TabsTrigger value="a">A</TabsTrigger>
          <TabsTrigger value="b">B</TabsTrigger>
        </TabsList>
      </Tabs>,
    )
    await user.click(screen.getByRole("tab", { name: "B" }))
    expect(onValueChange).toHaveBeenCalledWith("b")
    expect(screen.getByRole("tab", { name: "A" }).querySelector(INDICATOR)).not.toBeNull()
    expect(screen.getByRole("tab", { name: "B" }).querySelector(INDICATOR)).toBeNull()
  })

  it("gives an asChild trigger the plain active style, since a Slot takes one child", () => {
    render(
      <Tabs defaultValue="a" effect={effect}>
        <TabsList>
          <TabsTrigger value="a" asChild>
            <a href="#a">A</a>
          </TabsTrigger>
        </TabsList>
      </Tabs>,
    )
    const trigger = screen.getByRole("tab", { name: "A" })
    expect(trigger.querySelector(INDICATOR)).toBeNull()
    expect(trigger).toHaveClass("data-[state=active]:bg-background")
  })
})

describe("Tabs effect namespacing and reduced motion", () => {
  afterEach(() => {
    vi.doUnmock("motion/react")
    vi.resetModules()
  })

  async function importWith(overrides: (actual: typeof import("motion/react")) => object) {
    vi.resetModules()
    vi.doMock("motion/react", async (importOriginal) => {
      const actual = await importOriginal<typeof import("motion/react")>()
      return { ...actual, ...overrides(actual) }
    })
    return import("./tabs")
  }

  it("gives each instance its own LayoutGroup, so two Tabs never share an indicator", async () => {
    const groupIds: Array<string | undefined> = []
    const fresh = await importWith((actual) => ({
      LayoutGroup: (props: React.ComponentProps<typeof actual.LayoutGroup>) => {
        groupIds.push(props.id)
        return <actual.LayoutGroup {...props} />
      },
    }))
    render(
      <>
        <fresh.Tabs defaultValue="a" effect="spring">
          <fresh.TabsList>
            <fresh.TabsTrigger value="a">Left</fresh.TabsTrigger>
          </fresh.TabsList>
        </fresh.Tabs>
        <fresh.Tabs defaultValue="a" effect="spring">
          <fresh.TabsList>
            <fresh.TabsTrigger value="a">Right</fresh.TabsTrigger>
          </fresh.TabsList>
        </fresh.Tabs>
      </>,
    )
    expect(new Set(groupIds).size).toBe(2)
    expect(screen.getByRole("tab", { name: "Left" }).querySelector(INDICATOR)).not.toBeNull()
    expect(screen.getByRole("tab", { name: "Right" }).querySelector(INDICATOR)).not.toBeNull()
  })

  it("drops the shared-layout slide under reduced motion but still shows the indicator", async () => {
    const fresh = await importWith(() => ({ useReducedMotion: () => true }))
    render(
      <fresh.Tabs defaultValue="a" effect="pill">
        <fresh.TabsList>
          <fresh.TabsTrigger value="a">A</fresh.TabsTrigger>
        </fresh.TabsList>
      </fresh.Tabs>,
    )
    expect(screen.getByRole("tab", { name: "A" }).querySelector(INDICATOR)).toHaveAttribute("data-reduced", "true")
  })
})

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

  it("renders no indicator and no data-effect without the prop", () => {
    renderTabs()
    expect(screen.getByRole("tablist").parentElement).not.toHaveAttribute("data-effect")
    expect(document.querySelector(INDICATOR)).toBeNull()
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
