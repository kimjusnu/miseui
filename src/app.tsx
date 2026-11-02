import { Route, Routes } from "react-router"
import { Layout } from "./components/layout"
import { BlockPreviewPage } from "./pages/block-preview-page"
import { BlocksPage } from "./pages/blocks-page"
import { ComponentPage } from "./pages/component-page"
import { GettingStarted } from "./pages/getting-started"
import { Home } from "./pages/home"
import { NotFound } from "./pages/not-found"

export function App() {
  return (
    <Routes>
      <Route path="preview/:name" element={<BlockPreviewPage />} />
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="blocks" element={<BlocksPage />} />
        <Route path="docs" element={<GettingStarted />} />
        <Route path="components/:name" element={<ComponentPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
