import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router"
import "./index.css"
import { App } from "./app"
import { applyStoredPalette } from "./lib/use-palette"
import { applyStoredTheme } from "./lib/use-theme"

applyStoredPalette()
applyStoredTheme()

const rootElement = document.getElementById("root")
if (!rootElement) throw new Error("Root element #root was not found")

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
