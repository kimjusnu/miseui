import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CodeBlock, type CodeBlockVariant } from "./code-block"
import { diffResult, parseDiff } from "./code-block-diff"
import { tokenize, type CodeLanguage, type CodeToken } from "./code-block-tokens"

const SAMPLE_TS = `// load the user
export async function load(id: string): Promise<User> {
  const res = await fetch(\`/users/\${id}\`, { retry: 3 })
  /* two
     lines */
  return res.json() as User
}`
const SAMPLE_DIFF = `@@ -4,3 +4,3 @@
 const a = 1
-const b = 2
+const b = 3
 const c = 4`

const types = (lines: readonly (readonly CodeToken[])[], text: string) =>
  lines.flat().find((token) => token.text === text)?.type
const joined = (lines: readonly (readonly CodeToken[])[]) => lines.map((line) => line.map((t) => t.text).join("")).join("\n")

describe("tokenize", () => {
  it.each<[CodeLanguage, string]>([
    ["ts", SAMPLE_TS],
    ["json", `{\n  "a": [1, -2.5e3, true, null],\n  "b": "x\\"y"\n}\n`],
    ["bash", `# setup\nFOO=bar pnpm add -D motion --save "$HOME/x" | grep 'a b' 2>&1\nif [ -f x ]; then echo $FOO; fi`],
    ["ts", `const broken = "never closed\nnext /* also never closed`],
    ["text", "just\n\nwords\n"],
    ["ts", ""],
  ])("gives back the %s input exactly, line by line", (language, source) => {
    expect(joined(tokenize(source, language))).toBe(source)
  })

  it("reads typescript", () => {
    const lines = tokenize(SAMPLE_TS, "ts")
    expect(types(lines, "// load the user")).toBe("comment")
    expect(types(lines, "export")).toBe("keyword")
    expect(types(lines, "load")).toBe("function")
    expect(types(lines, "Promise")).toBe("type")
    expect(types(lines, "retry")).toBe("property")
    expect(types(lines, "3")).toBe("number")
    expect(types(lines, "`/users/${id}`")).toBe("string")
  })

  it("keeps the type of a comment that spans lines", () => {
    const lines = tokenize("/* two\n   lines */ x", "ts")
    expect(lines).toHaveLength(2)
    expect(lines[0][0]).toEqual({ type: "comment", text: "/* two" })
    expect(lines[1][0]).toEqual({ type: "comment", text: "   lines */" })
  })

  it("tells json keys from string values", () => {
    const lines = tokenize(`{"key": "value", "n": 1.5, "ok": true}`, "json")
    expect(types(lines, `"key"`)).toBe("property")
    expect(types(lines, `"value"`)).toBe("string")
    expect(types(lines, "1.5")).toBe("number")
    expect(types(lines, "true")).toBe("keyword")
  })

  it("reads bash: command position, flags, variables and comments", () => {
    const lines = tokenize(`pnpm add --save motion # note\nA=1 echo $HOME | grep x`, "bash")
    expect(types(lines, "pnpm")).toBe("function")
    expect(types(lines, "add")).toBe("plain")
    expect(types(lines, "--save")).toBe("property")
    expect(types(lines, "# note")).toBe("comment")
    expect(types(lines, "A")).toBe("variable")
    expect(types(lines, "echo")).toBe("function")
    expect(types(lines, "$HOME")).toBe("variable")
    expect(types(lines, "grep")).toBe("function")
  })

  it("does not take a hash inside a word as a bash comment", () => {
    expect(joined(tokenize("echo a#b", "bash"))).toBe("echo a#b")
    expect(tokenize("echo a#b", "bash").flat().some((token) => token.type === "comment")).toBe(false)
  })

  it("stays fast on a hostile line", () => {
    const start = performance.now()
    tokenize(`"${"\\a".repeat(20000)}`, "ts")
    tokenize(`${"a ".repeat(20000)}`, "bash")
    expect(performance.now() - start).toBeLessThan(2000)
  })
})

describe("parseDiff", () => {
  it("numbers both sides from the hunk header", () => {
    const [hunk, context, removed, added, tail] = parseDiff(SAMPLE_DIFF)
    expect(hunk.kind).toBe("hunk")
    expect(context).toEqual({ kind: "context", text: "const a = 1", oldNumber: 4, newNumber: 4 })
    expect(removed).toEqual({ kind: "removed", text: "const b = 2", oldNumber: 5 })
    expect(added).toEqual({ kind: "added", text: "const b = 3", newNumber: 5 })
    expect(tail).toMatchObject({ oldNumber: 6, newNumber: 6 })
  })

  it("gives the file after the change", () => {
    expect(diffResult(parseDiff(SAMPLE_DIFF))).toBe("const a = 1\nconst b = 3\nconst c = 4")
  })

  it("does not read the --- and +++ file headers as changes", () => {
    expect(parseDiff("--- a/x\n+++ b/x\n+y").map((line) => line.kind)).toEqual(["hunk", "hunk", "added"])
  })
})

