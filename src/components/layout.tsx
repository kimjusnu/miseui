import { Link, Outlet } from "react-router"
import { Button } from "@/registry/miseui/ui/button"
import { GITHUB_URL } from "@/src/lib/site"
import { GitHubIcon } from "./github-icon"
import { Sidebar } from "./sidebar"
import { ThemeToggle } from "./theme-toggle"

export function Brand() {
  return (
    <Link to="/" className="flex items-baseline gap-1.5 rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
      <span className="font-display text-[26px] leading-none italic">Mise</span>
      <span className="text-sm font-medium text-muted-foreground">UI</span>
    </Link>
  )
}

export function Layout() {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Brand />
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/docs">Docs</Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <a href={GITHUB_URL} target="_blank" rel="noreferrer" aria-label="GitHub repository">
                <GitHubIcon />
              </a>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-10 md:grid-cols-[200px_1fr]">
        <aside className="md:sticky md:top-24 md:self-start">
          <Sidebar />
        </aside>
        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
