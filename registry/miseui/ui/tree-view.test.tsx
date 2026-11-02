import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { TreeView, type TreeNode, type TreeViewProps, type TreeViewVariant } from "./tree-view"
import { containsNode, expandableSiblings, flattenVisible, treeMove, typeaheadMatch } from "./tree-view-math"

const NODES: readonly TreeNode[] = [
  {
    id: "src",
    label: "src",
    icon: <svg data-testid="src-icon" />,
    children: [
      { id: "app", label: "App.tsx" },
      { id: "ui", label: "ui", children: [{ id: "button", label: "Button.tsx" }] },
    ],
  },
  { id: "docs", label: "docs", children: [{ id: "intro", label: "intro.md" }] },
  { id: "readme", label: "README.md" },
  { id: "locked", label: "locked.txt", disabled: true },
]

const setup = () => userEvent.setup({ pointerEventsCheck: 0 })
const renderTree = (props: Partial<TreeViewProps> = {}) => render(<TreeView aria-label="Files" nodes={NODES} {...props} />)
const tree = () => screen.getByRole("tree", { name: "Files" })
const item = (name: string) => screen.getByRole("treeitem", { name })
const open = new Set(["src"])

describe("tree math", () => {
  it("flattenVisible walks depth first through open branches with level and set facts", () => {
    const visible = flattenVisible(NODES, open)
    expect(visible.map((entry) => entry.node.id)).toEqual(["src", "app", "ui", "docs", "readme", "locked"])
    expect(visible[2]).toMatchObject({ level: 2, parentId: "src", position: 2, setSize: 2 })
    expect(visible[3]).toMatchObject({ level: 1, parentId: null, position: 2, setSize: 4 })
  })

  it("treeMove follows the pattern for right and left", () => {
    const visible = flattenVisible(NODES, open)
    expect(treeMove("ArrowRight", visible, "docs", open)).toEqual({ expand: "docs" })
    expect(treeMove("ArrowRight", visible, "src", open)).toEqual({ focus: "app" })
    expect(treeMove("ArrowRight", visible, "app", open)).toEqual({})
    expect(treeMove("ArrowLeft", visible, "src", open)).toEqual({ collapse: "src" })
    expect(treeMove("ArrowLeft", visible, "app", open)).toEqual({ focus: "src" })
    expect(treeMove("Tab", visible, "app", open)).toBeNull()
  })

  it("typeaheadMatch starts after the current row and cycles", () => {
    const visible = flattenVisible(NODES, open)
    expect(typeaheadMatch(visible, "r", "src")).toBe("readme")
    expect(typeaheadMatch(visible, "d", "readme")).toBe("docs")
  })

  it("expandableSiblings lists branches beside the row; containsNode looks all the way down", () => {
    const visible = flattenVisible(NODES, open)
    expect(expandableSiblings(visible, "docs")).toEqual(["src", "docs"])
    expect(containsNode(NODES[0], "button")).toBe(true)
    expect(containsNode(NODES[1], "button")).toBe(false)
  })
})