describe("CodeBlock", () => {
  const line = (index: number) => document.querySelectorAll("[data-slot='code-block-line']")[index] as HTMLElement

  it("marks lines, numbers them and scrolls inside itself", () => {
    render(<CodeBlock code={"a\nb\nc"} lineNumbers highlightLines={[2]} label="Example" />)
    expect(line(1)).toHaveAttribute("data-highlighted", "true")
    expect(line(0)).not.toHaveAttribute("data-highlighted")
    expect(line(2)).toHaveTextContent("3c")
    const region = screen.getByRole("region", { name: "Example" })
    expect(region).toHaveAttribute("tabindex", "0")
    expect(region.className).toContain("overflow-auto")
  })

  it("lets a person toggle wrapping, and reports it", async () => {
    const onWrapChange = vi.fn()
    render(<CodeBlock code="long line" onWrapChange={onWrapChange} />)
    const toggle = screen.getByRole("button", { name: "Wrap lines" })
    expect(toggle).toHaveAttribute("aria-pressed", "false")
    expect(document.querySelector("pre")?.className).toContain("w-max")
    await userEvent.click(toggle)
    expect(toggle).toHaveAttribute("aria-pressed", "true")
    expect(document.querySelector("pre")?.className).toContain("w-full")
    expect(onWrapChange).toHaveBeenCalledWith(true)
  })

  it("takes pre-made tokens instead of tokenizing", () => {
    render(<CodeBlock code="ignored" language="ts" tokens={[[{ type: "keyword", text: "mine" }]]} />)
    expect(screen.getByText("mine")).toHaveAttribute("data-token", "keyword")
    expect(screen.queryByText("ignored")).not.toBeInTheDocument()
  })

  it("makes the variants differ in structure", () => {
    const structure = (variant: CodeBlockVariant) => {
      const { unmount } = render(<CodeBlock variant={variant} code={"+x"} title="a.ts" files={[{ name: "a.ts", code: "y" }]} />)
      const result = {
        bar: document.querySelector("[data-slot='code-block-bar']") !== null,
        tabs: screen.queryAllByRole("tab").length,
        kind: line(0).getAttribute("data-kind"),
      }
      unmount()
      return result
    }
    expect(structure("plain")).toEqual({ bar: false, tabs: 0, kind: null })
    expect(structure("window")).toEqual({ bar: true, tabs: 0, kind: null })
    expect(structure("tabs")).toEqual({ bar: true, tabs: 1, kind: null })
    expect(structure("diff")).toEqual({ bar: false, tabs: 0, kind: "added" })
  })

  it("moves between files with the arrow keys and only shows the active one", async () => {
    const files = [
      { name: "a.ts", code: "first" },
      { name: "b.ts", code: "second" },
      { name: "c.ts", code: "third" },
    ]
    render(<CodeBlock variant="tabs" files={files} />)
    const tabs = screen.getAllByRole("tab")
    expect(tabs[0]).toHaveAttribute("aria-selected", "true")
    expect(tabs[1]).toHaveAttribute("tabindex", "-1")
    tabs[0].focus()
    await userEvent.keyboard("{ArrowLeft}")
    expect(tabs[2]).toHaveFocus()
    expect(screen.getByRole("tabpanel")).toHaveTextContent("third")
    expect(screen.getByRole("tabpanel")).toHaveAccessibleName("c.ts")
    await userEvent.keyboard("{Home}")
    expect(screen.getByRole("tabpanel")).toHaveTextContent("first")
  })

  it("speaks added and removed lines, and does not rely on colour alone", () => {
    render(<CodeBlock variant="diff" code={SAMPLE_DIFF} lineNumbers />)
    expect(line(2)).toHaveAttribute("data-kind", "removed")
    expect(within(line(2)).getByText("Removed:", { exact: false })).toHaveClass("sr-only")
    expect(line(2)).toHaveTextContent("-")
    expect(line(3).className).toContain("bg-emerald-500/10")
    expect(line(2).className).toContain("bg-red-500/10")
  })

  it("copies the new version from a diff and the source otherwise", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } })
    render(<CodeBlock variant="diff" code={SAMPLE_DIFF} />)
    fireEvent.click(screen.getByRole("button", { name: "Copy code" }))
    await waitFor(() => expect(writeText).toHaveBeenCalledWith("const a = 1\nconst b = 3\nconst c = 4"))
  })

  it("runs line-reveal only when asked", () => {
    const { rerender } = render(<CodeBlock code="a" />)
    expect(document.querySelector("[data-slot='code-block']")).not.toHaveAttribute("data-effect")
    rerender(<CodeBlock code="a" effect="line-reveal" />)
    expect(document.querySelector("[data-slot='code-block']")).toHaveAttribute("data-effect", "line-reveal")
  })
})
