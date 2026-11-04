import { render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router"
import { BlockPreviewPage } from "./block-preview-page"

vi.mock("@/src/demos", () => ({
  demos: {
    "landing-hero": ({ variant }: { variant?: string }) => <p data-testid="demo">{variant ?? "none"}</p>,
  },
}))

vi.mock("@/src/content", () => ({
  findComponent: (name: string) => (name === "landing-hero" ? { name, category: "blocks" } : undefined),
}))

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/preview/:name" element={<BlockPreviewPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe("BlockPreviewPage", () => {
  it("hands the variant in the address to the block, so a design can be linked and captured", () => {
    renderAt("/preview/landing-hero?variant=minimal")
    expect(screen.getByTestId("demo")).toHaveTextContent("minimal")
  })

  it("leaves the block on its default when the address names none", () => {
    renderAt("/preview/landing-hero")
    expect(screen.getByTestId("demo")).toHaveTextContent("none")
  })
})
