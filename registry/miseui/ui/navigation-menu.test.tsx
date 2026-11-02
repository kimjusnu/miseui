import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuGroup,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuPanelLink,
  NavigationMenuTrigger,
  type NavigationMenuProps,
  type NavigationMenuVariant,
} from "./navigation-menu"

/** Answers at once, because the indicator stays unmounted until Radix has measured the open trigger. */
class ResizeObserverStub {
  private readonly callback: ResizeObserverCallback
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
  }
  observe() {
    this.callback([], this as unknown as ResizeObserver)
  }
  unobserve() {}
  disconnect() {}
}

beforeAll(() => vi.stubGlobal("ResizeObserver", ResizeObserverStub))
afterAll(() => vi.unstubAllGlobals())

function Menu(props: Partial<NavigationMenuProps>) {
  return (
    <NavigationMenu aria-label="Site" {...props}>
      <NavigationMenuList>
        <NavigationMenuItem value="product">
          <NavigationMenuTrigger>Product</NavigationMenuTrigger>
          <NavigationMenuContent>
            <NavigationMenuGroup title="Build">
              <NavigationMenuPanelLink href="#forms" title="Forms" description="Collect answers" icon={<svg data-testid="forms-icon" />} />
            </NavigationMenuGroup>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem value="company">
          <NavigationMenuTrigger>Company</NavigationMenuTrigger>
          <NavigationMenuContent>
            <NavigationMenuPanelLink href="#about" title="About" />
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink href="#pricing" active>Pricing</NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}

const setup = () => userEvent.setup({ pointerEventsCheck: 0 })
const root = () => screen.getByRole("navigation", { name: "Site" })
const product = () => screen.getByRole("button", { name: "Product" })
const slot = (name: string) => document.querySelector(`[data-slot='${name}']`) as HTMLElement

describe("NavigationMenu", () => {
  it.each<NavigationMenuVariant>(["bar", "mega", "pill", "underline"])("%s is a named nav landmark that marks its variant", (variant) => {
    render(<Menu variant={variant} />)
    expect(root()).toHaveAttribute("data-variant", variant)
    expect(screen.getByRole("link", { name: "Pricing" })).toHaveAttribute("aria-current", "page")
  })

  it("the variants differ in the list and the panel, not only in colour", () => {
    const bar = render(<Menu variant="bar" />)
    const barClass = slot("navigation-menu-list").className
    expect(barClass).toContain("flex-wrap")
    bar.unmount()
    const pill = render(<Menu variant="pill" />)
    expect(slot("navigation-menu-list").className).toContain("rounded-full")
    pill.unmount()
    render(<Menu variant="underline" />)
    expect(slot("navigation-menu-list").className).toContain("border-b")
    expect(slot("navigation-menu-list").className).not.toContain("flex-wrap")
  })

  it("Enter opens a panel, marks the trigger and shows its links", async () => {
    const user = setup()
    render(<Menu />)
    expect(screen.queryByRole("link", { name: /Forms/ })).toBeNull()
    product().focus()
    await user.keyboard("{Enter}")
    expect(product()).toHaveAttribute("aria-expanded", "true")
    const link = await screen.findByRole("link", { name: /Forms/ })
    expect(link).toHaveAttribute("href", "#forms")
    expect(within(link).getByText("Collect answers")).toBeInTheDocument()
    expect(within(link).getByTestId("forms-icon").parentElement).toHaveAttribute("aria-hidden", "true")
  })

  it("Escape closes it and leaves focus on the trigger", async () => {
    const user = setup()
    render(<Menu />)
    product().focus()
    await user.keyboard("{Enter}")
    await screen.findByRole("link", { name: /Forms/ })
    await user.keyboard("{Escape}")
    await waitFor(() => expect(product()).toHaveAttribute("aria-expanded", "false"))
    expect(product()).toHaveFocus()
  })

  it("arrow keys move between the items in the bar", async () => {
    const user = setup()
    render(<Menu />)
    product().focus()
    await user.keyboard("{ArrowRight}")
    expect(screen.getByRole("button", { name: "Company" })).toHaveFocus()
    await user.keyboard("{ArrowRight}")
    expect(screen.getByRole("link", { name: "Pricing" })).toHaveFocus()
  })

  it("controlled value decides what is open and reports changes", async () => {
    const user = setup()
    const onValueChange = vi.fn()
    render(<Menu value="company" onValueChange={onValueChange} />)
    expect(await screen.findByRole("link", { name: "About" })).toBeInTheDocument()
    product().focus()
    await user.keyboard("{Enter}")
    expect(onValueChange).toHaveBeenCalledWith("product")
    expect(screen.getByRole("link", { name: "About" })).toBeInTheDocument()
  })

  it("defaultValue opens with the panel showing", async () => {
    render(<Menu defaultValue="product" />)
    expect(await screen.findByRole("link", { name: /Forms/ })).toBeInTheDocument()
  })

  it("groups are named", async () => {
    render(<Menu variant="mega" defaultValue="product" />)
    expect(await screen.findByRole("group", { name: "Build" })).toContainElement(screen.getByRole("link", { name: /Forms/ }))
  })

  it("mega fills the root, while other panels follow the trigger", async () => {
    const mega = render(<Menu variant="mega" defaultValue="product" />)
    await screen.findByRole("link", { name: /Forms/ })
    expect(slot("navigation-menu-viewport").className).toContain("w-full")
    expect(slot("navigation-menu-viewport").style.left).toBe("")
    mega.unmount()
    render(<Menu variant="bar" defaultValue="product" />)
    await screen.findByRole("link", { name: /Forms/ })
    expect(slot("navigation-menu-viewport").className).toContain("w-(--radix-navigation-menu-viewport-width)")
    expect(root().style.getPropertyValue("--navigation-menu-left")).toBe("0px")
  })

  it("pill and underline slide an indicator while a panel is open; bar has none", async () => {
    const pill = render(<Menu variant="pill" defaultValue="product" />)
    await screen.findByRole("link", { name: /Forms/ })
    await waitFor(() => expect(slot("navigation-menu-indicator")).not.toBeNull())
    pill.unmount()
    render(<Menu variant="bar" defaultValue="product" />)
    await screen.findByRole("link", { name: /Forms/ })
    expect(slot("navigation-menu-indicator")).toBeNull()
  })

  it("materialize morphs the panel and slides its contents, and both stand down under reduced motion", async () => {
    render(<Menu effect="materialize" defaultValue="product" />)
    await screen.findByRole("link", { name: /Forms/ })
    expect(root()).toHaveAttribute("data-effect", "materialize")
    const viewport = slot("navigation-menu-viewport").className
    expect(viewport).toContain("transition-[width,height,left]")
    expect(viewport).toContain("motion-reduce:transition-none")
    expect(slot("navigation-menu-content").className).toContain("motion-reduce:animate-none")
  })

  it("without the effect the panel only fades", async () => {
    render(<Menu defaultValue="product" />)
    await screen.findByRole("link", { name: /Forms/ })
    expect(slot("navigation-menu-viewport").className).not.toContain("transition-[width,height,left]")
  })
})