describe("TreeView", () => {
  it.each<TreeViewVariant>(["plain", "lines", "compact", "card"])("%s is a tree with the facts each row needs", (variant) => {
    renderTree({ variant, defaultExpanded: ["src"] })
    expect(tree()).toHaveAttribute("data-variant", variant)
    const row = item("App.tsx")
    expect(row).toHaveAttribute("aria-level", "2")
    expect(row).toHaveAttribute("aria-posinset", "1")
    expect(row).toHaveAttribute("aria-setsize", "2")
    expect(row).not.toHaveAttribute("aria-expanded")
    expect(item("src")).toHaveAttribute("aria-expanded", "true")
    expect(within(item("src")).getByRole("group", { name: "src" })).toContainElement(row)
  })

  it("the variants differ in structure", () => {
    const plain = renderTree({ defaultExpanded: ["src"] })
    expect(screen.getByTestId("src-icon")).toBeInTheDocument()
    expect(within(item("src")).getByRole("group").className).not.toContain("border-s")
    plain.unmount()
    const lines = renderTree({ variant: "lines", defaultExpanded: ["src"] })
    expect(within(item("src")).getByRole("group").className).toContain("border-s")
    lines.unmount()
    const compact = renderTree({ variant: "compact" })
    expect(screen.queryByTestId("src-icon")).toBeNull()
    compact.unmount()
    renderTree({ variant: "card" })
    expect(item("src").className).toContain("border")
  })

  it("has one tab stop, and arrows walk visible rows", async () => {
    const user = setup()
    renderTree({ defaultExpanded: ["src"] })
    expect(document.querySelectorAll("[role='treeitem'][tabindex='0']")).toHaveLength(1)
    await user.tab()
    expect(item("src")).toHaveFocus()
    await user.keyboard("{ArrowDown}")
    expect(item("App.tsx")).toHaveFocus()
    expect(item("App.tsx")).toHaveAttribute("tabindex", "0")
    expect(item("src")).toHaveAttribute("tabindex", "-1")
    await user.keyboard("{End}")
    expect(item("locked.txt")).toHaveFocus()
    await user.keyboard("{Home}")
    expect(item("src")).toHaveFocus()
  })

  it("Right opens and then enters, Left leaves and then closes", async () => {
    const user = setup()
    const onExpandedChange = vi.fn()
    renderTree({ onExpandedChange })
    await user.tab()
    await user.keyboard("{ArrowRight}")
    expect(onExpandedChange).toHaveBeenLastCalledWith(["src"], { id: "src", expanded: true })
    expect(item("src")).toHaveFocus()
    await user.keyboard("{ArrowRight}")
    expect(item("App.tsx")).toHaveFocus()
    await user.keyboard("{ArrowLeft}")
    expect(item("src")).toHaveFocus()
    await user.keyboard("{ArrowLeft}")
    expect(onExpandedChange).toHaveBeenLastCalledWith([], { id: "src", expanded: false })
    expect(screen.queryByRole("treeitem", { name: "App.tsx" })).toBeNull()
  })

  it("* opens every branch beside the row and type-ahead jumps", async () => {
    const user = setup()
    renderTree()
    await user.tab()
    await user.keyboard("*")
    expect(item("App.tsx")).toBeInTheDocument()
    expect(item("intro.md")).toBeInTheDocument()
    await user.keyboard("r")
    expect(item("README.md")).toHaveFocus()
  })

  it("with no selection a press toggles the branch and nothing claims to be selected", async () => {
    const user = setup()
    renderTree()
    expect(item("src")).not.toHaveAttribute("aria-selected")
    await user.click(screen.getByText("src"))
    expect(item("src")).toHaveAttribute("aria-expanded", "true")
    expect(item("src")).not.toHaveAttribute("aria-selected")
  })

  it("single selection replaces, by pointer and by keyboard", async () => {
    const user = setup()
    const onSelectedChange = vi.fn()
    renderTree({ selectionMode: "single", onSelectedChange })
    await user.click(screen.getByText("README.md"))
    expect(onSelectedChange).toHaveBeenLastCalledWith(["readme"])
    expect(item("README.md")).toHaveAttribute("aria-selected", "true")
    item("docs").focus()
    await user.keyboard("{Enter}")
    expect(onSelectedChange).toHaveBeenLastCalledWith(["docs"])
    expect(item("README.md")).toHaveAttribute("aria-selected", "false")
  })

  it("multiple toggles with checkboxes, and a press does not close the branch", async () => {
    const user = setup()
    const onSelectedChange = vi.fn()
    renderTree({ selectionMode: "multiple", defaultExpanded: ["src"], onSelectedChange })
    expect(tree()).toHaveAttribute("aria-multiselectable", "true")
    expect(document.querySelectorAll("[data-slot='tree-view-checkbox']").length).toBeGreaterThan(0)
    await user.click(screen.getByText("src"))
    await user.click(screen.getByText("App.tsx"))
    expect(onSelectedChange).toHaveBeenLastCalledWith(["src", "app"])
    expect(item("src")).toHaveAttribute("aria-expanded", "true")
    item("src").focus()
    await user.keyboard(" ")
    expect(onSelectedChange).toHaveBeenLastCalledWith(["app"])
  })

  it("the chevron only opens and closes, whatever the selection mode", async () => {
    const user = setup()
    const onSelectedChange = vi.fn()
    renderTree({ selectionMode: "single", onSelectedChange })
    const toggle = item("docs").querySelector("[data-slot='tree-view-toggle']") as HTMLElement
    await user.click(toggle)
    expect(item("docs")).toHaveAttribute("aria-expanded", "true")
    expect(onSelectedChange).not.toHaveBeenCalled()
  })

  it("disabled rows can be reached but not selected", async () => {
    const user = setup()
    const onSelectedChange = vi.fn()
    renderTree({ selectionMode: "single", onSelectedChange })
    expect(item("locked.txt")).toHaveAttribute("aria-disabled", "true")
    await user.click(screen.getByText("locked.txt"))
    item("locked.txt").focus()
    await user.keyboard("{Enter}")
    expect(onSelectedChange).not.toHaveBeenCalled()
  })

  it("closing a branch around the focused row moves focus to the branch", async () => {
    const user = setup()
    renderTree({ defaultExpanded: ["src"] })
    item("App.tsx").focus()
    const toggle = item("src").querySelector("[data-slot='tree-view-toggle']") as HTMLElement
    await user.click(toggle)
    expect(item("src")).toHaveFocus()
  })

  it("a lazy node asks through onExpandedChange and shows the slot until children arrive", async () => {
    const user = setup()
    const onExpandedChange = vi.fn()
    const lazy: TreeNode = { id: "remote", label: "remote", lazy: true }
    const { rerender } = render(
      <TreeView aria-label="Files" nodes={[lazy]} onExpandedChange={onExpandedChange} renderLazy={(node) => <span>Fetching {node.label}</span>} />,
    )
    expect(item("remote")).toHaveAttribute("aria-expanded", "false")
    await user.click(screen.getByText("remote"))
    expect(onExpandedChange).toHaveBeenCalledWith(["remote"], { id: "remote", expanded: true })
    expect(screen.getByText("Fetching remote")).toBeInTheDocument()
    expect(item("remote")).toHaveAttribute("aria-busy", "true")
    rerender(
      <TreeView aria-label="Files" nodes={[{ ...lazy, children: [{ id: "file", label: "file.txt" }] }]} onExpandedChange={onExpandedChange} />,
    )
    expect(item("file.txt")).toBeInTheDocument()
    expect(screen.queryByText("Fetching remote")).toBeNull()
    expect(item("remote")).not.toHaveAttribute("aria-busy")
  })

  it("controlled expanded wins until the owner changes it", async () => {
    const user = setup()
    const onExpandedChange = vi.fn()
    renderTree({ expanded: [], onExpandedChange })
    await user.click(screen.getByText("src"))
    expect(onExpandedChange).toHaveBeenCalled()
    expect(item("src")).toHaveAttribute("aria-expanded", "false")
  })

  it("spring keeps the group mounted during its exit, then removes it", async () => {
    const user = setup()
    renderTree({ effect: "spring", defaultExpanded: ["src"] })
    expect(tree()).toHaveAttribute("data-effect", "spring")
    expect(document.querySelector("[data-slot='tree-view-group']")).not.toBeNull()
    await user.click(screen.getByText("src"))
    expect(item("src")).toHaveAttribute("aria-expanded", "false")
    await waitFor(() => expect(document.querySelector("[data-slot='tree-view-group']")).toBeNull())
  })
})
