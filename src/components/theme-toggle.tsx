import { Moon, Sun } from "lucide-react"
import { Button } from "@/registry/miseui/ui/button"
import { useTheme } from "@/src/lib/use-theme"

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const label = theme === "dark" ? "Switch to light theme" : "Switch to dark theme"

  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label={label} title={label}>
      {theme === "dark" ? <Sun /> : <Moon />}
    </Button>
  )
}
